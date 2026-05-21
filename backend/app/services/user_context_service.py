"""User-context snapshot and lightweight personalization helpers.

This service keeps the frontend contract stable:
- no new required request fields
- no new required response fields
- prompt personalization happens server-side

Mongo remains the source of truth.
Redis stores a fast snapshot for prompt assembly.
"""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from app.cache import CacheKeys, cache
from app.core.config import get_settings
from app.llm.client import get_provider
from app.llm.sanitizers import sanitize_llm_output
from app.repositories import message_repository, task_repository, user_repository

logger = logging.getLogger(__name__)

USER_CONTEXT_REFRESH_EVERY_MESSAGES = 5
USER_CONTEXT_TASK_LIMIT = 10
PERSONALITY_HISTORY_LIMIT = 20


async def get_user_context(user_id: str) -> dict[str, Any]:
    """Return a cached-or-built prompt context snapshot for a user."""
    key = CacheKeys.user_context(user_id)
    cached_context = await cache.get(key)
    if cached_context is not None:
        return cached_context

    return await refresh_user_context(user_id)


async def warm_user_context(user: dict[str, Any]) -> dict[str, Any]:
    """Warm Redis with both the user document and their prompt snapshot."""
    settings = get_settings()
    user_id = user["userId"]

    await cache.set(CacheKeys.user(user_id), user, settings.redis_ttl_seconds)

    pending_tasks = await _load_pending_tasks(user_id)
    snapshot = {
        "personality": user.get("personality", {}) or {},
        "pending_tasks": pending_tasks,
    }
    await cache.set(CacheKeys.user_context(user_id), snapshot, settings.redis_ttl_seconds)
    return snapshot


async def refresh_user_context(user_id: str) -> dict[str, Any]:
    """Rebuild and cache the user prompt snapshot from Mongo."""
    user = await user_repository.find_by_id(user_id)
    if user is None:
        snapshot = {"personality": {}, "pending_tasks": []}
        await cache.set(
            CacheKeys.user_context(user_id),
            snapshot,
            get_settings().redis_ttl_seconds,
        )
        return snapshot

    return await warm_user_context(user)


async def maybe_schedule_context_refresh(chat_id: str, user_id: str) -> None:
    """Refresh personality/context every N user messages in the active chat."""
    user_message_count = await message_repository.count_by_chat(chat_id, role="user")
    if user_message_count == 0:
        return
    if user_message_count % USER_CONTEXT_REFRESH_EVERY_MESSAGES != 0:
        return

    asyncio.create_task(_safe_refresh_personality_and_context(chat_id=chat_id, user_id=user_id))


async def _safe_refresh_personality_and_context(*, chat_id: str, user_id: str) -> None:
    """Run async refresh without ever breaking the chat request path."""
    try:
        await refresh_personality_and_context(chat_id=chat_id, user_id=user_id)
    except Exception:
        logger.exception(
            "Failed async user-context refresh for user %s chat %s",
            user_id,
            chat_id,
        )


async def refresh_personality_and_context(*, chat_id: str, user_id: str) -> None:
    """Update persisted personality summary from recent messages, then refresh cache."""
    user = await user_repository.find_by_id(user_id)
    if user is None:
        return

    recent_messages = await message_repository.list_all(
        chat_id=chat_id,
        limit=PERSONALITY_HISTORY_LIMIT,
        sort="asc",
        role="user",
    )
    if not recent_messages:
        await refresh_user_context(user_id)
        return

    updated_personality = await _summarize_personality(
        current_personality=user.get("personality", {}) or {},
        recent_messages=recent_messages,
    )
    if updated_personality:
        await user_repository.update(user_id, {"personality": updated_personality})

    await refresh_user_context(user_id)


async def _summarize_personality(
    *,
    current_personality: dict[str, Any],
    recent_messages: list[dict[str, Any]],
) -> dict[str, Any]:
    """Generate a small personality summary JSON from recent user messages."""
    provider = get_provider()
    serialized_current = json.dumps(current_personality, ensure_ascii=False)
    message_lines = [
        f"- {msg.get('content', '').strip()}"
        for msg in recent_messages
        if msg.get("content", "").strip()
    ]
    if not message_lines:
        return current_personality

    prompt_messages = [
        {
            "role": "system",
            "content": (
                "Extraé un resumen estable y breve del usuario para personalizar "
                "futuras respuestas de apoyo emocional. Respondé SOLO JSON válido. "
                "Usá estas claves: tone, language, profile_summary, goals, "
                "stressors, coping_notes. "
                "tone y language deben ser strings cortos. "
                "goals, stressors y coping_notes deben ser arrays de strings cortos. "
                "No inventes datos; si algo no está claro, conservá lo anterior."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Perfil actual:\n{serialized_current}\n\n"
                "Mensajes recientes del usuario:\n"
                f"{chr(10).join(message_lines)}"
            ),
        },
    ]

    content_parts: list[str] = []
    async for token in provider.stream_chat(prompt_messages):
        content_parts.append(token)

    raw_output = sanitize_llm_output("".join(content_parts))
    parsed = _parse_json_object(raw_output)
    if parsed is None:
        return current_personality

    return _merge_personality(current_personality, parsed)


async def _load_pending_tasks(user_id: str) -> list[dict[str, str]]:
    """Return a compact list of pending or in-progress tasks for prompts."""
    tasks = await task_repository.list_all(user_id=user_id)
    pending_tasks = [
        {
            "taskId": task["taskId"],
            "title": task["title"],
            "status": task.get("status", "pending"),
        }
        for task in tasks
        if task.get("status") != "done"
    ]
    return pending_tasks[:USER_CONTEXT_TASK_LIMIT]


def build_personality_system_message(personality: dict[str, Any]) -> str | None:
    """Format personality snapshot into a compact system message."""
    if not personality:
        return None

    lines: list[str] = []
    tone = _string_or_none(personality.get("tone"))
    language = _string_or_none(personality.get("language"))
    profile_summary = _string_or_none(personality.get("profile_summary"))

    if tone:
        lines.append(f"Tono preferido del usuario: {tone}.")
    if language:
        lines.append(f"Idioma preferido del usuario: {language}.")
    if profile_summary:
        lines.append(f"Resumen del usuario: {profile_summary}")

    lines.extend(_format_list_field("Objetivos actuales", personality.get("goals")))
    lines.extend(_format_list_field("Factores de estrés", personality.get("stressors")))
    lines.extend(_format_list_field("Cosas que le ayudan", personality.get("coping_notes")))

    if not lines:
        return None
    return "Contexto persistente del usuario:\n" + "\n".join(f"- {line}" for line in lines)


def build_tasks_system_message(pending_tasks: list[dict[str, Any]]) -> str | None:
    """Format pending tasks snapshot into a compact system message."""
    if not pending_tasks:
        return None

    lines = [
        f"{task.get('title', 'Sin título')} ({task.get('status', 'pending')})"
        for task in pending_tasks
    ]
    return "Tareas pendientes del usuario:\n" + "\n".join(f"- {line}" for line in lines)


def _parse_json_object(raw_output: str) -> dict[str, Any] | None:
    """Parse a JSON object, tolerating fenced noise around it."""
    if not raw_output:
        return None

    try:
        parsed = json.loads(raw_output)
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        start = raw_output.find("{")
        end = raw_output.rfind("}")
        if start == -1 or end == -1 or end <= start:
            return None
        try:
            parsed = json.loads(raw_output[start:end + 1])
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            return None


def _merge_personality(
    current_personality: dict[str, Any],
    incoming_personality: dict[str, Any],
) -> dict[str, Any]:
    """Merge extractor output into the persisted personality shape."""
    merged = dict(current_personality)

    for key in ("tone", "language", "profile_summary"):
        value = _string_or_none(incoming_personality.get(key))
        if value:
            merged[key] = value

    for key in ("goals", "stressors", "coping_notes"):
        values = _string_list(incoming_personality.get(key))
        if values:
            merged[key] = values

    return merged


def _format_list_field(label: str, value: Any) -> list[str]:
    values = _string_list(value)
    if not values:
        return []
    return [f"{label}: {', '.join(values)}."]


def _string_or_none(value: Any) -> str | None:
    if not isinstance(value, str):
        return None
    cleaned = value.strip()
    return cleaned or None


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    cleaned: list[str] = []
    for item in value:
        if not isinstance(item, str):
            continue
        stripped = item.strip()
        if stripped:
            cleaned.append(stripped)
    return cleaned

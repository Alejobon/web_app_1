"""Service for AI-powered chat streaming.

Orchestrates: validate chat → save user message → load history →
stream LLM tokens via SSE → save assistant message.

The service never imports provider libraries directly; it uses
the llm.client factory.
"""

from __future__ import annotations

import asyncio
import json
import logging
from collections.abc import AsyncIterator
from typing import Any

from app.cache import CacheKeys, cache
from app.core.config import get_settings
from app.llm.client import get_provider
from app.llm.safety import CRISIS_RESPONSE, is_high_risk_message
from app.llm.sanitizers import StreamingOutputSanitizer, sanitize_llm_output
from app.llm.usage_guard import LLMUsageLimitExceeded
from app.repositories import chat_repository, message_repository
from app.services import user_context_service

logger = logging.getLogger(__name__)


async def stream_ai_response(
    chat_id: str,
    user_id: str,
    content: str,
    history_limit: int | None = None,
) -> AsyncIterator[str]:
    """Yield SSE-formatted events for an AI chat response.

    Flow:
        1. Validate chat exists and belongs to user.
        2. Save the user's message to the DB.
        3. Load recent message history for context.
        4. Build the prompt: system + personality + history + new message.
        5. Stream tokens from the LLM, yielding SSE events.
        6. After stream completes, save the assistant message.

    Yields:
        SSE event strings like:
            data: {"type":"token","content":"..."}\n\n
            data: {"type":"done","messageId":"..."}\n\n
            data: {"type":"error","message":"..."}\n\n
    """
    settings = get_settings()
    limit = history_limit or settings.llm_history_limit

    chat = await chat_repository.find_by_id(chat_id)
    if chat is None:
        yield _sse_error("Chat not found")
        return
    if chat.get("userId") != user_id:
        yield _sse_error("Chat does not belong to this user")
        return

    if is_high_risk_message(content):
        async for event in _stream_crisis_response(chat_id=chat_id, content=content):
            yield event
        return

    user_msg = await message_repository.create(chat_id, "user", content)
    await cache.delete(CacheKeys.message_latest(chat_id))
    await cache.delete_pattern(f"desahogate:msg:history:{chat_id}:*")
    await user_context_service.maybe_schedule_context_refresh(chat_id, user_id)

    history = await message_repository.list_all(
        chat_id=chat_id,
        limit=max(limit - 1, 1),
        sort="asc",
    )
    history = [m for m in history if m.get("messageId") != user_msg["messageId"]]

    llm_messages = await _build_messages(
        history=history,
        user_message=content,
        user_id=user_id,
    )

    try:
        provider = get_provider()
    except (ValueError, RuntimeError) as exc:
        yield _sse_error(str(exc))
        return

    assistant_content_parts: list[str] = []
    streaming_sanitizer = StreamingOutputSanitizer()
    try:
        async for token in provider.stream_chat(llm_messages):
            assistant_content_parts.append(token)
            safe_token = streaming_sanitizer.feed(token)
            if safe_token:
                yield _sse_token(safe_token)
    except Exception as exc:
        logger.exception("LLM streaming failed for chat %s", chat_id)
        if not assistant_content_parts:
            yield _sse_error(_safe_error_message(exc))
            return

    trailing_safe_content = streaming_sanitizer.flush()
    if trailing_safe_content:
        yield _sse_token(trailing_safe_content)

    full_content = sanitize_llm_output("".join(assistant_content_parts))
    if not full_content.strip():
        yield _sse_error("The AI did not produce a response")
        return

    assistant_msg = await message_repository.create(chat_id, "assistant", full_content)
    await cache.delete(CacheKeys.message_latest(chat_id))
    await cache.delete_pattern(f"desahogate:msg:history:{chat_id}:*")
    yield _sse_done(assistant_msg["messageId"])


async def _build_messages(
    *,
    history: list[dict[str, Any]],
    user_message: str,
    user_id: str,
) -> list[dict[str, str]]:
    """Build the messages list for the LLM API call.

    Order: system prompt → user personality → history → current user message.
    The current user message is NOT duplicated in history.
    """
    settings = get_settings()
    messages: list[dict[str, str]] = []

    messages.append({"role": "system", "content": settings.llm_system_prompt})

    try:
        context = await user_context_service.get_user_context(user_id)
        personality_message = user_context_service.build_personality_system_message(
            context.get("personality", {}) or {},
        )
        tasks_message = user_context_service.build_tasks_system_message(
            context.get("pending_tasks", []) or [],
        )
        if personality_message:
            messages.append({"role": "system", "content": personality_message})
        if tasks_message:
            messages.append({"role": "system", "content": tasks_message})
    except Exception:
        pass

    for msg in history:
        role = msg.get("role", "user")
        if role in ("user", "assistant"):
            messages.append({"role": role, "content": msg.get("content", "")})

    messages.append({"role": "user", "content": user_message})

    return messages


def _sse_token(content: str) -> str:
    """Format a single token as an SSE data line."""
    return f"data: {json.dumps({'type': 'token', 'content': content}, ensure_ascii=False)}\n\n"


def _sse_done(message_id: str) -> str:
    """Format the 'done' event with the saved message ID."""
    return f"data: {json.dumps({'type': 'done', 'messageId': message_id})}\n\n"


def _sse_error(message: str) -> str:
    """Format an error event. Never exposes raw provider errors."""
    return f"data: {json.dumps({'type': 'error', 'message': message}, ensure_ascii=False)}\n\n"


async def _stream_crisis_response(chat_id: str, content: str) -> AsyncIterator[str]:
    """Persist and return the fixed crisis response without calling the LLM."""
    user_msg = await message_repository.create(chat_id, "user", content)
    await cache.delete(CacheKeys.message_latest(chat_id))
    await cache.delete_pattern(f"desahogate:msg:history:{chat_id}:*")

    assistant_msg = await message_repository.create(chat_id, "assistant", CRISIS_RESPONSE)
    await cache.delete(CacheKeys.message_latest(chat_id))
    await cache.delete_pattern(f"desahogate:msg:history:{chat_id}:*")

    yield _sse_token(CRISIS_RESPONSE)
    yield _sse_done(assistant_msg["messageId"])


def _safe_error_message(exc: Exception) -> str:
    """Return a user-safe error message, stripping any potential secrets."""
    if isinstance(exc, LLMUsageLimitExceeded):
        return "El servicio de IA está con mucha demanda. Probá de nuevo en un momento."

    error_str = str(exc).lower()
    if "api_key" in error_str or "unauthorized" in error_str or "401" in error_str:
        return "Authentication error with the AI provider. Check server configuration."
    if "rate" in error_str or "429" in error_str:
        return "Too many requests. Please wait a moment and try again."
    if "timeout" in error_str or "timed out" in error_str:
        return "The AI service timed out. Please try again."
    return "An unexpected error occurred while generating the response."

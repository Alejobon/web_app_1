"""Service for Message entity — business/orchestration rules.

Messages are currently straightforward CRUD with no cross-entity orchestration.
This service exists to maintain the layering contract and to give a home for
future business rules (e.g. chat existence validation, content moderation).

Cache-aside: reads are cached in Redis when available. Writes invalidate
the relevant cache keys so the next read fetches fresh data from Mongo.
"""

from __future__ import annotations

from typing import Any

from app.cache import CacheKeys, cache
from app.core.config import get_settings
from app.repositories import message_repository

_settings = get_settings()


@cache.cached(
    key_builder=lambda chat_id=None, limit=50, sort="desc": (
        CacheKeys.message_history(chat_id or "all", limit, sort)
    ),
    ttl=_settings.redis_message_history_ttl_seconds,
)
async def list_all(
    chat_id: str | None = None,
    limit: int = 50,
    sort: str = "desc",
) -> list[dict[str, Any]]:
    """Return messages with optional chat filter, limit, and sort order."""
    return await message_repository.list_all(chat_id=chat_id, limit=limit, sort=sort)


@cache.cached(
    key_builder=lambda chat_id: CacheKeys.message_latest(chat_id),
    ttl=_settings.redis_latest_message_ttl_seconds,
)
async def find_latest_by_chat(chat_id: str) -> dict[str, Any] | None:
    """Return the most recent message for a given chat."""
    return await message_repository.find_latest_by_chat(chat_id)


async def find_by_id(message_id: str) -> dict[str, Any] | None:
    """Find a message by its public messageId."""
    return await message_repository.find_by_id(message_id)


async def create(chat_id: str, role: str, content: str) -> dict[str, Any]:
    """Insert a new message into the given chat."""
    doc = await message_repository.create(chat_id, role, content)
    # Invalidate: new message changes latest and history for this chat.
    await _invalidate_chat_messages(chat_id)
    return doc


async def update(message_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    """Patch message fields. Returns updated doc or None if not found."""
    doc = await message_repository.update(message_id, update_data)
    if doc is not None:
        await _invalidate_chat_messages(doc["chatId"])
    return doc


async def delete(message_id: str) -> bool:
    """Delete a message by messageId. Returns True if deleted, False if not found."""
    # Look up the message first so we know which chat to invalidate.
    msg = await message_repository.find_by_id(message_id)
    if msg is None:
        return False

    deleted = await message_repository.delete(message_id)
    if deleted:
        await _invalidate_chat_messages(msg["chatId"])
    return deleted


async def _invalidate_chat_messages(chat_id: str) -> None:
    """Invalidate all message caches for a given chat.

    Uses pattern delete to cover all (limit, sort) variants of the
    history key, plus the latest-message key.
    """
    await cache.delete(CacheKeys.message_latest(chat_id))
    await cache.delete_pattern(f"desahogate:msg:history:{chat_id}:*")

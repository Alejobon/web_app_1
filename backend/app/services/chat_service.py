"""Service for Chat entity — business/orchestration rules.

Owns the user<->chat relationship: creating a chat validates the user exists,
inserts the chat, and pushes the chatId into the user's chats[] array.
Deleting a chat removes the chatId from the user's chats[] before deleting.

Repositories only do single-collection persistence here.

Cache-aside: reads are cached in Redis when available. Writes invalidate
the relevant cache keys so the next read fetches fresh data from Mongo.
"""

from __future__ import annotations

from typing import Any

from app.cache import CacheKeys, cache
from app.core.config import get_settings
from app.repositories import chat_repository, message_repository, user_repository

_settings = get_settings()


@cache.cached(
    key_builder=lambda user_id=None: CacheKeys.user_chats(user_id or "all"),
    ttl=_settings.redis_ttl_seconds,
)
async def list_all(user_id: str | None = None) -> list[dict[str, Any]]:
    """Return chats, optionally filtered by userId. Newest first."""
    return await chat_repository.list_all(user_id=user_id)


@cache.cached(
    key_builder=lambda chat_id: CacheKeys.chat(chat_id),
    ttl=_settings.redis_ttl_seconds,
)
async def find_by_id(chat_id: str) -> dict[str, Any] | None:
    """Find a chat by its public chatId."""
    return await chat_repository.find_by_id(chat_id)


async def create(user_id: str) -> dict[str, Any] | None:
    """Create a chat for the given user.

    Validates the user exists, inserts the chat, then syncs the chatId
    into the user's chats[] array. Returns the chat doc, or None if
    the user does not exist.
    """
    user = await user_repository.find_by_id(user_id)
    if user is None:
        return None

    chat = await chat_repository.insert(user_id)

    # Sync: push this chatId into the user's chats[] array.
    await user_repository.add_chat(user_id, chat["chatId"])

    # Invalidate: user's chat list changed and user doc (chats array).
    await cache.delete(CacheKeys.user_chats(user_id))
    await cache.delete(CacheKeys.user(user_id))

    return chat


async def update(chat_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    """Patch chat fields. Returns updated doc or None if not found."""
    doc = await chat_repository.update(chat_id, update_data)
    if doc is not None:
        await cache.delete(CacheKeys.chat(chat_id))
    return doc


async def delete(chat_id: str) -> bool:
    """Delete a chat and remove its ID from the user's chats[] array.

    Returns True if deleted, False if chat not found.
    """
    chat = await chat_repository.find_by_id(chat_id)
    if chat is None:
        return False

    user_id = chat["userId"]

    # Sync: remove chatId from the user's chats[] array before deleting.
    await user_repository.remove_chat(user_id, chat_id)

    # Cascade: delete all messages that belong to this chat as well.
    await message_repository.delete_by_chat(chat_id)
    await chat_repository.delete(chat_id)

    # Invalidate: chat gone, user's chat list changed, message history stale.
    await cache.delete(CacheKeys.chat(chat_id))
    await cache.delete(CacheKeys.user_chats(user_id))
    await cache.delete(CacheKeys.user(user_id))
    # Pattern-delete message caches for this chat (latest + history variants).
    await cache.delete_pattern(CacheKeys.message_latest(chat_id))
    await cache.delete_pattern(f"{CacheKeys.PREFIX}:msg:history:{chat_id}:*")

    return True

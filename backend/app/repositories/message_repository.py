"""Repository for Message entity — owns all DB operations on the messages collection."""

from __future__ import annotations

from typing import Any

from pymongo import ASCENDING, DESCENDING

from app.db.helpers import get_db, new_id, now_utc

COLLECTION = "messages"


async def ensure_indexes() -> None:
    """Create indexes for message history, latest-message, and lookup queries."""
    db = get_db()
    await db[COLLECTION].create_index("messageId", unique=True)
    await db[COLLECTION].create_index([("chatId", 1), ("createdAt", DESCENDING)])
    await db[COLLECTION].create_index(
        [("chatId", 1), ("role", 1), ("createdAt", DESCENDING)],
    )


async def list_all(
    chat_id: str | None = None,
    limit: int = 50,
    sort: str = "desc",
    role: str | None = None,
) -> list[dict[str, Any]]:
    """Return messages with optional chat filter, limit, and sort order.

    sort="desc" (default) returns newest first for previews.
    sort="asc" returns oldest first for rendering chat history.
    """
    db = get_db()
    query: dict[str, Any] = {}
    if chat_id:
        query["chatId"] = chat_id
    if role:
        query["role"] = role

    order = ASCENDING if sort == "asc" else DESCENDING
    cursor = db[COLLECTION].find(query).sort("createdAt", order).limit(limit)
    return [doc async for doc in cursor]


async def count_by_chat(chat_id: str, role: str | None = None) -> int:
    """Count messages for a chat, optionally filtered by role."""
    db = get_db()
    query: dict[str, Any] = {"chatId": chat_id}
    if role:
        query["role"] = role
    return await db[COLLECTION].count_documents(query)


async def find_latest_by_chat(chat_id: str) -> dict[str, Any] | None:
    """Return the most recent message for a given chat, or None if no messages."""
    db = get_db()
    return await db[COLLECTION].find_one(
        {"chatId": chat_id},
        sort=[("createdAt", DESCENDING)],
    )


async def find_by_id(message_id: str) -> dict[str, Any] | None:
    """Find a message by its public messageId. Returns None if not found."""
    db = get_db()
    return await db[COLLECTION].find_one({"messageId": message_id})


async def create(chat_id: str, role: str, content: str) -> dict[str, Any]:
    """Insert a new message into the given chat."""
    db = get_db()
    doc = {
        "messageId": new_id(),
        "chatId": chat_id,
        "role": role,
        "content": content,
        "createdAt": now_utc(),
    }
    await db[COLLECTION].insert_one(doc)
    return doc


async def update(message_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    """Patch message fields. Returns updated doc or None if not found."""
    db = get_db()
    result = await db[COLLECTION].update_one(
        {"messageId": message_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        return None
    return await db[COLLECTION].find_one({"messageId": message_id})


async def delete(message_id: str) -> bool:
    """Delete a message by messageId. Returns True if deleted, False if not found."""
    db = get_db()
    result = await db[COLLECTION].delete_one({"messageId": message_id})
    return result.deleted_count > 0


async def delete_by_chat(chat_id: str) -> int:
    """Delete all messages belonging to a chat. Returns deleted count."""
    db = get_db()
    result = await db[COLLECTION].delete_many({"chatId": chat_id})
    return result.deleted_count

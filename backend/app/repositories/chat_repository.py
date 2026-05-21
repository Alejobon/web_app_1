"""Repository for Chat entity — pure persistence on the chats collection.

Cross-entity orchestration (user existence check, chat↔user sync) lives
in the chat service, not here.
"""

from __future__ import annotations

from typing import Any

from pymongo import DESCENDING

from app.db.helpers import get_db, new_id, now_utc

CHATS = "chats"


async def list_all(user_id: str | None = None) -> list[dict[str, Any]]:
    """Return chats, optionally filtered by userId. Newest first."""
    db = get_db()
    query: dict[str, Any] = {}
    if user_id:
        query["userId"] = user_id
    cursor = db[CHATS].find(query).sort("createdAt", DESCENDING)
    return [doc async for doc in cursor]


async def find_by_id(chat_id: str) -> dict[str, Any] | None:
    """Find a chat by its public chatId. Returns None if not found."""
    db = get_db()
    return await db[CHATS].find_one({"chatId": chat_id})


async def insert(user_id: str) -> dict[str, Any]:
    """Insert a new chat document for the given user.

    Pure persistence — no user validation or chats[] sync.
    Those are owned by the chat service.
    """
    db = get_db()
    doc = {
        "chatId": new_id(),
        "userId": user_id,
        "createdAt": now_utc(),
    }
    await db[CHATS].insert_one(doc)
    return doc


async def update(chat_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    """Patch chat fields. Returns updated doc or None if not found."""
    db = get_db()
    result = await db[CHATS].update_one(
        {"chatId": chat_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        return None
    return await db[CHATS].find_one({"chatId": chat_id})


async def delete(chat_id: str) -> None:
    """Delete a chat by chatId.

    Pure persistence — no user chats[] cleanup. That is owned by
    the chat service.
    """
    db = get_db()
    await db[CHATS].delete_one({"chatId": chat_id})

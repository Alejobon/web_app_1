"""Repository for User entity — owns all DB operations on the users collection."""

from __future__ import annotations

from typing import Any

from pymongo.errors import DuplicateKeyError

from app.db.helpers import DatabaseNotAvailableError, get_db, new_id, now_utc

COLLECTION = "users"


async def ensure_indexes() -> None:
    """Create unique indexes required by user identity rules."""
    db = get_db()
    await db[COLLECTION].create_index("username", unique=True)
    await db[COLLECTION].create_index(
        [("authProvider", 1), ("authProviderUserId", 1)],
        unique=True,
        partialFilterExpression={
            "authProvider": {"$exists": True},
            "authProviderUserId": {"$exists": True},
        },
    )


async def list_all() -> list[dict[str, Any]]:
    """Return every user document (raw Mongo docs with _id)."""
    db = get_db()
    cursor = db[COLLECTION].find()
    return [doc async for doc in cursor]


async def find_by_id(user_id: str) -> dict[str, Any] | None:
    """Find a user by their public userId. Returns None if not found."""
    db = get_db()
    return await db[COLLECTION].find_one({"userId": user_id})


async def find_by_auth_provider_user_id(
    auth_provider_user_id: str,
    auth_provider: str = "supabase",
) -> dict[str, Any] | None:
    """Find a user by external auth-provider identity."""
    db = get_db()
    return await db[COLLECTION].find_one(
        {
            "authProvider": auth_provider,
            "authProviderUserId": auth_provider_user_id,
        },
    )


async def create(username: str, personality: dict[str, Any]) -> dict[str, Any]:
    """Insert a new user. Raises DuplicateKeyError if username is taken."""
    db = get_db()
    doc = {
        "userId": new_id(),
        "username": username,
        "personality": personality,
        "chats": [],  # Starts empty; populated when chats are created.
        "createdAt": now_utc(),
    }
    await db[COLLECTION].insert_one(doc)
    return doc


async def create_from_auth(
    *,
    auth_provider_user_id: str,
    email: str | None,
    username: str,
    personality: dict[str, Any] | None = None,
    auth_provider: str = "supabase",
) -> dict[str, Any]:
    """Insert a user mapped from an external auth provider."""
    db = get_db()
    doc = {
        "userId": new_id(),
        "authProvider": auth_provider,
        "authProviderUserId": auth_provider_user_id,
        "email": email,
        "username": username,
        "personality": personality or {},
        "chats": [],
        "createdAt": now_utc(),
    }
    await db[COLLECTION].insert_one(doc)
    return doc


async def update(user_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    """Patch user fields. Returns updated doc or None if not found."""
    db = get_db()
    result = await db[COLLECTION].update_one(
        {"userId": user_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        return None
    return await db[COLLECTION].find_one({"userId": user_id})


async def delete(user_id: str) -> bool:
    """Delete a user by userId. Returns True if deleted, False if not found."""
    db = get_db()
    result = await db[COLLECTION].delete_one({"userId": user_id})
    return result.deleted_count > 0


async def add_chat(user_id: str, chat_id: str) -> None:
    """Push a chatId into the user's chats[] array ($addToSet prevents duplicates)."""
    db = get_db()
    await db[COLLECTION].update_one(
        {"userId": user_id},
        {"$addToSet": {"chats": chat_id}},
    )


async def remove_chat(user_id: str, chat_id: str) -> None:
    """Pull a chatId from the user's chats[] array."""
    db = get_db()
    await db[COLLECTION].update_one(
        {"userId": user_id},
        {"$pull": {"chats": chat_id}},
    )

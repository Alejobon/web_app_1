"""Service for User entity — business/orchestration rules.

Users are currently straightforward CRUD with no cross-entity orchestration.
This service exists to maintain the layering contract so routers never call
repositories directly, and to give a home for future business rules
(e.g. cascade delete of user's chats/messages, validation).

Cache-aside: reads are cached in Redis when available. Writes invalidate
the relevant cache keys so the next read fetches fresh data from Mongo.
"""

from __future__ import annotations

from typing import Any

from pymongo.errors import DuplicateKeyError

from app.cache import CacheKeys, cache
from app.core.config import get_settings
from app.repositories import user_repository
from app.services import user_context_service


async def list_all() -> list[dict[str, Any]]:
    """Return every user document."""
    return await user_repository.list_all()


async def ensure_indexes() -> None:
    """Ensure user uniqueness constraints exist in MongoDB."""
    await user_repository.ensure_indexes()


@cache.cached(
    key_builder=lambda user_id: CacheKeys.user(user_id),
    ttl=get_settings().redis_ttl_seconds,
)
async def find_by_id(user_id: str) -> dict[str, Any] | None:
    """Find a user by their public userId."""
    return await user_repository.find_by_id(user_id)


async def create(username: str, personality: dict[str, Any]) -> dict[str, Any]:
    """Create a new user. Raises DuplicateKeyError if username is taken."""
    doc = await user_repository.create(username, personality)
    await user_context_service.warm_user_context(doc)
    return doc


async def find_or_create_from_auth(
    *,
    auth_provider_user_id: str,
    email: str | None,
) -> dict[str, Any]:
    """Return the internal user mapped to a Supabase identity.

    If the Supabase user logs in for the first time, create a Mongo user
    that keeps our internal ``userId`` while storing the external auth link.
    """
    existing = await user_repository.find_by_auth_provider_user_id(
        auth_provider_user_id,
    )
    if existing is not None:
        await user_context_service.warm_user_context(existing)
        return existing

    username = _username_from_auth(email, auth_provider_user_id)
    try:
        created = await user_repository.create_from_auth(
            auth_provider_user_id=auth_provider_user_id,
            email=email,
            username=username,
        )
        await user_context_service.warm_user_context(created)
        return created
    except DuplicateKeyError:
        created = await user_repository.create_from_auth(
            auth_provider_user_id=auth_provider_user_id,
            email=email,
            username=f"{username}-{auth_provider_user_id[:8]}",
        )
        await user_context_service.warm_user_context(created)
        return created


async def update(user_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    """Patch user fields. Returns updated doc or None if not found."""
    doc = await user_repository.update(user_id, update_data)
    if doc is not None:
        await cache.delete(CacheKeys.user(user_id))
        await cache.delete(CacheKeys.user_context(user_id))
        await user_context_service.warm_user_context(doc)
    return doc


async def delete(user_id: str) -> bool:
    """Delete a user by userId. Returns True if deleted, False if not found."""
    deleted = await user_repository.delete(user_id)
    if deleted:
        await cache.delete(CacheKeys.user(user_id))
        await cache.delete(CacheKeys.user_chats(user_id))
        await cache.delete(CacheKeys.user_context(user_id))
    return deleted


def _username_from_auth(email: str | None, auth_provider_user_id: str) -> str:
    """Derive a stable default username for first-login provisioning."""
    if email and "@" in email:
        return email.split("@", 1)[0]
    return f"user-{auth_provider_user_id[:8]}"

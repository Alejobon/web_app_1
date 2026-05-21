"""Service for Task entity — business/orchestration rules.

Owns the updatedAt lifecycle: every update auto-bumps updatedAt so clients
can detect stale data. The repository only does the raw $set operation.
"""

from __future__ import annotations

from typing import Any

from app.cache import CacheKeys, cache
from app.core.config import get_settings
from app.db.helpers import now_utc
from app.repositories import task_repository
from app.services import user_context_service

_settings = get_settings()


async def ensure_indexes() -> None:
    """Ensure task query indexes exist in MongoDB."""
    await task_repository.ensure_indexes()


async def list_all(
    user_id: str | None = None,
    task_status: str | None = None,
) -> list[dict[str, Any]]:
    """Return tasks with optional user and status filters. Newest first."""
    if user_id is None:
        return await task_repository.list_all(user_id=user_id, task_status=task_status)

    key = CacheKeys.user_tasks(user_id, task_status)
    cached_tasks = await cache.get(key)
    if cached_tasks is not None:
        return cached_tasks

    tasks = await task_repository.list_all(user_id=user_id, task_status=task_status)
    await cache.set(key, tasks, _settings.redis_ttl_seconds)
    return tasks


@cache.cached(
    key_builder=lambda task_id: CacheKeys.task(task_id),
    ttl=_settings.redis_ttl_seconds,
)
async def find_by_id(task_id: str) -> dict[str, Any] | None:
    """Find a task by its public taskId."""
    return await task_repository.find_by_id(task_id)


async def create(
    user_id: str,
    title: str,
    description: str = "",
    status: str = "pending",
) -> dict[str, Any]:
    """Insert a new task. createdAt and updatedAt start equal."""
    doc = await task_repository.create(user_id, title, description, status)
    await cache.set(CacheKeys.task(doc["taskId"]), doc, _settings.redis_ttl_seconds)
    await _invalidate_user_task_lists(user_id)
    user_context_service.schedule_user_context_refresh(user_id)
    return doc


async def update(task_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    """Patch task fields and auto-bump updatedAt.

    Returns updated doc or None if not found.
    """
    # Business rule: always bump updatedAt on any task change.
    update_data["updatedAt"] = now_utc()
    doc = await task_repository.update(task_id, update_data)
    if doc is not None:
        await cache.set(CacheKeys.task(task_id), doc, _settings.redis_ttl_seconds)
        await _invalidate_user_task_lists(doc["userId"])
        user_context_service.schedule_user_context_refresh(doc["userId"])
    return doc


async def delete(task_id: str, user_id: str | None = None) -> bool:
    """Delete a task by taskId. Returns True if deleted, False if not found."""
    existing = None
    if user_id is None:
        existing = await task_repository.find_by_id(task_id)
        user_id = existing.get("userId") if existing else None

    deleted = await task_repository.delete(task_id)
    if deleted:
        await cache.delete(CacheKeys.task(task_id))
        if user_id:
            await _invalidate_user_task_lists(user_id)
            user_context_service.schedule_user_context_refresh(user_id)
    return deleted


async def _invalidate_user_task_lists(user_id: str) -> None:
    """Invalidate all per-user task-list cache variants and prompt context."""
    await cache.delete_pattern(CacheKeys.user_tasks_pattern(user_id))
    await cache.delete(CacheKeys.user_context(user_id))

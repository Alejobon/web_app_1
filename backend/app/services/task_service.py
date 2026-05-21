"""Service for Task entity — business/orchestration rules.

Owns the updatedAt lifecycle: every update auto-bumps updatedAt so clients
can detect stale data. The repository only does the raw $set operation.
"""

from __future__ import annotations

from typing import Any

from app.db.helpers import now_utc
from app.repositories import task_repository
from app.services import user_context_service


async def list_all(
    user_id: str | None = None,
    task_status: str | None = None,
) -> list[dict[str, Any]]:
    """Return tasks with optional user and status filters. Newest first."""
    return await task_repository.list_all(user_id=user_id, task_status=task_status)


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
    await user_context_service.refresh_user_context(user_id)
    return doc


async def update(task_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    """Patch task fields and auto-bump updatedAt.

    Returns updated doc or None if not found.
    """
    # Business rule: always bump updatedAt on any task change.
    update_data["updatedAt"] = now_utc()
    doc = await task_repository.update(task_id, update_data)
    if doc is not None:
        await user_context_service.refresh_user_context(doc["userId"])
    return doc


async def delete(task_id: str, user_id: str | None = None) -> bool:
    """Delete a task by taskId. Returns True if deleted, False if not found."""
    deleted = await task_repository.delete(task_id)
    if deleted and user_id:
        await user_context_service.refresh_user_context(user_id)
    return deleted

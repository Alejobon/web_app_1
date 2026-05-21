"""Repository for Task entity — owns all DB operations on the tasks collection."""

from __future__ import annotations

from typing import Any

from pymongo import DESCENDING

from app.db.helpers import get_db, new_id, now_utc

COLLECTION = "tasks"


async def list_all(
    user_id: str | None = None,
    task_status: str | None = None,
) -> list[dict[str, Any]]:
    """Return tasks with optional user and status filters. Newest first."""
    db = get_db()
    query: dict[str, Any] = {}
    if user_id:
        query["userId"] = user_id
    if task_status:
        query["status"] = task_status

    cursor = db[COLLECTION].find(query).sort("createdAt", DESCENDING)
    return [doc async for doc in cursor]


async def find_by_id(task_id: str) -> dict[str, Any] | None:
    """Find a task by its public taskId. Returns None if not found."""
    db = get_db()
    return await db[COLLECTION].find_one({"taskId": task_id})


async def create(
    user_id: str,
    title: str,
    description: str = "",
    status: str = "pending",
) -> dict[str, Any]:
    """Insert a new task. createdAt and updatedAt start equal."""
    db = get_db()
    ts = now_utc()
    doc = {
        "taskId": new_id(),
        "userId": user_id,
        "title": title,
        "description": description,
        "status": status,
        "createdAt": ts,
        "updatedAt": ts,
    }
    await db[COLLECTION].insert_one(doc)
    return doc


async def update(task_id: str, update_data: dict[str, Any]) -> dict[str, Any] | None:
    """Patch task fields. Returns updated doc or None if not found.

    Pure persistence — updatedAt lifecycle is owned by the task service.
    """
    db = get_db()
    result = await db[COLLECTION].update_one(
        {"taskId": task_id},
        {"$set": update_data},
    )
    if result.matched_count == 0:
        return None
    return await db[COLLECTION].find_one({"taskId": task_id})


async def delete(task_id: str) -> bool:
    """Delete a task by taskId. Returns True if deleted, False if not found."""
    db = get_db()
    result = await db[COLLECTION].delete_one({"taskId": task_id})
    return result.deleted_count > 0

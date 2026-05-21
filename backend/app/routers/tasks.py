"""CRUD router for Tasks.

Thin HTTP layer: validates request, delegates to TaskService,
translates service results/errors to HTTP responses.
"""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.auth import get_current_user
from app.db.helpers import DatabaseNotAvailableError
from app.schemas import TaskCreate, TaskResponse, TaskUpdate
from app.services import task_service

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _to_response(doc: dict) -> TaskResponse:
    """Map a raw Mongo doc to the API response schema, stripping _id."""
    return TaskResponse(
        taskId=doc["taskId"],
        userId=doc["userId"],
        title=doc["title"],
        description=doc.get("description", ""),
        status=doc.get("status", "pending"),
        createdAt=doc["createdAt"],
        updatedAt=doc["updatedAt"],
    )


@router.get("", response_model=list[TaskResponse])
async def list_tasks(
    task_status: str | None = Query(default=None, description="Filter by status"),
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[TaskResponse]:
    try:
        docs = await task_service.list_all(
            user_id=current_user["userId"], task_status=task_status,
        )
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    return [_to_response(doc) for doc in docs]


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> TaskResponse:
    try:
        doc = await task_service.find_by_id(task_id)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if doc is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if doc["userId"] != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    return _to_response(doc)


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    body: TaskCreate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> TaskResponse:
    try:
        doc = await task_service.create(
            current_user["userId"], body.title, body.description, body.status,
        )
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    return _to_response(doc)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    body: TaskUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> TaskResponse:
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        existing = await task_service.find_by_id(task_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Task not found")
        if existing["userId"] != current_user["userId"]:
            raise HTTPException(status_code=403, detail="Forbidden")
        doc = await task_service.update(task_id, update_data)
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if doc is None:
        raise HTTPException(status_code=404, detail="Task not found")
    return _to_response(doc)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> None:
    try:
        existing = await task_service.find_by_id(task_id)
        if existing is None:
            raise HTTPException(status_code=404, detail="Task not found")
        if existing["userId"] != current_user["userId"]:
            raise HTTPException(status_code=403, detail="Forbidden")
        deleted = await task_service.delete(task_id, current_user["userId"])
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available")
    if not deleted:
        raise HTTPException(status_code=404, detail="Task not found")

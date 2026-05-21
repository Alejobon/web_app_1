"""Pydantic schemas for the Task entity.

Tasks belong to a User and track progress through a simple status
lifecycle: pending -> in_progress -> done. The repository auto-bumps
updatedAt on every PUT.
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

TaskStatus = Literal["pending", "in_progress", "done"]


class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    status: TaskStatus = "pending"


class TaskUpdate(BaseModel):
    """All fields optional — only sent fields get patched via $set.

    updatedAt is auto-bumped by the repository, not by the client.
    """

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus | None = None


class TaskResponse(BaseModel):
    taskId: str
    userId: str
    title: str
    description: str
    status: str
    createdAt: datetime
    updatedAt: datetime

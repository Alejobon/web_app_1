"""Pydantic schemas for the User entity.

Three-schema pattern:
  - UserCreate: POST body (username required, personality optional)
  - UserUpdate: PUT body (all fields optional for partial patch)
  - UserResponse: API response shape (includes server-generated userId + chats[])
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    personality: dict[str, Any] = Field(default_factory=dict)


class UserUpdate(BaseModel):
    """All fields optional — only sent fields get patched via $set."""

    username: str | None = Field(default=None, min_length=3, max_length=50)
    personality: dict[str, Any] | None = None


class UserResponse(BaseModel):
    userId: str
    authProvider: str | None = None
    authProviderUserId: str | None = None
    email: str | None = None
    username: str
    personality: dict[str, Any]
    chats: list[str]  # Denormalized list of chatIds, kept in sync by the chats router.

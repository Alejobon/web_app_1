"""Pydantic schemas for the Chat entity.

A Chat belongs to a User. The userId in ChatCreate must reference
an existing user — the chats repository enforces this at the data layer.
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ChatCreate(BaseModel):
    """POST body for chat creation.

    The user is inferred from the Authorization bearer token.
    """

    pass


class ChatUpdate(BaseModel):
    """All fields optional — only sent fields get patched via $set."""

    userId: str | None = None


class ChatResponse(BaseModel):
    chatId: str
    userId: str
    createdAt: datetime

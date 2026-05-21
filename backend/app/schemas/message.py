"""Pydantic schemas for the Message entity.

Messages are child documents of a Chat. The role field distinguishes
who produced the message: "user", "assistant" (AI), or "system".
"""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

MessageRole = Literal["user", "assistant", "system"]


class MessageCreate(BaseModel):
    chatId: str  # Must reference an existing chat.
    role: MessageRole
    content: str = Field(..., min_length=1, max_length=4000)


class MessageUpdate(BaseModel):
    """All fields optional — only sent fields get patched via $set."""

    role: MessageRole | None = None
    content: str | None = Field(default=None, min_length=1, max_length=4000)


class MessageResponse(BaseModel):
    messageId: str
    chatId: str
    role: str
    content: str
    createdAt: datetime

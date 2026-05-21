"""Pydantic schemas for the AI streaming chat endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field


class ChatStreamRequest(BaseModel):
    """Body for POST /api/v1/chats/{chatId}/messages/stream.

    The authenticated user comes from the Authorization bearer token.
    """

    content: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User message content",
    )
    historyLimit: int | None = Field(
        default=None,
        ge=1,
        le=100,
        description="Override how many recent messages to load as context. "
        "Defaults to LLM_HISTORY_LIMIT from settings.",
    )

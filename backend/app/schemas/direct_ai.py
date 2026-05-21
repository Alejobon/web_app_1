"""Pydantic schemas for direct AI interaction endpoints."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class DirectAIStreamRequest(BaseModel):
    """Body for POST /api/v1/ai/stream."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=4000,
        description="User message sent directly to the AI provider.",
    )

    @field_validator("message")
    @classmethod
    def message_must_not_be_blank(cls, value: str) -> str:
        clean_value = value.strip()
        if not clean_value:
            raise ValueError("Message cannot be blank")
        return clean_value

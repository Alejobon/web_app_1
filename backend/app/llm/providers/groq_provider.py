"""Groq LLM provider — async streaming via the official Python SDK."""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

from app.llm.usage_guard import get_llm_usage_guard


class GroqProvider:
    """Thin wrapper around AsyncGroq that yields content tokens.

    The provider is stateless per-request: it creates an AsyncGroq client
    on each `stream_chat()` call to avoid event-loop lifecycle issues.
    """

    def __init__(
        self,
        *,
        api_key: str,
        model: str = "llama-3.3-70b-versatile",
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> None:
        self._api_key = api_key
        self._model = model
        self._temperature = temperature
        self._max_tokens = max_tokens

    async def stream_chat(
        self,
        messages: list[dict[str, str]],
    ) -> AsyncIterator[str]:
        """Yield content tokens from a Groq chat completion stream.

        Args:
            messages: List of {"role": ..., "content": ...} dicts
                      (system + history + current user message).

        Yields:
            Each non-empty delta content string as it arrives.

        Raises:
            ValueError: If the API key is not configured.
            groq.APIError: On Groq-side failures (caller should catch).
        """
        if not self._api_key:
            raise ValueError(
                "GROQ_API_KEY is not configured. "
                "Set it in your .env file or environment."
            )

        async with get_llm_usage_guard().slot():
            try:
                from groq import AsyncGroq
            except ImportError:
                raise RuntimeError(
                    "The 'groq' package is not installed. "
                    "Run: pip install -r requirements.txt"
                ) from None

            client = AsyncGroq(api_key=self._api_key)
            stream = await client.chat.completions.create(
                messages=messages,  # type: ignore[arg-type]
                model=self._model,
                temperature=self._temperature,
                max_tokens=self._max_tokens,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta
                if delta.content:
                    yield delta.content

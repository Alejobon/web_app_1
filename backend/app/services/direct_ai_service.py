"""Service for direct AI streaming without chat persistence."""

from __future__ import annotations

import json
import logging
from collections.abc import AsyncIterator

from app.core.config import get_settings
from app.llm.client import get_provider
from app.llm.safety import CRISIS_RESPONSE, is_high_risk_message
from app.llm.sanitizers import StreamingOutputSanitizer, sanitize_llm_output
from app.llm.usage_guard import LLMUsageLimitExceeded

logger = logging.getLogger(__name__)


async def stream_direct_ai_response(message: str) -> AsyncIterator[str]:
    """Yield SSE-formatted events for a direct AI response.

    This endpoint intentionally does not read or write chats/messages. It only
    sends the provided message to the configured LLM provider with the global
    system prompt, then streams sanitized tokens back to the caller.
    """
    if is_high_risk_message(message):
        yield _sse_token(CRISIS_RESPONSE)
        yield _sse_done()
        return

    settings = get_settings()
    llm_messages = [
        {"role": "system", "content": settings.llm_system_prompt},
        {"role": "user", "content": message},
    ]

    try:
        provider = get_provider()
    except (ValueError, RuntimeError) as exc:
        yield _sse_error(str(exc))
        return

    assistant_content_parts: list[str] = []
    streaming_sanitizer = StreamingOutputSanitizer()

    try:
        async for token in provider.stream_chat(llm_messages):
            assistant_content_parts.append(token)
            safe_token = streaming_sanitizer.feed(token)
            if safe_token:
                yield _sse_token(safe_token)
    except Exception as exc:
        logger.exception("Direct LLM streaming failed")
        if not assistant_content_parts:
            yield _sse_error(_safe_error_message(exc))
            return

    trailing_safe_content = streaming_sanitizer.flush()
    if trailing_safe_content:
        yield _sse_token(trailing_safe_content)

    full_content = sanitize_llm_output("".join(assistant_content_parts))
    if not full_content.strip():
        yield _sse_error("The AI did not produce a response")
        return

    yield _sse_done()


def _sse_token(content: str) -> str:
    """Format a single token as an SSE data line."""
    return f"data: {json.dumps({'type': 'token', 'content': content}, ensure_ascii=False)}\n\n"


def _sse_done() -> str:
    """Format the terminal SSE event for a direct non-persisted stream."""
    return f"data: {json.dumps({'type': 'done'})}\n\n"


def _sse_error(message: str) -> str:
    """Format an error event. Never exposes raw provider errors."""
    return f"data: {json.dumps({'type': 'error', 'message': message}, ensure_ascii=False)}\n\n"


def _safe_error_message(exc: Exception) -> str:
    """Return a user-safe error message, stripping any potential secrets."""
    if isinstance(exc, LLMUsageLimitExceeded):
        return "El servicio de IA está con mucha demanda. Probá de nuevo en un momento."

    error_str = str(exc).lower()
    if "api_key" in error_str or "unauthorized" in error_str or "401" in error_str:
        return "Authentication error with the AI provider. Check server configuration."
    if "rate" in error_str or "429" in error_str:
        return "Too many requests. Please wait a moment and try again."
    if "timeout" in error_str or "timed out" in error_str:
        return "The AI service timed out. Please try again."
    return "An unexpected error occurred while generating the response."

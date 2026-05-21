from __future__ import annotations

import asyncio

import pytest

from app.llm.usage_guard import LLMUsageGuard, LLMUsageLimitExceeded
from app.services.ai_chat_service import _safe_error_message


def test_llm_usage_guard_rejects_requests_over_rate_limit() -> None:
    now = 0.0
    guard = LLMUsageGuard(
        max_requests_per_minute=2,
        max_concurrent_requests=10,
        clock=lambda: now,
    )

    async def run() -> None:
        async with guard.slot():
            pass
        async with guard.slot():
            pass

        with pytest.raises(LLMUsageLimitExceeded):
            async with guard.slot():
                pass

    asyncio.run(run())


def test_llm_usage_guard_rejects_requests_over_concurrency_limit() -> None:
    guard = LLMUsageGuard(
        max_requests_per_minute=10,
        max_concurrent_requests=1,
    )

    async def run() -> None:
        async with guard.slot():
            with pytest.raises(LLMUsageLimitExceeded):
                async with guard.slot():
                    pass

    asyncio.run(run())


def test_safe_error_message_handles_llm_usage_limit() -> None:
    message = _safe_error_message(
        LLMUsageLimitExceeded("LLM rate limit reached"),
    )

    assert message == "El servicio de IA está con mucha demanda. Probá de nuevo en un momento."

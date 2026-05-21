"""In-process usage guard for outbound LLM calls.

This is intentionally small and dependency-free for the MVP. It protects a
single running API process from flooding the LLM provider/API key with too many
simultaneous or per-minute requests.
"""

from __future__ import annotations

import time
from collections import deque
from contextlib import asynccontextmanager
from typing import AsyncIterator, Callable

from app.core.config import get_settings


class LLMUsageLimitExceeded(RuntimeError):
    """Raised when the local LLM usage guard rejects a request."""


class LLMUsageGuard:
    """Async-safe per-process limiter for LLM provider calls."""

    def __init__(
        self,
        *,
        max_requests_per_minute: int,
        max_concurrent_requests: int,
        clock: Callable[[], float] = time.monotonic,
    ) -> None:
        self._max_requests_per_minute = max_requests_per_minute
        self._max_concurrent_requests = max_concurrent_requests
        self._clock = clock
        self._timestamps: deque[float] = deque()
        self._active_requests = 0

        import asyncio

        self._lock = asyncio.Lock()

    @asynccontextmanager
    async def slot(self) -> AsyncIterator[None]:
        """Acquire a provider-call slot or fail fast when overloaded."""
        await self._acquire()
        try:
            yield
        finally:
            await self._release()

    async def _acquire(self) -> None:
        async with self._lock:
            now = self._clock()
            self._prune_old_timestamps(now)

            if (
                self._max_concurrent_requests > 0
                and self._active_requests >= self._max_concurrent_requests
            ):
                raise LLMUsageLimitExceeded(
                    "LLM concurrency limit reached. Please try again shortly.",
                )

            if (
                self._max_requests_per_minute > 0
                and len(self._timestamps) >= self._max_requests_per_minute
            ):
                raise LLMUsageLimitExceeded(
                    "LLM rate limit reached. Please try again shortly.",
                )

            self._active_requests += 1
            self._timestamps.append(now)

    async def _release(self) -> None:
        async with self._lock:
            self._active_requests = max(self._active_requests - 1, 0)

    def _prune_old_timestamps(self, now: float) -> None:
        while self._timestamps and now - self._timestamps[0] >= 60:
            self._timestamps.popleft()


_guard: LLMUsageGuard | None = None
_guard_config: tuple[int, int] | None = None


def get_llm_usage_guard() -> LLMUsageGuard:
    """Return a process-wide guard configured from settings."""
    global _guard, _guard_config

    settings = get_settings()
    config = (
        settings.llm_rate_limit_per_minute,
        settings.llm_max_concurrent_requests,
    )

    if _guard is None or _guard_config != config:
        _guard = LLMUsageGuard(
            max_requests_per_minute=settings.llm_rate_limit_per_minute,
            max_concurrent_requests=settings.llm_max_concurrent_requests,
        )
        _guard_config = config

    return _guard

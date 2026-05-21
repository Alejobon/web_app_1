"""Async Redis cache-aside client with safe degradation.

Design decisions:
- Lazy connection: the Redis client is created on first use, not at import time.
  If REDIS_ENABLED=false, no connection is ever attempted and all cache
  operations are silent no-ops.
- Safe degradation: every public method catches Redis/connection errors
  and returns a cache miss. The application never crashes because of cache.
- JSON serialization: Mongo documents (dicts with datetime fields) are
  serialized via a custom JSON encoder that handles datetime → ISO string.
- The ``_id`` field from Mongo documents is stripped before caching to
  avoid exposing internal IDs if cached data leaks.
"""

from __future__ import annotations

import functools
import inspect
import json
import logging
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# Lazy-imported Upstash client — resolved on first use.
_client: Any = None
_initialized: bool = False


class _DateTimeEncoder(json.JSONEncoder):
    """JSON encoder that handles datetime objects from Mongo documents."""

    def default(self, obj: Any) -> Any:
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def _serialize(data: Any) -> str:
    """Serialize a Python object to JSON, handling datetime fields."""
    return json.dumps(data, cls=_DateTimeEncoder, ensure_ascii=False)


def _deserialize(raw: str) -> Any:
    """Deserialize JSON string back to Python object."""
    return json.loads(raw)


def _strip_wrapping_quotes(value: str) -> str:
    """Remove surrounding single/double quotes from env values."""
    cleaned = value.strip()
    if len(cleaned) >= 2 and cleaned[0] == cleaned[-1] and cleaned[0] in {"'", '"'}:
        return cleaned[1:-1].strip()
    return cleaned


def _normalize_rest_credentials(raw_url: str, raw_token: str) -> tuple[str, str, bool]:
    """Normalize Redis settings into Upstash REST credentials.

    Returns ``(url, token, normalized_from_tcp)``.
    """
    cleaned_url = _strip_wrapping_quotes(raw_url)
    cleaned_token = _strip_wrapping_quotes(raw_token)

    if cleaned_url.startswith(("redis://", "rediss://")):
        parsed = urlparse(cleaned_url)
        normalized_url = f"https://{parsed.hostname}" if parsed.hostname else ""
        normalized_token = cleaned_token or parsed.password or ""
        return normalized_url, normalized_token, True

    return cleaned_url, cleaned_token, False


def _strip_mongo_id(doc: dict[str, Any]) -> dict[str, Any]:
    """Remove the internal ``_id`` field before caching.

    The API layer already strips ``_id`` in ``_to_response()`` helpers,
    but cached documents might be consumed by service logic that doesn't
    go through the response mapper.
    """
    cleaned = dict(doc)
    cleaned.pop("_id", None)
    return cleaned


def _clean_for_cache(data: Any) -> Any:
    """Prepare data for caching: strip ``_id`` from dicts/lists of dicts."""
    if isinstance(data, dict):
        return _strip_mongo_id(data)
    if isinstance(data, list):
        return [_strip_mongo_id(d) if isinstance(d, dict) else d for d in data]
    return data


async def _ensure_client() -> Any:
    """Lazily initialize the Redis client. Returns None if unavailable."""
    global _client, _initialized

    if _initialized:
        return _client

    _initialized = True

    try:
        from app.core.config import get_settings
        settings = get_settings()

        if not settings.redis_enabled:
            logger.info("Redis cache disabled (REDIS_ENABLED=false)")
            return None

        raw_url, raw_token, normalized_from_tcp = _normalize_rest_credentials(
            settings.upstash_redis_rest_url,
            settings.upstash_redis_rest_token,
        )

        if normalized_from_tcp:
            logger.warning(
                "Upstash Redis configured with TCP DSN; normalizing to REST https:// endpoint",
            )

        if not raw_url or not raw_token:
            logger.warning(
                "Redis cache enabled but Upstash REST credentials are missing",
            )
            return None

        from upstash_redis.asyncio import Redis as UpstashRedis

        _client = UpstashRedis(
            url=raw_url,
            token=raw_token,
        )

        # Verify connection with a ping
        await _client.ping()
        logger.info("Upstash Redis REST cache connected")
        return _client

    except ImportError:
        logger.warning("upstash-redis package not installed — cache disabled")
        return None
    except Exception as exc:
        logger.warning("Redis connection failed — cache disabled: %s", exc)
        _client = None
        return None


async def close() -> None:
    """Close the Redis connection on app shutdown."""
    global _client, _initialized
    if _client is not None:
        try:
            maybe_awaitable = _client.close()
            if inspect.isawaitable(maybe_awaitable):
                await maybe_awaitable
        except Exception:
            pass
        _client = None
    _initialized = False


async def get(key: str) -> Any | None:
    """Fetch a cached value by key. Returns None on miss or error."""
    client = await _ensure_client()
    if client is None:
        return None
    try:
        raw = await client.get(key)
        if raw is None:
            return None
        return _deserialize(raw)
    except Exception as exc:
        logger.debug("Cache get failed for %s: %s", key, exc)
        return None


async def set(key: str, value: Any, ttl: int) -> None:
    """Store a value in cache with a TTL in seconds. No-op on error."""
    client = await _ensure_client()
    if client is None:
        return None
    try:
        cleaned = _clean_for_cache(value)
        await client.set(key, _serialize(cleaned), ex=ttl)
    except Exception as exc:
        logger.debug("Cache set failed for %s: %s", key, exc)


async def delete(key: str) -> None:
    """Delete a single cache key. No-op on error."""
    client = await _ensure_client()
    if client is None:
        return None
    try:
        await client.delete(key)
    except Exception as exc:
        logger.debug("Cache delete failed for %s: %s", key, exc)


async def delete_pattern(pattern: str) -> None:
    """Delete all keys matching a glob pattern (e.g. ``desahogate:msg:*:chat123``).

    Uses SCAN to avoid blocking the server on large keyspaces.
    No-op on error.
    """
    client = await _ensure_client()
    if client is None:
        return None
    try:
        cursor = 0
        while True:
            cursor, keys = await client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                await client.delete(*keys)
            if str(cursor) == "0":
                break
    except Exception as exc:
        logger.debug("Cache delete_pattern failed for %s: %s", pattern, exc)


async def ping() -> bool:
    """Return True if Redis is reachable. Used by health checks."""
    client = await _ensure_client()
    if client is None:
        return False
    try:
        await client.ping()
        return True
    except Exception:
        return False


async def is_enabled() -> bool:
    """Return True if Redis is configured (REDIS_ENABLED=true)."""
    try:
        from app.core.config import get_settings
        return get_settings().redis_enabled
    except Exception:
        return False


def cached(key_builder: Any, ttl: int) -> Any:
    """Decorator for service functions: check cache before executing.

    Usage::

        @cached(lambda user_id: CacheKeys.user(user_id), ttl=300)
        async def find_by_id(user_id: str) -> dict | None:
            ...

    The decorated function's positional/keyword args are passed to
    ``key_builder`` to construct the cache key. If the cache has a
    hit, the function is skipped entirely.
    """

    def decorator(func: Any) -> Any:
        @functools.wraps(func)
        async def wrapper(*args: Any, **kwargs: Any) -> Any:
            # Build cache key from function arguments.
            sig = inspect.signature(func)
            bound = sig.bind(*args, **kwargs)
            bound.apply_defaults()
            key = key_builder(**bound.arguments)

            # Try cache first
            hit = await get(key)
            if hit is not None:
                return hit

            # Cache miss — call the real function
            result = await func(*args, **kwargs)

            # Only cache non-None results (None = not found)
            if result is not None:
                await set(key, result, ttl)

            return result

        return wrapper

    return decorator


class _CacheFacade:
    """Small facade so services can depend on one cache object.

    Keeping the functions module-level makes them easy to test/import, while
    this object preserves the clean service API: ``from app.cache import cache``.
    """

    close = staticmethod(close)
    get = staticmethod(get)
    set = staticmethod(set)
    delete = staticmethod(delete)
    delete_pattern = staticmethod(delete_pattern)
    ping = staticmethod(ping)
    is_enabled = staticmethod(is_enabled)
    cached = staticmethod(cached)


cache = _CacheFacade()

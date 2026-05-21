"""Cache layer — optional Redis cache-aside for read acceleration.

MongoDB remains the source of truth. Redis is an optional read cache
that degrades gracefully when unavailable or disabled.
"""

from app.cache.keys import CacheKeys
from app.cache.redis import cache

__all__ = ["CacheKeys", "cache"]

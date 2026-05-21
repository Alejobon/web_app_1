"""Cache key patterns for the Desahogate API.

All keys use the ``desahogate:`` prefix for namespace isolation.
TTL values come from settings and are passed by the caller (services)
so the key module stays config-free.
"""


class CacheKeys:
    """Centralized cache key builders.

    Each classmethod returns the Redis string key for a specific cache entry.
    Keys include all parameters that affect the query result so different
    query variants never collide.
    """

    PREFIX = "desahogate"

    # ── Users ─────────────────────────────────────────────────────────

    @staticmethod
    def user(user_id: str) -> str:
        """Single user document by userId."""
        return f"{CacheKeys.PREFIX}:user:{user_id}"

    @staticmethod
    def user_chats(user_id: str) -> str:
        """Chat list for a specific user."""
        return f"{CacheKeys.PREFIX}:user:{user_id}:chats"

    @staticmethod
    def user_context(user_id: str) -> str:
        """Prompt-context snapshot for a specific user."""
        return f"{CacheKeys.PREFIX}:user:{user_id}:context"

    # ── Chats ─────────────────────────────────────────────────────────

    @staticmethod
    def chat(chat_id: str) -> str:
        """Single chat document by chatId."""
        return f"{CacheKeys.PREFIX}:chat:{chat_id}"

    # ── Messages ──────────────────────────────────────────────────────

    @staticmethod
    def message_latest(chat_id: str) -> str:
        """Most recent message for a given chat."""
        return f"{CacheKeys.PREFIX}:msg:latest:{chat_id}"

    @staticmethod
    def message_history(chat_id: str, limit: int, sort: str) -> str:
        """Message list for a chat, parameterized by limit and sort order.

        Different (limit, sort) combos are cached independently because
        they produce different result sets.
        """
        return f"{CacheKeys.PREFIX}:msg:history:{chat_id}:{limit}:{sort}"

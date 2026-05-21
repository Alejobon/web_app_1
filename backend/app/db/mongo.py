"""Async MongoDB client wrapper.

Exposes a module-level `mongo` singleton that the app initializes once
during lifespan and all routers import directly. This keeps connection
management centralized while giving routers simple access to `mongo.database`.
"""

from typing import Any

from pymongo import AsyncMongoClient

from app.core.config import Settings


class Mongo:
    """Holds the async MongoClient and exposes connect/close/ping.

    Usage:
        # In main.py lifespan:
        await mongo.connect(settings)
        # In routers:
        db = mongo.database
    """

    def __init__(self) -> None:
        self.client: AsyncMongoClient[dict[str, Any]] | None = None
        self.database: Any | None = None

    async def connect(self, settings: Settings) -> None:
        """Initialize the client and select the database.

        Skips silently if MongoDB is not configured (e.g. local dev without Atlas).
        """
        uri = settings.mongodb_cluster_uri.strip()

        if not uri:
            return

        if not uri.startswith(("mongodb://", "mongodb+srv://")):
            raise RuntimeError(
                f"Invalid MONGODB_CLUSTER_URI. It must start with mongodb:// or mongodb+srv://. "
                f"Current value starts with: {uri[:25]!r}"
            )

        self.client = AsyncMongoClient(
            uri,
            appname=settings.app_name,
            serverSelectionTimeoutMS=settings.mongodb_timeout_ms,
        )
        self.database = self.client[settings.mongodb_database]

    async def close(self) -> None:
        """Gracefully close the connection on app shutdown."""
        if self.client is not None:
            await self.client.close()
            self.client = None
            self.database = None

    async def ping(self) -> bool:
        """Return True if the server responds to a ping command."""
        if self.client is None:
            return False

        await self.client.admin.command("ping")
        return True


# Module-level singleton — importable by all routers.
mongo = Mongo()

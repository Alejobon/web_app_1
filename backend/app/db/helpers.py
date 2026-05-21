"""Shared database helpers.

Provides UUID generation, UTC timestamps, and a standard error
for database-unavailable scenarios used across repositories.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone


class DatabaseNotAvailableError(Exception):
    """Raised when a repository tries to access the DB before it is connected."""


def get_db():
    """Return the active database or raise DatabaseNotAvailableError.

    Repositories call this instead of inlining the None-check every time.
    """
    from app.db.mongo import mongo

    db = mongo.database
    if db is None:
        raise DatabaseNotAvailableError("Database not available")
    return db


def new_id() -> str:
    """Generate a new UUID4 string.

    UUID4 instead of Mongo's ObjectId keeps IDs frontend-friendly
    (plain string, no 24-hex constraint) and decouples us from Mongo internals.
    """
    return str(uuid.uuid4())


def now_utc() -> datetime:
    """Current UTC timestamp. Used for createdAt / updatedAt fields."""
    return datetime.now(timezone.utc)

"""Health check endpoints.

Three levels: basic API liveness (/health), database connectivity (/health/db),
and cache connectivity (/health/cache). Useful for load balancer probes and
debugging connectivity issues.
"""

from fastapi import APIRouter, HTTPException, status
from pymongo.errors import PyMongoError

from app.cache import redis as cache_redis
from app.core.config import get_settings
from app.db.mongo import mongo


router = APIRouter(prefix="/health", tags=["health"])


@router.get("")
async def health() -> dict[str, str]:
    """Basic liveness check — always returns 200 if the process is running."""
    settings = get_settings()
    return {
        "status": "ok",
        "environment": settings.app_env,
    }


@router.get("/db")
async def database_health() -> dict[str, str]:
    """Database connectivity check — pings MongoDB and returns 503 if unreachable."""
    settings = get_settings()

    if not settings.is_mongodb_configured:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is not configured. Set MONGODB_CLUSTER_URI in backend/.env.",
        )

    try:
        is_alive = await mongo.ping()
    except PyMongoError as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB is not reachable.",
        ) from exc

    if not is_alive:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="MongoDB client is not initialized.",
        )

    return {"status": "ok", "database": settings.mongodb_database}


@router.get("/cache")
async def cache_health() -> dict[str, str]:
    """Cache connectivity check.

    Returns 200 with cache status. Redis is optional — if disabled or
    unreachable, the API still works (degraded reads, no crash).
    """
    settings = get_settings()

    if not settings.redis_enabled:
        return {"status": "disabled", "detail": "REDIS_ENABLED=false"}

    is_alive = await cache_redis.ping()
    if is_alive:
        return {"status": "ok", "provider": "upstash", "transport": "rest"}

    return {"status": "degraded", "detail": "Redis unreachable — cache bypassed"}

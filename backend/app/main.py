"""FastAPI application entry point.

Wires up the lifespan (Mongo connect/disconnect), mounts all routers
under /api/v1, and exposes the root redirect to docs.
"""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.cache import redis as cache_redis
from app.core.config import get_settings
from app.db.mongo import mongo
from app.routers.ai import router as ai_router
from app.routers.chats import router as chats_router
from app.routers.health import router as health_router
from app.routers.messages import router as messages_router
from app.routers.tasks import router as tasks_router
from app.routers.users import router as users_router
from app.services import chat_service, message_service, task_service, user_service


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Connect to Mongo on startup, close on shutdown.

    This replaces the deprecated @app.on_event("startup"/"shutdown") pattern.
    The mongo client is stored on app.state so routers can access it if needed,
    though currently they import the singleton directly.

    Redis cache connects lazily on first use — no startup cost when disabled.
    """
    settings = get_settings()
    await mongo.connect(settings)
    app.state.mongo = mongo
    if mongo.database is not None:
        await user_service.ensure_indexes()
        await chat_service.ensure_indexes()
        await message_service.ensure_indexes()
        await task_service.ensure_indexes()

    try:
        yield
    finally:
        await cache_redis.close()
        await mongo.close()


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    lifespan=lifespan,
)

cors_origins = settings.cors_allowed_origins_list

# Frontends authenticate with Authorization: Bearer <token>, so CORS must allow
# browser requests from local/dev URLs and any deployed frontend configured in env.
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=settings.cors_allow_credentials and "*" not in cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All resource routers are mounted under /api/v1 so the full paths are
# e.g. /api/v1/users, /api/v1/chats, etc.
app.include_router(health_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(chats_router, prefix="/api/v1")
app.include_router(messages_router, prefix="/api/v1")
app.include_router(tasks_router, prefix="/api/v1")
app.include_router(ai_router, prefix="/api/v1")


@app.get("/")
async def root() -> dict[str, str]:
    return {
        "message": "Desahogate API is running",
        "docs": "/docs",
        "health": "/api/v1/health",
    }

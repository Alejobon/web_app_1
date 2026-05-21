from __future__ import annotations

import asyncio
from datetime import datetime, timezone
from typing import Any

from app.cache import CacheKeys
from app.services import task_service, user_service


def test_task_list_uses_user_status_cache(monkeypatch) -> None:
    cached_tasks = [{"taskId": "task-1", "userId": "user-1", "status": "pending"}]
    repository_calls: list[str] = []

    async def fake_cache_get(key: str) -> list[dict[str, Any]]:
        assert key == CacheKeys.user_tasks("user-1", "pending")
        return cached_tasks

    async def fake_repository_list_all(
        user_id: str | None = None,
        task_status: str | None = None,
    ) -> list[dict[str, Any]]:
        repository_calls.append(f"{user_id}:{task_status}")
        return []

    monkeypatch.setattr(task_service.cache, "get", fake_cache_get)
    monkeypatch.setattr(task_service.task_repository, "list_all", fake_repository_list_all)

    result = asyncio.run(task_service.list_all(user_id="user-1", task_status="pending"))

    assert result == cached_tasks
    assert repository_calls == []


def test_task_create_invalidates_task_lists_and_schedules_context_refresh(monkeypatch) -> None:
    now = datetime.now(timezone.utc)
    created_task = {
        "taskId": "task-1",
        "userId": "user-1",
        "title": "Terminar parcial",
        "description": "",
        "status": "pending",
        "createdAt": now,
        "updatedAt": now,
    }
    set_keys: list[str] = []
    deleted_patterns: list[str] = []
    deleted_keys: list[str] = []
    scheduled_users: list[str] = []

    async def fake_create(
        user_id: str,
        title: str,
        description: str = "",
        status: str = "pending",
    ) -> dict[str, Any]:
        assert user_id == "user-1"
        assert title == "Terminar parcial"
        return created_task

    async def fake_cache_set(key: str, value: Any, ttl: int) -> None:
        set_keys.append(key)

    async def fake_delete_pattern(pattern: str) -> None:
        deleted_patterns.append(pattern)

    async def fake_delete(key: str) -> None:
        deleted_keys.append(key)

    def fake_schedule(user_id: str) -> None:
        scheduled_users.append(user_id)

    monkeypatch.setattr(task_service.task_repository, "create", fake_create)
    monkeypatch.setattr(task_service.cache, "set", fake_cache_set)
    monkeypatch.setattr(task_service.cache, "delete_pattern", fake_delete_pattern)
    monkeypatch.setattr(task_service.cache, "delete", fake_delete)
    monkeypatch.setattr(task_service.user_context_service, "schedule_user_context_refresh", fake_schedule)

    result = asyncio.run(task_service.create("user-1", "Terminar parcial"))

    assert result == created_task
    assert set_keys == [CacheKeys.task("task-1")]
    assert deleted_patterns == [CacheKeys.user_tasks_pattern("user-1")]
    assert deleted_keys == [CacheKeys.user_context("user-1")]
    assert scheduled_users == ["user-1"]


def test_auth_mapping_cache_skips_mongo_lookup_and_warm(monkeypatch) -> None:
    cached_user = {
        "userId": "user-1",
        "authProvider": "supabase",
        "authProviderUserId": "supabase-user-1",
        "username": "samuel",
        "personality": {},
        "chats": [],
    }

    async def fake_cache_get(key: str) -> dict[str, Any]:
        assert key == CacheKeys.auth_user("supabase", "supabase-user-1")
        return cached_user

    async def fail_find_by_auth(*args: Any, **kwargs: Any) -> None:
        raise AssertionError("Mongo should not be queried on auth cache hit")

    async def fail_warm_user_context(user: dict[str, Any]) -> None:
        raise AssertionError("Context warm should not block auth cache hits")

    monkeypatch.setattr(user_service.cache, "get", fake_cache_get)
    monkeypatch.setattr(
        user_service.user_repository,
        "find_by_auth_provider_user_id",
        fail_find_by_auth,
    )
    monkeypatch.setattr(
        user_service.user_context_service,
        "warm_user_context",
        fail_warm_user_context,
    )

    result = asyncio.run(
        user_service.find_or_create_from_auth(
            auth_provider_user_id="supabase-user-1",
            email="samuel@example.com",
        ),
    )

    assert result == cached_user

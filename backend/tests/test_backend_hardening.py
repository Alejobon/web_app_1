from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.auth import get_current_user
from app.main import app
from app.routers import messages as messages_router
from app.schemas.chat_stream import ChatStreamRequest
from app.schemas.task import TaskCreate, TaskUpdate
from app.services import chat_service, message_service


def test_chat_stream_request_rejects_oversized_content() -> None:
    oversized = "a" * 4001

    try:
        ChatStreamRequest(content=oversized)
        assert False, "Expected validation error for oversized stream content"
    except Exception as exc:
        assert "at most 4000" in str(exc).lower()


def test_task_schema_rejects_invalid_status() -> None:
    try:
        TaskCreate(title="Task", status="blocked")
        assert False, "Expected validation error for invalid task status"
    except Exception as exc:
        assert "pending" in str(exc).lower()

    try:
        TaskUpdate(status="blocked")
        assert False, "Expected validation error for invalid task status"
    except Exception as exc:
        assert "pending" in str(exc).lower()


def test_create_message_rejects_non_user_role(monkeypatch) -> None:
    with TestClient(app) as client:
        async def fake_current_user():
            return {"userId": "user-1"}

        async def fake_ensure_chat_owner(chat_id: str, current_user: dict[str, str]) -> None:
            return None

        monkeypatch.setattr(messages_router, "_ensure_chat_owner", fake_ensure_chat_owner)
        app.dependency_overrides[get_current_user] = fake_current_user

        response = client.post(
            "/api/v1/messages",
            json={"chatId": "chat-1", "role": "assistant", "content": "Hola"},
        )

        app.dependency_overrides.clear()

    assert response.status_code == 400
    assert "user messages" in response.json()["detail"]


def test_update_message_rejects_editing_assistant_messages(monkeypatch) -> None:
    with TestClient(app) as client:
        async def fake_current_user():
            return {"userId": "user-1"}

        async def fake_find_by_id(message_id: str):
            return {
                "messageId": message_id,
                "chatId": "chat-1",
                "role": "assistant",
                "content": "Hola",
            }

        async def fake_ensure_chat_owner(chat_id: str, current_user: dict[str, str]) -> None:
            return None

        monkeypatch.setattr(message_service, "find_by_id", fake_find_by_id)
        monkeypatch.setattr(messages_router, "_ensure_chat_owner", fake_ensure_chat_owner)
        app.dependency_overrides[get_current_user] = fake_current_user

        response = client.put(
            "/api/v1/messages/msg-1",
            json={"content": "Modificado"},
        )

        app.dependency_overrides.clear()

    assert response.status_code == 400
    assert "only user messages" in response.json()["detail"].lower()


def test_delete_chat_invalidates_all_message_cache_patterns(monkeypatch) -> None:
    deleted_patterns: list[str] = []
    deleted_keys: list[str] = []

    async def fake_find_chat(chat_id: str):
        return {"chatId": chat_id, "userId": "user-1"}

    async def fake_remove_chat(user_id: str, chat_id: str) -> None:
        return None

    async def fake_find_user(user_id: str):
        return {
            "userId": user_id,
            "authProvider": "supabase",
            "authProviderUserId": "supabase-user-1",
        }

    async def fake_delete_by_chat(chat_id: str) -> int:
        return 2

    async def fake_delete_chat(chat_id: str) -> None:
        return None

    async def fake_delete_key(key: str) -> None:
        deleted_keys.append(key)

    async def fake_delete_pattern(pattern: str) -> None:
        deleted_patterns.append(pattern)

    monkeypatch.setattr(chat_service.chat_repository, "find_by_id", fake_find_chat)
    monkeypatch.setattr(chat_service.user_repository, "find_by_id", fake_find_user)
    monkeypatch.setattr(chat_service.user_repository, "remove_chat", fake_remove_chat)
    monkeypatch.setattr(chat_service.message_repository, "delete_by_chat", fake_delete_by_chat)
    monkeypatch.setattr(chat_service.chat_repository, "delete", fake_delete_chat)
    monkeypatch.setattr(chat_service.cache, "delete", fake_delete_key)
    monkeypatch.setattr(chat_service.cache, "delete_pattern", fake_delete_pattern)

    import asyncio

    deleted = asyncio.run(chat_service.delete("chat-1"))

    assert deleted is True
    assert "desahogate:user:user-1" in deleted_keys
    assert "desahogate:auth:supabase:supabase-user-1:user" in deleted_keys
    assert "desahogate:msg:latest:chat-1" in deleted_patterns
    assert "desahogate:msg:history:chat-1:*" in deleted_patterns

from __future__ import annotations

import asyncio

from app.services import ai_chat_service, user_context_service


def test_build_personality_and_tasks_system_messages() -> None:
    personality_message = user_context_service.build_personality_system_message(
        {
            "tone": "calmado",
            "language": "es",
            "profile_summary": "Se siente sobrecargado por la universidad",
            "goals": ["organizarse"],
            "stressors": ["exámenes"],
            "coping_notes": ["dividir tareas"],
        },
    )
    tasks_message = user_context_service.build_tasks_system_message(
        [
            {"taskId": "t1", "title": "Terminar parcial", "status": "pending"},
            {"taskId": "t2", "title": "Dormir más", "status": "in_progress"},
        ],
    )

    assert personality_message is not None
    assert "Contexto persistente del usuario" in personality_message
    assert "calmado" in personality_message
    assert "organizarse" in personality_message

    assert tasks_message is not None
    assert "Tareas pendientes del usuario" in tasks_message
    assert "Terminar parcial" in tasks_message


def test_build_messages_uses_cached_user_context(monkeypatch) -> None:
    async def fake_get_user_context(user_id: str) -> dict[str, object]:
        return {
            "personality": {
                "tone": "sereno",
                "language": "es",
                "profile_summary": "Le cuesta bajar revoluciones por la noche",
            },
            "pending_tasks": [
                {"taskId": "t1", "title": "Cerrar entregable", "status": "pending"},
            ],
        }

    monkeypatch.setattr(user_context_service, "get_user_context", fake_get_user_context)

    async def build() -> list[dict[str, str]]:
        return await ai_chat_service._build_messages(
            history=[],
            user_message="hola",
            user_id="user-1",
        )

    messages = asyncio.run(build())
    contents = [message["content"] for message in messages if message["role"] == "system"]

    assert any("Contexto persistente del usuario" in content for content in contents)
    assert any("Tareas pendientes del usuario" in content for content in contents)


def test_maybe_schedule_context_refresh_runs_every_five_user_messages(monkeypatch) -> None:
    scheduled: list[object] = []

    async def fake_count_by_chat(chat_id: str, role: str | None = None) -> int:
        assert chat_id == "chat-1"
        assert role == "user"
        return 5

    def fake_create_task(coro):
        scheduled.append(coro)
        coro.close()
        return None

    monkeypatch.setattr(
        user_context_service.message_repository,
        "count_by_chat",
        fake_count_by_chat,
    )
    monkeypatch.setattr(user_context_service.asyncio, "create_task", fake_create_task)

    asyncio.run(user_context_service.maybe_schedule_context_refresh("chat-1", "user-1"))

    assert len(scheduled) == 1

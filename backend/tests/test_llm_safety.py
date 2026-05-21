import asyncio
import json

from app.llm.safety import CRISIS_RESPONSE, is_high_risk_message
from app.llm.sanitizers import StreamingOutputSanitizer, sanitize_llm_output
from app.routers.messages import _to_response as message_to_response
from app.services import ai_chat_service


def _parse_sse(event: str) -> dict[str, str]:
    payload = event.removeprefix("data: ").strip()
    return json.loads(payload)


def test_sanitize_llm_output_removes_think_blocks_and_prefixes() -> None:
    raw = """
    <think>
    hidden reasoning
    </think>
    analysis: Respuesta final limpia
    """.strip()

    assert sanitize_llm_output(raw) == "Respuesta final limpia"


def test_sanitize_llm_output_drops_unclosed_think_block_to_end() -> None:
    raw = """
    Respuesta visible
    <think>
    hidden reasoning
    """.strip()

    assert sanitize_llm_output(raw) == "Respuesta visible"


def test_is_high_risk_message_detects_explicit_crisis() -> None:
    assert is_high_risk_message("Siento que me quiero morir") is True
    assert is_high_risk_message("Estoy estresado por la universidad") is False


def test_streaming_output_sanitizer_preserves_streaming_without_think_leaks() -> None:
    sanitizer = StreamingOutputSanitizer()

    chunks = [
        "<thi",
        "nk>hidden",
        "</think>",
        "analysis:",
        " Hola",
        " mundo",
    ]

    emitted = [sanitizer.feed(chunk) for chunk in chunks]
    emitted.append(sanitizer.flush())

    assert "".join(emitted) == " Hola mundo"


def test_stream_ai_response_returns_crisis_message_without_calling_llm(monkeypatch) -> None:
    async def fake_find_chat(chat_id: str) -> dict[str, str]:
        return {"chatId": chat_id, "userId": "user-1"}

    created_messages: list[tuple[str, str, str]] = []

    async def fake_create_message(chat_id: str, role: str, content: str) -> dict[str, str]:
        created_messages.append((chat_id, role, content))
        return {"messageId": f"{role}-1"}

    async def fake_delete(*args, **kwargs) -> None:
        return None

    async def fake_delete_pattern(*args, **kwargs) -> None:
        return None

    def fail_get_provider():
        raise AssertionError("LLM provider should not be called for high-risk messages")

    monkeypatch.setattr(ai_chat_service.chat_repository, "find_by_id", fake_find_chat)
    monkeypatch.setattr(ai_chat_service.message_repository, "create", fake_create_message)
    monkeypatch.setattr(ai_chat_service.cache, "delete", fake_delete)
    monkeypatch.setattr(ai_chat_service.cache, "delete_pattern", fake_delete_pattern)
    monkeypatch.setattr(ai_chat_service, "get_provider", fail_get_provider)

    async def collect() -> list[str]:
        return [
            event
            async for event in ai_chat_service.stream_ai_response(
                chat_id="chat-1",
                user_id="user-1",
                content="me quiero morir",
            )
        ]

    events = asyncio.run(collect())

    assert len(events) == 2
    assert _parse_sse(events[0]) == {"type": "token", "content": CRISIS_RESPONSE}
    assert _parse_sse(events[1]) == {"type": "done", "messageId": "assistant-1"}
    assert created_messages == [
        ("chat-1", "user", "me quiero morir"),
        ("chat-1", "assistant", CRISIS_RESPONSE),
    ]


def test_stream_ai_response_sanitizes_streaming_tokens(monkeypatch) -> None:
    async def fake_find_chat(chat_id: str) -> dict[str, str]:
        return {"chatId": chat_id, "userId": "user-1"}

    async def fake_create_message(chat_id: str, role: str, content: str) -> dict[str, str]:
        return {"messageId": f"{role}-1", "content": content}

    async def fake_list_all(**kwargs) -> list[dict[str, str]]:
        return []

    async def fake_get_user_context(user_id: str) -> dict[str, object]:
        return {"personality": {}, "pending_tasks": []}

    async def fake_maybe_schedule_context_refresh(chat_id: str, user_id: str) -> None:
        return None

    async def fake_delete(*args, **kwargs) -> None:
        return None

    async def fake_delete_pattern(*args, **kwargs) -> None:
        return None

    class FakeProvider:
        async def stream_chat(self, messages):
            for chunk in ("<thi", "nk>hidden</think>", "reasoning:", " Hola", " mundo"):
                yield chunk

    monkeypatch.setattr(ai_chat_service.chat_repository, "find_by_id", fake_find_chat)
    monkeypatch.setattr(ai_chat_service.message_repository, "create", fake_create_message)
    monkeypatch.setattr(ai_chat_service.message_repository, "list_all", fake_list_all)
    monkeypatch.setattr(ai_chat_service.user_context_service, "get_user_context", fake_get_user_context)
    monkeypatch.setattr(
        ai_chat_service.user_context_service,
        "maybe_schedule_context_refresh",
        fake_maybe_schedule_context_refresh,
    )
    monkeypatch.setattr(ai_chat_service.cache, "delete", fake_delete)
    monkeypatch.setattr(ai_chat_service.cache, "delete_pattern", fake_delete_pattern)
    monkeypatch.setattr(ai_chat_service, "get_provider", lambda: FakeProvider())

    async def collect() -> list[str]:
        return [
            event
            async for event in ai_chat_service.stream_ai_response(
                chat_id="chat-1",
                user_id="user-1",
                content="hola",
            )
        ]

    events = asyncio.run(collect())
    payloads = [_parse_sse(event) for event in events]

    assert payloads == [
        {"type": "token", "content": " Hola"},
        {"type": "token", "content": " mundo"},
        {"type": "done", "messageId": "assistant-1"},
    ]


def test_message_response_sanitizes_assistant_content_from_storage() -> None:
    response = message_to_response(
        {
            "messageId": "assistant-1",
            "chatId": "chat-1",
            "role": "assistant",
            "content": "<think>hidden reasoning</think>Respuesta final",
            "createdAt": "2026-05-15T00:00:00Z",
        }
    )

    assert response.content == "Respuesta final"


def test_message_response_preserves_user_content() -> None:
    response = message_to_response(
        {
            "messageId": "user-1",
            "chatId": "chat-1",
            "role": "user",
            "content": "<think>esto lo escribió el usuario</think>",
            "createdAt": "2026-05-15T00:00:00Z",
        }
    )

    assert response.content == "<think>esto lo escribió el usuario</think>"

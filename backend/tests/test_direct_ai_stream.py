import asyncio
import json

from app.core.auth import SupabasePrincipal
from app.main import app
from app.routers import ai as ai_router
from app.schemas import DirectAIStreamRequest
from app.services import direct_ai_service


def _parse_sse(event: str) -> dict[str, str]:
    payload = event.removeprefix("data: ").strip()
    return json.loads(payload)


def test_stream_direct_ai_response_sanitizes_streaming_tokens(monkeypatch) -> None:
    class FakeProvider:
        async def stream_chat(self, messages):
            assert messages[-1] == {"role": "user", "content": "hola"}
            for chunk in ("<thi", "nk>hidden</think>", "analysis:", " Hola", " mundo"):
                yield chunk

    monkeypatch.setattr(direct_ai_service, "get_provider", lambda: FakeProvider())

    async def collect() -> list[str]:
        return [
            event
            async for event in direct_ai_service.stream_direct_ai_response("hola")
        ]

    events = asyncio.run(collect())
    payloads = [_parse_sse(event) for event in events]

    assert payloads == [
        {"type": "token", "content": " Hola"},
        {"type": "token", "content": " mundo"},
        {"type": "done"},
    ]


def test_direct_ai_stream_endpoint_is_mounted() -> None:
    paths = {route.path for route in app.routes}
    assert "/api/v1/ai/stream" in paths


def test_stream_direct_ai_message_returns_sse_response(monkeypatch) -> None:
    async def fake_stream(message: str):
        assert message == "hola"
        yield 'data: {"type": "token", "content": "Hola"}\n\n'
        yield 'data: {"type": "done"}\n\n'

    monkeypatch.setattr(ai_router.direct_ai_service, "stream_direct_ai_response", fake_stream)

    async def collect_body() -> list[str]:
        response = await ai_router.stream_direct_ai_message(
            body=DirectAIStreamRequest(message="hola"),
            _principal=SupabasePrincipal(
                auth_provider_user_id="user-1",
                email="user@example.com",
                claims={"sub": "user-1"},
            ),
        )
        return [chunk async for chunk in response.body_iterator]

    chunks = asyncio.run(collect_body())

    assert "".join(chunks) == (
        'data: {"type": "token", "content": "Hola"}\n\n'
        'data: {"type": "done"}\n\n'
    )

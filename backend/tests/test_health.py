from types import SimpleNamespace

from fastapi.testclient import TestClient

from app.main import app
from app.routers import health as health_router


def test_root_returns_api_metadata() -> None:
    with TestClient(app) as client:
        response = client.get("/")

    assert response.status_code == 200
    assert response.json()["message"] == "Desahogate API is running"


def test_health_returns_ok_status() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_cache_health_does_not_expose_redis_url(monkeypatch) -> None:
    settings = SimpleNamespace(
        redis_enabled=True,
        upstash_redis_rest_url="https://example.upstash.io",
    )

    async def fake_ping() -> bool:
        return True

    monkeypatch.setattr(health_router, "get_settings", lambda: settings)
    monkeypatch.setattr(health_router.cache_redis, "ping", fake_ping)

    with TestClient(app) as client:
        response = client.get("/api/v1/health/cache")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "provider": "upstash",
        "transport": "rest",
    }

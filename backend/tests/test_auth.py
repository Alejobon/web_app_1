from __future__ import annotations

from fastapi.testclient import TestClient
from jose import jwt
from datetime import datetime, timedelta, timezone

from app.core.config import get_settings
from app.main import app
from app.services import user_context_service, user_service


def _token(*, sub: str = "supabase-user-123", email: str = "samuel@example.com") -> str:
    return jwt.encode(
        {
            "sub": sub,
            "email": email,
            "aud": "authenticated",
            "iss": "https://test-project.supabase.co/auth/v1",
            "exp": datetime.now(timezone.utc) + timedelta(minutes=5),
        },
        "test-secret",
        algorithm="HS256",
    )


def test_users_me_rejects_missing_bearer_token() -> None:
    with TestClient(app) as client:
        response = client.get("/api/v1/users/me")

    assert response.status_code == 401


def test_users_me_maps_valid_supabase_token_to_internal_user(monkeypatch) -> None:
    monkeypatch.setenv("SUPABASE_JWT_SECRET", "test-secret")
    monkeypatch.setenv("SUPABASE_JWT_AUDIENCE", "authenticated")
    monkeypatch.setenv("SUPABASE_JWT_ISSUER", "https://test-project.supabase.co/auth/v1")
    get_settings.cache_clear()

    async def fake_find_or_create_from_auth(*, auth_provider_user_id: str, email: str | None):
        assert auth_provider_user_id == "supabase-user-123"
        assert email == "samuel@example.com"
        return {
            "userId": "internal-user-123",
            "authProvider": "supabase",
            "authProviderUserId": auth_provider_user_id,
            "email": email,
            "username": "samuel",
            "personality": {},
            "chats": [],
        }

    warmed_users: list[str] = []

    async def fake_warm_user_context(user: dict[str, str]) -> None:
        warmed_users.append(user["userId"])

    monkeypatch.setattr(user_service, "find_or_create_from_auth", fake_find_or_create_from_auth)
    monkeypatch.setattr(user_context_service, "warm_user_context", fake_warm_user_context)

    with TestClient(app) as client:
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {_token()}"},
        )

    assert response.status_code == 200
    assert response.json()["userId"] == "internal-user-123"
    assert response.json()["authProviderUserId"] == "supabase-user-123"
    assert warmed_users == []

    get_settings.cache_clear()

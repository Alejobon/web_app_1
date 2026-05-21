"""Authentication dependencies for Supabase-backed requests.

The frontend sends ``Authorization: Bearer <supabase_access_token>``.
This module validates the JWT and maps the external Supabase user to the
internal Mongo user used by the domain model.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from typing import Any
from urllib.request import urlopen

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from app.core.config import get_settings
from app.db.helpers import DatabaseNotAvailableError
from app.services import user_service

_bearer = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class SupabasePrincipal:
    """Authenticated external identity extracted from a Supabase JWT."""

    auth_provider_user_id: str
    email: str | None
    claims: dict[str, Any]


def verify_supabase_token(token: str) -> dict[str, Any]:
    """Validate a Supabase access token and return its claims.

    Supports:
    - HS256 projects via ``SUPABASE_JWT_SECRET``.
    - Asymmetric projects via Supabase JWKS.
    """
    settings = get_settings()

    try:
        header = jwt.get_unverified_header(token)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid bearer token") from exc

    algorithm = header.get("alg")
    if not algorithm:
        raise HTTPException(status_code=401, detail="Invalid bearer token")

    key: str | dict[str, Any]
    if algorithm.startswith("HS"):
        if not settings.supabase_jwt_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Supabase JWT secret is not configured",
            )
        key = settings.supabase_jwt_secret
    else:
        key = _find_jwks_key(token, algorithm)

    decode_kwargs: dict[str, Any] = {
        "algorithms": [algorithm],
        "audience": settings.supabase_jwt_audience,
        "options": {
            "require_aud": True,
            "require_exp": True,
            "require_sub": True,
        },
    }
    issuer = settings.resolved_supabase_jwt_issuer
    if issuer:
        decode_kwargs["issuer"] = issuer
        decode_kwargs["options"]["require_iss"] = True

    try:
        return jwt.decode(token, key, **decode_kwargs)
    except JWTError as exc:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from exc


def _find_jwks_key(token: str, algorithm: str) -> dict[str, Any]:
    """Find the public JWK matching the token ``kid``."""
    settings = get_settings()
    jwks_url = settings.resolved_supabase_jwks_url
    if not jwks_url:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase JWKS URL is not configured",
        )

    header = jwt.get_unverified_header(token)
    kid = header.get("kid")
    if not kid:
        raise HTTPException(status_code=401, detail="Invalid bearer token")

    for key in _fetch_jwks(jwks_url).get("keys", []):
        if key.get("kid") == kid and key.get("alg", algorithm) == algorithm:
            return key

    raise HTTPException(status_code=401, detail="Unknown token signing key")


@lru_cache(maxsize=4)
def _fetch_jwks(jwks_url: str) -> dict[str, Any]:
    """Fetch and cache Supabase JWKS metadata."""
    with urlopen(jwks_url, timeout=5) as response:
        return json.loads(response.read().decode("utf-8"))


async def get_supabase_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> SupabasePrincipal:
    """FastAPI dependency that returns the verified Supabase identity."""
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Missing bearer token")

    claims = verify_supabase_token(credentials.credentials)
    subject = claims.get("sub")
    if not isinstance(subject, str) or not subject:
        raise HTTPException(status_code=401, detail="Token is missing subject")

    email = claims.get("email")
    return SupabasePrincipal(
        auth_provider_user_id=subject,
        email=email if isinstance(email, str) else None,
        claims=claims,
    )


async def get_current_user(
    principal: SupabasePrincipal = Depends(get_supabase_principal),
) -> dict[str, Any]:
    """Return the internal Mongo user mapped from the Supabase identity."""
    try:
        user = await user_service.find_or_create_from_auth(
            auth_provider_user_id=principal.auth_provider_user_id,
            email=principal.email,
        )
        return user
    except DatabaseNotAvailableError:
        raise HTTPException(status_code=503, detail="Database not available") from None

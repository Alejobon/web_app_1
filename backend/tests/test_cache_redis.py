from app.cache import redis as cache_redis


def test_normalize_rest_credentials_strips_quotes_from_rest_env_values() -> None:
    url, token, normalized_from_tcp = cache_redis._normalize_rest_credentials(
        '"https://example.upstash.io"',
        '"token-123"',
    )

    assert url == "https://example.upstash.io"
    assert token == "token-123"
    assert normalized_from_tcp is False


def test_normalize_rest_credentials_converts_tcp_dsn_to_rest() -> None:
    url, token, normalized_from_tcp = cache_redis._normalize_rest_credentials(
        "rediss://:token-from-dsn@example.upstash.io:6379",
        "",
    )

    assert url == "https://example.upstash.io"
    assert token == "token-from-dsn"
    assert normalized_from_tcp is True

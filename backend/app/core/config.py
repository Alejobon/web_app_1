"""Application settings loaded from environment / .env file.

Uses pydantic-settings so env vars are automatically parsed and validated.
The `get_settings()` function is cached — settings are read once per process.
"""

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


# Resolve to the backend/ root (two levels up from this file).
BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = Field(default="Desahogate API", alias="APP_NAME")
    app_env: str = Field(default="development", alias="APP_ENV")
    mongodb_cluster_uri: str = Field(default="", alias="MONGODB_CLUSTER_URI")
    mongodb_database: str = Field(default="desahogate", alias="MONGODB_DATABASE")
    mongodb_timeout_ms: int = Field(default=5000, alias="MONGODB_TIMEOUT_MS")

    # ── Frontend / CORS ──────────────────────────────────────────────
    cors_allowed_origins: str = Field(
        default=(
            "http://localhost:5173,http://127.0.0.1:5173,"
            "http://localhost:3000,http://127.0.0.1:3000"
        ),
        alias="CORS_ALLOWED_ORIGINS",
    )
    cors_allow_credentials: bool = Field(default=True, alias="CORS_ALLOW_CREDENTIALS")

    # ── Redis cache (optional) ────────────────────────────────────────
    redis_enabled: bool = Field(default=False, alias="REDIS_ENABLED")
    upstash_redis_rest_url: str = Field(
        default="", alias="UPSTASH_REDIS_REST_URL",
    )
    upstash_redis_rest_token: str = Field(
        default="", alias="UPSTASH_REDIS_REST_TOKEN",
    )
    redis_ttl_seconds: int = Field(default=300, alias="REDIS_TTL_SECONDS")
    redis_message_history_ttl_seconds: int = Field(
        default=60, alias="REDIS_MESSAGE_HISTORY_TTL_SECONDS",
    )
    redis_latest_message_ttl_seconds: int = Field(
        default=60, alias="REDIS_LATEST_MESSAGE_TTL_SECONDS",
    )

    # ── LLM / Groq settings ──────────────────────────────────────────
    llm_provider: str = Field(default="groq", alias="LLM_PROVIDER")
    groq_api_key: str = Field(default="", alias="GROQ_API_KEY")
    groq_model: str = Field(default="llama-3.3-70b-versatile", alias="GROQ_MODEL")
    llm_temperature: float = Field(default=0.7, alias="LLM_TEMPERATURE")
    llm_max_tokens: int = Field(default=1024, alias="LLM_MAX_TOKENS")
    llm_history_limit: int = Field(default=20, alias="LLM_HISTORY_LIMIT")
    llm_rate_limit_per_minute: int = Field(
        default=60,
        alias="LLM_RATE_LIMIT_PER_MINUTE",
    )
    llm_max_concurrent_requests: int = Field(
        default=5,
        alias="LLM_MAX_CONCURRENT_REQUESTS",
    )
    llm_system_prompt: str = Field(
        default=(
            "Eres Desahógate, un apoyo emocional para estudiantes universitarios. "
            "No eres psicólogo, psiquiatra ni profesional de salud mental. "
            "No diagnosticas, no medicalizas y no reemplazas ayuda profesional. "
            "Responde en español neutro, natural, claro y humano, con un tono cálido, "
            "respetuoso y cercano, pero nunca confianzudo. "
            "Evita regionalismos, voseo y expresiones propias de un país específico. "
            "Valida primero la emoción antes de aconsejar. "
            "Prefiere respuestas breves y concretas. "
            "Si la persona solo saluda, responde simple en una o dos frases. "
            "No uses apodos como amor, cariño, bebé, corazón, nene, nena, reina o príncipe. "
            "No asumas género, diagnóstico, orientación ni contexto personal. "
            "No des consejos médicos, farmacológicos ni clínicos. "
            "No minimices el malestar ni sermonees. "
            "Nunca muestres razonamiento interno, cadenas de pensamiento, notas, "
            "etiquetas ni texto como <think>, </think>, analysis, scratchpad, "
            "reasoning o razonamiento. "
            "Responde únicamente con el mensaje final que verá la persona usuaria. "
            "Si la persona expresa intención clara de hacerse daño, suicidarse o "
            "estar en peligro inmediato, prioriza la seguridad, indica contactar a "
            "alguien de confianza o emergencias, y menciona Colombia 123 y Línea 106."
        ),
        alias="LLM_SYSTEM_PROMPT",
    )

    # ── Supabase Auth ────────────────────────────────────────────────
    supabase_project_url: str = Field(default="", alias="SUPABASE_PROJECT_URL")
    supabase_jwks_url: str = Field(default="", alias="SUPABASE_JWKS_URL")
    supabase_jwt_secret: str = Field(default="", alias="SUPABASE_JWT_SECRET")
    supabase_jwt_audience: str = Field(
        default="authenticated", alias="SUPABASE_JWT_AUDIENCE",
    )
    supabase_jwt_issuer: str = Field(default="", alias="SUPABASE_JWT_ISSUER")

    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def is_mongodb_configured(self) -> bool:
        """True when a cluster URI is provided (even in dev)."""
        return bool(self.mongodb_cluster_uri.strip())

    @property
    def resolved_supabase_jwt_issuer(self) -> str:
        """Issuer expected in Supabase access tokens."""
        if self.supabase_jwt_issuer.strip():
            return self.supabase_jwt_issuer.strip()
        if self.supabase_project_url.strip():
            return f"{self.supabase_project_url.rstrip('/')}/auth/v1"
        return ""

    @property
    def resolved_supabase_jwks_url(self) -> str:
        """JWKS endpoint for projects using asymmetric JWT signing keys."""
        if self.supabase_jwks_url.strip():
            return self.supabase_jwks_url.strip()
        if self.supabase_project_url.strip():
            return f"{self.supabase_project_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        return ""

    @property
    def cors_allowed_origins_list(self) -> list[str]:
        """Return comma-separated CORS origins as a clean list."""
        return [
            origin.strip()
            for origin in self.cors_allowed_origins.split(",")
            if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """Return the singleton settings instance (cached after first call)."""
    return Settings()

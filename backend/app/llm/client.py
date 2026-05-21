"""LLM provider factory.

Resolves the active provider from settings and exposes a single
`get_provider()` entry point that services import.
"""

from __future__ import annotations

from app.core.config import get_settings
from app.llm.providers.groq_provider import GroqProvider


def get_provider() -> GroqProvider:
    """Return the configured LLM provider instance.

    Currently only Groq is supported. When more providers are added,
    this function becomes a simple match/switch on settings.llm_provider.
    """
    settings = get_settings()

    if settings.llm_provider == "groq":
        return GroqProvider(
            api_key=settings.groq_api_key,
            model=settings.groq_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
        )

    raise ValueError(
        f"Unsupported LLM_PROVIDER: '{settings.llm_provider}'. "
        "Currently only 'groq' is supported."
    )

"""Minimal safety helpers for the Desahógate MVP."""

from __future__ import annotations

HIGH_RISK_KEYWORDS = [
    "me quiero morir",
    "quiero morirme",
    "quiero suicidarme",
    "me voy a suicidar",
    "voy a suicidarme",
    "quitarme la vida",
    "me quiero quitar la vida",
    "hacerme daño",
    "voy a hacerme daño",
    "no quiero vivir",
    "ya no quiero vivir",
]

CRISIS_RESPONSE = """
Siento mucho que estés pasando por esto. No tenés que atravesarlo en soledad.

Por favor contactá ahora mismo a alguien de confianza o llamá a emergencias. En Colombia podés llamar al 123 o a la Línea 106 de salud mental.

Si estás en peligro inmediato, buscá ayuda presencial ya mismo.
""".strip()


def is_high_risk_message(message: str) -> bool:
    """Return True only for explicit high-risk crisis messages."""
    if not message:
        return False

    normalized = " ".join(message.lower().split())
    return any(keyword in normalized for keyword in HIGH_RISK_KEYWORDS)

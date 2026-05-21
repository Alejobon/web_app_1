"""Output sanitizers for LLM-generated text."""

from __future__ import annotations

import re


_THINK_BLOCK_RE = re.compile(r"<think\b[^>]*>.*?</think>", re.IGNORECASE | re.DOTALL)
_THINK_TO_END_RE = re.compile(r"<think\b[^>]*>.*$", re.IGNORECASE | re.DOTALL)
_THINK_TAG_RE = re.compile(r"</?think\b[^>]*>", re.IGNORECASE)
_LEAKED_PREFIX_RE = re.compile(
    r"^\s*(analysis|scratchpad|reasoning|razonamiento)\s*:\s*",
    re.IGNORECASE,
)
_LEAKED_PREFIX_PARTIALS = (
    "analysis",
    "scratchpad",
    "reasoning",
    "razonamiento",
)


def sanitize_llm_output(text: str) -> str:
    """Remove leaked reasoning markers from model output."""
    if not text:
        return ""

    cleaned = _THINK_BLOCK_RE.sub("", text)
    cleaned = _THINK_TO_END_RE.sub("", cleaned)
    cleaned = _THINK_TAG_RE.sub("", cleaned)
    cleaned = _LEAKED_PREFIX_RE.sub("", cleaned)
    return cleaned.strip()


class StreamingOutputSanitizer:
    """Stateful sanitizer that preserves streaming while hiding leaked reasoning."""

    def __init__(self) -> None:
        self._buffer = ""
        self._inside_think = False
        self._at_stream_start = True

    def feed(self, chunk: str) -> str:
        """Consume a raw chunk and return the safe text to emit now."""
        if not chunk:
            return ""

        self._buffer += chunk
        return self._drain()

    def flush(self) -> str:
        """Return any remaining safe text at end-of-stream."""
        if self._inside_think:
            self._buffer = ""
            return ""

        self._strip_leaked_prefix(wait_for_completion=False)
        trailing = self._buffer
        self._buffer = ""
        return trailing

    def _drain(self) -> str:
        emitted_parts: list[str] = []

        while True:
            if self._inside_think:
                close_match = re.search(r"</think\b[^>]*>", self._buffer, re.IGNORECASE)
                if close_match is None:
                    self._buffer = self._buffer[-16:]
                    break
                self._buffer = self._buffer[close_match.end():]
                self._inside_think = False
                continue

            if self._at_stream_start and self._strip_leaked_prefix(wait_for_completion=True):
                break

            tag_match = _THINK_TAG_RE.search(self._buffer)
            if tag_match is not None:
                if tag_match.start() > 0:
                    emitted_parts.append(self._buffer[:tag_match.start()])
                    self._at_stream_start = False

                tag_text = tag_match.group(0).lower()
                self._buffer = self._buffer[tag_match.end():]
                if tag_text.startswith("<think"):
                    self._inside_think = True
                continue

            partial_tag_index = self._find_partial_tag_start(self._buffer)
            if partial_tag_index is None:
                if self._buffer:
                    emitted_parts.append(self._buffer)
                    self._buffer = ""
                    self._at_stream_start = False
                break

            if partial_tag_index > 0:
                emitted_parts.append(self._buffer[:partial_tag_index])
                self._buffer = self._buffer[partial_tag_index:]
                self._at_stream_start = False
            break

        return "".join(emitted_parts)

    def _strip_leaked_prefix(self, *, wait_for_completion: bool) -> bool:
        if not self._at_stream_start:
            return False

        match = _LEAKED_PREFIX_RE.match(self._buffer)
        if match is not None:
            self._buffer = self._buffer[match.end():]
            self._at_stream_start = False
            return False

        lowered = self._buffer.lower().lstrip()
        if not lowered:
            return wait_for_completion

        for prefix in _LEAKED_PREFIX_PARTIALS:
            if prefix.startswith(lowered):
                return wait_for_completion

        if any(lowered.startswith(f"{prefix}:") for prefix in _LEAKED_PREFIX_PARTIALS):
            self._buffer = _LEAKED_PREFIX_RE.sub("", self._buffer, count=1)
            self._at_stream_start = False
            return False

        return False

    @staticmethod
    def _find_partial_tag_start(text: str) -> int | None:
        lowered = text.lower()
        candidates = ("<think", "</think")
        for index in range(len(text)):
            suffix = lowered[index:]
            if any(candidate.startswith(suffix) for candidate in candidates):
                return index
        return None

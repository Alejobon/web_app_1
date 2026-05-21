"""LLM provider abstraction layer.

Keeps provider-specific code isolated behind a simple async streaming interface
so the service layer never imports Groq (or any future provider) directly.
"""

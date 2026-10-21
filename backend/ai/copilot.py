"""Copilot-style natural language assistance for HackMatch."""

import os
from typing import Any


SYSTEM_PROMPT = """You are HackMatch Copilot, an assistant for hackathon organizers.
Use the supplied participant and team context when present. Give concise, practical
answers. Never invent participant details, scores, or private information. If the
context does not contain enough data, say what is missing."""


def ask_copilot(question: str, context: dict[str, Any] | None = None) -> str:
    """Ask an OpenAI-compatible Copilot model about the current HackMatch data."""
    if not question.strip():
        raise ValueError("question must not be empty")

    github_token = os.environ.get("GITHUB_TOKEN")
    api_key = os.environ.get("OPENAI_API_KEY") or github_token
    if not api_key:
        raise RuntimeError(
            "OPENAI_API_KEY is not configured for the FastAPI service. Set it in the service environment and restart the backend."
        )

    try:
        from openai import OpenAI
    except ImportError as exc:
        raise RuntimeError("The OpenAI package is not installed") from exc

    base_url = os.environ.get("OPENAI_BASE_URL")
    if not base_url and github_token and not os.environ.get("OPENAI_API_KEY"):
        base_url = "https://models.inference.ai.azure.com"

    client_kwargs: dict[str, Any] = {"api_key": api_key}
    if base_url:
        client_kwargs["base_url"] = base_url

    context_text = ""
    if context:
        context_text = f"\nCurrent HackMatch context:\n{context}\n"

    response = OpenAI(**client_kwargs).chat.completions.create(
        model=os.environ.get("OPENAI_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"{context_text}\nQuestion: {question}"},
        ],
        temperature=0.2,
        max_tokens=500,
    )
    answer = response.choices[0].message.content
    return answer.strip() if answer else "I could not generate an answer for that question."

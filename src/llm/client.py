"""Anthropic Claude API wrapper with model routing."""
from anthropic import AsyncAnthropic

from src.config.settings import settings

_client: AsyncAnthropic | None = None


def get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        _client = AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


def select_model(complex_query: bool = True) -> str:
    """Route to Sonnet for complex multi-record analysis, Haiku for simple lookups."""
    return settings.anthropic_model_complex if complex_query else settings.anthropic_model_simple


async def chat(
    messages: list[dict],
    system: str,
    model: str | None = None,
    max_tokens: int = 2048,
) -> str:
    """Send a chat request and return the response text."""
    if model is None:
        model = settings.anthropic_model_complex
    response = await get_client().messages.create(
        model=model,
        max_tokens=max_tokens,
        system=system,
        messages=messages,
    )
    return response.content[0].text

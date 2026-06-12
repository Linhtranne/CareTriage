from typing import List, Optional, Type

from pydantic import BaseModel

from app.domain.interfaces import ILlmProvider, ITelemetryClient
from app.infrastructure.llm.gemini_provider import GeminiProvider
from app.shared.config import get_settings


class UnsupportedProviderError(ValueError):
    """Raised when an unsupported LLM provider is requested."""

    pass


class MockProvider(ILlmProvider):
    """A minimal mock provider for testing or fallback when no real provider is needed."""

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        history: Optional[List[str]] = None,
        context: Optional[str] = None,
        attachments: Optional[List[dict]] = None,
        session_id: str = "system",
    ) -> str:
        return "Mock response from MockProvider."

    async def generate_structured_data(
        self,
        system_prompt: str,
        user_prompt: str,
        output_schema: Type[BaseModel],
        context: Optional[str] = None,
        session_id: str = "system",
    ) -> dict:
        return {}


def get_llm_provider(telemetry: ITelemetryClient | None = None) -> ILlmProvider:
    """Factory method to get the configured LLM Provider."""
    settings = get_settings()
    provider_name = settings.get("llm_provider", "gemini").lower()

    if provider_name == "gemini":
        return GeminiProvider(telemetry=telemetry)
    elif provider_name in ("mock", "null"):
        return MockProvider()
    else:
        raise UnsupportedProviderError(
            f"Unsupported LLM provider configured: '{provider_name}'. "
            "Supported providers: 'gemini', 'mock'."
        )

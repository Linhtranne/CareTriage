from unittest.mock import patch

import pytest

from app.infrastructure.llm.provider_factory import (
    MockProvider,
    UnsupportedProviderError,
    get_llm_provider,
)


def test_get_llm_provider_default_is_gemini():
    with (
        patch(
            "app.infrastructure.llm.provider_factory.get_settings",
            return_value={"llm_provider": "gemini"},
        ),
        patch(
            "app.infrastructure.llm.provider_factory.GeminiProvider"
        ) as mock_gemini_provider,
    ):
        provider = get_llm_provider()
        assert provider == mock_gemini_provider.return_value
        mock_gemini_provider.assert_called_once_with(telemetry=None)


def test_get_llm_provider_passes_telemetry_to_gemini():
    telemetry = object()
    with (
        patch(
            "app.infrastructure.llm.provider_factory.get_settings",
            return_value={"llm_provider": "gemini"},
        ),
        patch(
            "app.infrastructure.llm.provider_factory.GeminiProvider"
        ) as mock_gemini_provider,
    ):
        get_llm_provider(telemetry=telemetry)
        mock_gemini_provider.assert_called_once_with(telemetry=telemetry)


def test_get_llm_provider_mock():
    with patch(
        "app.infrastructure.llm.provider_factory.get_settings",
        return_value={"llm_provider": "mock"},
    ):
        provider = get_llm_provider()
        assert isinstance(provider, MockProvider)


def test_get_llm_provider_unsupported_raises_error():
    with patch(
        "app.infrastructure.llm.provider_factory.get_settings",
        return_value={"llm_provider": "openai"},
    ):
        with pytest.raises(UnsupportedProviderError) as exc_info:
            get_llm_provider()
        assert "Unsupported LLM provider configured: 'openai'" in str(exc_info.value)


def test_routes_import_successfully():
    try:
        from app.api.ehr_routes import router as ehr_router  # noqa: F401
        from app.api.routes import router  # noqa: F401
    except ImportError as e:
        pytest.fail(f"Failed to import routes: {e}")

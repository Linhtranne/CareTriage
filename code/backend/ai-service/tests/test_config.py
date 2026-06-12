import os
import sys
from unittest.mock import patch

# Force the local 'app' package to be loaded
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))

import pytest  # noqa: E402

from app.shared.config import get_settings  # noqa: E402


@pytest.fixture(autouse=True)
def clear_config_cache():
    """Clear LRU cache for get_settings before and after every test run."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


def test_config_testing_profile_success():
    """Assert that when TESTING=true, dummy defaults are used without throwing errors."""
    fake_env = {
        "TESTING": "true",
        "LLM_PROVIDER": "mock",
    }
    with patch.dict(os.environ, fake_env, clear=True):
        settings = get_settings()
        assert settings["gemini_api_key"] == "test-gemini-key"
        assert settings["internal_api_key"] == "test-internal-api-key-min-32-chars-long"
        assert settings["llm_provider"] == "mock"
        # Optional fields should remain None
        assert settings["tavily_api_key"] is None


def test_config_production_profile_fails_fast_when_missing():
    """Assert that when TESTING=false, missing required environment variables throws RuntimeError."""
    fake_env = {
        "TESTING": "false",
        # Keep only some variables, omit required GEMINI_API_KEY
        "GEMINI_MODEL_NAME": "gemini-2.5",
        "INTERNAL_API_KEY": "some-production-internal-api-key-longer",
    }
    with patch.dict(os.environ, fake_env, clear=True):
        with pytest.raises(RuntimeError) as exc_info:
            get_settings()
        assert "Missing required environment variable: GEMINI_API_KEY" in str(
            exc_info.value
        )


def test_config_production_profile_success_when_all_provided():
    """Assert that when TESTING=false, providing all required env vars succeeds."""
    fake_env = {
        "TESTING": "false",
        "GEMINI_API_KEY": "production-gemini-key",
        "GEMINI_MODEL_NAME": "gemini-2.5-pro",
        "GEMINI_EMBEDDING_MODEL": "embedding-model-prod",
        "GEMINI_TEMPERATURE": "0.1",
        "GEMINI_TOP_P": "0.9",
        "GEMINI_MAX_TOKENS": "2048",
        "INTERNAL_API_KEY": "super-secure-production-internal-api-key",
        "MAX_BODY_SIZE_BYTES": "10000000",
        "ENTREZ_EMAIL": "prod-admin@caretriage.com",
        "CHROMA_DB_PATH": "/prod/chroma",
    }
    with patch.dict(os.environ, fake_env, clear=True):
        settings = get_settings()
        assert settings["gemini_api_key"] == "production-gemini-key"
        assert settings["gemini_model_name"] == "gemini-2.5-pro"
        assert settings["gemini_temperature"] == 0.1
        assert settings["gemini_max_tokens"] == 2048
        assert (
            settings["internal_api_key"] == "super-secure-production-internal-api-key"
        )
        assert settings["max_body_size_bytes"] == 10000000
        assert settings["entrez_email"] == "prod-admin@caretriage.com"


def test_config_production_profile_uses_safe_optional_defaults():
    """Assert production only requires mandatory env vars and defaults safe tunables."""
    fake_env = {
        "TESTING": "false",
        "GEMINI_API_KEY": "production-gemini-key",
        "GEMINI_MODEL_NAME": "gemini-2.5-pro",
        "GEMINI_EMBEDDING_MODEL": "embedding-model-prod",
        "INTERNAL_API_KEY": "super-secure-production-internal-api-key",
        "ENTREZ_EMAIL": "prod-admin@caretriage.com",
        "CHROMA_DB_PATH": "/prod/chroma",
    }
    with patch.dict(os.environ, fake_env, clear=True):
        settings = get_settings()
        assert settings["gemini_temperature"] == 0.2
        assert settings["gemini_top_p"] == 0.8
        assert settings["gemini_max_tokens"] == 1024
        assert settings["max_body_size_bytes"] == 5242880
        assert settings["telemetry_provider"] == "noop"
        assert settings["llm_provider"] == "gemini"


def test_config_fails_on_invalid_numeric_types():
    """Assert that config parsing fails clearly on invalid integer/float strings."""
    fake_env = {
        "TESTING": "true",
        "GEMINI_TEMPERATURE": "invalid-float-here",
    }
    with patch.dict(os.environ, fake_env, clear=True):
        with pytest.raises(ValueError) as exc_info:
            get_settings()
        assert "Invalid environment variable format" in str(exc_info.value)

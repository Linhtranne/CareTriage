import os
from functools import lru_cache
from typing import Optional

from dotenv import load_dotenv
from pydantic import BaseModel, Field, ValidationError

load_dotenv(override=True)


def is_testing() -> bool:
    return os.getenv("TESTING", "false").lower() == "true"


def require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def required_env(name: str, testing_default: str | None = None) -> str:
    if is_testing() and testing_default is not None:
        return os.getenv(name, testing_default)
    return require_env(name)


def optional_env(name: str) -> str | None:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return None
    return value


def optional_env_with_default(name: str, default: str) -> str:
    value = optional_env(name)
    return value if value is not None else default


class SettingsModel(BaseModel):
    gemini_api_key: str
    gemini_model_name: str
    gemini_embedding_model: str
    gemini_temperature: float = Field(default=0.2)
    gemini_top_p: float = Field(default=0.8)
    gemini_max_tokens: int = Field(default=1024)
    internal_api_key: str
    max_body_size_bytes: int = Field(default=5242880)
    entrez_email: str
    tavily_api_key: Optional[str] = None
    chroma_db_path: str
    enable_web_research: bool = False
    rag_enabled: bool = False
    telemetry_provider: str = "noop"
    llm_provider: str = "gemini"
    langfuse_public_key: Optional[str] = None
    langfuse_secret_key: Optional[str] = None
    langfuse_host: str = "https://cloud.langfuse.com"
    clinical_context_builder_v1: bool = False


@lru_cache
def get_settings() -> dict:
    try:
        # Load raw values (applying testing defaults where appropriate)
        raw_settings = {
            "gemini_api_key": required_env("GEMINI_API_KEY", "test-gemini-key"),
            "gemini_model_name": required_env("GEMINI_MODEL_NAME", "gemini-test-model"),
            "gemini_embedding_model": required_env(
                "GEMINI_EMBEDDING_MODEL", "gemini-test-embedding"
            ),
            "gemini_temperature": float(
                optional_env_with_default("GEMINI_TEMPERATURE", "0.2")
            ),
            "gemini_top_p": float(optional_env_with_default("GEMINI_TOP_P", "0.8")),
            "gemini_max_tokens": int(
                optional_env_with_default("GEMINI_MAX_TOKENS", "1024")
            ),
            "internal_api_key": required_env(
                "INTERNAL_API_KEY", "test-internal-api-key-min-32-chars-long"
            ),
            "max_body_size_bytes": int(
                optional_env_with_default("MAX_BODY_SIZE_BYTES", "5242880")
            ),
            "entrez_email": required_env("ENTREZ_EMAIL", "test@example.com"),
            "tavily_api_key": optional_env("TAVILY_API_KEY"),
            "chroma_db_path": required_env("CHROMA_DB_PATH", ".chroma-test"),
            "enable_web_research": os.getenv("ENABLE_WEB_RESEARCH", "false").lower()
            == "true",
            "rag_enabled": os.getenv("RAG_ENABLED", "false").lower() == "true",
            "telemetry_provider": os.getenv("TELEMETRY_PROVIDER", "noop"),
            "llm_provider": os.getenv("LLM_PROVIDER", "gemini").lower(),
            "langfuse_public_key": optional_env("LANGFUSE_PUBLIC_KEY"),
            "langfuse_secret_key": optional_env("LANGFUSE_SECRET_KEY"),
            "langfuse_host": optional_env_with_default(
                "LANGFUSE_HOST", "https://cloud.langfuse.com"
            ),
            "clinical_context_builder_v1": os.getenv(
                "CLINICAL_CONTEXT_BUILDER_V1", "false"
            ).lower()
            == "true",
        }

        # Validate using Pydantic model
        model = SettingsModel(**raw_settings)  # type: ignore[arg-type]
        return model.model_dump()

    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid environment variable format: {str(e)}") from e
    except ValidationError as e:
        raise ValueError(f"Config validation error: {str(e)}") from e

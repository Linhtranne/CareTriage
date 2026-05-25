import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv(override=True)


def require_env(name: str) -> str:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def optional_env(name: str) -> str | None:
    value = os.getenv(name)
    if value is None or value.strip() == "":
        return None
    return value


def env_int(name: str) -> int:
    return int(require_env(name))


def env_float(name: str) -> float:
    return float(require_env(name))


@lru_cache
def get_settings():
    return {
        "gemini_api_key": require_env("GEMINI_API_KEY"),
        "gemini_model_name": require_env("GEMINI_MODEL_NAME"),
        "gemini_embedding_model": require_env("GEMINI_EMBEDDING_MODEL"),
        "gemini_temperature": env_float("GEMINI_TEMPERATURE"),
        "gemini_top_p": env_float("GEMINI_TOP_P"),
        "gemini_max_tokens": env_int("GEMINI_MAX_TOKENS"),
        "internal_api_key": require_env("INTERNAL_API_KEY"),
        "max_body_size_bytes": env_int("MAX_BODY_SIZE_BYTES"),
        "entrez_email": require_env("ENTREZ_EMAIL"),
        "tavily_api_key": optional_env("TAVILY_API_KEY"),
        "chroma_db_path": require_env("CHROMA_DB_PATH"),
        "enable_web_research": os.getenv("ENABLE_WEB_RESEARCH", "false").lower() == "true",
        "rag_enabled": os.getenv("RAG_ENABLED", "false").lower() == "true",
        "telemetry_provider": os.getenv("TELEMETRY_PROVIDER", "noop"),
        "langfuse_public_key": optional_env("LANGFUSE_PUBLIC_KEY"),
        "langfuse_secret_key": optional_env("LANGFUSE_SECRET_KEY"),
        "langfuse_host": os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com"),
    }

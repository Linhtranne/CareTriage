import logging
from app.domain.interfaces import ITelemetryClient
from app.infrastructure.telemetry.noop_telemetry import NoOpTelemetryClient
from app.infrastructure.telemetry.structured_logger import StructuredLogTelemetryClient
from app.infrastructure.telemetry.langfuse_telemetry import LangfuseTelemetryClient
from app.shared.config import get_settings

logger = logging.getLogger(__name__)

def get_telemetry_client() -> ITelemetryClient:
    settings = get_settings()
    provider = settings.get("telemetry_provider", "noop").lower()

    if provider == "langfuse":
        pub_key = settings.get("langfuse_public_key")
        sec_key = settings.get("langfuse_secret_key")
        if pub_key and sec_key:
            return LangfuseTelemetryClient(
                public_key=pub_key,
                secret_key=sec_key,
                host=settings.get("langfuse_host", "https://cloud.langfuse.com")
            )
        else:
            logger.warning("Langfuse keys missing. Falling back to NoOpTelemetryClient.")
            return NoOpTelemetryClient()
    elif provider == "structured":
        return StructuredLogTelemetryClient()
    
    return NoOpTelemetryClient()

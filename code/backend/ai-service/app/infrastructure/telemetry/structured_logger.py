import logging
import json
from datetime import datetime
from app.domain.interfaces import ITelemetryClient

logger = logging.getLogger("ai_telemetry")
# Configure structured logging to standard output
if not logger.handlers:
    handler = logging.StreamHandler()
    logger.setLevel(logging.INFO)
    logger.addHandler(handler)

class StructuredLogTelemetryClient(ITelemetryClient):
    def _log_event(self, event_name: str, session_id: str, payload: dict):
        # We explicitly enforce NO PHI properties (e.g. no 'message', no 'prompt') 
        # based on the method signatures below which do not accept them.
        log_data = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "event": event_name,
            "session_id": session_id,
            "payload": payload
        }
        logger.info(json.dumps(log_data))

    def track_request_started(self, session_id: str, action: str):
        self._log_event("request_started", session_id, {"action": action})

    def track_request_completed(self, session_id: str, action: str, latency_ms: float):
        self._log_event("request_completed", session_id, {"action": action, "latency_ms": latency_ms})

    def track_red_flag_triggered(self, session_id: str, trigger_reason: str):
        self._log_event("red_flag_triggered", session_id, {"trigger_reason": trigger_reason})

    def track_rag_context_retrieved(self, session_id: str, document_count: int):
        self._log_event("rag_context_retrieved", session_id, {"document_count": document_count})

    def track_llm_call_started(self, session_id: str, model: str):
        self._log_event("llm_call_started", session_id, {"model": model})

    def track_llm_call_completed(self, session_id: str, model: str, latency_ms: float, tokens: int = 0):
        self._log_event("llm_call_completed", session_id, {"model": model, "latency_ms": latency_ms, "tokens": tokens})

    def track_llm_call_failed(self, session_id: str, model: str, error: str):
        self._log_event("llm_call_failed", session_id, {"model": model, "error": error})

    def track_structured_output_validation_failed(self, session_id: str, error: str):
        self._log_event("structured_output_validation_failed", session_id, {"error": error})

    def track_fallback_applied(self, session_id: str, reason: str):
        self._log_event("fallback_applied", session_id, {"reason": reason})

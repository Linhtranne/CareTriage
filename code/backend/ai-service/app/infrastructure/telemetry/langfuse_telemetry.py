from langfuse import Langfuse
from app.domain.interfaces import ITelemetryClient

class LangfuseTelemetryClient(ITelemetryClient):
    def __init__(self, public_key: str, secret_key: str, host: str):
        self.langfuse = Langfuse(
            public_key=public_key,
            secret_key=secret_key,
            host=host
        )

    def track_request_started(self, session_id: str, action: str):
        # We start a trace for this session
        self.langfuse.trace(
            id=session_id,
            name=action,
            tags=["request_started"]
        )
        self.langfuse.span(
            trace_id=session_id,
            name=f"{action}_started",
            input={"action": action}
        )

    def track_request_completed(self, session_id: str, action: str, latency_ms: float):
        self.langfuse.span(
            trace_id=session_id,
            name=f"{action}_completed",
            output={"latency_ms": latency_ms}
        )

    def track_red_flag_triggered(self, session_id: str, trigger_reason: str):
        self.langfuse.event(
            trace_id=session_id,
            name="red_flag_triggered",
            metadata={"trigger_reason": trigger_reason}
        )

    def track_rag_context_retrieved(self, session_id: str, document_count: int):
        self.langfuse.event(
            trace_id=session_id,
            name="rag_context_retrieved",
            metadata={"document_count": document_count}
        )

    def track_llm_call_started(self, session_id: str, model: str):
        self.langfuse.generation(
            trace_id=session_id,
            name="llm_call",
            model=model,
            metadata={"status": "started"}
        )

    def track_llm_call_completed(self, session_id: str, model: str, latency_ms: float, tokens: int = 0):
        # We can update the generation if we have its ID, but event works to track completion
        self.langfuse.event(
            trace_id=session_id,
            name="llm_call_completed",
            metadata={"model": model, "latency_ms": latency_ms, "tokens": tokens}
        )

    def track_llm_call_failed(self, session_id: str, model: str, error: str):
        self.langfuse.event(
            trace_id=session_id,
            name="llm_call_failed",
            level="ERROR",
            metadata={"model": model, "error": error}
        )

    def track_structured_output_validation_failed(self, session_id: str, error: str):
        self.langfuse.event(
            trace_id=session_id,
            name="structured_output_validation_failed",
            level="WARNING",
            metadata={"error": error}
        )

    def track_fallback_applied(self, session_id: str, reason: str):
        self.langfuse.event(
            trace_id=session_id,
            name="fallback_applied",
            metadata={"reason": reason}
        )

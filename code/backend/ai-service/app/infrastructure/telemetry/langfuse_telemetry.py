from typing import cast

from langfuse import Langfuse
from langfuse.types import TraceContext

from app.domain.interfaces import ITelemetryClient
from app.shared.log_sanitizer import assert_safe_log_payload, sanitize_error


class LangfuseTelemetryClient(ITelemetryClient):
    def __init__(self, public_key: str, secret_key: str, host: str):
        self.langfuse = Langfuse(
            public_key=public_key, secret_key=secret_key, host=host
        )

    def _check_safe_payload(self, payload: dict):
        if not payload:
            return
        assert_safe_log_payload(payload)

    def _trace_context(self, session_id: str) -> TraceContext:
        return cast(TraceContext, {"trace_id": session_id})

    def track_request_started(self, session_id: str, action: str):
        input_payload = {"action": action}
        self._check_safe_payload(input_payload)
        self.langfuse.create_event(
            trace_context=self._trace_context(session_id),
            name=f"{action}_started",
            input=input_payload,
        )

    def track_request_completed(self, session_id: str, action: str, latency_ms: float):
        output_payload = {"latency_ms": latency_ms}
        self._check_safe_payload(output_payload)
        self.langfuse.create_event(
            trace_context=self._trace_context(session_id),
            name=f"{action}_completed",
            output=output_payload,
        )

    def track_red_flag_triggered(self, session_id: str, trigger_reason: str):
        meta = {"trigger_reason": trigger_reason}
        self._check_safe_payload(meta)
        self.langfuse.create_event(
            trace_context=self._trace_context(session_id),
            name="red_flag_triggered",
            metadata=meta,
        )

    def track_rag_context_retrieved(
        self,
        session_id: str,
        document_count: int,
        retrieval_latency_ms: float = 0.0,
        context_char_count: int = 0,
    ):
        meta = {
            "document_count": document_count,
            "retrieval_latency_ms": retrieval_latency_ms,
            "context_char_count": context_char_count,
        }
        self._check_safe_payload(meta)
        self.langfuse.create_event(
            trace_context=self._trace_context(session_id),
            name="rag_context_retrieved",
            metadata=meta,
        )

    def track_llm_call_started(self, session_id: str, model: str):
        meta = {"model": model, "status": "started"}
        self._check_safe_payload(meta)
        self.langfuse.create_event(
            trace_context=self._trace_context(session_id),
            name="llm_call_started",
            metadata=meta,
        )

    def track_llm_call_completed(
        self, session_id: str, model: str, latency_ms: float, tokens: int = 0
    ):
        meta = {"model": model, "latency_ms": latency_ms, "tokens": tokens}
        self._check_safe_payload(meta)
        self.langfuse.create_event(
            trace_context=self._trace_context(session_id),
            name="llm_call_completed",
            metadata=meta,
        )

    def track_llm_call_failed(self, session_id: str, model: str, error: str):
        meta = {"model": model, "error": sanitize_error(Exception(error))}
        self._check_safe_payload(meta)
        self.langfuse.create_event(
            trace_context=self._trace_context(session_id),
            name="llm_call_failed",
            level="ERROR",
            metadata=meta,
        )

    def track_structured_output_validation_failed(self, session_id: str, error: str):
        meta = {"error": sanitize_error(Exception(error))}
        self._check_safe_payload(meta)
        self.langfuse.create_event(
            trace_context=self._trace_context(session_id),
            name="structured_output_validation_failed",
            level="WARNING",
            metadata=meta,
        )

    def track_fallback_applied(self, session_id: str, reason: str):
        meta = {"reason": reason}
        self._check_safe_payload(meta)
        self.langfuse.create_event(
            trace_context=self._trace_context(session_id),
            name="fallback_applied",
            metadata=meta,
        )

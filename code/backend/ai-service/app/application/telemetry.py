from app.domain.interfaces import ITelemetryClient


class NoOpTelemetryClient(ITelemetryClient):
    def track_request_started(self, session_id: str, action: str):
        pass

    def track_request_completed(self, session_id: str, action: str, latency_ms: float):
        pass

    def track_red_flag_triggered(self, session_id: str, trigger_reason: str):
        pass

    def track_rag_context_retrieved(
        self,
        session_id: str,
        document_count: int,
        retrieval_latency_ms: float = 0.0,
        context_char_count: int = 0,
    ):
        pass

    def track_llm_call_started(self, session_id: str, model: str):
        pass

    def track_llm_call_completed(
        self, session_id: str, model: str, latency_ms: float, tokens: int = 0
    ):
        pass

    def track_llm_call_failed(self, session_id: str, model: str, error: str):
        pass

    def track_structured_output_validation_failed(self, session_id: str, error: str):
        pass

    def track_fallback_applied(self, session_id: str, reason: str):
        pass

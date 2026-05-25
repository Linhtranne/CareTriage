from abc import ABC, abstractmethod
from typing import Dict, Any, List, Type, Optional
from pydantic import BaseModel

class ILlmProvider(ABC):
    @abstractmethod
    async def generate_text(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        history: Optional[List[str]] = None, 
        context: Optional[str] = None, 
        attachments: Optional[List[dict]] = None
    ) -> str:
        """Generate a text response from the LLM."""
        pass

    @abstractmethod
    async def generate_structured_data(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        output_schema: Type[BaseModel], 
        context: Optional[str] = None
    ) -> dict:
        """Generate a structured JSON output matching the provided Pydantic schema."""
        pass


class IRetriever(ABC):
    @abstractmethod
    def get_context(self, query: str) -> str:
        """Retrieve context for a given query."""
        pass


class IResearchService(IRetriever):
    @abstractmethod
    def start_background_research(self, patient_id: int, query: str) -> None:
        """Start background research and cache medical context for a patient."""
        pass


class ITelemetryClient(ABC):
    @abstractmethod
    def track_request_started(self, session_id: str, action: str):
        pass

    @abstractmethod
    def track_request_completed(self, session_id: str, action: str, latency_ms: float):
        pass

    @abstractmethod
    def track_red_flag_triggered(self, session_id: str, trigger_reason: str):
        pass

    @abstractmethod
    def track_rag_context_retrieved(self, session_id: str, document_count: int):
        pass

    @abstractmethod
    def track_llm_call_started(self, session_id: str, model: str):
        pass

    @abstractmethod
    def track_llm_call_completed(self, session_id: str, model: str, latency_ms: float, tokens: int = 0):
        pass

    @abstractmethod
    def track_llm_call_failed(self, session_id: str, model: str, error: str):
        pass

    @abstractmethod
    def track_structured_output_validation_failed(self, session_id: str, error: str):
        pass

    @abstractmethod
    def track_fallback_applied(self, session_id: str, reason: str):
        pass

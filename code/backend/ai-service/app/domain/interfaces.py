from abc import ABC, abstractmethod
from typing import TYPE_CHECKING, AsyncIterator, List, Optional, Type

from pydantic import BaseModel

if TYPE_CHECKING:
    from app.domain.schemas import (
        ClinicalContext,
        ClinicalContextInput,
        EvidenceChunk,
        RetrievalQuery,
        RetrievalResult,
    )


class ILlmProvider(ABC):
    @abstractmethod
    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        history: Optional[List[str]] = None,
        context: Optional[str] = None,
        attachments: Optional[List[dict]] = None,
        session_id: str = "system",
    ) -> str:
        """Generate a text response from the LLM."""
        pass

    async def generate_text_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        history: Optional[List[str]] = None,
        context: Optional[str] = None,
        attachments: Optional[List[dict]] = None,
        session_id: str = "system",
    ) -> AsyncIterator[str]:
        """Stream text response chunks from the LLM."""
        yield ""

    @abstractmethod
    async def generate_structured_data(
        self,
        system_prompt: str,
        user_prompt: str,
        output_schema: Type[BaseModel],
        context: Optional[str] = None,
        session_id: str = "system",
    ) -> dict:
        """Generate a structured JSON output matching the provided Pydantic schema."""
        pass


class IRetriever(ABC):
    @abstractmethod
    def get_context(self, query: str, session_id: str = "system") -> str:
        """Retrieve context for a given query."""
        pass


class IResearchService(IRetriever):
    @abstractmethod
    def start_background_research(self, query: str, session_id: str = "system") -> None:
        """Start background research and cache non-PHI medical context."""
        pass


class IReranker(ABC):
    @abstractmethod
    def rerank(self, query: str, documents: List[str]) -> List[str]:
        """Rerank retrieved documents."""
        pass


class IContextCompressor(ABC):
    @abstractmethod
    def compress_context(self, query: str, documents: List[str]) -> str:
        """Compress context documents to fit within context window constraints."""
        pass


class IMedicalKnowledgeStore(ABC):
    @abstractmethod
    def search(self, query: "RetrievalQuery") -> List["EvidenceChunk"]:
        """Return structured candidates without formatting prompt text."""
        pass


class IMedicalRetriever(ABC):
    @abstractmethod
    def retrieve(self, query: "RetrievalQuery") -> "RetrievalResult":
        """Retrieve, rank, and compress medical evidence."""
        pass


class IKeywordScorer(ABC):
    @abstractmethod
    def score(self, query: str, content: str) -> float:
        """Return a deterministic normalized keyword score."""
        pass


class IRankFusion(ABC):
    @abstractmethod
    def fuse(self, candidates: List["EvidenceChunk"]) -> List["EvidenceChunk"]:
        """Return candidates in a deterministic fused order."""
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
    def track_rag_context_retrieved(
        self,
        session_id: str,
        document_count: int,
        retrieval_latency_ms: float = 0.0,
        context_char_count: int = 0,
    ):
        pass

    @abstractmethod
    def track_llm_call_started(self, session_id: str, model: str):
        pass

    @abstractmethod
    def track_llm_call_completed(
        self, session_id: str, model: str, latency_ms: float, tokens: int = 0
    ):
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


class IClinicalContextBuilder(ABC):
    @abstractmethod
    def build(self, context_input: "ClinicalContextInput") -> "ClinicalContext":
        """Build deterministic clinical context from inputs without using LLM."""
        pass

import logging

from app.domain.interfaces import IResearchService

logger = logging.getLogger(__name__)


class MedicalResearchUseCase:
    def __init__(self, research_service: IResearchService):
        self.research_service = research_service

    def start_background_research(self, query: str, session_id: str = "system"):
        """Start a background thread to research and cache medical info."""
        self.research_service.start_background_research(
            query=query, session_id=session_id
        )

    def get_context(self, query: str, session_id: str = "system") -> str:
        """Retrieve relevant context for RAG."""
        return self.research_service.get_context(query, session_id=session_id)

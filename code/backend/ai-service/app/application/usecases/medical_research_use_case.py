import logging
from app.domain.interfaces import IResearchService


logger = logging.getLogger(__name__)

class MedicalResearchUseCase:
    def __init__(self, research_service: IResearchService):
        self.research_service = research_service

    def start_background_research(self, patient_id: int, query: str):
        """Start a background thread to research and cache medical info."""
        self.research_service.start_background_research(patient_id, query)

    def get_context(self, query: str) -> str:
        """Retrieve relevant context for RAG."""
        return self.research_service.get_context(query)

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.triage_service import TriageService
from app.services.research_service import ResearchService

import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
triage_service = TriageService()
research_service = ResearchService()

class ResearchRequest(BaseModel):
    patient_id: int
    query: str


class TriageMetadata(BaseModel):
    age: int
    gender: str
    onset: str  # Dưới 24h, 1-3 ngày, Trên 1 tuần, Mãn tính

class TriageRequest(BaseModel):
    session_id: str
    message: str
    conversation_history: list[dict] = []
    attachments: Optional[list[dict]] = None
    metadata: Optional[TriageMetadata] = None


class TriageResponse(BaseModel):
    reply: str
    thinking: Optional[str] = None
    is_complete: bool = False
    triage_result: Optional[dict] = None


class RecommendationResponse(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    urgency_level: str
    confidence_score: float
    suggested_actions: list[str]
    reasoning: str


@router.post("/triage/analyze", response_model=TriageResponse)
async def analyze_symptoms(request: TriageRequest):
    """Analyze patient symptoms and generate follow-up questions or triage recommendation."""
    # Retrieve context from RAG if available
    try:
        context = research_service.get_context(request.message)
    except Exception as e:
        logger.error(f"RAG Context Error: {str(e)}")
        context = ""
    
    result = await triage_service.analyze(
        session_id=request.session_id,
        message=request.message,
        history=request.conversation_history,
        context=context,
        attachments=request.attachments
    )
    logger.info(f"AI Result for session {request.session_id} processed")
    return result


@router.post("/triage/research")
async def trigger_research(request: ResearchRequest):
    """Trigger background research for a patient."""
    research_service.start_background_research(request.patient_id, request.query)
    return {"status": "Research started", "patient_id": request.patient_id}


def map_specialty_to_id(name: str) -> Optional[int]:
    """Map AI specialty name to system Department ID."""
    mapping = {
        "Nội tổng quát": 1,
        "Tai Mũi Họng": 2,
        "Tim mạch": 3,
        "Nhi khoa": 4,
        "Sản phụ khoa": 5,
        "Da liễu": 6,
        "Tiêu hóa": 7,
        "Cơ xương khớp": 8,
        "Thần kinh": 9,
        "Cấp cứu": 10
    }
    return mapping.get(name)


@router.post("/triage/recommend", response_model=RecommendationResponse)
async def get_recommendation(request: TriageRequest):
    """Generate a final triage recommendation with category mapping and business rules."""
    try:
        context = research_service.get_context(request.message)
    except Exception as e:
        logger.error(f"RAG Context Error: {str(e)}")
        context = ""
    
    result = await triage_service.analyze(
        session_id=request.session_id,
        message=request.message,
        history=request.conversation_history,
        context=context,
        attachments=request.attachments,
        metadata=request.metadata.dict() if request.metadata else None
    )
    
    # Ensure completion
    triage_data = result.get("triage_result")
    if not triage_data:
        triage_data = await triage_service._extract_triage_result(result["reply"])
    
    # Business Rule: If confidence < 0.6, fallback to "Nội tổng quát"
    confidence = triage_data.get("confidence_score", 0.0)
    dept_name = triage_data.get("suggested_department", "Nội tổng quát")
    
    if confidence < 0.6:
        dept_name = "Nội tổng quát"
    
    # Mapping
    category_id = map_specialty_to_id(dept_name)

    # Logging for monitoring and re-training
    logger.info(f"Triage Recommendation: session={request.session_id}, dept={dept_name}, confidence={confidence}")
    
    return RecommendationResponse(
        category_id=category_id,
        category_name=dept_name,
        urgency_level=triage_data.get("urgency_level", "MEDIUM"),
        confidence_score=confidence,
        suggested_actions=triage_data.get("suggested_actions", []),
        reasoning=result.get("thinking", "")
    )

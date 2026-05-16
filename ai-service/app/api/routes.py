from fastapi import APIRouter
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal
import base64
import binascii
import logging

from app.services.triage_service import TriageService
from app.services.research_service import ResearchService

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()
triage_service = TriageService()
research_service = ResearchService()

MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

class HistoryMessage(BaseModel):
    role: Literal["user", "model", "assistant"]
    content: str = Field(min_length=1, max_length=2000)

class Attachment(BaseModel):
    type: Literal["image"]
    mime_type: Literal["image/jpeg", "image/png"]
    data: str = Field(min_length=1)

    @field_validator("data")
    @classmethod
    def validate_base64_size(cls, value):
        try:
            decoded = base64.b64decode(value, validate=True)
        except binascii.Error:
            raise ValueError("Invalid base64 attachment")

        if len(decoded) > MAX_ATTACHMENT_BYTES:
            raise ValueError("Attachment exceeds 5MB limit")
        return value

class ResearchRequest(BaseModel):
    patient_id: int
    query: str

class TriageMetadata(BaseModel):
    age: int
    gender: str
    onset: str

class TriageRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=64)
    message: str = Field(min_length=1, max_length=4000)
    conversation_history: list[HistoryMessage] = Field(default_factory=list, max_length=30)
    attachments: Optional[list[Attachment]] = Field(default=None, max_length=3)
    metadata: Optional[TriageMetadata] = None

class TriageResponse(BaseModel):
    reply: str
    is_complete: bool = False
    triage_result: Optional[dict] = None

class RecommendationResponse(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    urgency_level: str
    confidence_score: float
    possible_conditions: list[str] = []
    suggested_actions: list[str] = []
    safe_explanation: str

@router.post("/triage/analyze", response_model=TriageResponse)
async def analyze_symptoms(request: TriageRequest):
    """Analyze patient symptoms and generate follow-up questions or triage recommendation."""
    try:
        context = research_service.get_context(request.message)
    except Exception as e:
        logger.error(f"RAG Context Error: {str(e)}")
        context = ""
    
    history_dicts = [msg.dict() for msg in request.conversation_history]
    attachment_dicts = [att.dict() for att in request.attachments] if request.attachments else None
    
    result = await triage_service.analyze(
        session_id=request.session_id,
        message=request.message,
        history=history_dicts,
        context=context,
        attachments=attachment_dicts
    )
    
    # Do not leak 'thinking' to public response. Log it internally instead.
    if "thinking" in result and result["thinking"]:
        logger.info(f"AI Thinking for session {request.session_id}: {result['thinking']}")
        
    logger.info(f"AI Result for session {request.session_id} processed")
    
    return TriageResponse(
        reply=result["reply"],
        is_complete=result["is_complete"],
        triage_result=result["triage_result"]
    )

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
    
    history_dicts = [msg.dict() for msg in request.conversation_history]
    attachment_dicts = [att.dict() for att in request.attachments] if request.attachments else None
    metadata_dict = request.metadata.dict() if request.metadata else None

    result = await triage_service.analyze(
        session_id=request.session_id,
        message=request.message,
        history=history_dicts,
        context=context,
        attachments=attachment_dicts,
        metadata=metadata_dict
    )
    
    if "thinking" in result and result["thinking"]:
        logger.info(f"AI Thinking for session {request.session_id}: {result['thinking']}")

    # Ensure completion
    triage_data = result.get("triage_result")
    if not triage_data:
        triage_data = await triage_service._extract_triage_result(result["reply"])
    
    confidence = triage_data.get("confidence_score", 0.0)
    dept_name = triage_data.get("suggested_department", "Nội tổng quát")
    
    if confidence < 0.6:
        dept_name = "Nội tổng quát"
    
    category_id = map_specialty_to_id(dept_name)

    logger.info(f"Triage Recommendation: session={request.session_id}, dept={dept_name}, confidence={confidence}")
    
    return RecommendationResponse(
        category_id=category_id,
        category_name=dept_name,
        urgency_level=triage_data.get("urgency_level", "MEDIUM"),
        confidence_score=confidence,
        possible_conditions=triage_data.get("possible_conditions", []),
        suggested_actions=triage_data.get("suggested_actions", []),
        safe_explanation="Dựa trên triệu chứng bạn mô tả, hệ thống khuyến nghị khám chuyên khoa phù hợp. Đây không phải chẩn đoán chính thức."
    )

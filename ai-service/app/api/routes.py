from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List
import base64
import binascii
import logging

from app.core.config import get_settings
from app.services.triage_service import TriageService
from app.services.research_service import ResearchService

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()
triage_service = TriageService()
research_service = ResearchService()

MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024

class HistoryMessage(BaseModel):
    role: Literal["user", "model", "assistant", "system"]
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
    conversation_history: List[HistoryMessage] = Field(default_factory=list, max_length=30)
    attachments: Optional[List[Attachment]] = Field(default=None, max_length=3)
    metadata: Optional[TriageMetadata] = None

class TriageResponse(BaseModel):
    reply: str
    is_complete: bool = False
    intake_complete: bool = False
    red_flag_detected: bool = False
    triage_result: Optional[dict] = None

class TriageResultDetail(BaseModel):
    category_id: Optional[int] = None
    category_name: str
    suggested_department_code: str
    suggested_department_name: str
    urgency_level: str
    confidence_score: float
    possible_conditions: List[str] = []
    suggested_actions: List[str] = []
    department_mapping_status: str
    fallback_reason: Optional[str] = None
    clinical_reasoning_summary: Optional[str] = None

class RecommendationResponse(BaseModel):
    intake_complete: bool
    recommendation_ready: bool
    missing_information: List[str] = []
    reply: Optional[str] = None
    triage_result: Optional[TriageResultDetail] = None



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
    metadata_dict = request.metadata.dict() if request.metadata else None
    
    result = await triage_service.analyze(
        session_id=request.session_id,
        message=request.message,
        history=history_dicts,
        context=context,
        attachments=attachment_dicts,
        metadata=metadata_dict
    )
    
    # Internal clinical logging to prevent leaking CoT to public responses
    if "clinical_reasoning_summary" in result and result["clinical_reasoning_summary"]:
        logger.info(f"AI Clinical Reasoning for session {request.session_id}: {result['clinical_reasoning_summary']}")
        
    logger.info(f"AI Result for session {request.session_id} processed")
    
    return TriageResponse(
        reply=result["reply"],
        is_complete=result["is_complete"],
        intake_complete=result["intake_complete"],
        red_flag_detected=result["red_flag_detected"],
        triage_result=result["triage_result"]
    )


@router.post("/triage/research")
async def trigger_research(request: ResearchRequest):
    """Trigger background research for a patient. Blocked when ENABLE_WEB_RESEARCH is false."""
    if not settings.get("enable_web_research", False):
        raise HTTPException(status_code=403, detail="Web research is disabled")
        
    research_service.start_background_research(request.patient_id, request.query)
    return {"status": "Research started", "patient_id": request.patient_id}


@router.post("/triage/recommend", response_model=RecommendationResponse)
async def get_recommendation(request: TriageRequest):
    """Generate a final triage recommendation with whitelisted category mapping and business rules."""
    try:
        context = research_service.get_context(request.message)
    except Exception as e:
        logger.error(f"RAG Context Error: {str(e)}")
        context = ""
    
    history_dicts = [msg.dict() for msg in request.conversation_history]

    result = await triage_service.recommend(
        session_id=request.session_id,
        message=request.message,
        history=history_dicts,
        context=context
    )

    tdata = result.get("triage_result")
    if tdata:
        dept_name = tdata.get("suggested_department_name", "Nội tổng quát")
        category_id = None
        
        # Populate category mapping metadata nested inside triage_result
        triage_result_detail = TriageResultDetail(
            category_id=category_id,
            category_name=dept_name,
            suggested_department_code=tdata.get("suggested_department_code", "GENERAL_INTERNAL_MEDICINE"),
            suggested_department_name=dept_name,
            urgency_level=tdata.get("urgency_level", "MEDIUM"),
            confidence_score=tdata.get("confidence_score", 0.0),
            possible_conditions=tdata.get("possible_conditions", []),
            suggested_actions=tdata.get("suggested_actions", []),
            department_mapping_status=tdata.get("department_mapping_status", "LOW_CONFIDENCE_FALLBACK"),
            fallback_reason=tdata.get("fallback_reason"),
            clinical_reasoning_summary=tdata.get("clinical_reasoning_summary")
        )
    else:
        triage_result_detail = None

    logger.info(
        f"Triage Recommendation complete: session={request.session_id}, "
        f"intake_complete={result['intake_complete']}, ready={result['recommendation_ready']}"
    )
    
    return RecommendationResponse(
        intake_complete=result["intake_complete"],
        recommendation_ready=result["recommendation_ready"],
        missing_information=result.get("missing_information", []),
        reply=result.get("reply"),
        triage_result=triage_result_detail
    )

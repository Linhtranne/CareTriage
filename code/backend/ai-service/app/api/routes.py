from fastapi import APIRouter, HTTPException
import logging

from app.application.usecases.triage_use_case import TriageUseCase
from app.application.usecases.medical_research_use_case import MedicalResearchUseCase
from app.infrastructure.llm.gemini_provider import GeminiProvider
from app.infrastructure.rag.research_service import ResearchService
from app.infrastructure.telemetry.factory import get_telemetry_client
from app.shared.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()
llm_provider = GeminiProvider()
research_service = ResearchService()
research_use_case = MedicalResearchUseCase(research_service=research_service)
telemetry_client = get_telemetry_client()
triage_use_case = TriageUseCase(
    llm_provider=llm_provider,
    research_service=research_service,
    telemetry=telemetry_client,
)

from app.api.schemas import (
    ResearchRequest,
    TriageRequest,
    TriageResponse,
    TriageResultDetail,
    RecommendationResponse,
)



@router.post("/triage/analyze", response_model=TriageResponse)
async def analyze_symptoms(request: TriageRequest):
    """Analyze patient symptoms and generate follow-up questions or triage recommendation."""
    try:
        context = research_use_case.get_context(request.message)
    except Exception as e:
        logger.error(f"RAG Context Error: {str(e)}")
        context = ""
    
    history_dicts = [msg.dict() for msg in request.conversation_history]
    attachment_dicts = [att.dict() for att in request.attachments] if request.attachments else None
    metadata_dict = request.metadata.dict() if request.metadata else None
    
    result = await triage_use_case.analyze(
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
        
    research_use_case.start_background_research(request.patient_id, request.query)
    return {"status": "Research started", "patient_id": request.patient_id}


@router.post("/triage/recommend", response_model=RecommendationResponse)
async def get_recommendation(request: TriageRequest):
    """Generate a final triage recommendation with whitelisted category mapping and business rules."""
    try:
        context = research_use_case.get_context(request.message)
    except Exception as e:
        logger.error(f"RAG Context Error: {str(e)}")
        context = ""
    
    history_dicts = [msg.dict() for msg in request.conversation_history]

    result = await triage_use_case.recommend(
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
            clinical_reasoning_summary=tdata.get("clinical_reasoning_summary"),
            summary=tdata.get("summary"),
            red_flag_detected=tdata.get("red_flag_detected", False)
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

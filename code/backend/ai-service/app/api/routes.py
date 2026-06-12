import json
import logging
from uuid import uuid4

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.application.context.clinical_context_builder import (
    DeterministicClinicalContextBuilder,
)
from app.application.usecases.medical_research_use_case import MedicalResearchUseCase
from app.application.usecases.triage_use_case import TriageUseCase
from app.infrastructure.llm.provider_factory import get_llm_provider
from app.infrastructure.rag.research_service import ResearchService
from app.infrastructure.telemetry.factory import get_telemetry_client
from app.shared.config import get_settings
from app.shared.log_sanitizer import sanitize_error

logger = logging.getLogger(__name__)
settings = get_settings()

router = APIRouter()
telemetry_client = get_telemetry_client()
llm_provider = get_llm_provider(telemetry=telemetry_client)
research_service = ResearchService()
research_use_case = MedicalResearchUseCase(research_service=research_service)
triage_use_case = TriageUseCase(
    llm_provider=llm_provider,
    context_builder=DeterministicClinicalContextBuilder(),
    clinical_context_builder_enabled=get_settings().get(
        "clinical_context_builder_v1", False
    ),
    research_service=research_service,
    telemetry=telemetry_client,
)

from app.api.schemas import (  # noqa: E402
    RecommendationResponse,
    ResearchRequest,
    TriageRequest,
    TriageResponse,
    TriageResultDetail,
    TriageStreamRequest,
)


@router.post("/triage/analyze", response_model=TriageResponse)
async def analyze_symptoms(request: TriageRequest) -> TriageResponse:
    """Analyze patient symptoms and generate follow-up questions or triage recommendation."""
    try:
        context = research_use_case.get_context(
            request.message, session_id=request.session_id
        )
    except Exception as e:
        logger.error(f"RAG Context Error: {sanitize_error(e)}")
        context = ""

    history_dicts = [msg.model_dump() for msg in request.conversation_history]
    attachment_dicts = (
        [att.model_dump() for att in request.attachments]
        if request.attachments
        else None
    )
    metadata_dict = request.metadata.model_dump() if request.metadata else None

    result = await triage_use_case.analyze(
        session_id=request.session_id,
        message=request.message,
        history=history_dicts,
        context=context,
        attachments=attachment_dicts,
        metadata=metadata_dict,
    )

    logger.info(f"AI Result for session {request.session_id} processed")

    return TriageResponse(
        reply=result["reply"],
        intake_complete=result["intake_complete"],
        red_flag_detected=result["red_flag_detected"],
        triage_result=result["triage_result"],
    )


@router.post("/triage/analyze/stream")
async def stream_analyze_symptoms(request: TriageStreamRequest) -> StreamingResponse:
    """Stream triage intake reply chunks using server-sent events."""
    try:
        context = research_use_case.get_context(
            request.message, session_id=request.session_id
        )
    except Exception as e:
        logger.error(f"RAG Context Error: {sanitize_error(e)}")
        context = ""

    history_dicts = [msg.model_dump() for msg in request.conversation_history]
    attachment_dicts = (
        [att.model_dump() for att in request.attachments]
        if request.attachments
        else None
    )
    metadata_dict = request.metadata.model_dump() if request.metadata else None

    async def event_generator():
        try:
            async for sse_event in triage_use_case.analyze_stream(
                session_id=request.session_id,
                message=request.message,
                history=history_dicts,
                turn_id=request.turn_id,
                context=context,
                attachments=attachment_dicts,
                metadata=metadata_dict,
            ):
                yield sse_event
        except Exception as e:
            logger.error(f"Streaming triage failed: {sanitize_error(e)}")
            error_payload = {
                "turn_id": request.turn_id,
                "code": "INTERNAL_STREAM_ERROR",
                "message": "Xin l\u1ed7i, h\u1ec7 th\u1ed1ng AI \u0111ang g\u1eb7p s\u1ef1 c\u1ed1. Vui l\u00f2ng th\u1eed l\u1ea1i.",
                "retryable": True,
            }
            yield f"event: error\ndata: {json.dumps(error_payload, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.post("/triage/research")
async def trigger_research(request: ResearchRequest) -> dict[str, str]:
    """Trigger background research for a patient. Blocked when ENABLE_WEB_RESEARCH is false."""
    if not settings.get("enable_web_research", False):
        raise HTTPException(status_code=403, detail="Web research is disabled")

    research_id = f"research-{uuid4().hex}"
    research_use_case.start_background_research(
        query=request.query, session_id=research_id
    )
    return {"status": "Research started", "research_id": research_id}


@router.post("/triage/recommend", deprecated=True)
async def get_recommendation(request: TriageRequest) -> RecommendationResponse:
    """Removed: completion and recommendation are part of the SSE final event."""
    raise HTTPException(
        status_code=410,
        detail="Use POST /api/triage/analyze/stream and consume its final event.",
    )

    # Kept unreachable until legacy response types are removed in a later cleanup.
    try:
        context = research_use_case.get_context(
            request.message, session_id=request.session_id
        )
    except Exception as e:
        logger.error(f"RAG Context Error: {sanitize_error(e)}")
        context = ""

    history_dicts = [msg.model_dump() for msg in request.conversation_history]

    result = await triage_use_case.recommend(
        session_id=request.session_id,
        message=request.message,
        history=history_dicts,
        context=context,
    )

    tdata = result.get("triage_result")
    if tdata:
        dept_name = tdata.get("suggested_department_name", "Nội tổng quát")
        category_id = None

        # Populate category mapping metadata nested inside triage_result
        triage_result_detail = TriageResultDetail(
            category_id=category_id,
            category_name=dept_name,
            suggested_department_code=tdata.get(
                "suggested_department_code", "GENERAL_INTERNAL_MEDICINE"
            ),
            suggested_department_name=dept_name,
            urgency_level=tdata.get("urgency_level", "MEDIUM"),
            confidence_score=tdata.get("confidence_score", 0.0),
            possible_conditions=tdata.get("possible_conditions", []),
            suggested_actions=tdata.get("suggested_actions", []),
            department_mapping_status=tdata.get(
                "department_mapping_status", "LOW_CONFIDENCE_FALLBACK"
            ),
            fallback_reason=tdata.get("fallback_reason"),
            clinical_reasoning_summary=tdata.get("clinical_reasoning_summary"),
            summary=tdata.get("summary"),
            red_flag_detected=tdata.get("red_flag_detected", False),
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
        triage_result=triage_result_detail,
    )

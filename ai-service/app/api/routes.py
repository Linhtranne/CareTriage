from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.triage_service import TriageService

router = APIRouter()
triage_service = TriageService()


class TriageRequest(BaseModel):
    session_id: str
    message: str
    conversation_history: list[dict] = []


class TriageResponse(BaseModel):
    reply: str
    is_complete: bool = False
    triage_result: Optional[dict] = None


@router.post("/triage/analyze", response_model=TriageResponse)
async def analyze_symptoms(request: TriageRequest):
    """Analyze patient symptoms and generate follow-up questions or triage recommendation."""
    result = await triage_service.analyze(
        session_id=request.session_id,
        message=request.message,
        history=request.conversation_history,
    )
    return result

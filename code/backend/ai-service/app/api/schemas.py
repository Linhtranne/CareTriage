from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List, Dict, Any
import base64
import binascii

from app.domain.schemas import TriageResultDetail, ExtractionResult, NoteType

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

class RecommendationResponse(BaseModel):
    intake_complete: bool
    recommendation_ready: bool
    missing_information: List[str] = []
    reply: Optional[str] = None
    triage_result: Optional[TriageResultDetail] = None

class EHRExtractRequest(BaseModel):
    text: str
    note_type: NoteType = NoteType.PROGRESS
    patient_id: Optional[str] = None

class EHRExtractResponse(BaseModel):
    success: bool = True
    result: Optional[ExtractionResult] = None
    error: Optional[str] = None

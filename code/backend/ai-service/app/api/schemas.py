import base64
import binascii
from typing import List, Literal, Optional

from pydantic import BaseModel, Field, field_validator, model_validator

from app.domain.schemas import (
    ExtractionResult,
    NoteType,
    TriageResultDetail,
    TriageResultOutput,
)

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
            raise ValueError("Invalid base64 attachment") from None

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
    conversation_history: List[HistoryMessage] = Field(
        default_factory=list, max_length=30
    )
    attachments: Optional[List[Attachment]] = Field(default=None, max_length=3)
    metadata: Optional[TriageMetadata] = None


class TriageStreamRequest(BaseModel):
    session_id: str = Field(min_length=1, max_length=64)
    message: str = Field(min_length=1, max_length=4000)
    conversation_history: List[HistoryMessage] = Field(
        default_factory=list, max_length=30
    )
    attachments: Optional[List[Attachment]] = Field(default=None, max_length=3)
    metadata: Optional[TriageMetadata] = None
    turn_id: str = Field(min_length=36, max_length=36)


class SseFinalPayload(BaseModel):
    contract_version: Literal["1"] = "1"
    turn_id: str = Field(min_length=36, max_length=36)
    reply: str = Field(min_length=1)
    intake_complete: bool
    red_flag_detected: bool
    missing_information: List[str] = Field(default_factory=list)
    classification_status: Literal["OK", "DEGRADED"]
    classification_error_code: Optional[str] = None
    triage_result: Optional[TriageResultOutput] = None

    @field_validator("classification_error_code")
    @classmethod
    def validate_classification_error_code(cls, value, info):
        status = info.data.get("classification_status")
        if status == "DEGRADED" and not value:
            raise ValueError("DEGRADED requires classification_error_code")
        return value

    @model_validator(mode="after")
    def validate_terminal_state(self):
        if self.classification_status == "DEGRADED":
            if self.intake_complete or self.triage_result is not None:
                raise ValueError(
                    "DEGRADED cannot complete intake or contain triage_result"
                )
        if self.intake_complete and self.triage_result is None:
            raise ValueError("Completed intake requires triage_result")
        return self


class SseTokenPayload(BaseModel):
    turn_id: str = Field(min_length=36, max_length=36)
    sequence: int = Field(ge=1)
    content: str


class SseHeartbeatPayload(BaseModel):
    turn_id: str = Field(min_length=36, max_length=36)
    timestamp: str = Field(min_length=1)


class SseErrorPayload(BaseModel):
    turn_id: str = Field(min_length=36, max_length=36)
    code: Literal[
        "LLM_PHASE_A_FAILED",
        "LLM_EMPTY_RESPONSE",
        "EMPTY_RESPONSE",
        "INTERNAL_STREAM_ERROR",
        "STREAM_TIMEOUT",
    ]
    message: str = Field(min_length=1)
    retryable: bool


class TriageResponse(BaseModel):
    reply: str
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

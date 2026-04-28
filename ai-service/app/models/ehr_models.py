from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class EntityType(str, Enum):
    MEDICATION = "MEDICATION"
    SYMPTOM = "SYMPTOM"
    CONDITION = "CONDITION"
    DOSAGE = "DOSAGE"
    LAB_TEST = "LAB_TEST"
    PROCEDURE = "PROCEDURE"


class NoteType(str, Enum):
    ADMISSION = "ADMISSION"
    PROGRESS = "PROGRESS"
    DISCHARGE = "DISCHARGE"
    CONSULTATION = "CONSULTATION"
    PRESCRIPTION = "PRESCRIPTION"


class ExtractedEntity(BaseModel):
    entity_type: EntityType
    entity_value: str
    normalized_value: Optional[str] = None
    confidence_score: float = Field(ge=0.0, le=1.0, default=0.8)
    start_position: Optional[int] = None
    end_position: Optional[int] = None
    metadata: Optional[dict] = None


class ExtractionResult(BaseModel):
    raw_text: str
    entities: list[ExtractedEntity] = []
    medications: list[ExtractedEntity] = []
    symptoms: list[ExtractedEntity] = []
    conditions: list[ExtractedEntity] = []
    dosages: list[ExtractedEntity] = []
    lab_tests: list[ExtractedEntity] = []
    procedures: list[ExtractedEntity] = []
    processing_time_ms: Optional[float] = None


class EHRExtractRequest(BaseModel):
    text: str
    note_type: Optional[NoteType] = NoteType.PROGRESS
    patient_id: Optional[str] = None


class EHRExtractResponse(BaseModel):
    success: bool = True
    result: Optional[ExtractionResult] = None
    error: Optional[str] = None

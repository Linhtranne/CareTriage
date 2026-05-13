from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime


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
    metadata: Dict[str, Any] = Field(default_factory=dict)


class ExtractionResult(BaseModel):
    raw_text: str
    entities: List[ExtractedEntity] = Field(default_factory=list)
    medications: List[ExtractedEntity] = Field(default_factory=list)
    symptoms: List[ExtractedEntity] = Field(default_factory=list)
    conditions: List[ExtractedEntity] = Field(default_factory=list)
    dosages: List[ExtractedEntity] = Field(default_factory=list)
    lab_tests: List[ExtractedEntity] = Field(default_factory=list)
    procedures: List[ExtractedEntity] = Field(default_factory=list)
    processing_time_ms: Optional[float] = None


class ClinicalNote(BaseModel):
    id: Optional[str] = None
    patient_id: Optional[str] = None
    doctor_id: Optional[str] = None
    note_type: NoteType = NoteType.PROGRESS
    raw_text: str
    file_type: str = "TEXT"
    extraction_status: str = "PENDING"
    created_at: datetime = Field(default_factory=datetime.now)
    extraction_result: Optional[ExtractionResult] = None


class EHRExtractRequest(BaseModel):
    text: str
    note_type: NoteType = NoteType.PROGRESS
    patient_id: Optional[str] = None


class EHRExtractResponse(BaseModel):
    success: bool = True
    result: Optional[ExtractionResult] = None
    error: Optional[str] = None

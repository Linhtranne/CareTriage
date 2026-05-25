from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal, List, Dict, Any
from enum import Enum
from datetime import datetime

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
    summary: Optional[str] = None
    red_flag_detected: Optional[bool] = False

class PolicyResult(BaseModel):
    is_triggered: bool = False
    reply_msg: Optional[str] = None
    triage_result: Optional[TriageResultDetail] = None

# --- LLM OUTPUT SCHEMAS ---
class TriageRecommendationOutput(BaseModel):
    intake_complete: bool = Field(description="True only if symptom, onset, and severity are clearly provided.")
    missing_information: List[str] = Field(default_factory=list, description="Questions to ask the patient if intake is not complete.")
    suggested_department: str = Field(description="Must be one of: Nội tổng quát, Tai Mũi Họng, Tim mạch, Nhi khoa, Sản phụ khoa, Da liễu, Tiêu hóa, Cơ xương khớp, Thần kinh, Cấp cứu.")
    urgency_level: str = Field(description="LOW, MEDIUM, HIGH, EMERGENCY")
    confidence_score: float = Field(ge=0.0, le=1.0)
    possible_conditions: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    clinical_reasoning_summary: str = Field(description="No internal thoughts, clinical logic only.")
    summary: str = Field(description="Short summary of symptoms for medical record.")
    infection_control: bool = Field(default=False)

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

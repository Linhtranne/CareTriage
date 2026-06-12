from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


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


# --- RAG SCHEMAS ---
class RagDocument(BaseModel):
    content: str
    source: str
    title: Optional[str] = None
    url: Optional[str] = None
    retrieved_at: datetime = Field(default_factory=datetime.now)
    scope: Optional[str] = None


class EvidenceSourceType(str, Enum):
    INTERNAL_GUIDELINE = "INTERNAL_GUIDELINE"
    GOVERNMENT_GUIDELINE = "GOVERNMENT_GUIDELINE"
    PROFESSIONAL_GUIDELINE = "PROFESSIONAL_GUIDELINE"
    PUBMED = "PUBMED"
    HOSPITAL = "HOSPITAL"
    WEB = "WEB"


class EvidenceMetadata(BaseModel):
    model_config = ConfigDict(extra="forbid")

    evidence_id: str = Field(min_length=64, max_length=64, pattern=r"^[0-9a-f]{64}$")
    source_type: EvidenceSourceType
    source_name: str = Field(min_length=1, max_length=200)
    title: str = Field(min_length=1, max_length=500)
    source_url: Optional[str] = Field(default=None, max_length=2048)
    document_version: Optional[str] = Field(default=None, max_length=100)
    published_at: Optional[datetime] = None
    retrieved_at: datetime
    specialty_codes: List[str] = Field(default_factory=list, max_length=50)
    language: str = Field(min_length=2, max_length=16)
    trust_tier: int = Field(ge=1, le=5)
    corpus_version: str = Field(min_length=1, max_length=100)


class EvidenceChunk(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1)
    metadata: EvidenceMetadata
    vector_rank: Optional[int] = Field(default=None, ge=1)
    keyword_score: float = Field(default=0.0, ge=0.0, le=1.0)
    fused_score: float = Field(default=0.0, ge=0.0)


class RetrievalQuery(BaseModel):
    model_config = ConfigDict(extra="forbid")

    text: str = Field(min_length=1, max_length=4000)
    language: str = Field(default="vi", min_length=2, max_length=16)
    specialty_codes: List[str] = Field(default_factory=list, max_length=20)
    max_candidates: int = Field(default=20, ge=1, le=100)
    max_results: int = Field(default=5, ge=1, le=20)
    context_char_budget: int = Field(default=6000, ge=500, le=20000)


class RetrievalResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    evidence: List[EvidenceChunk] = Field(default_factory=list)
    context_text: str = ""
    corpus_version: Optional[str] = None
    degraded: bool = False
    failure_code: Optional[str] = None


# --- LLM OUTPUT SCHEMAS ---
class AnalyzeOutput(BaseModel):
    reply: str = Field(description="The conversational reply to the patient.")
    intake_complete: bool = Field(
        default=False,
        description="True only when symptom, onset, and severity are sufficient.",
    )


class TriageRecommendationOutput(BaseModel):
    intake_complete: bool = Field(
        description="True only if symptom, onset, and severity are clearly provided."
    )
    missing_information: List[str] = Field(
        default_factory=list,
        description="Questions to ask the patient if intake is not complete.",
    )
    suggested_department: str = Field(
        description="Must be one of: Nội tổng quát, Tai Mũi Họng, Tim mạch, Nhi khoa, Sản phụ khoa, Da liễu, Tiêu hóa, Cơ xương khớp, Thần kinh, Cấp cứu."
    )
    urgency_level: str = Field(description="LOW, MEDIUM, HIGH, EMERGENCY")
    confidence_score: float = Field(ge=0.0, le=1.0)
    possible_conditions: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    clinical_reasoning_summary: str = Field(
        description="No internal thoughts, clinical logic only."
    )
    summary: str = Field(description="Short summary of symptoms for medical record.")
    infection_control: bool = Field(default=False)


class TriageResultOutput(BaseModel):
    suggested_department_code: str
    suggested_department_name: str
    urgency_level: str
    confidence_score: float = Field(ge=0.0, le=1.0)
    possible_conditions: List[str] = Field(default_factory=list)
    suggested_actions: List[str] = Field(default_factory=list)
    clinical_reasoning_summary: str
    summary: str


class ClassifyOutput(BaseModel):
    """Phase B classification only; reply text is owned by Phase A."""

    intake_complete: bool
    red_flag_detected: bool = False
    missing_information: List[str] = Field(default_factory=list)
    triage_result: Optional[TriageResultOutput] = None


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


# --- CAPABILITY 1: CLINICAL CONTEXT BUILDER ---


class ClinicalFact(BaseModel):
    fact_id: str
    fact_type: str
    value: str
    source: Literal["PATIENT", "PROFILE", "ATTACHMENT", "RETRIEVAL"]
    confidence: float = Field(ge=0.0, le=1.0)


class ClinicalConflict(BaseModel):
    fact_type: str
    fact_ids: List[str]
    description: str


class DomainHistoryMessage(BaseModel):
    role: str
    content: str


class ClinicalContextInput(BaseModel):
    current_message: str
    conversation_history: List[DomainHistoryMessage] = Field(default_factory=list)
    patient_facts: List[ClinicalFact] = Field(default_factory=list)
    attachment_facts: List[ClinicalFact] = Field(default_factory=list)
    retrieved_evidence: List[RagDocument] = Field(default_factory=list)


class ClinicalContext(BaseModel):
    prompt_history: List[str] = Field(default_factory=list)
    current_message: str
    known_facts: List[ClinicalFact] = Field(default_factory=list)
    missing_fact_types: List[str] = Field(default_factory=list)
    conflicts: List[ClinicalConflict] = Field(default_factory=list)
    context_text: str

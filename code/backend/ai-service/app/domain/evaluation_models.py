from typing import List, Optional

from pydantic import BaseModel, Field


class EvalCase(BaseModel):
    id: str
    input_text: str
    conversation_history: List[dict] = Field(default_factory=list)
    expected_department_code: Optional[str] = None
    expected_urgency_level: Optional[str] = None
    expected_red_flag: Optional[bool] = None
    expected_missing_info: Optional[List[str]] = None
    safety_expectation: Optional[str] = None
    notes: Optional[str] = None


class EvalResult(BaseModel):
    case_id: str
    passed: bool
    department_match: bool
    urgency_match: bool
    red_flag_match: bool
    safety_notes: Optional[str] = None


class EvalSummary(BaseModel):
    total_cases: int
    passed_cases: int
    accuracy: float
    results: List[EvalResult]

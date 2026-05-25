from pydantic import BaseModel
from typing import List, Optional

class EvalCase(BaseModel):
    id: str
    patient_message: str
    history: List[dict]
    expected_department: str
    expected_urgency: str
    expected_red_flag: bool

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

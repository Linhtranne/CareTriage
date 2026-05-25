import asyncio
import json
import os
import sys
sys.stdout.reconfigure(encoding='utf-8')
from typing import List, Optional, Type
from pydantic import BaseModel

# Add the project root to sys.path so we can import 'app'
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.domain.evaluation_models import EvalCase, EvalResult, EvalSummary
from app.application.usecases.triage_use_case import TriageUseCase
from app.domain.interfaces import ILlmProvider
from app.domain.schemas import TriageRecommendationOutput
from app.infrastructure.telemetry.factory import get_telemetry_client

class MockLlmProvider(ILlmProvider):
    async def generate_text(self, system_prompt: str, user_prompt: str, history: Optional[List[str]] = None, context: Optional[str] = None, attachments: Optional[List[dict]] = None) -> str:
        return "Mocked response"

    async def generate_structured_data(self, system_prompt: str, user_prompt: str, output_schema: Type[BaseModel], context: Optional[str] = None) -> dict:
        # Mocking responses based on simple keyword matches for testing eval correctness without LLM cost
        msg = user_prompt.lower()
        if "ngứa" in msg or "mẩn đỏ" in msg or "hải sản" in msg:
            return TriageRecommendationOutput(
                intake_complete=True,
                urgency_level="MEDIUM",
                suggested_department="Da liễu",
                confidence_score=0.9,
                clinical_reasoning_summary="Allergic reaction",
                summary="Patient has allergic reaction to seafood"
            ).model_dump()
        elif "sốt" in msg and "cháu" in msg:
            return TriageRecommendationOutput(
                intake_complete=True,
                urgency_level="HIGH",
                suggested_department="Nhi khoa",
                confidence_score=0.9,
                clinical_reasoning_summary="High fever in toddler",
                summary="Toddler with 39C fever"
            ).model_dump()
        elif "dạ dày" in msg:
            return TriageRecommendationOutput(
                intake_complete=True,
                urgency_level="LOW",
                suggested_department="Tiêu hóa",
                confidence_score=0.9,
                clinical_reasoning_summary="Stomach ache",
                summary="Patient has stomach ache"
            ).model_dump()
        
        # Default fallback
        return TriageRecommendationOutput(
            intake_complete=True,
            urgency_level="MEDIUM",
            suggested_department="Nội tổng quát",
            confidence_score=0.8,
            clinical_reasoning_summary="Default",
            summary="Default"
        ).model_dump()

async def run_evals():
    dataset_path = os.path.join(os.path.dirname(__file__), "golden_dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        cases_data = json.load(f)

    eval_cases = [EvalCase(**c) for c in cases_data]
    
    llm = MockLlmProvider()
    telemetry = get_telemetry_client()
    use_case = TriageUseCase(llm_provider=llm, telemetry=telemetry)

    results = []
    passed_count = 0

    print(f"Running evaluation on {len(eval_cases)} cases...")

    for case in eval_cases:
        print(f"Evaluating case: {case.id}")
        
        # Run triage pipeline
        res = await use_case.recommend(
            session_id=f"eval_{case.id}",
            message=case.patient_message,
            history=case.history
        )
        
        triage_res = res.get("triage_result") or {}
        actual_dept = triage_res.get("suggested_department_name", "Nội tổng quát")
        actual_urgency = triage_res.get("urgency_level", "MEDIUM")
        
        dept_match = actual_dept == case.expected_department
        urgency_match = actual_urgency == case.expected_urgency
        # If expected red flag is true, then we expect the triage_result to indicate an emergency bypass
        is_emergency = actual_dept == "Cấp cứu" and actual_urgency == "EMERGENCY"
        red_flag_match = is_emergency == case.expected_red_flag

        passed = dept_match and urgency_match and red_flag_match
        if passed:
            passed_count += 1
            
        results.append(EvalResult(
            case_id=case.id,
            passed=passed,
            department_match=dept_match,
            urgency_match=urgency_match,
            red_flag_match=red_flag_match,
            safety_notes=None if passed else f"Expected: {case.expected_department}/{case.expected_urgency}, Got: {actual_dept}/{actual_urgency}"
        ))

    summary = EvalSummary(
        total_cases=len(eval_cases),
        passed_cases=passed_count,
        accuracy=passed_count / len(eval_cases),
        results=results
    )

    print("\n--- Evaluation Summary ---")
    print(f"Total Cases: {summary.total_cases}")
    print(f"Passed: {summary.passed_cases}")
    print(f"Accuracy: {summary.accuracy * 100:.1f}%\n")
    
    for r in summary.results:
        status = "PASS" if r.passed else "FAIL"
        notes = f" - Notes: {r.safety_notes}" if r.safety_notes else ""
        print(f"[{status}] {r.case_id}{notes}")

if __name__ == "__main__":
    asyncio.run(run_evals())

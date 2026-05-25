from dataclasses import dataclass
from typing import Any, Iterable, Mapping


@dataclass(frozen=True)
class EvalCase:
    id: str
    input_text: str
    expected_department_code: str | None = None
    expected_urgency_level: str | None = None
    should_red_flag: bool | None = None


@dataclass(frozen=True)
class EvalResult:
    case_id: str
    passed: bool
    reasons: list[str]


@dataclass(frozen=True)
class EvalSummary:
    total: int
    passed: int
    failed: int
    results: list[EvalResult]


class TriageEvalRunner:
    def evaluate_result(self, case: EvalCase, triage_output: Mapping[str, Any]) -> EvalResult:
        reasons: list[str] = []

        triage_result = triage_output.get("triage_result") or {}
        if case.expected_department_code:
            actual_department = triage_result.get("suggested_department_code")
            if actual_department != case.expected_department_code:
                reasons.append(
                    f"department expected {case.expected_department_code}, got {actual_department}"
                )

        if case.expected_urgency_level:
            actual_urgency = triage_result.get("urgency_level")
            if actual_urgency != case.expected_urgency_level:
                reasons.append(f"urgency expected {case.expected_urgency_level}, got {actual_urgency}")

        if case.should_red_flag is not None:
            actual_red_flag = bool(triage_output.get("red_flag_detected") or triage_result.get("red_flag_detected"))
            if actual_red_flag != case.should_red_flag:
                reasons.append(f"red flag expected {case.should_red_flag}, got {actual_red_flag}")

        return EvalResult(case_id=case.id, passed=not reasons, reasons=reasons)

    def summarize(self, results: Iterable[EvalResult]) -> EvalSummary:
        result_list = list(results)
        passed = sum(1 for result in result_list if result.passed)
        total = len(result_list)
        return EvalSummary(total=total, passed=passed, failed=total - passed, results=result_list)

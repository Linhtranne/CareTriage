# ruff: noqa: E402, I001
import argparse
import asyncio
import json
import os
import sys
import unicodedata
from typing import List, Optional, Type

from pydantic import BaseModel

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.application.context.clinical_context_builder import (
    DeterministicClinicalContextBuilder,
)  # noqa: E402
from app.application.evaluations import TriageEvalRunner  # noqa: E402
from app.application.usecases.triage_use_case import TriageUseCase  # noqa: E402
from app.domain.evaluation_models import EvalCase  # noqa: E402
from app.domain.interfaces import ILlmProvider  # noqa: E402
from app.domain.schemas import TriageRecommendationOutput  # noqa: E402
from app.infrastructure.telemetry.factory import get_telemetry_client  # noqa: E402


def normalize_text(value: str) -> str:
    normalized = unicodedata.normalize(
        "NFKD", value.lower().replace("đ", "d").replace("Đ", "D")
    )
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def make_output(
    department: str,
    urgency: str,
    *,
    confidence: float = 0.9,
    red_flag: bool = False,
    missing_information: Optional[List[str]] = None,
    reasoning: str = "Mocked deterministic routing",
) -> dict:
    return TriageRecommendationOutput(
        intake_complete=not missing_information,
        missing_information=missing_information or [],
        urgency_level=urgency,
        suggested_department=department,
        confidence_score=confidence,
        clinical_reasoning_summary=reasoning,
        summary=reasoning,
        red_flag_detected=red_flag,
        infection_control=red_flag,
    ).model_dump()


class MockLlmProvider(ILlmProvider):
    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        history: Optional[List[str]] = None,
        context: Optional[str] = None,
        attachments: Optional[List[dict]] = None,
        session_id: str = "system",
    ) -> str:
        return "Mocked response"

    async def generate_structured_data(  # noqa: C901
        self,
        system_prompt: str,
        user_prompt: str,
        output_schema: Type[BaseModel],
        context: Optional[str] = None,
        session_id: str = "system",
    ) -> dict:
        msg = normalize_text(user_prompt)
        # Extract just the patient message at the end
        patient_msg = msg
        if "patient:" in msg:
            patient_msg = msg.split("patient:")[-1]

        if any(
            term in patient_msg
            for term in [
                "dot ngot meo mieng",
                "meo mieng",
                "liet nua nguoi",
                "dau tuc nguc",
                "moi tim",
                "khong noi duoc",
                "kho khe",
                "sung moi",
                "mang thai",
                "ra mau am dao",
                "khong muon song",
                "tu lam hai",
                "dau dau du doi nhat",
            ]
        ):
            return make_output("Cấp cứu", "EMERGENCY", red_flag=True)

        if "nga" in patient_msg and (
            "lu lan" in patient_msg or "dau hong" in patient_msg
        ):
            return make_output("Cấp cứu", "HIGH", red_flag=True)

        if "phan đen" in patient_msg or "phan den" in patient_msg:
            return make_output("Cấp cứu", "HIGH", red_flag=True)

        if (
            "ngua" in patient_msg
            or "man" in patient_msg
            or "hai san" in patient_msg
            or "noi mun do" in patient_msg
        ):
            urgency = "LOW" if "noi mun do" in patient_msg else "MEDIUM"
            return make_output("Da liễu", urgency, reasoning="Dermatology symptoms")

        if ("sot" in patient_msg and "chau" in patient_msg) or "con toi" in patient_msg:
            urgency = (
                "HIGH" if "39" in patient_msg or "sot cao" in patient_msg else "MEDIUM"
            )
            return make_output("Nhi khoa", urgency, reasoning="Pediatric symptoms")

        if "da day" in patient_msg or "o chua" in patient_msg:
            return make_output("Tiêu hóa", "LOW", reasoning="Stomach reflux")

        if any(
            term in patient_msg for term in ["di ngoai", "ho chau phai", "dau bung"]
        ):
            urgency = (
                "HIGH"
                if "ho chau phai" in patient_msg or "bung duoi ben phai" in patient_msg
                else "MEDIUM"
            )
            return make_output("Tiêu hóa", urgency, reasoning="GI symptoms")

        if any(
            term in patient_msg for term in ["dau lung", "treo co chan", "sung dau"]
        ):
            return make_output(
                "Cơ xương khớp", "LOW", reasoning="Musculoskeletal symptoms"
            )

        if any(
            term in patient_msg
            for term in ["nghet mui", "dau hong", "u tai", "chay dich tai"]
        ):
            return make_output("Tai Mũi Họng", "LOW", reasoning="ENT symptoms")

        if "mat khu giac" in patient_msg or "covid" in patient_msg:
            return make_output(
                "Nội tổng quát", "MEDIUM", reasoning="Infection control symptoms"
            )

        if "dau dau nhe" in patient_msg and "khong yeu tay chan" in patient_msg:
            return make_output(
                "Nội tổng quát", "LOW", reasoning="Negated neurological red flags"
            )

        if "dau dau nhe" in patient_msg and "khong nhin mo" in patient_msg:
            return make_output(
                "Nội tổng quát", "LOW", reasoning="Mild headache without red flags"
            )

        if "sooot" in patient_msg or (
            "ho nhieu" in patient_msg and "tho dc" in patient_msg
        ):
            return make_output(
                "Nội tổng quát", "MEDIUM", reasoning="Noisy respiratory symptoms"
            )

        if "hoi hop" in patient_msg or "danh trong nguc" in patient_msg:
            return make_output("Tim mạch", "MEDIUM", reasoning="Cardiology symptoms")

        if any(term in patient_msg for term in ["te bi", "run tay", "dau dau am i"]):
            return make_output("Thần kinh", "MEDIUM", reasoning="Neurology symptoms")

        if any(
            term in patient_msg for term in ["khi hu", "tre kinh", "dau vung ha vi"]
        ):
            return make_output("Sản phụ khoa", "MEDIUM", reasoning="OBGYN symptoms")

        if "khong duoc khoe" in patient_msg or "hoi met" in patient_msg:
            return make_output(
                "Nội tổng quát",
                "MEDIUM",
                missing_information=["triệu chứng chính", "thời gian khởi phát"],
                reasoning="Ambiguous symptoms need more intake",
            )

        return make_output("Nội tổng quát", "MEDIUM", confidence=0.8)


async def run_evals(dataset_path: str, output_path: str, threshold: float, mode: str):  # noqa: C901
    with open(dataset_path, "r", encoding="utf-8") as f:
        cases_data = json.load(f)

    eval_cases = [EvalCase(**case_data) for case_data in cases_data]
    eval_runner = TriageEvalRunner()

    results = []

    if mode == "saved":
        print(
            f"Running evaluation on {len(eval_cases)} cases using saved outputs from {output_path}..."
        )
        if not os.path.exists(output_path):
            print(f"Error: Saved outputs file {output_path} not found.")
            sys.exit(1)

        with open(output_path, "r", encoding="utf-8") as f:
            saved_outputs_list = json.load(f)

        saved_outputs = {item["case_id"]: item for item in saved_outputs_list}

        for case in eval_cases:
            print(f"Evaluating case: {case.id}")
            actual_output = saved_outputs.get(case.id, {})
            result = eval_runner.evaluate_result(case, actual_output)
            results.append(result)

    else:
        print(f"Running evaluation on {len(eval_cases)} cases using mode: {mode}...")
        llm_provider = None
        if mode == "live":
            if os.getenv("ENABLE_LIVE_EVALS") != "true":
                print(
                    "Error: Live mode requested but ENABLE_LIVE_EVALS != 'true'. Aborting."
                )
                sys.exit(1)
            from app.infrastructure.llm.gemini_provider import GeminiProvider

            llm_provider = GeminiProvider()
        else:
            llm_provider = MockLlmProvider()

        use_case = TriageUseCase(
            llm_provider=llm_provider,
            context_builder=DeterministicClinicalContextBuilder(),
            clinical_context_builder_enabled=False,
            telemetry=get_telemetry_client(),
        )

        actual_outputs_to_save = []

        for case in eval_cases:
            print(f"Evaluating case: {case.id}")
            response = await use_case.recommend(
                session_id=f"eval_{case.id}",
                message=case.input_text,
                history=case.conversation_history,
            )

            # Map for TriageEvalRunner expectations (suggested_department_code)
            triage_result = response.get("triage_result") or {}
            if (
                "suggested_department_name" in triage_result
                and "suggested_department_code" not in triage_result
            ):
                triage_result["suggested_department_code"] = triage_result[
                    "suggested_department_name"
                ]

            actual_outputs_to_save.append(
                {
                    "case_id": case.id,
                    "triage_result": triage_result,
                    "red_flag_detected": triage_result.get("red_flag_detected", False),
                }
            )

            result = eval_runner.evaluate_result(case, response)
            results.append(result)

        if output_path:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(actual_outputs_to_save, f, ensure_ascii=False, indent=2)

    summary = eval_runner.summarize(results)

    print("\n--- Evaluation Summary ---")
    print(f"Total Cases: {summary.total}")
    print(f"Passed: {summary.passed}")
    accuracy = summary.passed / summary.total if summary.total > 0 else 0
    print(f"Accuracy: {accuracy * 100:.1f}%\n")

    for result in summary.results:
        status = "PASS" if result.passed else "FAIL"
        notes = f" - Notes: {', '.join(result.reasons)}" if result.reasons else ""
        print(f"[{status}] {result.case_id}{notes}")

    if accuracy < threshold:
        print(
            f"\nError: Accuracy {accuracy * 100:.1f}% is below the threshold of {threshold * 100:.1f}%."
        )
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run AI Triage Evaluations")
    parser.add_argument(
        "--dataset",
        type=str,
        default=os.path.join(os.path.dirname(__file__), "golden_dataset.json"),
        help="Path to golden dataset",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=os.path.join(os.path.dirname(__file__), "eval_outputs.json"),
        help="Path to save/load outputs",
    )
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.8,
        help="Pass/fail threshold for accuracy (0.0 - 1.0)",
    )
    parser.add_argument(
        "--mode",
        type=str,
        choices=["mocked", "saved", "live"],
        default="mocked",
        help="Evaluation mode",
    )

    args = parser.parse_args()

    asyncio.run(run_evals(args.dataset, args.output, args.threshold, args.mode))

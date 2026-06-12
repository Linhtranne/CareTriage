import json
from pathlib import Path

from app.api.schemas import (
    SseErrorPayload,
    SseFinalPayload,
    SseHeartbeatPayload,
    SseTokenPayload,
)


def test_shared_sse_final_fixture_matches_python_contract():
    fixture_path = (
        Path(__file__).resolve().parents[4] / "contracts" / "ai-sse-final-v1.json"
    )
    payload = SseFinalPayload.model_validate(
        json.loads(fixture_path.read_text(encoding="utf-8"))
    )

    assert payload.contract_version == "1"
    assert payload.classification_status == "OK"
    assert payload.triage_result is not None
    assert payload.triage_result.suggested_department_code == "CARDIOLOGY"


def test_all_shared_sse_fixtures_match_python_contract():
    contract_dir = Path(__file__).resolve().parents[4] / "contracts"

    SseTokenPayload.model_validate(
        json.loads((contract_dir / "ai-sse-token-v1.json").read_text("utf-8"))
    )
    SseHeartbeatPayload.model_validate(
        json.loads((contract_dir / "ai-sse-heartbeat-v1.json").read_text("utf-8"))
    )
    SseErrorPayload.model_validate(
        json.loads((contract_dir / "ai-sse-error-v1.json").read_text("utf-8"))
    )
    degraded = SseFinalPayload.model_validate(
        json.loads((contract_dir / "ai-sse-final-degraded-v1.json").read_text("utf-8"))
    )
    assert degraded.classification_status == "DEGRADED"
    assert degraded.triage_result is None

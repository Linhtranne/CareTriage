import os
import sys
from unittest.mock import patch

# Force the local 'app' package to be loaded
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../")))
os.environ["TESTING"] = "true"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402

client = TestClient(app)


def test_missing_auth_behavior_when_not_testing():
    """Assert that missing X-Internal-Api-Key returns 401 when TESTING is not true."""
    # When TESTING="false", requests should be blocked unless API key matches
    with patch("os.getenv") as mock_getenv:
        mock_getenv.side_effect = lambda key, default=None: (
            "false" if key == "TESTING" else os.environ.get(key, default)
        )
        response = client.post(
            "/api/triage/analyze",
            json={
                "session_id": "test-session-123",
                "message": "Tôi bị nhức đầu sốt nhẹ",
                "conversation_history": [],
            },
        )
        assert response.status_code == 401
        assert response.json()["message"] == "Unauthorized access"


@pytest.mark.asyncio
@patch("app.api.routes.llm_provider.generate_structured_data")
async def test_triage_analyze_contract(mock_generate_structured_data):
    """Assert stable response keys for /triage/analyze."""
    mock_generate_structured_data.return_value = {
        "reply": "Chào bạn, bạn bị nhức đầu sốt nhẹ từ bao lâu rồi?",
        "intake_complete": False,
    }

    request_payload = {
        "session_id": "test-session-123",
        "message": "Tôi bị nhức đầu sốt nhẹ",
        "conversation_history": [],
        "metadata": {"age": 30, "gender": "Nữ", "onset": "2 ngày"},
    }

    response = client.post("/api/triage/analyze", json=request_payload)
    assert response.status_code == 200

    data = response.json()
    # Contract Lock Assertions
    assert "reply" in data
    assert "intake_complete" in data
    assert "red_flag_detected" in data
    assert "triage_result" in data

    assert data["reply"] == "Chào bạn, bạn bị nhức đầu sốt nhẹ từ bao lâu rồi?"
    assert data["intake_complete"] is False
    assert data["red_flag_detected"] is False
    assert data["triage_result"] is None


def test_triage_analyze_red_flag_no_clinical_reasoning_leak():
    """Assert that when a red flag bypass is triggered during symptom analysis,
    no non-empty clinical_reasoning_summary leaks to the patient-facing response.
    """
    response = client.post(
        "/api/triage/analyze",
        json={
            "session_id": "test-session-redflag",
            "message": "Tôi bị yếu nửa người đột ngột và méo miệng",  # Triggers STROKE red flag
            "conversation_history": [],
        },
    )
    assert response.status_code == 200
    data = response.json()

    assert data["red_flag_detected"] is True
    assert data["triage_result"] is not None

    tresult = data["triage_result"]
    if "clinical_reasoning_summary" in tresult:
        assert (
            tresult["clinical_reasoning_summary"] is None
            or tresult["clinical_reasoning_summary"] == ""
        )


@pytest.mark.asyncio
@patch("app.api.routes.llm_provider.generate_structured_data")
async def test_triage_recommend_contract(mock_generate_structured_data):
    """Assert stable response keys for /triage/recommend."""
    # Mock output matching domain schema TriageRecommendationOutput
    mock_generate_structured_data.return_value = {
        "intake_complete": True,
        "missing_information": [],
        "suggested_department": "Nội tổng quát",
        "urgency_level": "MEDIUM",
        "confidence_score": 0.85,
        "possible_conditions": ["Cảm cúm thông thường"],
        "suggested_actions": ["Nghỉ ngơi và uống đủ nước"],
        "clinical_reasoning_summary": "Bệnh nhân có triệu chứng sốt nhẹ và đau đầu nhẹ tự hết.",
        "summary": "Sốt nhẹ đau đầu nhẹ",
        "infection_control": False,
    }

    request_payload = {
        "session_id": "test-session-123",
        "message": "Tôi bị sốt nhẹ và đau đầu nhẹ",
        "conversation_history": [],
    }

    response = client.post("/api/triage/recommend", json=request_payload)
    assert response.status_code == 410
    mock_generate_structured_data.assert_not_called()
    return

    data = response.json()
    # Contract Lock Assertions
    assert "intake_complete" in data
    assert "recommendation_ready" in data
    assert "missing_information" in data
    assert "triage_result" in data

    assert data["intake_complete"] is True
    assert data["recommendation_ready"] is True

    tresult = data["triage_result"]
    assert tresult is not None
    assert "category_id" in tresult
    assert tresult["category_name"] == "Nội tổng quát"
    assert tresult["suggested_department_code"] == "GENERAL_INTERNAL_MEDICINE"
    assert tresult["urgency_level"] == "MEDIUM"
    assert tresult["confidence_score"] == 0.85
    assert (
        tresult["clinical_reasoning_summary"]
        == "Bệnh nhân có triệu chứng sốt nhẹ và đau đầu nhẹ tự hết."
    )


@pytest.mark.asyncio
@patch("app.api.routes.research_use_case.start_background_research")
async def test_triage_research_contract(mock_start_research):
    """Assert research endpoint contract under web research settings."""
    # When web research is disabled, it should return 403 Forbidden
    with patch.dict("app.api.routes.settings", {"enable_web_research": False}):
        response = client.post(
            "/api/triage/research", json={"patient_id": 999, "query": "flu treatment"}
        )
        assert response.status_code == 403

    # When web research is enabled, it should succeed, return status and research_id, and MUST not leak patient_id
    with patch.dict("app.api.routes.settings", {"enable_web_research": True}):
        response = client.post(
            "/api/triage/research", json={"patient_id": 999, "query": "flu treatment"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "research_id" in data
        assert data["status"] == "Research started"
        # Assert patient_id is not leaked in the response
        assert "patient_id" not in data


@pytest.mark.asyncio
@patch("app.api.ehr_routes.ehr_use_case.llm.generate_structured_data")
async def test_ehr_extract_text_contract(mock_generate_structured_data):
    """Assert stable EHR extraction response schema."""
    mock_generate_structured_data.return_value = {
        "entities": [
            {
                "entity_type": "MEDICATION",
                "entity_value": "Aspirin",
                "normalized_value": "Aspirin",
                "confidence_score": 0.95,
                "start_position": 0,
                "end_position": 7,
                "metadata": {},
            }
        ]
    }

    response = client.post(
        "/api/ehr/extract-text",
        json={"text": "Aspirin 100mg", "patient_id": "123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "result" in data
    assert "error" in data

    res = data["result"]
    assert "raw_text" in res
    assert "entities" in res
    assert "medications" in res
    assert "symptoms" in res
    assert "conditions" in res
    assert "dosages" in res
    assert "lab_tests" in res
    assert "procedures" in res
    assert "processing_time_ms" in res


@pytest.mark.asyncio
@patch("app.api.ehr_routes.ehr_use_case.llm.generate_structured_data")
async def test_ehr_extract_text_exception_handling(mock_generate_structured_data):
    """Assert exception handling in EHR route masks raw exception trace."""
    # Mocking Gemini failure
    mock_generate_structured_data.side_effect = RuntimeError(
        "Critical DB connection dropped: user=admin password=secret_db_pass"
    )

    response = client.post(
        "/api/ehr/extract-text",
        json={"text": "Aspirin 100mg", "patient_id": "123"},
    )
    assert response.status_code == 500
    detail = response.json()["detail"]
    assert "Internal AI service error occurred during extraction" in detail
    # Make sure database credentials/raw connection errors are masked and do not leak
    assert "secret_db_pass" not in detail
    assert "RuntimeError" not in detail


@pytest.mark.asyncio
@patch("app.api.ehr_routes.ehr_use_case.llm.generate_structured_data")
async def test_ehr_extract_file_contract_txt(mock_generate_structured_data):
    """Assert stable EHR extraction response schema for a valid TXT file upload."""
    mock_generate_structured_data.return_value = {
        "entities": [
            {
                "entity_type": "MEDICATION",
                "entity_value": "Paracetamol",
                "normalized_value": "Paracetamol",
                "confidence_score": 0.9,
                "start_position": 0,
                "end_position": 11,
                "metadata": {},
            }
        ]
    }

    response = client.post(
        "/api/ehr/extract-file",
        files={"file": ("clinical_note.txt", b"Paracetamol 500mg daily", "text/plain")},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "result" in data
    assert "error" in data

    res = data["result"]
    assert res["raw_text"] == "Paracetamol 500mg daily"
    assert "entities" in res
    assert "medications" in res
    assert "symptoms" in res
    assert "conditions" in res
    assert "dosages" in res
    assert "lab_tests" in res
    assert "procedures" in res
    assert "processing_time_ms" in res


@pytest.mark.asyncio
@patch("app.api.ehr_routes.ehr_use_case._parse_pdf")
@patch("app.api.ehr_routes.ehr_use_case.llm.generate_structured_data")
async def test_ehr_extract_file_contract_pdf(
    mock_generate_structured_data, mock_parse_pdf
):
    """Assert stable EHR extraction response schema for a valid PDF file upload."""
    mock_parse_pdf.return_value = "Patient diagnosed with flu."
    mock_generate_structured_data.return_value = {
        "entities": [
            {
                "entity_type": "CONDITION",
                "entity_value": "flu",
                "normalized_value": "influenza",
                "confidence_score": 0.85,
                "start_position": 22,
                "end_position": 25,
                "metadata": {},
            }
        ]
    }

    response = client.post(
        "/api/ehr/extract-file",
        files={
            "file": (
                "clinical_note.pdf",
                b"%PDF-1.4 mock pdf content",
                "application/pdf",
            )
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "result" in data
    assert "error" in data

    res = data["result"]
    assert res["raw_text"] == "Patient diagnosed with flu."
    assert len(res["conditions"]) == 1
    assert res["conditions"][0]["entity_value"] == "flu"


def test_ehr_extract_file_unsupported_format():
    """Assert 400 error when uploading an unsupported file format."""
    response = client.post(
        "/api/ehr/extract-file",
        files={"file": ("unsupported_image.png", b"fake png data", "image/png")},
    )
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"]


def test_ehr_extract_file_empty():
    """Assert 400 error when uploading an empty file."""
    response = client.post(
        "/api/ehr/extract-file",
        files={"file": ("clinical_note.txt", b"", "text/plain")},
    )
    assert response.status_code == 400
    assert "File is empty" in response.json()["detail"]


@pytest.mark.asyncio
@patch("app.api.ehr_routes.ehr_use_case.extract_from_file")
async def test_ehr_extract_file_exception_handling(mock_extract_from_file):
    """Assert exception handling in EHR file route masks raw exception trace."""
    mock_extract_from_file.side_effect = RuntimeError(
        "Sensitive internal details: DB connection broken user=admin password=secret_db_pass"
    )

    response = client.post(
        "/api/ehr/extract-file",
        files={"file": ("clinical_note.txt", b"Paracetamol 500mg daily", "text/plain")},
    )
    assert response.status_code == 500
    detail = response.json()["detail"]
    assert "Internal AI service error occurred during file extraction" in detail
    assert "secret_db_pass" not in detail
    assert "RuntimeError" not in detail

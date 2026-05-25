import os
import sys

# Force local 'app' package to be loaded instead of global packages
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.core.config import get_settings
from app.main import app
from app.services.red_flag_detector import RedFlagDetector

settings = get_settings()
client = TestClient(app)

def test_missing_auth():
    response = client.post("/api/triage/analyze", json={
        "session_id": "test",
        "message": "hello"
    })
    assert response.status_code == 401
    assert response.json() == {"message": "Unauthorized access"}

def test_payload_too_large():
    large_body = {
        "session_id": "test",
        "message": "a" * (settings["max_body_size_bytes"] + 1)
    }
    response = client.post("/api/triage/analyze", json=large_body, headers={
        "X-Internal-Api-Key": settings["internal_api_key"]
    })
    assert response.status_code == 413

def test_invalid_schema_length():
    response = client.post("/api/triage/analyze", json={
        "session_id": "test",
        "message": "a" * 5000
    }, headers={
        "X-Internal-Api-Key": settings["internal_api_key"]
    })
    assert response.status_code == 422 # Pydantic validation error

def test_red_flag_bypass():
    response = client.post("/api/triage/analyze", json={
        "session_id": "test",
        "message": "Bố tôi đột ngột bị méo miệng và liệt nửa người bên phải"
    }, headers={
        "X-Internal-Api-Key": settings["internal_api_key"]
    })
    assert response.status_code == 200
    data = response.json()
    assert data["is_complete"] is True
    assert data["triage_result"]["urgency_level"] == "EMERGENCY"
    assert data["triage_result"]["suggested_department"] == "Cấp cứu"
    assert data["triage_result"]["department_mapping_status"] == "RED_FLAG_BYPASS"
    assert "thinking" not in data

def test_negated_red_flag_no_bypass():
    # 1. Fully negated: should be None
    res1 = RedFlagDetector.detect_red_flags("Tôi không bị đột quỵ và không hề có triệu chứng méo miệng")
    assert res1 is None

    # 2. Negated but with second active emergency symptom: should trigger for second symptom (DYSPNEA)
    res2 = RedFlagDetector.detect_red_flags("Tôi không bị đau ngực nhưng tôi đang khó thở nặng không thở được")
    assert res2 is not None
    assert res2["triage_result"]["suggested_department"] == "Cấp cứu"
    assert "khó thở nặng" in res2["reply"]

    # 3. Double negation check:
    res3 = RedFlagDetector.detect_red_flags("chưa từng bị co giật hay hôn mê")
    assert res3 is None

def test_web_research_disabled():
    response = client.post("/api/triage/research", json={
        "patient_id": 1,
        "query": "sốt xuất huyết"
    }, headers={
        "X-Internal-Api-Key": settings["internal_api_key"]
    })
    if not settings.get("enable_web_research", False):
        assert response.status_code == 403
        assert "Web research is disabled" in response.json()["detail"]
    else:
        assert response.status_code == 200

def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "config_status" in data
    assert "rag_enabled" in data
    assert "corpus_status" in data
    if not settings.get("rag_enabled", False):
        assert data["rag_enabled"] is False
        assert data["corpus_status"] == "NOT_CONFIGURED"

print("Running manual security and unit tests...")
test_missing_auth()
test_invalid_schema_length()
test_red_flag_bypass()
test_negated_red_flag_no_bypass()
test_web_research_disabled()
test_health_check_endpoint()
print("All security and unit tests passed successfully!")

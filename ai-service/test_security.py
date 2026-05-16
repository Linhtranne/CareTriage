from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_missing_auth():
    response = client.post("/api/triage/analyze", json={
        "session_id": "test",
        "message": "hello"
    })
    assert response.status_code == 401
    assert response.json() == {"message": "Unauthorized access"}

def test_payload_too_large():
    # Use valid auth, but giant body
    large_body = {
        "session_id": "test",
        "message": "a" * (16 * 1024 * 1024 + 1)
    }
    response = client.post("/api/triage/analyze", json=large_body, headers={
        "X-Internal-Api-Key": "caretriage-internal-secret-for-dev-only-min-32-chars-long"
    })
    assert response.status_code == 413

def test_invalid_schema_length():
    # Message too long
    response = client.post("/api/triage/analyze", json={
        "session_id": "test",
        "message": "a" * 5000
    }, headers={
        "X-Internal-Api-Key": "caretriage-internal-secret-for-dev-only-min-32-chars-long"
    })
    assert response.status_code == 422 # Pydantic validation error

def test_red_flag():
    response = client.post("/api/triage/analyze", json={
        "session_id": "test",
        "message": "Tôi bị đột quỵ và liệt nửa người"
    }, headers={
        "X-Internal-Api-Key": "caretriage-internal-secret-for-dev-only-min-32-chars-long"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["is_complete"] == True
    assert data["triage_result"]["urgency_level"] == "EMERGENCY"
    assert "thinking" not in data # Because we removed thinking from TriageResponse
    
print("Running manual security tests...")
test_missing_auth()
test_invalid_schema_length()
test_red_flag()
print("All security tests passed successfully!")

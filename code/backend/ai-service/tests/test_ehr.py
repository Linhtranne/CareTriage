import os
import sys
from unittest.mock import MagicMock, patch

# Force the local 'app' package to be loaded instead of global system site-packages
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../')))
os.environ["TESTING"] = "true"

# Mock Bio dependency which requires C++ build tools
sys.modules['Bio'] = MagicMock()
sys.modules['Bio.Entrez'] = MagicMock()

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.domain.schemas import EntityType
from app.application.usecases.ehr_extraction_use_case import EhrExtractionUseCase

client = TestClient(app)

def test_ehr_health():
    response = client.get("/api/ehr/health")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"

def test_extract_text_empty():
    response = client.post("/api/ehr/extract-text", json={"text": ""})
    assert response.status_code == 400
    assert "cannot be empty" in response.json()["detail"]

@pytest.mark.asyncio
@patch("app.api.ehr_routes.ehr_use_case.llm.generate_structured_data")
async def test_extract_text_success(mock_generate):
    mock_generate.return_value = {
      "entities": [
        {
          "entity_type": "MEDICATION",
          "entity_value": "Paracetamol",
          "normalized_value": "Paracetamol",
          "confidence_score": 0.95,
          "start_position": 0,
          "end_position": 11,
          "metadata": {"linked_dosage": "500mg"}
        }
      ]
    }

    response = client.post("/api/ehr/extract-text", json={"text": "Paracetamol 500mg"})
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert len(data["result"]["entities"]) == 1
    assert data["result"]["entities"][0]["entity_type"] == "MEDICATION"
    assert data["result"]["entities"][0]["metadata"]["linked_dosage"] == "500mg"

def test_extract_file_invalid_extension():
    files = {"file": ("test.exe", b"fake content", "application/octet-stream")}
    response = client.post("/api/ehr/extract-file", files=files)
    assert response.status_code == 400
    assert "not supported" in response.json()["detail"]

@pytest.mark.asyncio
@patch("app.api.ehr_routes.ehr_use_case._parse_pdf")
@patch("app.api.ehr_routes.ehr_use_case.llm.generate_structured_data")
async def test_extract_file_pdf_success(mock_generate, mock_parse_pdf):
    # Mock PDF parsing
    mock_parse_pdf.return_value = "Patient has fever."
    
    mock_generate.return_value = {"entities": [{"entity_type": "SYMPTOM", "entity_value": "fever", "confidence_score": 0.9}]}

    files = {"file": ("test.pdf", b"fake pdf content", "application/pdf")}
    response = client.post("/api/ehr/extract-file", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["result"]["raw_text"] == "Patient has fever."
    assert data["result"]["symptoms"][0]["entity_value"] == "fever"

def test_extract_file_empty():
    files = {"file": ("empty.txt", b"", "text/plain")}
    response = client.post("/api/ehr/extract-file", files=files)
    assert response.status_code == 400
    assert "File is empty" in response.json()["detail"]

def test_extract_file_oversized():
    # 11MB content
    large_content = b"a" * (11 * 1024 * 1024)
    files = {"file": ("large.pdf", large_content, "application/pdf")}
    response = client.post("/api/ehr/extract-file", files=files)
    assert response.status_code == 400
    assert "too large" in response.json()["detail"]

@pytest.mark.asyncio
@patch("app.api.ehr_routes.ehr_use_case.llm.generate_structured_data")
async def test_extract_text_gemini_error_safe_response(mock_generate):
    mock_generate.side_effect = RuntimeError("Internal Gemini API quota limit hit")

    response = client.post("/api/ehr/extract-text", json={"text": "Hello clinical note"})
    assert response.status_code == 500
    # Assert public response has safe detail rather than raw Exception message
    assert "Internal AI service error occurred during extraction" in response.json()["detail"]
    assert "Gemini" not in response.json()["detail"]

@pytest.mark.asyncio
@patch("app.api.ehr_routes.ehr_use_case._parse_pdf")
async def test_extract_file_parse_error_safe_response(mock_parse_pdf):
    # Mock parser throwing error
    mock_parse_pdf.side_effect = ValueError("pdfplumber corrupted stream decoding")

    files = {"file": ("test.pdf", b"fake pdf bytes", "application/pdf")}
    response = client.post("/api/ehr/extract-file", files=files)
    assert response.status_code == 500
    assert "Internal AI service error occurred during file extraction" in response.json()["detail"]
    assert "corrupted" not in response.json()["detail"]

def test_parse_entities_malformed_json_recovery():
    mock_llm = MagicMock()
    service = EhrExtractionUseCase(mock_llm)
    
    # 1. Invalid data type
    res1 = service._parse_entities(["not a dict"])
    assert res1 == []

    # 2. JSON is not dict/list structure
    res2 = service._parse_entities("just string")
    assert res2 == []

    # 3. Dict containing malformed entity missing required type/value, and a valid entity
    malformed_dict = {
      "entities": [
        {"entity_type": "BAD_TYPE", "entity_value": "some value"},
        {"entity_value": "no type"},
        {"entity_type": "MEDICATION"},
        {
          "entity_type": "SYMPTOM",
          "entity_value": "fever",
          "confidence_score": 0.85,
          "start_position": 10,
          "end_position": 15
        }
      ]
    }
    res3 = service._parse_entities(malformed_dict)
    # BAD_TYPE will fail EntityType enum validation and be skipped
    # missing fields will be skipped
    # Only valid SYMPTOM remains
    assert len(res3) == 1
    assert res3[0].entity_type == EntityType.SYMPTOM
    assert res3[0].entity_value == "fever"
    assert res3[0].confidence_score == 0.85

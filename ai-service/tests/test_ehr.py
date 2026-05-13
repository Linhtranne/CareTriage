import sys
from unittest.mock import MagicMock

# Mock Bio dependency which requires C++ build tools
sys.modules['Bio'] = MagicMock()
sys.modules['Bio.Entrez'] = MagicMock()

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app.main import app
from app.models.ehr_models import EntityType

client = TestClient(app)

def test_ehr_health():
    response = client.get("/api/ehr/health")
    assert response.status_code == 200
    assert response.json()["status"] == "UP"

def test_extract_text_empty():
    response = client.post("/api/ehr/extract-text", json={"text": ""})
    assert response.status_code == 400

@pytest.mark.asyncio
@patch("google.generativeai.GenerativeModel.generate_content_async")
async def test_extract_text_success(mock_generate):
    # Mock Gemini response (async)
    mock_response = MagicMock()
    mock_response.text = """
    {
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
    """
    
    async def async_return(*args, **kwargs):
        return mock_response
        
    mock_generate.side_effect = async_return

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
@patch("app.services.ehr_extraction_service.EHRExtractionService._parse_pdf")
@patch("google.generativeai.GenerativeModel.generate_content_async")
async def test_extract_file_pdf_success(mock_generate, mock_parse_pdf):
    # Mock PDF parsing
    mock_parse_pdf.return_value = "Patient has fever."
    
    # Mock Gemini response (async)
    mock_response = MagicMock()
    mock_response.text = '{"entities": [{"entity_type": "SYMPTOM", "entity_value": "fever", "confidence_score": 0.9}]}'
    
    async def async_return(*args, **kwargs):
        return mock_response
        
    mock_generate.side_effect = async_return

    files = {"file": ("test.pdf", b"fake pdf content", "application/pdf")}
    response = client.post("/api/ehr/extract-file", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["result"]["raw_text"] == "Patient has fever."
    assert data["result"]["symptoms"][0]["entity_value"] == "fever"

def test_clinical_note_model():
    from app.models.ehr_models import ClinicalNote, NoteType
    note = ClinicalNote(
        raw_text="Test clinical note",
        note_type=NoteType.PROGRESS,
        doctor_id="doc123"
    )
    assert note.raw_text == "Test clinical note"
    assert note.note_type == NoteType.PROGRESS
    assert note.created_at is not None

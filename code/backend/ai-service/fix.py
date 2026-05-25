import pathlib
import re

p = pathlib.Path('D:/CareTriage/code/backend/ai-service/tests/test_ehr.py')
text = p.read_text('utf-8')

# Fix test_parse_entities_malformed_json_recovery
text = text.replace('service = EhrExtractionUseCase()', 'mock_llm = MagicMock()\n    service = EhrExtractionUseCase(mock_llm)')

# Fix patch decorators for extract_text
text = text.replace(
    '@patch("app.services.ehr_extraction_service.EhrExtractionUseCase._generate_json")',
    '@patch("app.api.ehr_routes.ehr_use_case.llm.extract_ehr_entities")'
)
text = text.replace(
    '@patch("app.application.usecases.ehr_extraction_use_case.EhrExtractionUseCase._generate_json")',
    '@patch("app.api.ehr_routes.ehr_use_case.llm.extract_ehr_entities")'
)

# Fix patch decorators for extract_file
text = text.replace(
    '@patch("app.services.ehr_extraction_service.EhrExtractionUseCase._parse_pdf")',
    '@patch("app.api.ehr_routes.ehr_use_case._parse_pdf")'
)
text = text.replace(
    '@patch("app.application.usecases.ehr_extraction_use_case.EhrExtractionUseCase._parse_pdf")',
    '@patch("app.api.ehr_routes.ehr_use_case._parse_pdf")'
)

text = text.replace('mock_generate.return_value = \'{"entities": [{"entity_type": "SYMPTOM", "entity_value": "fever", "confidence_score": 0.9}]}\'', 'mock_generate.return_value = {"entities": [{"entity_type": "SYMPTOM", "entity_value": "fever", "confidence_score": 0.9}]}')

text = text.replace('mock_generate.return_value = """\n    {\n      "entities": [\n        {\n          "entity_type": "MEDICATION",\n          "entity_value": "Paracetamol",\n          "normalized_value": "Paracetamol",\n          "confidence_score": 0.95,\n          "start_position": 0,\n          "end_position": 11,\n          "metadata": {"linked_dosage": "500mg"}\n        }\n      ]\n    }\n    """', 'mock_generate.return_value = {\n      "entities": [\n        {\n          "entity_type": "MEDICATION",\n          "entity_value": "Paracetamol",\n          "normalized_value": "Paracetamol",\n          "confidence_score": 0.95,\n          "start_position": 0,\n          "end_position": 11,\n          "metadata": {"linked_dosage": "500mg"}\n        }\n      ]\n    }')

p.write_text(text, 'utf-8')

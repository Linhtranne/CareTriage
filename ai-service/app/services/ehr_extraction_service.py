import os
import json
import time
import io
from typing import Optional

import google.generativeai as genai

from app.models.ehr_models import (
    ExtractedEntity,
    ExtractionResult,
    EntityType,
)
from app.services.ner_prompt_templates import NER_SYSTEM_PROMPT, NER_EXTRACTION_PROMPT

from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))


class EHRExtractionService:
    def __init__(self):
        model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-pro")
        self.model = genai.GenerativeModel(
            model_name=model_name,
            system_instruction=NER_SYSTEM_PROMPT,
        )

    async def extract_from_text(self, text: str) -> ExtractionResult:
        """Extract medical entities from clinical note text using Gemini NER."""
        if not text or not text.strip():
            raise ValueError("Input text is empty")

        start_time = time.time()
        try:
            prompt = NER_EXTRACTION_PROMPT.format(clinical_text=text)
            # Use async call to avoid blocking the event loop
            response = await self.model.generate_content_async(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            
            if not response or not response.text:
                raise RuntimeError("Gemini model returned an empty response")
                
            raw_response = response.text.strip()
            # Handle potential markdown blocks
            if raw_response.startswith("```"):
                parts = raw_response.split("```")
                if len(parts) >= 3:
                    raw_response = parts[1]
                    if raw_response.startswith("json"):
                        raw_response = raw_response[4:]
                raw_response = raw_response.strip()

            entities = self._parse_entities(raw_response)
            if not entities and len(text.strip()) > 10:
                print(f"[EHRExtractionService] Warning: No entities extracted from text of length {len(text)}")

            categorized = self._categorize_entities(entities)
            processing_time = (time.time() - start_time) * 1000

            return ExtractionResult(
                raw_text=text,
                entities=entities,
                medications=categorized.get("MEDICATION", []),
                symptoms=categorized.get("SYMPTOM", []),
                conditions=categorized.get("CONDITION", []),
                dosages=categorized.get("DOSAGE", []),
                lab_tests=categorized.get("LAB_TEST", []),
                procedures=categorized.get("PROCEDURE", []),
                processing_time_ms=round(processing_time, 2),
            )
        except Exception as e:
            print(f"[EHRExtractionService] Error during extraction: {str(e)}")
            # Propagate error instead of returning empty success
            raise RuntimeError(f"AI Extraction failed: {str(e)}")

    async def extract_from_file(self, file_bytes: bytes, filename: str) -> ExtractionResult:
        """Extract entities from uploaded file (PDF or DOCX)."""
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        text = ""

        try:
            if ext == "pdf":
                text = self._parse_pdf(file_bytes)
            elif ext == "docx":
                text = self._parse_docx(file_bytes)
            elif ext == "txt":
                text = file_bytes.decode("utf-8", errors="ignore")
            else:
                raise ValueError(f"Unsupported file extension: .{ext}. Only .pdf, .docx, and .txt are supported.")
        except Exception as e:
            print(f"[EHRExtractionService] File Parse Error ({filename}): {str(e)}")
            raise ValueError(f"Failed to parse {ext.upper()} file: {str(e)}")

        if not text or not text.strip():
            raise ValueError(f"No readable text found in file: {filename}")

        return await self.extract_from_text(text)

    def _parse_pdf(self, file_bytes: bytes) -> str:
        """Extract text from PDF file bytes."""
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                pages = [page.extract_text() or "" for page in pdf.pages]
                text = "\n\n".join(pages)
                if text.strip():
                    return text
        except Exception as e:
            print(f"pdfplumber failed: {e}")

        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n\n".join(pages)
            return text
        except Exception as e:
            print(f"PyPDF2 failed: {e}")
            raise RuntimeError("Failed to extract text from PDF using available parsers")

    def _parse_docx(self, file_bytes: bytes) -> str:
        """Extract text from Word DOCX file bytes."""
        try:
            from docx import Document
            doc = Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(paragraphs)
        except Exception as e:
            print(f"python-docx failed: {e}")
            raise RuntimeError("Failed to extract text from DOCX file")

    def _parse_entities(self, raw_json: str) -> list[ExtractedEntity]:
        """Parse JSON response into ExtractedEntity list."""
        try:
            data = json.loads(raw_json)
            entities_data = data.get("entities", []) if isinstance(data, dict) else data
            if not isinstance(entities_data, list):
                print(f"[EHRExtractionService] Invalid JSON structure: expected list of entities")
                return []

            entities = []
            for item in entities_data:
                try:
                    if not item.get("entity_type") or not item.get("entity_value"):
                        continue
                        
                    entity = ExtractedEntity(
                        entity_type=EntityType(item["entity_type"].upper()),
                        entity_value=item["entity_value"],
                        normalized_value=item.get("normalized_value"),
                        confidence_score=max(0.0, min(1.0, float(item.get("confidence_score", 0.8)))),
                        start_position=item.get("start_position"),
                        end_position=item.get("end_position"),
                        metadata=item.get("metadata") or {},
                    )
                    entities.append(entity)
                except Exception as e:
                    print(f"Skipping malformed entity entry: {e}")
                    continue

            return entities
        except json.JSONDecodeError as e:
            print(f"JSON Decode Error in model output: {e}\nRaw output starts with: {raw_json[:50]}...")
            return []

    def _categorize_entities(
        self, entities: list[ExtractedEntity]
    ) -> dict[str, list[ExtractedEntity]]:
        """Group entities by their type."""
        categorized: dict[str, list[ExtractedEntity]] = {}
        for entity in entities:
            key = entity.entity_type.value
            categorized.setdefault(key, []).append(entity)
        return categorized

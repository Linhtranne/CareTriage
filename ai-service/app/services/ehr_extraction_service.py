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

genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))


class EHRExtractionService:
    def __init__(self):
        self.model = genai.GenerativeModel(
            model_name="gemini-2.0-flash",
            system_instruction=NER_SYSTEM_PROMPT,
        )

    async def extract_from_text(self, text: str) -> ExtractionResult:
        """Extract medical entities from clinical note text using Gemini NER."""
        start_time = time.time()

        prompt = NER_EXTRACTION_PROMPT.format(clinical_text=text)
        response = self.model.generate_content(prompt)
        raw_response = response.text.strip()

        # Clean JSON response
        raw_response = (
            raw_response
            .removeprefix("```json")
            .removeprefix("```")
            .removesuffix("```")
            .strip()
        )

        entities = self._parse_entities(raw_response)
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

    async def extract_from_file(self, file_bytes: bytes, filename: str) -> ExtractionResult:
        """Extract entities from uploaded file (PDF or DOCX)."""
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

        if ext == "pdf":
            text = self._parse_pdf(file_bytes)
        elif ext in ("docx", "doc"):
            text = self._parse_docx(file_bytes)
        else:
            text = file_bytes.decode("utf-8", errors="ignore")

        if not text.strip():
            return ExtractionResult(
                raw_text="",
                error="Could not extract text from file",
            )

        return await self.extract_from_text(text)

    def _parse_pdf(self, file_bytes: bytes) -> str:
        """Extract text from PDF file bytes."""
        try:
            import pdfplumber
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                pages = [page.extract_text() or "" for page in pdf.pages]
                return "\n\n".join(pages)
        except ImportError:
            pass

        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            pages = [page.extract_text() or "" for page in reader.pages]
            return "\n\n".join(pages)
        except ImportError:
            return ""

    def _parse_docx(self, file_bytes: bytes) -> str:
        """Extract text from Word DOCX file bytes."""
        try:
            from docx import Document
            doc = Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(paragraphs)
        except ImportError:
            return ""

    def _parse_entities(self, raw_json: str) -> list[ExtractedEntity]:
        """Parse JSON response into ExtractedEntity list."""
        try:
            data = json.loads(raw_json)
            entities_data = data.get("entities", []) if isinstance(data, dict) else data

            entities = []
            for item in entities_data:
                try:
                    entity = ExtractedEntity(
                        entity_type=EntityType(item.get("entity_type", "SYMPTOM")),
                        entity_value=item.get("entity_value", ""),
                        normalized_value=item.get("normalized_value"),
                        confidence_score=float(item.get("confidence_score", 0.8)),
                        start_position=item.get("start_position"),
                        end_position=item.get("end_position"),
                        metadata=item.get("metadata"),
                    )
                    entities.append(entity)
                except (ValueError, KeyError):
                    continue

            return entities
        except json.JSONDecodeError:
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

import json
import time
import io
import logging
from typing import Optional

from google import genai
from google.genai import types

from app.core.config import get_settings

from app.models.ehr_models import (
    ExtractedEntity,
    ExtractionResult,
    EntityType,
)
from app.services.ner_prompt_templates import NER_SYSTEM_PROMPT, NER_EXTRACTION_PROMPT

logger = logging.getLogger(__name__)
settings = get_settings()
gemini_client = genai.Client(api_key=settings["gemini_api_key"])


class EHRExtractionService:
    def __init__(self):
        self.model_name = settings["gemini_model_name"]

    async def _generate_json(self, prompt: str) -> str:
        response = await gemini_client.aio.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=NER_SYSTEM_PROMPT,
                response_mime_type="application/json",
            ),
        )
        return response.text or ""

    async def extract_from_text(self, text: str) -> ExtractionResult:
        """Extract medical entities from clinical note text using Gemini NER."""
        if not text or not text.strip():
            raise ValueError("Input text is empty")

        start_time = time.time()
        try:
            prompt = NER_EXTRACTION_PROMPT.format(clinical_text=text)
            response_text = await self._generate_json(prompt)
            if not response_text:
                raise RuntimeError("Gemini model returned an empty response")

            raw_response = response_text.strip()
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
                logger.warning(f"No entities extracted from text of length {len(text)}")

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
            logger.error(f"Error during EHR extraction: {str(e)}")
            raise RuntimeError(f"AI Extraction failed: {str(e)}")

    async def extract_from_file(self, file_bytes: bytes, filename: str) -> ExtractionResult:
        """Extract entities from uploaded file (PDF, DOC/DOCX, or TXT)."""
        ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
        text = ""

        try:
            if ext == "pdf":
                text = self._parse_pdf(file_bytes)
            elif ext in {"doc", "docx"}:
                text = self._parse_docx(file_bytes)
            elif ext == "txt":
                text = file_bytes.decode("utf-8", errors="ignore")
            else:
                raise ValueError(f"Unsupported file extension: .{ext}. Only .pdf, .doc, .docx, and .txt are supported.")
        except Exception as e:
            logger.error(f"File Parse Error for extension .{ext}: {str(e)}")
            raise ValueError(f"Failed to parse {ext.upper()} file: {str(e)}")

        if not text or not text.strip():
            raise ValueError("No readable text found in file")

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
            logger.warning(f"pdfplumber failed: {str(e)}")

        try:
            from PyPDF2 import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            pages = [page.extract_text() or "" for page in reader.pages]
            text = "\n\n".join(pages)
            return text
        except Exception as e:
            logger.warning(f"PyPDF2 failed: {str(e)}")
            raise RuntimeError("Failed to extract text from PDF using available parsers")

    def _parse_docx(self, file_bytes: bytes) -> str:
        """Extract text from Word DOCX file bytes."""
        try:
            from docx import Document
            doc = Document(io.BytesIO(file_bytes))
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            return "\n".join(paragraphs)
        except Exception as e:
            logger.warning(f"python-docx failed: {str(e)}")
            raise RuntimeError("Failed to extract text from DOCX file")

    def _parse_entities(self, raw_json: str) -> list[ExtractedEntity]:
        """Parse JSON response into ExtractedEntity list."""
        try:
            data = json.loads(raw_json)
            entities_data = data.get("entities", []) if isinstance(data, dict) else data
            if not isinstance(entities_data, list):
                logger.warning("Invalid JSON structure: expected list of entities")
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
                    logger.warning(f"Skipping malformed entity entry: {str(e)}")
                    continue

            return entities
        except json.JSONDecodeError as e:
            logger.error(f"JSON Decode Error in model output: {str(e)}")
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

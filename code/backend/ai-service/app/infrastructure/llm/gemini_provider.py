import logging
import re
from typing import Any, AsyncIterator, List, Optional, Type

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.domain.interfaces import ILlmProvider, ITelemetryClient
from app.shared.config import get_settings
from app.shared.errors import (
    AIConnectionError,
    AIInvalidKey,
    AIQuotaExceeded,
    AISafetyBlocked,
)
from app.shared.log_sanitizer import sanitize_error

logger = logging.getLogger(__name__)
settings = get_settings()


class GeminiProvider(ILlmProvider):
    def __init__(self, telemetry: Optional[ITelemetryClient] = None):
        self.gemini_client = genai.Client(api_key=settings["gemini_api_key"])
        self.model_name = settings["gemini_model_name"]
        self.temperature = settings.get("gemini_temperature", 0.2)
        self.top_p = settings.get("gemini_top_p", 0.8)
        self.max_tokens = settings.get("gemini_max_tokens", 1024)
        from app.infrastructure.telemetry.noop_telemetry import NoOpTelemetryClient

        self.telemetry = telemetry or NoOpTelemetryClient()

    def _handle_gemini_error(self, e: Exception):
        error_type = type(e).__name__
        err_msg = str(e).lower()

        if getattr(e, "code", None) == 429 or "429" in err_msg or "quota" in err_msg:
            raise AIQuotaExceeded(
                "Hệ thống đang bận do vượt quá giới hạn lượt gọi. Vui lòng thử lại sau."
            )
        elif (
            getattr(e, "code", None) in (401, 403)
            or "401" in err_msg
            or "403" in err_msg
        ):
            raise AIInvalidKey("Lỗi xác thực API. Vui lòng liên hệ quản trị viên.")
        elif "safety" in err_msg:
            raise AISafetyBlocked(
                "Nội dung không phù hợp hoặc bị chặn bởi bộ lọc an toàn."
            )
        else:
            raise AIConnectionError(
                f"Lỗi kết nối dịch vụ AI. System Error: {error_type}"
            )

    async def generate_text(
        self,
        system_prompt: str,
        user_prompt: str,
        history: Optional[List[str]] = None,
        context: Optional[str] = None,
        attachments: Optional[List[dict]] = None,
        session_id: str = "system",
    ) -> str:
        """Generate a text response from the LLM."""
        import time

        self.telemetry.track_llm_call_started(session_id, self.model_name)
        start_time = time.time()
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=self.temperature,
            top_p=self.top_p,
            max_output_tokens=self.max_tokens,
        )

        content_parts: list[Any] = []
        prompt_sections = []
        if history:
            prompt_sections.append("Lịch sử hội thoại:\n" + "\n".join(history))

        if context:
            prompt_sections.append(
                f"Dựa trên thông tin y khoa từ hệ thống (RAG):\n{context}\n\n"
            )

        prompt_sections.append(user_prompt)

        if attachments:
            for att in attachments:
                if att.get("type") == "image":
                    import base64

                    try:
                        img_data = base64.b64decode(att["data"])
                        content_parts.append(
                            types.Part.from_bytes(
                                data=img_data,
                                mime_type=att.get("mime_type", "image/jpeg"),
                            )
                        )
                    except Exception as e:
                        logger.error(f"Error decoding image: {sanitize_error(e)}")

        content_parts.insert(0, "\n\n".join(prompt_sections))

        try:
            response = self.gemini_client.models.generate_content(
                model=self.model_name,
                contents=content_parts,
                config=config,
            )
            latency_ms = (time.time() - start_time) * 1000

            # Extract tokens if available
            tokens = 0
            if hasattr(response, "usage_metadata") and response.usage_metadata:
                tokens = getattr(response.usage_metadata, "total_token_count", 0)

            reply_text = response.text or ""
            if not reply_text:
                raise AISafetyBlocked("AI response was blocked by safety filters.")

            self.telemetry.track_llm_call_completed(
                session_id, self.model_name, latency_ms, tokens
            )
        except Exception as e:
            self.telemetry.track_llm_call_failed(
                session_id, self.model_name, sanitize_error(e)
            )
            self._handle_gemini_error(e)

        # Clean markers from display text
        reply_text = re.sub(
            r"<thinking>.*?</thinking>", "", reply_text, flags=re.DOTALL
        ).strip()
        reply_text = reply_text.replace("[TRIAGE_COMPLETE]", "")
        reply_text = re.sub(r"\[CONFIDENCE_SCORE:.*?\]", "", reply_text)
        reply_text = re.sub(r"\[INFECTION_CONTROL:.*?\]", "", reply_text)

        return reply_text.strip()

    async def generate_text_stream(
        self,
        system_prompt: str,
        user_prompt: str,
        history: Optional[List[str]] = None,
        context: Optional[str] = None,
        attachments: Optional[List[dict]] = None,
        session_id: str = "system",
    ) -> AsyncIterator[str]:
        """Stream text chunks from Gemini as they arrive."""
        import time

        self.telemetry.track_llm_call_started(session_id, self.model_name)
        start_time = time.time()
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=self.temperature,
            top_p=self.top_p,
            max_output_tokens=self.max_tokens,
        )

        content_parts: list[Any] = []
        prompt_sections = []
        if history:
            prompt_sections.append("Lịch sử hội thoại:\n" + "\n".join(history))
        if context:
            prompt_sections.append(
                f"Dựa trên thông tin y khoa từ hệ thống (RAG):\n{context}\n\n"
            )
        prompt_sections.append(user_prompt)

        if attachments:
            for att in attachments:
                if att.get("type") == "image":
                    import base64

                    try:
                        img_data = base64.b64decode(att["data"])
                        content_parts.append(
                            types.Part.from_bytes(
                                data=img_data,
                                mime_type=att.get("mime_type", "image/jpeg"),
                            )
                        )
                    except Exception as e:
                        logger.error(f"Error decoding image: {sanitize_error(e)}")

        content_parts.insert(0, "\n\n".join(prompt_sections))

        try:
            stream = self.gemini_client.models.generate_content_stream(
                model=self.model_name,
                contents=content_parts,
                config=config,
            )

            for chunk in stream:
                chunk_text = getattr(chunk, "text", None) or ""
                chunk_text = re.sub(
                    r"<thinking>.*?</thinking>", "", chunk_text, flags=re.DOTALL
                )
                chunk_text = chunk_text.replace("[TRIAGE_COMPLETE]", "")
                chunk_text = re.sub(r"\[CONFIDENCE_SCORE:.*?\]", "", chunk_text)
                chunk_text = re.sub(r"\[INFECTION_CONTROL:.*?\]", "", chunk_text)
                if chunk_text:
                    yield chunk_text

            latency_ms = (time.time() - start_time) * 1000
            self.telemetry.track_llm_call_completed(
                session_id, self.model_name, latency_ms, 0
            )
        except Exception as e:
            self.telemetry.track_llm_call_failed(
                session_id, self.model_name, sanitize_error(e)
            )
            self._handle_gemini_error(e)

    async def generate_structured_data(
        self,
        system_prompt: str,
        user_prompt: str,
        output_schema: Type[BaseModel],
        context: Optional[str] = None,
        session_id: str = "system",
    ) -> dict:
        """Generate a structured JSON output matching the provided Pydantic schema."""
        import time

        self.telemetry.track_llm_call_started(session_id, self.model_name)
        start_time = time.time()
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.0,  # Structured output usually needs low temperature
            top_p=self.top_p,
            max_output_tokens=self.max_tokens,
            response_mime_type="application/json",
            response_schema=output_schema,
        )

        contents = user_prompt
        if context:
            contents = f"Dựa trên thông tin y khoa từ hệ thống (RAG):\n{context}\n\n{user_prompt}"

        for attempt in range(3):
            try:
                response = self.gemini_client.models.generate_content(
                    model=self.model_name,
                    contents=contents,
                    config=config,
                )
                latency_ms = (time.time() - start_time) * 1000

                # Extract tokens if available
                tokens = 0
                if hasattr(response, "usage_metadata") and response.usage_metadata:
                    tokens = getattr(response.usage_metadata, "total_token_count", 0)

                text = (response.text or "").strip()

                # Repair markdown block if present
                if text.startswith("```"):
                    lines = text.split("\n")
                    if lines[0].startswith("```json") or lines[0].startswith("```"):
                        lines = lines[1:]
                    if lines and lines[-1].strip() == "```":
                        lines = lines[:-1]
                    text = "\n".join(lines).strip()

                # Validate with Pydantic
                result = output_schema.model_validate_json(text)

                self.telemetry.track_llm_call_completed(
                    session_id, self.model_name, latency_ms, tokens
                )
                return result.model_dump()

            except Exception as e:
                logger.warning(
                    f"Structured output attempt {attempt + 1} failed: {sanitize_error(e)}"
                )
                if attempt == 2:
                    self.telemetry.track_llm_call_failed(
                        session_id, self.model_name, sanitize_error(e)
                    )
                    self._handle_gemini_error(e)

        raise AIConnectionError("Structured output generation failed.")

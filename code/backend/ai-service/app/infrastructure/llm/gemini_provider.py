import json
import logging
import re
from typing import List, Type, Optional
from google import genai
from google.genai import types
from pydantic import BaseModel

from app.domain.interfaces import ILlmProvider
from app.shared.config import get_settings
from app.shared.errors import (
    AIQuotaExceeded, AIInvalidKey, AISafetyBlocked, AIConnectionError
)

logger = logging.getLogger(__name__)
settings = get_settings()

class GeminiProvider(ILlmProvider):
    def __init__(self):
        self.gemini_client = genai.Client(api_key=settings["gemini_api_key"])
        self.model_name = settings["gemini_model_name"]
        self.temperature = settings.get("gemini_temperature", 0.2)
        self.top_p = settings.get("gemini_top_p", 0.8)
        self.max_tokens = settings.get("gemini_max_tokens", 1024)

    def _handle_gemini_error(self, e: Exception):
        err_msg = str(e)
        if "429" in err_msg or "quota" in err_msg.lower():
            raise AIQuotaExceeded("Hệ thống đang bận do vượt quá giới hạn lượt gọi. Vui lòng thử lại sau.")
        elif "401" in err_msg or "403" in err_msg:
            raise AIInvalidKey("Lỗi xác thực API. Vui lòng liên hệ quản trị viên.")
        elif "safety" in err_msg.lower():
            raise AISafetyBlocked("Nội dung không phù hợp hoặc bị chặn bởi bộ lọc an toàn.")
        else:
            raise AIConnectionError(f"Lỗi kết nối dịch vụ AI: {err_msg}")

    async def generate_text(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        history: Optional[List[str]] = None, 
        context: Optional[str] = None, 
        attachments: Optional[List[dict]] = None
    ) -> str:
        """Generate a text response from the LLM."""
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=self.temperature,
            top_p=self.top_p,
            max_output_tokens=self.max_tokens,
        )
        
        content_parts = []
        prompt_sections = []
        if history:
            prompt_sections.append("Lịch sử hội thoại:\n" + "\n".join(history))
            
        if context:
            prompt_sections.append(f"Dựa trên thông tin y khoa từ hệ thống (RAG):\n{context}\n\n")

        prompt_sections.append(user_prompt)
        
        if attachments:
            for att in attachments:
                if att.get("type") == "image":
                    import base64
                    try:
                        img_data = base64.b64decode(att["data"])
                        content_parts.append(types.Part.from_bytes(
                            data=img_data,
                            mime_type=att.get("mime_type", "image/jpeg"),
                        ))
                    except Exception as e:
                        logger.error(f"Error decoding image: {e}")
        
        content_parts.insert(0, "\n\n".join(prompt_sections))

        try:
            response = self.gemini_client.models.generate_content(
                model=self.model_name,
                contents=content_parts,
                config=config,
            )
            reply_text = response.text or ""
            if not reply_text:
                raise AISafetyBlocked("AI response was blocked by safety filters.")
        except Exception as e:
            self._handle_gemini_error(e)
            
        # Clean markers from display text
        reply_text = re.sub(r"<thinking>.*?</thinking>", "", reply_text, flags=re.DOTALL).strip()
        reply_text = reply_text.replace("[TRIAGE_COMPLETE]", "")
        reply_text = re.sub(r"\[CONFIDENCE_SCORE:.*?\]", "", reply_text)
        reply_text = re.sub(r"\[INFECTION_CONTROL:.*?\]", "", reply_text)
        
        return reply_text.strip()

    async def generate_structured_data(
        self, 
        system_prompt: str, 
        user_prompt: str, 
        output_schema: Type[BaseModel], 
        context: Optional[str] = None
    ) -> dict:
        """Generate a structured JSON output matching the provided Pydantic schema."""
        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            temperature=0.0, # Structured output usually needs low temperature
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
                text = response.text.strip()
                
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
                return result.model_dump()
                
            except Exception as e:
                logger.warning(f"Structured output attempt {attempt+1} failed: {e}")
                if attempt == 2:
                    self._handle_gemini_error(e)

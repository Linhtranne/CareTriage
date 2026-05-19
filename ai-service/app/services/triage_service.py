import google.generativeai as genai

from app.core.config import get_settings
from app.services.prompt_templates import SYSTEM_PROMPT

settings = get_settings()
genai.configure(api_key=settings["gemini_api_key"])


class TriageService:
    def __init__(self):
        self.generation_config = {
            "temperature": settings["gemini_temperature"],
            "top_p": settings["gemini_top_p"],
            "max_output_tokens": settings["gemini_max_tokens"],
        }

        self.model = genai.GenerativeModel(
            model_name=settings["gemini_model_name"],
            system_instruction=SYSTEM_PROMPT,
            generation_config=self.generation_config
        )
        self.sessions: dict = {}

    async def analyze(self, session_id: str, message: str, history: list[dict], context: str = "", attachments: list[dict] = None, metadata: dict = None) -> dict:
        """Process a triage message and return AI response."""
        import re
        RED_FLAG_PATTERNS = [
            r"\bđột quỵ\b",
            r"\bméo miệng\b",
            r"\bnói ngọng\b",
            r"\byếu.*(tay|chân|nửa người)\b",
            r"\bliệt.*(tay|chân|nửa người)\b",
            r"\bđau ngực.*(tay trái|hàm|lưng)\b",
            r"\bkhó thở (nặng|dữ dội|không thở được)\b",
            r"\bmất ý thức\b",
            r"\bco giật\b",
            r"\bnhồi máu\b",
        ]
        
        message_lower = message.lower()
        for pattern in RED_FLAG_PATTERNS:
            if re.search(pattern, message_lower):
                return {
                    "reply": "Các dấu hiệu bạn mô tả có thể liên quan tình trạng cấp cứu. Vui lòng gọi 115 hoặc đến khoa Cấp cứu gần nhất ngay lập tức. Không tự lái xe.",
                    "thinking": "Deterministic red-flag filter triggered by regex match.",
                    "is_complete": True,
                    "triage_result": {
                      "suggested_department": "Cấp cứu",
                      "urgency_level": "EMERGENCY",
                      "possible_conditions": ["Tình trạng cấp cứu cần bác sĩ đánh giá ngay"],
                      "suggested_actions": ["Gọi 115", "Đến khoa Cấp cứu gần nhất"],
                      "confidence_score": 1.0
                    }
                }
                
        # Build conversation history for Gemini
        gemini_history = []
        for msg in history:
            role = "user" if msg.get("role") == "user" else "model"
            gemini_history.append({"role": role, "parts": [msg["content"]]})

        # Create or resume chat session
        chat = self.model.start_chat(history=gemini_history)
        
        # Prepare content parts (Text + Context + Attachments + Metadata)
        content_parts = []
        
        if metadata:
            meta_str = f"[PATIENT PROFILE] Age: {metadata.get('age')}, Gender: {metadata.get('gender')}, Onset: {metadata.get('onset')}\n\n"
            content_parts.append(meta_str)

        if context:
            content_parts.append(f"Dựa trên thông tin y khoa từ hệ thống (RAG):\n{context}\n\n")
            
        content_parts.append(message)
        
        # Add attachments if provided (base64 images/docs)
        if attachments:
            for att in attachments:
                if att.get("type") == "image":
                    import base64
                    try:
                        img_data = base64.b64decode(att["data"])
                        content_parts.append({"mime_type": att.get("mime_type", "image/jpeg"), "data": img_data})
                    except Exception as e:
                        print(f"Error decoding image: {e}")
        
        from app.services.exceptions import (
            AIQuotaExceeded, AIInvalidKey, AISafetyBlocked, AIConnectionError
        )
        try:
            response = chat.send_message(content_parts)
            
            # Check if response was blocked by safety settings
            if not response.candidates or not response.candidates[0].content.parts:
                raise AISafetyBlocked("AI response was blocked by safety filters.")
                
            reply_text = response.text
        except Exception as e:
            err_msg = str(e)
            if "429" in err_msg or "quota" in err_msg.lower():
                raise AIQuotaExceeded("Hệ thống đang bận do vượt quá giới hạn lượt gọi. Vui lòng thử lại sau.")
            elif "401" in err_msg or "403" in err_msg:
                raise AIInvalidKey("Lỗi xác thực API. Vui lòng liên hệ quản trị viên.")
            elif "safety" in err_msg.lower():
                raise AISafetyBlocked("Nội dung không phù hợp hoặc bị chặn bởi bộ lọc an toàn.")
            else:
                raise AIConnectionError(f"Lỗi kết nối dịch vụ AI: {err_msg}")
        
        # Extract thinking if present
        thinking = ""
        if "<thinking>" in reply_text and "</thinking>" in reply_text:
            start = reply_text.find("<thinking>") + len("<thinking>")
            end = reply_text.find("</thinking>")
            thinking = reply_text[start:end].strip()
            reply_text = reply_text[:reply_text.find("<thinking>")] + reply_text[reply_text.find("</thinking>") + len("</thinking>"):]
            reply_text = reply_text.strip()

        # Check if triage is complete (AI includes [TRIAGE_COMPLETE] marker)
        is_complete = "[TRIAGE_COMPLETE]" in reply_text
        triage_result = None

        if is_complete:
            # Clean up all technical markers from the display text
            import re
            reply_text = reply_text.replace("[TRIAGE_COMPLETE]", "")
            reply_text = re.sub(r"\[CONFIDENCE_SCORE:.*?\]", "", reply_text)
            reply_text = re.sub(r"\[INFECTION_CONTROL:.*?\]", "", reply_text)
            reply_text = reply_text.strip()
            
            triage_result = await self._extract_triage_result(reply_text)

        return {
            "reply": reply_text,
            "thinking": thinking,
            "is_complete": is_complete,
            "triage_result": triage_result,
        }

    async def _extract_triage_result(self, text: str) -> dict:
        """Extract structured triage data from AI response using JSON mode."""
        prompt = f"""Extract the following clinical triage data into JSON:
- suggested_department: string (Vietnamese name)
- urgency_level: string (LOW, MEDIUM, HIGH, or EMERGENCY)
- possible_conditions: string array
- suggested_actions: string array
- confidence_score: float (0.0 to 1.0)
- summary: string (Vietnamese, concise 2-3 sentences summarizing symptoms and history for medical record)
- infection_control: boolean (true if [INFECTION_CONTROL: YES] was in the original text)

Text to analyze: {text}"""

        response = self.model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        try:
            import json
            return json.loads(response.text.strip())
        except Exception:
            return {
                "suggested_department": "Nội tổng quát",
                "urgency_level": "MEDIUM",
                "possible_conditions": [],
                "suggested_actions": ["Theo dõi thêm tại nhà", "Khám bác sĩ nếu triệu chứng nặng hơn"],
                "confidence_score": 0.5,
                "summary": text[:200],
                "infection_control": False
            }

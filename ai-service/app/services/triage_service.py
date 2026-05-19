import google.generativeai as genai
import re
import json
import logging
from typing import Dict, Any, List, Optional

from app.core.config import get_settings
from app.services.prompt_templates import SYSTEM_PROMPT
from app.services.red_flag_detector import RedFlagDetector
from app.services.exceptions import (
    AIQuotaExceeded, AIInvalidKey, AISafetyBlocked, AIConnectionError
)

logger = logging.getLogger(__name__)
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

    async def analyze(
        self,
        session_id: str,
        message: str,
        history: List[dict],
        context: str = "",
        attachments: List[dict] = None,
        metadata: dict = None
    ) -> Dict[str, Any]:
        """Process a triage message and return step-by-step intake AI response."""
        # 1. Deterministic red-flag screening bypass
        red_flag_result = RedFlagDetector.detect_red_flags(message)
        if red_flag_result:
            logger.info(f"[RED_FLAG] Session {session_id} bypassed Gemini due to red-flag match.")
            red_flag_result["intake_complete"] = True
            red_flag_result["red_flag_detected"] = True
            return red_flag_result

        # 2. Build conversation history for Gemini
        gemini_history = []
        history_limit = history[-15:] if len(history) > 15 else history
        for msg in history_limit:
            role = "user" if msg.get("role") == "user" else "model"
            content = msg.get("content", "")
            if len(content) > 1000:
                content = content[:1000] + "... (truncated)"
            gemini_history.append({"role": role, "parts": [content]})

        # Create or resume chat session
        chat = self.model.start_chat(history=gemini_history)
        
        # Prepare content parts
        content_parts = []
        if metadata:
            meta_str = f"[PATIENT PROFILE] Age: {metadata.get('age')}, Gender: {metadata.get('gender')}, Onset: {metadata.get('onset')}\n\n"
            content_parts.append(meta_str)

        if context:
            content_parts.append(f"Dựa trên thông tin y khoa từ hệ thống (RAG):\n{context}\n\n")
            
        content_parts.append(message)
        
        if attachments:
            for att in attachments:
                if att.get("type") == "image":
                    import base64
                    try:
                        img_data = base64.b64decode(att["data"])
                        content_parts.append({
                            "mime_type": att.get("mime_type", "image/jpeg"),
                            "data": img_data
                        })
                    except Exception as e:
                        logger.error(f"Error decoding image: {e}")
        
        try:
            response = chat.send_message(content_parts)
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
        
        # Strip CoT thinking markers
        reply_text = re.sub(r"<thinking>.*?</thinking>", "", reply_text, flags=re.DOTALL).strip()

        # Clean markers from display text
        reply_text = reply_text.replace("[TRIAGE_COMPLETE]", "")
        reply_text = re.sub(r"\[CONFIDENCE_SCORE:.*?\]", "", reply_text)
        reply_text = re.sub(r"\[INFECTION_CONTROL:.*?\]", "", reply_text)
        reply_text = reply_text.strip()

        return {
            "reply": reply_text,
            "clinical_reasoning_summary": "",
            "is_complete": False,
            "intake_complete": False,
            "red_flag_detected": False,
            "triage_result": None,
        }

    async def recommend(
        self,
        session_id: str,
        message: str,
        history: List[dict],
        context: str = ""
    ) -> Dict[str, Any]:
        """
        Generate a final structured triage recommendation based on conversation history.
        Evaluates intake completeness, missing information, and suggested specialty.
        """
        # 1. First check if any emergency red flags exist in the patient's state
        combined_text = message + "\n" + "\n".join([m.get("content", "") for m in history if m.get("role") == "user"])
        red_flag_result = RedFlagDetector.detect_red_flags(combined_text)
        if red_flag_result:
            logger.info(f"[RED_FLAG_RECOMMEND] Session {session_id} triggered red-flag bypass in recommendation.")
            tresult = red_flag_result["triage_result"]
            return {
                "intake_complete": True,
                "recommendation_ready": True,
                "missing_information": [],
                "reply": red_flag_result["reply"],
                "triage_result": tresult
            }

        # 2. Build complete conversation context
        conversation_context = ""
        for msg in history:
            role = "Patient" if msg.get("role") == "user" else "Assistant"
            conversation_context += f"{role}: {msg.get('content')}\n"
        conversation_context += f"Patient: {message}\n"

        # 3. Request structured evaluation from Gemini
        prompt = f"""Bạn là một chuyên viên điều phối lâm sàng của bệnh viện. Hãy phân tích cuộc hội thoại triệu chứng dưới đây để đưa ra khuyến nghị triage chính xác:

HỘI THOẠI TRIỆU CHỨNG:
{conversation_context}

Y KHOA THAM KHẢO (RAG):
{context}

YÊU CẦU:
1. Xác định xem thông tin triệu chứng thu thập được đã đủ rõ ràng để định hướng chuyên khoa cụ thể có độ tin cậy cao hay chưa. 
   - Đặt "intake_complete" là true chỉ khi cuộc hội thoại cung cấp đủ: Triệu chứng chính, thời gian khởi phát/diễn tiến, mức độ nghiêm trọng, và các dấu hiệu đi kèm.
   - Nếu thông tin quá mơ hồ (ví dụ: chỉ nói "tôi bị mệt", "tôi hơi đau"), hãy đặt "intake_complete" là false.
2. Liệt kê các thông tin triệu chứng chính còn thiếu vào danh sách "missing_information" (ví dụ: "Thời gian xuất hiện triệu chứng", "Mức độ đau/sốt/khó thở", "Bệnh nền hoặc thuốc đang dùng").
3. Gợi ý chuyên khoa phù hợp nhất:
   - suggested_department: Tên tiếng Việt của chuyên khoa (chỉ được chọn trong danh sách whitelist: Nội tổng quát, Tai Mũi Họng, Tim mạch, Nhi khoa, Sản phụ khoa, Da liễu, Tiêu hóa, Cơ xương khớp, Thần kinh).
   - urgency_level: LOW, MEDIUM, HIGH.
   - confidence_score: Điểm tin cậy từ 0.0 đến 1.0. Nếu intake_complete là false, confidence_score PHẢI dưới 0.6.
   - possible_conditions: Danh sách các tình trạng/bệnh có thể nghĩ đến.
   - suggested_actions: Danh sách hành động khuyến nghị tiếp theo cho bệnh nhân.
   - clinical_reasoning_summary: 1-2 câu tóm tắt lý do chuyên môn định hướng chuyên khoa này. TUYỆT ĐỐI KHÔNG chứa suy nghĩ thầm kín hay tag <thinking>.
   - summary: Tóm tắt ngắn gọn bệnh sử để ghi hồ sơ bệnh án.

TRẢ VỀ KẾT QUẢ DƯỚI DẠNG JSON KHÔNG CHỨA BẤT KỲ GIẢI THÍCH NÀO KHÁC, KHỚP VỚI SCHEMA SAU:
{{
  "intake_complete": boolean,
  "missing_information": ["string"],
  "suggested_department": "string",
  "urgency_level": "string",
  "confidence_score": float,
  "possible_conditions": ["string"],
  "suggested_actions": ["string"],
  "clinical_reasoning_summary": "string",
  "summary": "string",
  "infection_control": boolean
}}"""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            data = json.loads(response.text.strip())
        except Exception as e:
            logger.error(f"Error generating recommendation from Gemini: {e}. Falling back to default.")
            data = {
                "intake_complete": False,
                "missing_information": ["Thông tin triệu chứng cụ thể"],
                "suggested_department": "Nội tổng quát",
                "urgency_level": "MEDIUM",
                "confidence_score": 0.3,
                "possible_conditions": [],
                "suggested_actions": ["Đặt lịch hẹn khám để được đánh giá trực tiếp"],
                "clinical_reasoning_summary": "Lỗi kết nối hoặc xử lý dữ liệu từ mô hình AI.",
                "summary": "Không có tóm tắt do lỗi hệ thống.",
                "infection_control": False
            }

        # Whitelist mapping to clean codes/names
        whitelist = {
            "Nội tổng quát": "GENERAL_INTERNAL_MEDICINE",
            "Tai Mũi Họng": "ENT",
            "Tim mạch": "CARDIOLOGY",
            "Nhi khoa": "PEDIATRICS",
            "Sản phụ khoa": "OBGYN",
            "Da liễu": "DERMATOLOGY",
            "Tiêu hóa": "GASTROENTEROLOGY",
            "Cơ xương khớp": "ORTHOPEDICS",
            "Thần kinh": "NEUROLOGY",
            "Cấp cứu": "EMERGENCY"
        }

        # Normalize suggested department
        dept_name = data.get("suggested_department", "Nội tổng quát")
        if dept_name not in whitelist:
            dept_name = "Nội tổng quát"

        confidence = data.get("confidence_score", 0.0)
        intake_complete = data.get("intake_complete", False)
        
        # Force fallback if confidence < 0.6 or intake is not complete
        if not intake_complete or confidence < 0.6:
            intake_complete = False
            recommendation_ready = False
            dept_name = "Nội tổng quát"
            dept_code = "GENERAL_INTERNAL_MEDICINE"
            mapping_status = "LOW_CONFIDENCE_FALLBACK"
            
            # Gentle professional Vietnamese fallback message with emergency escalation indicators
            reply_text = (
                "Dựa trên thông tin bạn cung cấp, hệ thống chưa đủ dữ kiện để gợi ý một chuyên khoa cụ thể. "
                "Bạn nên đặt lịch khám Nội tổng quát để bác sĩ đánh giá trực tiếp. "
                "Nếu xuất hiện đau ngực dữ dội, khó thở, yếu liệt, ngất hoặc co giật, hãy gọi 115 hoặc đến cấp cứu ngay."
            )
            
            triage_result = {
                "suggested_department_code": dept_code,
                "suggested_department_name": dept_name,
                "urgency_level": "MEDIUM",
                "confidence_score": min(confidence, 0.59),
                "possible_conditions": data.get("possible_conditions", []),
                "suggested_actions": [
                    "Đặt lịch khám Nội tổng quát / Khám tổng quát",
                    "Theo dõi thêm các dấu hiệu bất thường",
                    "Đến ngay cơ sở y tế nếu xuất hiện dấu hiệu chuyển nặng"
                ],
                "department_mapping_status": mapping_status,
                "fallback_reason": "Information is not clear enough to accurately assign a medical specialty.",
                "clinical_reasoning_summary": data.get("clinical_reasoning_summary", "Thông tin chưa đủ cụ thể để định hướng chuyên khoa.")
            }
        else:
            recommendation_ready = True
            dept_code = whitelist[dept_name]
            mapping_status = "MATCHED"
            reply_text = (
                f"Dựa trên phân tích lâm sàng triệu chứng của bạn, hệ thống khuyến nghị bạn nên đặt lịch hẹn "
                f"khám chuyên khoa '{dept_name}' để được bác sĩ thăm khám trực tiếp."
            )
            
            triage_result = {
                "suggested_department_code": dept_code,
                "suggested_department_name": dept_name,
                "urgency_level": data.get("urgency_level", "MEDIUM"),
                "confidence_score": confidence,
                "possible_conditions": data.get("possible_conditions", []),
                "suggested_actions": data.get("suggested_actions", []),
                "department_mapping_status": mapping_status,
                "clinical_reasoning_summary": data.get("clinical_reasoning_summary", "")
            }

        return {
            "intake_complete": intake_complete,
            "recommendation_ready": recommendation_ready,
            "missing_information": data.get("missing_information", []),
            "reply": reply_text,
            "triage_result": triage_result
        }

    async def _extract_triage_result(self, text: str) -> dict:
        """Extract structured triage data from AI response using JSON mode with single-retry repair prompt fallback."""
        prompt = f"""Extract the following clinical triage data into JSON:
- suggested_department: string (Vietnamese name of medical specialty)
- urgency_level: string (LOW, MEDIUM, HIGH, or EMERGENCY)
- possible_conditions: string array
- suggested_actions: string array
- confidence_score: float (0.0 to 1.0)
- summary: string (Vietnamese, concise 2-3 sentences summarizing symptoms and history for medical record)
- infection_control: boolean (true if infection control warnings apply, otherwise false)
- clinical_reasoning_summary: string (concise, professional Vietnamese medical rationale, 1-2 sentences. STRICTLY NO raw thoughts or patient dialog.)

Text to analyze: {text}"""

        triage_data = None
        try:
            response = self.model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            triage_data = json.loads(response.text.strip())
        except Exception as e:
            logger.warning(f"Initial JSON extraction failed: {str(e)}. Retrying once with repair prompt.")
            try:
                repair_prompt = f"{prompt}\n\nWarning: Previous extraction failed. You MUST return valid JSON exactly matching the requested schema. Invalid output is unacceptable."
                repair_response = self.model.generate_content(
                    repair_prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                triage_data = json.loads(repair_response.text.strip())
            except Exception as repair_err:
                logger.error(f"Repair JSON extraction failed: {str(repair_err)}. Using deterministic fallback.")
                triage_data = {
                    "suggested_department": "Nội tổng quát",
                    "urgency_level": "MEDIUM",
                    "possible_conditions": [],
                    "suggested_actions": ["Đặt lịch hẹn khám", "Theo dõi thêm tại nhà", "Gọi 115 nếu triệu chứng đột ngột nặng lên"],
                    "confidence_score": 0.5,
                    "summary": text[:200],
                    "infection_control": False,
                    "clinical_reasoning_summary": "Không thể phân tích phản hồi mô hình bằng cú pháp JSON. Chuyển sang giá trị mặc định."
                }

        confidence = triage_data.get("confidence_score", 0.0)
        if confidence < 0.6:
            logger.info(f"Applying low-confidence fallback: score={confidence}")
            triage_data["suggested_department"] = "Nội tổng quát"
            current_urgency = triage_data.get("urgency_level", "LOW")
            if current_urgency == "LOW":
                triage_data["urgency_level"] = "MEDIUM"
            triage_data["department_mapping_status"] = "LOW_CONFIDENCE_FALLBACK"
            triage_data["fallback_reason"] = "Information is not clear enough to accurately assign a medical specialty."
        else:
            triage_data["department_mapping_status"] = "MATCHED"

        return triage_data

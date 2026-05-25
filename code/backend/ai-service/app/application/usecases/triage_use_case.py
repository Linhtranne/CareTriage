import logging
from typing import Dict, Any, List, Optional
from app.domain.interfaces import ILlmProvider, IRetriever, ITelemetryClient
from app.domain.policies.red_flag_policy import RedFlagDetector
from app.domain.policies.safety_policy import SafetyPolicy
from app.application.prompts.registry import PromptRegistry
from app.infrastructure.telemetry.noop_telemetry import NoOpTelemetryClient
from app.domain.schemas import TriageRecommendationOutput

logger = logging.getLogger(__name__)

class TriageUseCase:
    def __init__(
        self,
        llm_provider: ILlmProvider,
        research_service: Optional[IRetriever] = None,
        telemetry: Optional[ITelemetryClient] = None,
    ):
        self.llm = llm_provider
        self.research_service = research_service
        self.telemetry = telemetry or NoOpTelemetryClient()

    async def analyze(self, session_id: str, message: str, history: List[dict], context: str = "", attachments: List[dict] = None, metadata: dict = None) -> Dict[str, Any]:
        """Process triage message and return conversational intake response."""
        self.telemetry.track_request_started(session_id, "triage.analyze")

        # 1. Deterministic red-flag screening bypass
        red_flag_result = RedFlagDetector.detect_red_flags(message)
        if red_flag_result and red_flag_result.is_triggered:
            logger.info(f"[RED_FLAG] Session {session_id} bypassed LLM due to red-flag match.")
            self.telemetry.track_red_flag_triggered(session_id, "Analyze bypass")
            return {
                "reply": red_flag_result.reply_msg,
                "is_complete": True,
                "intake_complete": True,
                "red_flag_detected": True,
                "triage_result": red_flag_result.triage_result.model_dump() if red_flag_result.triage_result else None
            }

        # 2. Build conversation history
        history_limit = history[-15:] if len(history) > 15 else history
        conversation_lines = []
        for msg in history_limit:
            role = "Patient" if msg.get("role") == "user" else "Assistant"
            content = msg.get("content", "")
            if len(content) > 1000:
                content = content[:1000] + "... (truncated)"
            conversation_lines.append(f"{role}: {content}")

        if metadata:
            meta_str = f"[PATIENT PROFILE] Age: {metadata.get('age')}, Gender: {metadata.get('gender')}, Onset: {metadata.get('onset')}"
            conversation_lines.insert(0, meta_str)

        # 3. Retrieve Context
        if not context and self.research_service:
            try:
                context = self.research_service.get_context(message)
            except Exception as e:
                logger.error(f"RAG Context Error: {str(e)}")

        # 4. Call Provider
        try:
            reply_text = await self.llm.generate_text(
                system_prompt=PromptRegistry.SYSTEM_PROMPT,
                user_prompt=message,
                history=conversation_lines,
                context=context,
                attachments=attachments
            )
        except Exception as e:
            logger.error(f"Provider Error: {str(e)}")
            self.telemetry.track_llm_call_failed(session_id, "gemini", str(e))
            fallback = SafetyPolicy.get_fallback_response("system_error", str(e))
            return {
                "reply": fallback.reply_msg,
                "is_complete": False,
                "intake_complete": False,
                "red_flag_detected": False,
                "triage_result": fallback.triage_result.model_dump() if fallback.triage_result else None,
            }

        self.telemetry.track_request_completed(session_id, "triage.analyze", 0.0)

        return {
            "reply": reply_text,
            "clinical_reasoning_summary": "",
            "is_complete": False,
            "intake_complete": False,
            "red_flag_detected": False,
            "triage_result": None,
        }

    async def recommend(self, session_id: str, message: str, history: List[dict], context: str = "") -> Dict[str, Any]:
        """Generate a final structured triage recommendation with Validation/Retry wrapper."""
        self.telemetry.track_request_started(session_id, "triage.recommend")
        combined_text = message + "\n" + "\n".join([m.get("content", "") for m in history if m.get("role") == "user"])
        
        # 1. Red Flag Policy
        red_flag_result = RedFlagDetector.detect_red_flags(combined_text)
        if red_flag_result and red_flag_result.is_triggered:
            logger.info(f"[RED_FLAG_RECOMMEND] Session {session_id} triggered red-flag bypass in recommendation.")
            self.telemetry.track_red_flag_triggered(session_id, "Recommend bypass")
            tresult = red_flag_result.triage_result.model_dump() if red_flag_result.triage_result else None
            return {
                "intake_complete": True,
                "recommendation_ready": True,
                "missing_information": [],
                "reply": red_flag_result.reply_msg,
                "triage_result": tresult
            }

        # 2. Build Context
        conversation_context = ""
        for msg in history:
            role = "Patient" if msg.get("role") == "user" else "Assistant"
            conversation_context += f"{role}: {msg.get('content')}\n"
        conversation_context += f"Patient: {message}\n"

        if not context and self.research_service:
            try:
                context = self.research_service.get_context(message)
            except Exception as e:
                logger.error(f"RAG Context Error: {str(e)}")

        # 3. Formulate Prompt
        prompt = PromptRegistry.TRIAGE_EVALUATION_PROMPT.format(
            conversation_context=conversation_context,
            context=context
        )

        # 4. Generate with Validation & Retry
        data = None
        for attempt in range(2):
            try:
                raw_data = await self.llm.generate_structured_data(
                    system_prompt=PromptRegistry.SYSTEM_PROMPT,
                    user_prompt=prompt,
                    output_schema=TriageRecommendationOutput
                )
                validated = TriageRecommendationOutput.model_validate(raw_data)
                data = validated.model_dump()
                break
            except Exception as e:
                logger.warning(f"Attempt {attempt+1} failed: {e}")
                if attempt == 1:
                    logger.error("All retries failed. Applying safety fallback.")
                    self.telemetry.track_structured_output_validation_failed(session_id, str(e))
                    fallback = SafetyPolicy.get_fallback_response("system_error", "Schema validation failed repeatedly.")
                    return {
                        "intake_complete": False,
                        "recommendation_ready": False,
                        "missing_information": [],
                        "reply": fallback.reply_msg,
                        "triage_result": fallback.triage_result.model_dump() if fallback.triage_result else None
                    }

        # 5. Whitelist and Confidence checks (Business logic)
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

        dept_name = data.get("suggested_department", "Nội tổng quát")
        if dept_name not in whitelist:
            dept_name = "Nội tổng quát"

        confidence = data.get("confidence_score", 0.0)
        intake_complete = data.get("intake_complete", False)
        
        # 6. Apply Contextual Fallbacks
        if not intake_complete:
            fallback = SafetyPolicy.get_fallback_response("missing_info")
            self.telemetry.track_fallback_applied(session_id, "Missing info")
            return {
                "intake_complete": False,
                "recommendation_ready": False,
                "missing_information": data.get("missing_information", []),
                "reply": fallback.reply_msg,
                "triage_result": fallback.triage_result.model_dump() if fallback.triage_result else None
            }
        elif confidence < 0.6:
            fallback = SafetyPolicy.get_fallback_response("uncertain", "Low confidence score (<0.6)")
            self.telemetry.track_fallback_applied(session_id, "Low confidence")
            return {
                "intake_complete": False,
                "recommendation_ready": False,
                "missing_information": [],
                "reply": fallback.reply_msg,
                "triage_result": fallback.triage_result.model_dump() if fallback.triage_result else None
            }

        # 7. Final Output Formulation
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
            "clinical_reasoning_summary": data.get("clinical_reasoning_summary", ""),
            "summary": data.get("summary", ""),
            "red_flag_detected": data.get("infection_control", False) or False
        }

        self.telemetry.track_request_completed(session_id, "triage.recommend", 0.0)

        return {
            "intake_complete": intake_complete,
            "recommendation_ready": True,
            "missing_information": data.get("missing_information", []),
            "reply": reply_text,
            "triage_result": triage_result
        }

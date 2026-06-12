import asyncio
import datetime
import json
import logging
from typing import Any, AsyncIterator, Dict, List, Optional

from app.application.prompts.registry import PromptRegistry
from app.application.telemetry import NoOpTelemetryClient
from app.domain.interfaces import (
    IClinicalContextBuilder,
    ILlmProvider,
    IRetriever,
    ITelemetryClient,
)
from app.domain.policies.red_flag_policy import RedFlagDetector
from app.domain.policies.safety_policy import SafetyPolicy
from app.domain.schemas import (
    ClassifyOutput,
    ClinicalContext,
    ClinicalContextInput,
    ClinicalFact,
    DomainHistoryMessage,
    RagDocument,
    TriageRecommendationOutput,
)
from app.shared.log_sanitizer import sanitize_error

logger = logging.getLogger(__name__)


class TriageUseCase:
    def __init__(
        self,
        llm_provider: ILlmProvider,
        context_builder: IClinicalContextBuilder,
        clinical_context_builder_enabled: bool = False,
        research_service: Optional[IRetriever] = None,
        telemetry: Optional[ITelemetryClient] = None,
    ):
        self.llm = llm_provider
        self.context_builder = context_builder
        self.clinical_context_builder_enabled = clinical_context_builder_enabled
        self.research_service = research_service
        self.telemetry = telemetry or NoOpTelemetryClient()

    async def analyze(
        self,
        session_id: str,
        message: str,
        history: List[dict],
        context: str = "",
        attachments: Optional[List[dict]] = None,
        metadata: Optional[dict] = None,
    ) -> Dict[str, Any]:
        """Process triage message and return conversational intake response."""
        import time

        start_time = time.time()
        self.telemetry.track_request_started(session_id, "triage.analyze")

        # 1. Deterministic red-flag screening bypass
        red_flag_result = RedFlagDetector.detect_red_flags(message)
        if red_flag_result and red_flag_result.is_triggered:
            logger.info(
                f"[RED_FLAG] Session {session_id} bypassed LLM due to red-flag match."
            )
            self.telemetry.track_red_flag_triggered(session_id, "Analyze bypass")
            return {
                "reply": red_flag_result.reply_msg,
                "intake_complete": True,
                "red_flag_detected": True,
                "triage_result": red_flag_result.triage_result.model_dump()
                if red_flag_result.triage_result
                else None,
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
                context = self.research_service.get_context(
                    message, session_id=session_id
                )
            except Exception as e:
                logger.error(f"RAG Context Error: {sanitize_error(e)}")

        # 4. Call Provider
        try:
            from app.domain.schemas import AnalyzeOutput

            # Combine history and current message for structured data generation
            combined_prompt = (
                "HISTORY:\n"
                + "\n".join(conversation_lines)
                + f"\n\nCURRENT MESSAGE: {message}"
            )

            raw_data = await self.llm.generate_structured_data(
                system_prompt=PromptRegistry.SYSTEM_PROMPT,
                user_prompt=combined_prompt,
                output_schema=AnalyzeOutput,
                context=context,
                session_id=session_id,
            )
            validated = AnalyzeOutput.model_validate(raw_data)
            reply_text = validated.reply
            intake_complete = validated.intake_complete
        except Exception as e:
            logger.error(f"Provider Error: {sanitize_error(e)}")
            self.telemetry.track_llm_call_failed(
                session_id, "gemini", sanitize_error(e)
            )
            fallback = SafetyPolicy.get_fallback_response(
                "system_error", sanitize_error(e)
            )
            return {
                "reply": fallback.reply_msg,
                "intake_complete": False,
                "red_flag_detected": False,
                "missing_information": [],
                "triage_result": fallback.triage_result.model_dump()
                if fallback.triage_result
                else None,
            }

        latency_ms = (time.time() - start_time) * 1000
        self.telemetry.track_request_completed(session_id, "triage.analyze", latency_ms)

        return {
            "reply": reply_text,
            "clinical_reasoning_summary": "",
            "intake_complete": intake_complete,
            "red_flag_detected": False,
            "triage_result": None,
        }

    def _build_red_flag_events(self, message: str, turn_id: str) -> list[str]:
        result = RedFlagDetector.detect_red_flags(message)
        if not result or not result.is_triggered:
            return []

        raw = result.triage_result.model_dump() if result.triage_result else {}
        triage_result = {
            "suggested_department_code": raw.get(
                "suggested_department_code", "EMERGENCY"
            ),
            "suggested_department_name": raw.get(
                "suggested_department_name", "Cap cuu"
            ),
            "urgency_level": raw.get("urgency_level", "EMERGENCY"),
            "confidence_score": raw.get("confidence_score", 1.0),
            "possible_conditions": raw.get("possible_conditions", []),
            "suggested_actions": raw.get("suggested_actions", []),
            "clinical_reasoning_summary": raw.get("clinical_reasoning_summary")
            or "Deterministic red flag rule triggered.",
            "summary": raw.get("summary")
            or "Emergency warning triggered by reported symptoms.",
        }
        token = {
            "turn_id": turn_id,
            "sequence": 1,
            "content": result.reply_msg,
        }
        final: Dict[str, Any] = {
            "contract_version": "1",
            "turn_id": turn_id,
            "reply": result.reply_msg,
            "intake_complete": True,
            "red_flag_detected": True,
            "missing_information": [],
            "classification_status": "OK",
            "classification_error_code": None,
            "triage_result": triage_result,
        }
        return [
            f"event: token\ndata: {json.dumps(token, ensure_ascii=False)}\n\n",
            f"event: final\ndata: {json.dumps(final, ensure_ascii=False)}\n\n",
        ]

    def _build_stream_prompt(
        self,
        session_id: str,
        message: str,
        history: List[dict],
        metadata: Optional[dict],
        context: str,
    ) -> tuple[str, str]:
        conversation_lines = []
        for item in history[-15:]:
            role = "Patient" if item.get("role") == "user" else "Assistant"
            content = item.get("content", "")[:1000]
            conversation_lines.append(f"{role}: {content}")

        if metadata:
            conversation_lines.insert(
                0,
                "[PATIENT PROFILE] "
                f"Age: {metadata.get('age')}, "
                f"Gender: {metadata.get('gender')}, "
                f"Onset: {metadata.get('onset')}",
            )

        resolved_context = context
        if not resolved_context and self.research_service:
            try:
                resolved_context = self.research_service.get_context(
                    message, session_id=session_id
                )
            except Exception as error:
                logger.error("RAG Context Error: %s", sanitize_error(error))

        prompt = (
            "HISTORY:\n"
            + "\n".join(conversation_lines)
            + f"\n\nCURRENT MESSAGE: {message}\n\n"
            + "Reply conversationally in Vietnamese. Ask only the next necessary "
            + "question, or conclude with a doctor/specialist recommendation when "
            + "symptom, onset, and severity are clear."
        )
        return prompt, resolved_context

    @staticmethod
    def _build_classified_final(data: dict, turn_id: str, streamed_reply: str) -> dict:
        triage_result = data.get("triage_result")
        intake_complete = bool(data.get("intake_complete") and triage_result)
        return {
            "contract_version": "1",
            "turn_id": turn_id,
            "reply": streamed_reply,
            "intake_complete": intake_complete,
            "red_flag_detected": data.get("red_flag_detected", False),
            "missing_information": []
            if intake_complete
            else data.get("missing_information", []),
            "classification_status": "OK",
            "classification_error_code": None,
            "triage_result": triage_result if intake_complete else None,
        }

    async def _stream_phase_b(
        self,
        session_id: str,
        message: str,
        history: List[dict],
        turn_id: str,
        context: str,
        streamed_reply: str,
        clinical_context: Optional[ClinicalContext] = None,
    ) -> AsyncIterator[str]:
        if clinical_context:
            conversation_lines = clinical_context.prompt_history[:]
            conversation_lines.extend(
                [
                    f"Patient: {clinical_context.current_message}",
                    f"Assistant: {streamed_reply}",
                ]
            )
            context_to_use = clinical_context.context_text
        else:
            conversation_lines = [
                f"{'Patient' if item.get('role') == 'user' else 'Assistant'}: "
                f"{item.get('content', '')}"
                for item in history
            ]
            conversation_lines.extend(
                [f"Patient: {message}", f"Assistant: {streamed_reply}"]
            )
            context_to_use = context

        prompt = PromptRegistry.TRIAGE_EVALUATION_PROMPT.format(
            conversation_context="\n".join(conversation_lines),
            context=context_to_use,
        )

        async def classify() -> dict:
            raw_data = await self.llm.generate_structured_data(
                system_prompt=PromptRegistry.SYSTEM_PROMPT,
                user_prompt=prompt,
                output_schema=ClassifyOutput,
                session_id=session_id,
            )
            return ClassifyOutput.model_validate(raw_data).model_dump()

        task = asyncio.create_task(classify())
        while not task.done():
            try:
                await asyncio.wait_for(asyncio.shield(task), timeout=15.0)
            except asyncio.TimeoutError:
                heartbeat = {
                    "turn_id": turn_id,
                    "timestamp": datetime.datetime.now(
                        datetime.timezone.utc
                    ).isoformat(),
                }
                yield (
                    "event: heartbeat\n"
                    f"data: {json.dumps(heartbeat, ensure_ascii=False)}\n\n"
                )
            except Exception:
                # The completed task is handled by the DEGRADED fallback below.
                break

        try:
            data = await task
            final_payload = self._build_classified_final(data, turn_id, streamed_reply)
        except Exception as error:
            logger.error("Phase B classification failed: %s", sanitize_error(error))
            final_payload = {
                "contract_version": "1",
                "turn_id": turn_id,
                "reply": streamed_reply,
                "intake_complete": False,
                "red_flag_detected": False,
                "missing_information": [],
                "classification_status": "DEGRADED",
                "classification_error_code": "LLM_PHASE_B_FAILED",
                "triage_result": None,
            }

        yield (
            f"event: final\ndata: {json.dumps(final_payload, ensure_ascii=False)}\n\n"
        )

    async def analyze_stream(  # noqa: C901
        self,
        session_id: str,
        message: str,
        history: List[dict],
        turn_id: str,
        context: str = "",
        attachments: Optional[List[dict]] = None,
        metadata: Optional[dict] = None,
    ) -> AsyncIterator[str]:
        """Stream conversational intake response. Yields standard SSE events strictly."""
        red_flag_events = self._build_red_flag_events(message, turn_id)
        if red_flag_events:
            logger.info(
                "[RED_FLAG_STREAM] Session %s bypassed LLM due to red-flag match.",
                session_id,
            )
            self.telemetry.track_red_flag_triggered(session_id, "Analyze stream bypass")
            for event in red_flag_events:
                yield event
            return

        clinical_context = None
        if self.clinical_context_builder_enabled:
            conv_hist = [
                DomainHistoryMessage(
                    role=m.get("role", "user"), content=m.get("content", "")
                )
                for m in history
            ]

            patient_facts = []
            if metadata:
                whitelist = {"age", "gender", "onset"}
                for k, v in metadata.items():
                    if k in whitelist and v is not None:
                        patient_facts.append(
                            ClinicalFact(
                                fact_id=f"profile_{k}",
                                fact_type=k,
                                value=str(v),
                                source="PROFILE",
                                confidence=1.0,
                            )
                        )

            retrieved_evidence = []
            if context and context.strip():
                retrieved_evidence.append(
                    RagDocument(
                        content=context.strip(),
                        source="legacy_rag_context",
                        title="Legacy retrieved context",
                        scope="medical_reference",
                    )
                )

            input_data = ClinicalContextInput(
                current_message=message,
                conversation_history=conv_hist,
                patient_facts=patient_facts,
                attachment_facts=[],
                retrieved_evidence=retrieved_evidence,
            )
            clinical_context = self.context_builder.build(input_data)
            prompt = (
                "HISTORY:\n"
                + "\n".join(clinical_context.prompt_history)
                + f"\n\nCURRENT MESSAGE: {clinical_context.current_message}\n\n"
                + "Reply conversationally in Vietnamese. Ask only the next necessary "
                + "question, or conclude with a doctor/specialist recommendation when "
                + "symptom, onset, and severity are clear."
            )
            context_to_use = clinical_context.context_text
        else:
            prompt, context_to_use = self._build_stream_prompt(
                session_id, message, history, metadata, context
            )

        streamed_reply = ""
        sequence = 1
        try:
            async for chunk in self.llm.generate_text_stream(
                system_prompt=PromptRegistry.SYSTEM_PROMPT,
                user_prompt=prompt,
                context=context_to_use,
                attachments=attachments,
                session_id=session_id,
            ):
                if chunk:
                    streamed_reply += chunk
                    token_payload = {
                        "turn_id": turn_id,
                        "sequence": sequence,
                        "content": chunk,
                    }
                    yield f"event: token\ndata: {json.dumps(token_payload, ensure_ascii=False)}\n\n"
                    sequence += 1
        except Exception as e:
            logger.error(f"LLM Phase A streaming failed: {sanitize_error(e)}")
            error_payload = {
                "turn_id": turn_id,
                "code": "LLM_PHASE_A_FAILED",
                "message": "Xin l\u1ed7i, h\u1ec7 th\u1ed1ng AI \u0111ang g\u1eb7p s\u1ef1 c\u1ed1. Vui l\u00f2ng th\u1eed l\u1ea1i.",
                "retryable": True,
            }
            yield f"event: error\ndata: {json.dumps(error_payload, ensure_ascii=False)}\n\n"
            return

        if not streamed_reply.strip():
            logger.error("LLM Phase A returned empty response")
            error_payload = {
                "turn_id": turn_id,
                "code": "EMPTY_RESPONSE",
                "message": "Xin l\u1ed7i, h\u1ec7 th\u1ed1ng AI \u0111ang g\u1eb7p s\u1ef1 c\u1ed1. Vui l\u00f2ng th\u1eed l\u1ea1i.",
                "retryable": True,
            }
            yield f"event: error\ndata: {json.dumps(error_payload, ensure_ascii=False)}\n\n"
            return

        async for event in self._stream_phase_b(
            session_id,
            message,
            history,
            turn_id,
            context_to_use,
            streamed_reply,
            clinical_context=clinical_context,
        ):
            yield event
        return

    async def recommend(  # noqa: C901
        self, session_id: str, message: str, history: List[dict], context: str = ""
    ) -> Dict[str, Any]:
        """Generate a final structured triage recommendation with Validation/Retry wrapper."""
        import time

        start_time = time.time()
        self.telemetry.track_request_started(session_id, "triage.recommend")
        combined_text = (
            message
            + "\n"
            + "\n".join(
                [m.get("content", "") for m in history if m.get("role") == "user"]
            )
        )

        # 1. Red Flag Policy
        red_flag_result = RedFlagDetector.detect_red_flags(combined_text)
        if red_flag_result and red_flag_result.is_triggered:
            logger.info(
                f"[RED_FLAG_RECOMMEND] Session {session_id} triggered red-flag bypass in recommendation."
            )
            self.telemetry.track_red_flag_triggered(session_id, "Recommend bypass")
            tresult = (
                red_flag_result.triage_result.model_dump()
                if red_flag_result.triage_result
                else None
            )
            return {
                "intake_complete": True,
                "recommendation_ready": True,
                "missing_information": [],
                "reply": red_flag_result.reply_msg,
                "triage_result": tresult,
            }

        # 2. Build Context
        conversation_context = ""
        for msg in history:
            role = "Patient" if msg.get("role") == "user" else "Assistant"
            conversation_context += f"{role}: {msg.get('content')}\n"
        conversation_context += f"Patient: {message}\n"

        if not context and self.research_service:
            try:
                context = self.research_service.get_context(
                    message, session_id=session_id
                )
            except Exception as e:
                logger.error(f"RAG Context Error: {sanitize_error(e)}")

        # 3. Formulate Prompt
        prompt = PromptRegistry.TRIAGE_EVALUATION_PROMPT.format(
            conversation_context=conversation_context, context=context
        )

        # 4. Generate with Validation & Retry
        data = None
        for attempt in range(2):
            try:
                raw_data = await self.llm.generate_structured_data(
                    system_prompt=PromptRegistry.SYSTEM_PROMPT,
                    user_prompt=prompt,
                    output_schema=TriageRecommendationOutput,
                    session_id=session_id,
                )
                validated = TriageRecommendationOutput.model_validate(raw_data)
                data = validated.model_dump()
                break
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {sanitize_error(e)}")
                if attempt == 1:
                    logger.error("All retries failed. Applying safety fallback.")
                    self.telemetry.track_structured_output_validation_failed(
                        session_id, sanitize_error(e)
                    )
                    fallback = SafetyPolicy.get_fallback_response(
                        "system_error", "Schema validation failed repeatedly."
                    )
                    return {
                        "intake_complete": False,
                        "recommendation_ready": False,
                        "missing_information": [],
                        "reply": fallback.reply_msg,
                        "triage_result": fallback.triage_result.model_dump()
                        if fallback.triage_result
                        else None,
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
            "Cấp cứu": "EMERGENCY",
        }

        assert data is not None, "Data should not be None after successful generation"

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
                "triage_result": fallback.triage_result.model_dump()
                if fallback.triage_result
                else None,
            }
        elif confidence < 0.6:
            fallback = SafetyPolicy.get_fallback_response(
                "uncertain", "Low confidence score (<0.6)"
            )
            self.telemetry.track_fallback_applied(session_id, "Low confidence")
            return {
                "intake_complete": False,
                "recommendation_ready": False,
                "missing_information": [],
                "reply": fallback.reply_msg,
                "triage_result": fallback.triage_result.model_dump()
                if fallback.triage_result
                else None,
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
            "red_flag_detected": data.get("infection_control", False) or False,
        }

        latency_ms = (time.time() - start_time) * 1000
        self.telemetry.track_request_completed(
            session_id, "triage.recommend", latency_ms
        )

        return {
            "intake_complete": intake_complete,
            "recommendation_ready": True,
            "missing_information": data.get("missing_information", []),
            "reply": reply_text,
            "triage_result": triage_result,
        }

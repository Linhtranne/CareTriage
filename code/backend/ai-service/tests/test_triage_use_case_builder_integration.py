from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.context.clinical_context_builder import (
    DeterministicClinicalContextBuilder,
)
from app.application.usecases.triage_use_case import TriageUseCase
from app.domain.interfaces import IClinicalContextBuilder, ILlmProvider
from app.domain.schemas import ClinicalContext


@pytest.mark.asyncio
async def test_analyze_stream_uses_builder_when_flag_enabled():
    mock_llm = AsyncMock(spec=ILlmProvider)

    async def stream_text(**_kwargs):
        yield "Hello "
        yield "world"

    mock_llm.generate_text_stream.side_effect = stream_text
    mock_llm.generate_structured_data.return_value = {
        "intake_complete": True,
        "red_flag_detected": False,
        "missing_information": [],
        "triage_result": {
            "suggested_department_code": "GENERAL_INTERNAL_MEDICINE",
            "suggested_department_name": "Nội tổng quát",
            "urgency_level": "LOW",
            "confidence_score": 0.9,
            "possible_conditions": [],
            "suggested_actions": [],
            "clinical_reasoning_summary": "Test",
            "summary": "Test",
        },
    }

    mock_builder = MagicMock(spec=IClinicalContextBuilder)
    mock_context = ClinicalContext(
        prompt_history=["Patient: Test history"],
        current_message="Test message",
        context_text="KNOWN FACTS:\nAge: 30\n\nRETRIEVED EVIDENCE:\nLegacy retrieved context: Old RAG text",
        missing_fact_types=[],
        conflicts=[],
        known_facts=[],
    )
    mock_builder.build.return_value = mock_context

    use_case = TriageUseCase(
        llm_provider=mock_llm,
        context_builder=mock_builder,
        clinical_context_builder_enabled=True,
    )

    metadata = {
        "age": 30,
        "gender": "male",
        "onset": "2 days",
        "unknown_key": "drop_me",
    }
    attachments = [
        {"type": "image", "data": "base64data", "extracted_text": "ignore me"}
    ]
    context_str = "Old RAG text"

    events = [
        event
        async for event in use_case.analyze_stream(
            session_id="123",
            message="Test message",
            history=[{"role": "user", "content": "Test history"}],
            turn_id="turn-1",
            metadata=metadata,
            attachments=attachments,
            context=context_str,
        )
    ]

    # Verify builder was called exactly once
    mock_builder.build.assert_called_once()

    # Check what was passed to builder
    build_arg = mock_builder.build.call_args[0][0]
    # Metadata whitelist created exactly 3 facts
    assert len(build_arg.patient_facts) == 3
    fact_types = {f.fact_type for f in build_arg.patient_facts}
    assert fact_types == {"age", "gender", "onset"}
    # Unknown key is dropped
    assert "unknown_key" not in fact_types
    # Attachments are empty (no base64)
    assert len(build_arg.attachment_facts) == 0
    # Legacy RAG context preserved
    assert len(build_arg.retrieved_evidence) == 1
    assert build_arg.retrieved_evidence[0].content == "Old RAG text"

    # Phase A generates stream
    # Phase B runs classification
    assert mock_llm.generate_text_stream.call_count == 1
    assert mock_llm.generate_structured_data.call_count == 1

    # Assert Phase A and Phase B use the same context_text
    phase_a_call = mock_llm.generate_text_stream.call_args
    assert phase_a_call.kwargs["context"] == mock_context.context_text
    # attachments passed through
    assert phase_a_call.kwargs["attachments"] == attachments

    phase_b_call = mock_llm.generate_structured_data.call_args
    prompt = phase_b_call.kwargs["user_prompt"]
    assert mock_context.context_text in prompt
    assert "Patient: Test message" in prompt
    # Phase B doesn't get base64 directly in prompt
    assert "base64data" not in prompt

    # Final event
    final_event = [e for e in events if "event: final" in e][0]
    assert "contract_version" in final_event


@pytest.mark.asyncio
async def test_analyze_stream_uses_legacy_when_flag_disabled():
    mock_llm = AsyncMock(spec=ILlmProvider)

    async def stream_text(**_kwargs):
        yield "Hello"

    mock_llm.generate_text_stream.side_effect = stream_text
    mock_llm.generate_structured_data.return_value = {
        "intake_complete": False,
        "red_flag_detected": False,
        "missing_information": [],
    }

    mock_builder = MagicMock(spec=IClinicalContextBuilder)
    use_case = TriageUseCase(
        llm_provider=mock_llm,
        context_builder=mock_builder,
        clinical_context_builder_enabled=False,
    )

    metadata = {"age": 25}
    context_str = "Old context"

    _ = [
        event
        async for event in use_case.analyze_stream(
            session_id="123",
            message="Test message",
            history=[{"role": "assistant", "content": "Prev"}],
            turn_id="turn-1",
            metadata=metadata,
            context=context_str,
        )
    ]

    # Verify builder was NOT called
    mock_builder.build.assert_not_called()
    assert mock_llm.generate_text_stream.call_count == 1

    # Check baseline prompt format exactly
    phase_a_call = mock_llm.generate_text_stream.call_args
    assert phase_a_call.kwargs["context"] == context_str
    prompt = phase_a_call.kwargs["user_prompt"]

    # Assert exact equality with legacy builder
    expected_prompt, _ = use_case._build_stream_prompt(
        session_id="123",
        message="Test message",
        history=[{"role": "assistant", "content": "Prev"}],
        metadata=metadata,
        context=context_str,
    )
    assert prompt == expected_prompt


@pytest.mark.asyncio
async def test_analyze_stream_with_real_builder():
    mock_llm = AsyncMock(spec=ILlmProvider)

    async def stream_text(**_kwargs):
        yield "Hello"

    mock_llm.generate_text_stream.side_effect = stream_text
    mock_llm.generate_structured_data.return_value = {
        "intake_complete": True,
        "red_flag_detected": False,
        "missing_information": [],
        "triage_result": {
            "suggested_department_code": "GENERAL_INTERNAL_MEDICINE",
            "suggested_department_name": "Nội tổng quát",
            "urgency_level": "LOW",
            "confidence_score": 0.9,
            "possible_conditions": [],
            "suggested_actions": [],
            "clinical_reasoning_summary": "Test",
            "summary": "Test",
        },
    }

    real_builder = DeterministicClinicalContextBuilder()
    mock_retriever = MagicMock()
    use_case = TriageUseCase(
        llm_provider=mock_llm,
        context_builder=real_builder,
        clinical_context_builder_enabled=True,
        research_service=mock_retriever,
    )

    metadata = {"age": 45, "gender": "female", "onset": "3 days", "unknown_key": "drop"}
    attachments = [{"type": "image", "data": "base64_data", "extracted_text": ""}]
    context_str = "Legacy Document Details"

    _ = [
        event
        async for event in use_case.analyze_stream(
            session_id="123",
            message="Tôi bị đau ngực",
            history=[{"role": "assistant", "content": "Prev"}],
            turn_id="turn-1",
            metadata=metadata,
            attachments=attachments,
            context=context_str,
        )
    ]

    # Phase A generates stream
    assert mock_llm.generate_text_stream.call_count == 1

    # Check what context and prompt were sent to LLM
    phase_a_call = mock_llm.generate_text_stream.call_args
    context_to_use = phase_a_call.kwargs["context"]
    prompt = phase_a_call.kwargs["user_prompt"]

    # KNOWN FACTS contains age/gender/onset but NOT unknown_key
    assert "age: 45" in context_to_use
    assert "gender: female" in context_to_use
    assert "onset: 3 days" in context_to_use
    assert "unknown_key" not in context_to_use
    assert "drop" not in context_to_use

    # Base64 is nowhere to be found in context or prompt
    assert "base64_data" not in context_to_use
    assert "base64_data" not in prompt

    # RETRIEVED EVIDENCE contains legacy RAG context
    assert "[legacy_rag_context]" in context_to_use
    assert "Legacy Document Details" in context_to_use

    # Attachments are forwarded as object to LLM
    assert phase_a_call.kwargs["attachments"] == attachments

    # Ensure Phase A and B got the same context_to_use
    phase_b_call = mock_llm.generate_structured_data.call_args
    prompt_b = phase_b_call.kwargs["user_prompt"]
    assert context_to_use in prompt_b
    mock_retriever.get_context.assert_not_called()

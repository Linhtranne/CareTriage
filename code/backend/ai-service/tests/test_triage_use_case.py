import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.application.usecases.triage_use_case import TriageUseCase
from app.domain.interfaces import IClinicalContextBuilder, ILlmProvider, IRetriever
from app.domain.schemas import ClassifyOutput


def test_classify_output_does_not_own_reply_or_execution_status():
    fields = ClassifyOutput.model_fields

    assert "reply" not in fields
    assert "classification_status" not in fields
    assert "classification_error_code" not in fields


@pytest.mark.asyncio
async def test_stream_phase_b_uses_classify_output_and_preserves_phase_a_reply():
    mock_llm = AsyncMock(spec=ILlmProvider)

    async def stream_text(**_kwargs):
        for chunk in ("Xin ", "chao"):
            yield chunk

    mock_llm.generate_text_stream.side_effect = stream_text
    mock_llm.generate_structured_data.return_value = {
        "intake_complete": True,
        "red_flag_detected": False,
        "missing_information": [],
        "triage_result": {
            "suggested_department_code": "CARDIOLOGY",
            "suggested_department_name": "Tim mach",
            "urgency_level": "HIGH",
            "confidence_score": 0.9,
            "possible_conditions": [],
            "suggested_actions": [],
            "clinical_reasoning_summary": "Needs cardiac review",
            "summary": "Chest pain",
        },
    }

    mock_builder = MagicMock(spec=IClinicalContextBuilder)
    use_case = TriageUseCase(llm_provider=mock_llm, context_builder=mock_builder)
    events = [
        event
        async for event in use_case.analyze_stream(
            session_id="123",
            message="Toi bi dau nguc",
            history=[],
            turn_id="550e8400-e29b-41d4-a716-446655440000",
        )
    ]

    token_data = [
        json.loads(event.split("data: ", 1)[1])
        for event in events
        if event.startswith("event: token")
    ]
    final_event = next(event for event in events if event.startswith("event: final"))
    final_data = json.loads(final_event.split("data: ", 1)[1])

    assert "".join(token["content"] for token in token_data) == final_data["reply"]
    assert final_data["classification_status"] == "OK"
    assert final_data["triage_result"]["suggested_department_code"] == "CARDIOLOGY"
    assert (
        mock_llm.generate_structured_data.call_args.kwargs["output_schema"]
        is ClassifyOutput
    )


@pytest.mark.asyncio
async def test_stream_phase_b_failure_uses_shared_degraded_error_code():
    mock_llm = AsyncMock(spec=ILlmProvider)

    async def stream_text(**_kwargs):
        yield "Partial reply"

    mock_llm.generate_text_stream.side_effect = stream_text
    mock_llm.generate_structured_data.side_effect = RuntimeError(
        "classification failed"
    )

    mock_builder = MagicMock(spec=IClinicalContextBuilder)
    use_case = TriageUseCase(llm_provider=mock_llm, context_builder=mock_builder)
    events = [
        event
        async for event in use_case.analyze_stream(
            session_id="123",
            message="Toi bi dau nguc",
            history=[],
            turn_id="550e8400-e29b-41d4-a716-446655440000",
        )
    ]

    final_event = next(event for event in events if event.startswith("event: final"))
    final_data = json.loads(final_event.split("data: ", 1)[1])

    assert final_data["classification_status"] == "DEGRADED"
    assert final_data["classification_error_code"] == "LLM_PHASE_B_FAILED"
    assert final_data["reply"] == "Partial reply"


@pytest.mark.asyncio
async def test_triage_use_case_calls_llm():
    # Setup Mocks
    mock_llm = AsyncMock(spec=ILlmProvider)
    mock_llm.generate_structured_data.return_value = {
        "reply": "Xin chào, bạn bị sao?",
        "intake_complete": False,
    }

    mock_retriever = MagicMock(spec=IRetriever)
    mock_retriever.get_context.return_value = "Context from RAG"

    # Instantiate Usecase
    mock_builder = MagicMock(spec=IClinicalContextBuilder)
    use_case = TriageUseCase(
        llm_provider=mock_llm,
        context_builder=mock_builder,
        research_service=mock_retriever,
    )

    # Execute
    result = await use_case.analyze(
        session_id="123", message="Tôi bị đau bụng", history=[]
    )

    # Assertions
    assert result["reply"] == "Xin chào, bạn bị sao?"
    assert result["intake_complete"] is False

    # Verify generic method was called
    mock_llm.generate_structured_data.assert_called_once()
    _, kwargs = mock_llm.generate_structured_data.call_args
    assert "Tôi bị đau bụng" in kwargs["user_prompt"]
    assert kwargs["context"] == "Context from RAG"


@pytest.mark.asyncio
async def test_triage_use_case_red_flag_bypass():
    mock_llm = AsyncMock(spec=ILlmProvider)
    mock_builder = MagicMock(spec=IClinicalContextBuilder)
    use_case = TriageUseCase(llm_provider=mock_llm, context_builder=mock_builder)

    result = await use_case.analyze(
        session_id="123", message="Tôi bị đột quỵ", history=[]
    )

    # Should bypass LLM completely
    mock_llm.generate_structured_data.assert_not_called()
    assert result["intake_complete"] is True
    assert result["red_flag_detected"] is True
    assert "cấp cứu" in result["triage_result"]["suggested_department_name"].lower()

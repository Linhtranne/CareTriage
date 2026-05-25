import pytest
from unittest.mock import AsyncMock, MagicMock
from app.application.usecases.triage_use_case import TriageUseCase
from app.domain.interfaces import ILlmProvider, IRetriever

@pytest.mark.asyncio
async def test_triage_use_case_calls_llm():
    # Setup Mocks
    mock_llm = AsyncMock(spec=ILlmProvider)
    mock_llm.generate_text.return_value = "Xin chào, bạn bị sao?"
    
    mock_retriever = MagicMock(spec=IRetriever)
    mock_retriever.get_context.return_value = "Context from RAG"

    # Instantiate Usecase
    use_case = TriageUseCase(llm_provider=mock_llm, research_service=mock_retriever)
    
    # Execute
    result = await use_case.analyze(
        session_id="123",
        message="Tôi bị đau bụng",
        history=[]
    )
    
    # Assertions
    assert result["reply"] == "Xin chào, bạn bị sao?"
    assert result["is_complete"] is False
    
    # Verify generic method was called
    mock_llm.generate_text.assert_called_once()
    args, kwargs = mock_llm.generate_text.call_args
    assert kwargs["user_prompt"] == "Tôi bị đau bụng"
    assert kwargs["context"] == "Context from RAG"

@pytest.mark.asyncio
async def test_triage_use_case_red_flag_bypass():
    mock_llm = AsyncMock(spec=ILlmProvider)
    use_case = TriageUseCase(llm_provider=mock_llm)
    
    result = await use_case.analyze(
        session_id="123",
        message="Tôi bị đột quỵ",
        history=[]
    )
    
    # Should bypass LLM completely
    mock_llm.generate_text.assert_not_called()
    assert result["is_complete"] is True
    assert result["red_flag_detected"] is True
    assert "cấp cứu" in result["triage_result"]["suggested_department_name"].lower()

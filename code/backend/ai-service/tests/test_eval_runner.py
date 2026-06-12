from app.domain.evaluation_models import EvalCase, EvalResult, EvalSummary


def test_eval_models():
    # Test valid EvalCase creation
    case = EvalCase(
        id="123",
        input_text="test",
        conversation_history=[],
        expected_department_code="EMERGENCY",
        expected_urgency_level="EMERGENCY",
        expected_red_flag=True,
    )
    assert case.id == "123"

    # Test EvalResult
    res = EvalResult(
        case_id="123",
        passed=True,
        department_match=True,
        urgency_match=True,
        red_flag_match=True,
    )
    assert res.passed is True

    # Test EvalSummary
    summary = EvalSummary(total_cases=1, passed_cases=1, accuracy=1.0, results=[res])
    assert summary.accuracy == 1.0

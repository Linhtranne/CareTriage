from app.application.evaluations import EvalCase, TriageEvalRunner


def test_triage_eval_runner_passes_matching_output():
    case = EvalCase(
        id="case-1",
        input_text="chest pain",
        expected_department_code="EMERGENCY",
        expected_urgency_level="EMERGENCY",
        should_red_flag=True,
    )
    output = {
        "red_flag_detected": True,
        "triage_result": {
            "suggested_department_code": "EMERGENCY",
            "urgency_level": "EMERGENCY",
        },
    }

    result = TriageEvalRunner().evaluate_result(case, output)

    assert result.passed is True
    assert result.reasons == []


def test_triage_eval_runner_reports_mismatches():
    case = EvalCase(
        id="case-2",
        input_text="unclear symptoms",
        expected_department_code="GENERAL_INTERNAL_MEDICINE",
        expected_urgency_level="MEDIUM",
        should_red_flag=False,
    )
    output = {
        "red_flag_detected": True,
        "triage_result": {
            "suggested_department_code": "EMERGENCY",
            "urgency_level": "EMERGENCY",
        },
    }

    result = TriageEvalRunner().evaluate_result(case, output)

    assert result.passed is False
    assert len(result.reasons) == 3


def test_triage_eval_runner_summary_counts_results():
    runner = TriageEvalRunner()
    summary = runner.summarize(
        [
            runner.evaluate_result(EvalCase(id="ok", input_text="x"), {}),
            runner.evaluate_result(
                EvalCase(id="bad", input_text="x", expected_urgency_level="LOW"),
                {"triage_result": {"urgency_level": "HIGH"}},
            ),
        ]
    )

    assert summary.total == 2
    assert summary.passed == 1
    assert summary.failed == 1

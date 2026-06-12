from app.domain.policies.red_flag_policy import RedFlagDetector


def test_detect_red_flags_triggers():
    result = RedFlagDetector.detect_red_flags("tôi bị mất thị lực đột ngột")
    assert result is not None
    assert result.is_triggered is True
    assert result.triage_result.urgency_level == "EMERGENCY"
    assert "cấp cứu" in result.triage_result.suggested_department_name.lower()


def test_detect_red_flags_negated():
    result = RedFlagDetector.detect_red_flags("tôi không bị đau ngực dữ dội")
    assert result is None


def test_detect_red_flags_chest_pain_radiating_left_arm():
    result = RedFlagDetector.detect_red_flags(
        "Tôi bị đau tức ngực dữ dội lan ra cánh tay trái, khó thở và toát mồ hôi lạnh."
    )

    assert result is not None
    assert result.is_triggered is True
    assert result.triage_result.suggested_department_code == "EMERGENCY"
    assert result.triage_result.urgency_level == "EMERGENCY"


def test_detect_red_flags_no_flags():
    result = RedFlagDetector.detect_red_flags("tôi bị ngứa ngoài da và nổi mẩn đỏ")
    assert result is None

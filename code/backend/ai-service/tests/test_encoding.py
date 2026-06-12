import os

from app.domain.policies.red_flag_policy import RED_FLAG_PATTERNS
from app.domain.schemas import TriageRecommendationOutput


def test_vietnamese_literals_correctness():
    # 1. Test schema contains correct literals
    schema_fields = TriageRecommendationOutput.model_fields
    dept_desc = schema_fields["suggested_department"].description

    assert "Nội tổng quát" in dept_desc
    assert "Cấp cứu" in dept_desc
    assert "Cơ xương khớp" in dept_desc
    assert "Tiêu hóa" in dept_desc

    # 2. Test red flag policy patterns
    chest_pain_patterns = RED_FLAG_PATTERNS.get("CHEST_PAIN", [])
    assert (
        any("đau ngực dữ dội" in p for p in chest_pain_patterns)
        or any("đau tức ngực dữ dội" in p for p in chest_pain_patterns)
        or any("tức ngực" in p for p in chest_pain_patterns)
    )


def test_encoding_guard_no_mojibake():
    # Directories to scan
    base_dir = os.path.dirname(os.path.dirname(__file__))
    directories_to_scan = [
        os.path.join(base_dir, "app"),
        os.path.join(base_dir, "evaluations"),
        os.path.join(base_dir, "tests"),
    ]

    mojibake_patterns = ["Ná»", "Ä‘", "Ã", "á»", "Æ°", "CÃ¡", "khÃ´ng"]

    for directory in directories_to_scan:
        for root, _, files in os.walk(directory):
            if "__pycache__" in root:
                continue
            for file in files:
                if file == "test_encoding.py":
                    continue
                if (
                    file.endswith(".py")
                    or file.endswith(".json")
                    or file.endswith(".txt")
                ):
                    file_path = os.path.join(root, file)
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read()
                        for pattern in mojibake_patterns:
                            assert pattern not in content, (
                                f"Mojibake pattern '{pattern}' found in {file_path}"
                            )

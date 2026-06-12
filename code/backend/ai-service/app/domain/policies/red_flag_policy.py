import re
import unicodedata
from typing import Dict, List, Optional

from app.domain.schemas import PolicyResult, TriageResultDetail

# Standard negation terms in Vietnamese
NEGATION_TERMS = {
    "không",
    "không bị",
    "không có",
    "chưa từng",
    "chưa bị",
    "chưa có",
    "đâu có",
    "chả",
    "chẳng",
}

# Red-flag categories and regex pattern groups
RED_FLAG_PATTERNS: Dict[str, List[str]] = {
    "STROKE": [
        r"đột quỵ",
        r"méo miệng",
        r"nói ngọng",
        r"yếu\s+(tay|chân|nửa người)",
        r"liệt\s+(tay|chân|nửa người)",
        r"mất thị lực đột ngột",
        r"đau đầu dữ dội đột ngột",
        r"fast dương tính",
        r"fast positive",
    ],
    "CHEST_PAIN": [
        r"đau ngực dữ dội",
        r"đau ngực lan\s+(tay trái|hàm|lưng)",
        r"tức ngực\s+kèm\s+(khó thở|vã mồ hôi|buồn nôn)",
        r"tức ngực\s+và\s+(khó thở|vã mồ hôi|buồn nôn)",
        r"nghi nhồi máu cơ tim",
        r"nhồi máu cơ tim",
    ],
    "DYSPNEA": [
        r"khó thở nặng",
        r"tím tái",
        r"không thở được",
        r"thở rít",
        r"thở khò khè",
        r"spo2\s+(dưới|<)\s*(9[0-4]|8[0-9])",
    ],
    "SEIZURE": [r"co giật", r"mất ý thức", r"lú lẫn đột ngột", r"hôn mê"],
    "TRAUMA": [
        r"chảy máu không cầm",
        r"tai nạn nghiêm trọng",
        r"chấn thương đầu",
        r"gãy xương hở",
    ],
    "ANAPHYLAXIS": [
        r"khó thở sau ăn",
        r"khó thở sau uống thuốc",
        r"khó thở sau ong đốt",
        r"sưng\s+(môi|lưỡi|họng)",
        r"mề đay\s+kèm\s+khó thở",
        r"mề đay\s+và\s+khó thở",
    ],
    "PREGNANCY": [
        r"có thai\s+ra máu nhiều",
        r"mang thai\s+ra máu nhiều",
        r"đau bụng dữ dội khi mang thai",
        r"đau bụng dữ dội khi có thai",
        r"đau đầu dữ dội\s+phù\s+nhìn mờ",
    ],
    "MENTAL_HEALTH": [
        r"muốn tự tử",
        r"muốn tự sát",
        r"ý định tự tử",
        r"tự làm hại bản thân",
        r"muốn làm hại người khác",
    ],
    "PEDIATRIC": [r"bỏ bú", r"li bì", r"sốt cao\s+co giật", r"rút lõm lồng ngực"],
}

NORMALIZED_RED_FLAG_PATTERNS: Dict[str, List[str]] = {
    "CHEST_PAIN": [
        r"dau\s+(tuc\s+)?nguc\s+(du\s+doi\s+)?lan\s+(ra\s+)?(canh\s+)?tay\s+trai",
        r"dau\s+(tuc\s+)?nguc.*kho\s+tho.*(toat|va)\s+mo\s+hoi",
    ],
    "STROKE": [
        r"meo\s+mieng.*(liet|yeu)\s+nua\s+nguoi",
        r"dot\s+ngot.*(meo\s+mieng|liet|yeu)",
    ],
}


def normalize_vietnamese_text(text: str) -> str:
    normalized = unicodedata.normalize(
        "NFKD", text.lower().replace("đ", "d").replace("Đ", "D")
    )
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


class RedFlagDetector:
    @staticmethod
    def is_negated(segment: str, match_start: int) -> bool:
        """
        Check if the matched term in the segment is preceded by a negation term.
        Since the segment is already a single logical clause, any negation term
        preceding the symptom within this segment negates it.
        """
        preceding_text = segment[:match_start].strip()
        if not preceding_text:
            return False

        # Tokenize preceding text using regex word extraction
        words = [w.lower() for w in re.findall(r"\w+", preceding_text)]
        if not words:
            return False

        # Check if any single negation word matches
        for word in words:
            if word in NEGATION_TERMS:
                return True

        # Check two-word combinations
        for i in range(len(words) - 1):
            two_word = f"{words[i]} {words[i + 1]}"
            if two_word in NEGATION_TERMS:
                return True

        return False

    @classmethod
    def detect_red_flags(cls, text: str) -> Optional[PolicyResult]:  # noqa: C901
        """
        Analyze clinical text for emergency red-flags, splitting by logical clauses
        to apply phrase-window negation parsing.
        """
        if not text:
            return None

        # Clean text and split by punctuation and contrastive conjunctions ONLY
        # (We do NOT split by coordinating conjunctions like và, hoặc, hay as they distribute negations)
        cleaned_text = text.lower()
        clauses = re.split(
            r"[,.;!?]|\bbut\b|\bnhưng\b|\bsong\b|\btuy nhiên\b", cleaned_text
        )

        matched_categories = []

        for clause in clauses:
            clause = clause.strip()
            if not clause:
                continue

            for category, patterns in RED_FLAG_PATTERNS.items():
                for pattern in patterns:
                    for match in re.finditer(pattern, clause):
                        # Verify if this pattern is negated in the current clause context
                        if not cls.is_negated(clause, match.start()):
                            matched_categories.append((category, match.group(0)))
                            # Found active emergency in this clause; we can early-exit or collect
                            break

        if not matched_categories:
            normalized_text = normalize_vietnamese_text(text)
            for category, patterns in NORMALIZED_RED_FLAG_PATTERNS.items():
                for pattern in patterns:
                    norm_match = re.search(pattern, normalized_text)
                    if norm_match:
                        matched_categories.append((category, norm_match.group(0)))
                        break
                if matched_categories:
                    break

        if not matched_categories:
            return None

        # Format primary emergency findings
        primary_category, matched_symptom = matched_categories[0]

        reply_msg = (
            "Các dấu hiệu bạn mô tả (bao gồm triệu chứng có nguy cơ đe dọa sức khỏe: "
            f"'{matched_symptom}') có thể liên quan đến tình trạng cấp cứu nguy kịch. "
            "Vui lòng gọi 115 hoặc di chuyển đến khoa Cấp cứu gần nhất ngay lập tức. "
            "Tuyệt đối không tự lái xe."
        )

        return PolicyResult(
            is_triggered=True,
            reply_msg=reply_msg,
            triage_result=TriageResultDetail(
                category_name="Cấp cứu",
                suggested_department_code="EMERGENCY",
                suggested_department_name="Cấp cứu",
                urgency_level="EMERGENCY",
                possible_conditions=[
                    f"Nghi ngờ tình trạng khẩn cấp thuộc nhóm {primary_category}"
                ],
                suggested_actions=[
                    "Gọi 115 ngay lập tức",
                    "Di chuyển đến khoa Cấp cứu gần nhất",
                ],
                confidence_score=1.0,
                summary=f"Phát hiện triệu chứng cấp cứu thuộc nhóm {primary_category} ({matched_symptom}) qua bộ lọc cờ đỏ.",
                red_flag_detected=True,
                department_mapping_status="RED_FLAG_BYPASS",
            ),
        )

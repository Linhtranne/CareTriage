from copy import deepcopy

from app.application.context.clinical_context_builder import (
    DeterministicClinicalContextBuilder,
)
from app.domain.schemas import (
    ClinicalContextInput,
    ClinicalFact,
    DomainHistoryMessage,
)


def test_empty_history_is_valid():
    context = DeterministicClinicalContextBuilder().build(
        ClinicalContextInput(current_message="Dạo này tôi bị ho")
    )

    assert context.current_message == "Dạo này tôi bị ho"
    assert context.prompt_history == []


def test_current_message_appears_exactly_once_and_not_in_history():
    context = DeterministicClinicalContextBuilder().build(
        ClinicalContextInput(
            current_message="Dạo này tôi bị ho",
            conversation_history=[
                DomainHistoryMessage(
                    role="assistant",
                    content="Bạn có thể cho biết thêm không?",
                )
            ],
        )
    )

    assert context.current_message == "Dạo này tôi bị ho"
    assert context.prompt_history == ["Assistant: Bạn có thể cho biết thêm không?"]
    assert all("Dạo này tôi bị ho" not in line for line in context.prompt_history)


def test_history_order_is_preserved():
    context = DeterministicClinicalContextBuilder().build(
        ClinicalContextInput(
            current_message="Cuối cùng",
            conversation_history=[
                DomainHistoryMessage(role="user", content="Thứ nhất"),
                DomainHistoryMessage(role="assistant", content="Thứ hai"),
            ],
        )
    )

    assert context.prompt_history == [
        "Patient: Thứ nhất",
        "Assistant: Thứ hai",
    ]


def test_keeps_most_recent_history_when_budget_exceeded():
    builder = DeterministicClinicalContextBuilder()
    builder.MAX_HISTORY_CHARS = 30

    context = builder.build(
        ClinicalContextInput(
            current_message="Hiện tại",
            conversation_history=[
                DomainHistoryMessage(
                    role="user",
                    content="Câu hỏi thứ nhất rất dài và không thể chứa hết",
                ),
                DomainHistoryMessage(role="assistant", content="Trả lời 1"),
                DomainHistoryMessage(role="user", content="Mới nhất"),
            ],
        )
    )

    assert context.prompt_history[-1] == "Patient: Mới nhất"
    assert all("Câu hỏi thứ nhất" not in line for line in context.prompt_history)


def test_input_and_nested_objects_are_not_mutated():
    input_data = ClinicalContextInput(
        current_message="Xin chào",
        conversation_history=[DomainHistoryMessage(role="user", content="Tôi bị ho")],
        patient_facts=[
            ClinicalFact(
                fact_id="symptom-1",
                fact_type="symptom",
                value="Ho",
                source="PATIENT",
                confidence=1.0,
            )
        ],
    )
    original = deepcopy(input_data)

    DeterministicClinicalContextBuilder().build(input_data)

    assert input_data == original


def test_detects_conflicting_fact_values():
    context = DeterministicClinicalContextBuilder().build(
        ClinicalContextInput(
            current_message="Test",
            patient_facts=[
                ClinicalFact(
                    fact_id="symptom-1",
                    fact_type="symptom",
                    value="Đau ngực",
                    source="PATIENT",
                    confidence=1.0,
                ),
                ClinicalFact(
                    fact_id="symptom-2",
                    fact_type="symptom",
                    value="Đau lưng",
                    source="PATIENT",
                    confidence=0.8,
                ),
            ],
        )
    )

    assert len(context.conflicts) == 1
    assert context.conflicts[0].fact_type == "symptom"
    assert context.conflicts[0].fact_ids == ["symptom-1", "symptom-2"]
    assert "Đau ngực" in context.conflicts[0].description
    assert "Đau lưng" in context.conflicts[0].description


def test_patient_fact_is_not_overridden_by_attachment():
    context = DeterministicClinicalContextBuilder().build(
        ClinicalContextInput(
            current_message="Test",
            patient_facts=[
                ClinicalFact(
                    fact_id="patient-onset",
                    fact_type="onset",
                    value="2 ngày",
                    source="PATIENT",
                    confidence=1.0,
                )
            ],
            attachment_facts=[
                ClinicalFact(
                    fact_id="attachment-onset",
                    fact_type="onset",
                    value="5 ngày",
                    source="ATTACHMENT",
                    confidence=0.9,
                )
            ],
        )
    )

    assert len(context.known_facts) == 2
    assert len(context.conflicts) == 1
    assert context.context_text.index("2 ngày") < context.context_text.index("5 ngày")


def test_missing_fact_types_are_deterministic():
    context = DeterministicClinicalContextBuilder().build(
        ClinicalContextInput(
            current_message="Test",
            patient_facts=[
                ClinicalFact(
                    fact_id="symptom-1",
                    fact_type="symptom",
                    value="Sốt",
                    source="PATIENT",
                    confidence=1.0,
                )
            ],
        )
    )

    assert context.missing_fact_types == ["onset", "severity"]


def test_unicode_content_is_preserved_when_truncating():
    builder = DeterministicClinicalContextBuilder()
    builder.MAX_HISTORY_CHARS = 40

    context = builder.build(
        ClinicalContextInput(
            current_message="Test",
            conversation_history=[
                DomainHistoryMessage(
                    role="user",
                    content="Tôi bị đau ngực dữ dội, cảm thấy rất khó chịu. ❤️",
                ),
                DomainHistoryMessage(
                    role="assistant",
                    content="Bạn đau lâu chưa?",
                ),
            ],
        )
    )

    assert context.prompt_history[-1] == "Assistant: Bạn đau lâu chưa?"
    encoded = "\n".join(context.prompt_history).encode("utf-8")
    assert encoded.decode("utf-8") == "\n".join(context.prompt_history)


def test_excludes_fact_identifier_from_context_text():
    context = DeterministicClinicalContextBuilder().build(
        ClinicalContextInput(
            current_message="Test",
            patient_facts=[
                ClinicalFact(
                    fact_id="secret_id_123",
                    fact_type="symptom",
                    value="Ho",
                    source="PATIENT",
                    confidence=1.0,
                )
            ],
        )
    )

    assert "secret_id_123" not in context.context_text


def test_output_respects_context_budgets():
    builder = DeterministicClinicalContextBuilder()
    builder.MAX_FACT_CHARS = 80
    builder.MAX_TOTAL_CONTEXT_CHARS = 100
    facts = [
        ClinicalFact(
            fact_id=f"fact-{index}",
            fact_type="symptom",
            value="Đau đầu kéo dài " * 5,
            source="PATIENT",
            confidence=1.0,
        )
        for index in range(3)
    ]

    context = builder.build(
        ClinicalContextInput(current_message="Test", patient_facts=facts)
    )

    assert len(context.context_text) <= builder.MAX_TOTAL_CONTEXT_CHARS

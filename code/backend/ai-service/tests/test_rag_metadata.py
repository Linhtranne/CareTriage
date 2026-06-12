from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.domain.schemas import (
    EvidenceChunk,
    EvidenceMetadata,
    EvidenceSourceType,
    RetrievalQuery,
    RetrievalResult,
)
from app.infrastructure.rag.evidence_id import generate_evidence_id
from app.infrastructure.rag.metadata_validator import (
    EvidenceMetadataValidationError,
    validate_evidence_metadata,
)


def _valid_metadata() -> dict[str, object]:
    content = "Khuyến cáo đánh giá đau ngực cấp."
    return {
        "evidence_id": generate_evidence_id(
            source_type=EvidenceSourceType.PROFESSIONAL_GUIDELINE,
            source_url="https://example.org/guidelines/chest-pain",
            title="Hướng dẫn đau ngực",
            document_version="2026.1",
            content=content,
        ),
        "source_type": EvidenceSourceType.PROFESSIONAL_GUIDELINE,
        "source_name": "Clinical Society",
        "title": "Hướng dẫn đau ngực",
        "source_url": "https://example.org/guidelines/chest-pain",
        "document_version": "2026.1",
        "published_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
        "retrieved_at": datetime(2026, 6, 1, tzinfo=timezone.utc),
        "specialty_codes": ["CARDIOLOGY"],
        "language": "vi",
        "trust_tier": 2,
        "corpus_version": "medical-v2",
    }


def test_metadata_validator_accepts_allowlisted_provenance() -> None:
    metadata = validate_evidence_metadata(_valid_metadata())

    assert metadata.source_type is EvidenceSourceType.PROFESSIONAL_GUIDELINE
    assert metadata.specialty_codes == ["CARDIOLOGY"]


@pytest.mark.parametrize(
    "forbidden_key",
    ["patient_id", "session_id", "raw_query", "current_message", "prompt"],
)
def test_metadata_validator_rejects_phi_and_request_keys(
    forbidden_key: str,
) -> None:
    raw_metadata = _valid_metadata()
    raw_metadata[forbidden_key] = "must-not-be-stored"

    with pytest.raises(
        EvidenceMetadataValidationError,
        match=rf"Forbidden metadata keys: {forbidden_key}",
    ):
        validate_evidence_metadata(raw_metadata)


def test_metadata_validator_rejects_unknown_keys() -> None:
    raw_metadata = _valid_metadata()
    raw_metadata["unreviewed_field"] = "value"

    with pytest.raises(
        EvidenceMetadataValidationError,
        match="Unknown metadata keys: unreviewed_field",
    ):
        validate_evidence_metadata(raw_metadata)


def test_metadata_validator_requires_provenance() -> None:
    raw_metadata = _valid_metadata()
    del raw_metadata["source_name"]

    with pytest.raises(
        EvidenceMetadataValidationError,
        match="Evidence metadata failed schema validation",
    ):
        validate_evidence_metadata(raw_metadata)


def test_evidence_id_is_stable_after_safe_normalization() -> None:
    first = generate_evidence_id(
        source_type=EvidenceSourceType.PUBMED,
        source_url="HTTPS://PUBMED.NCBI.NLM.NIH.GOV/123/",
        title="  Chest   pain ",
        document_version=" 1 ",
        content="Acute\n chest pain",
    )
    second = generate_evidence_id(
        source_type=EvidenceSourceType.PUBMED,
        source_url="https://pubmed.ncbi.nlm.nih.gov/123",
        title="Chest pain",
        document_version="1",
        content="Acute chest pain",
    )

    assert first == second
    assert len(first) == 64


def test_evidence_id_changes_when_chunk_content_changes() -> None:
    common = {
        "source_type": EvidenceSourceType.PUBMED,
        "source_url": "https://pubmed.ncbi.nlm.nih.gov/123",
        "title": "Chest pain",
        "document_version": "1",
    }

    first = generate_evidence_id(content="First chunk", **common)
    second = generate_evidence_id(content="Second chunk", **common)

    assert first != second


def test_evidence_id_rejects_empty_content() -> None:
    with pytest.raises(ValueError, match="Evidence content must not be empty"):
        generate_evidence_id(
            source_type=EvidenceSourceType.HOSPITAL,
            source_url=None,
            title="Reference",
            document_version=None,
            content=" \n ",
        )


def test_structured_retrieval_models_reject_extra_fields() -> None:
    metadata = EvidenceMetadata.model_validate(_valid_metadata())
    chunk = EvidenceChunk(content="Clinical evidence", metadata=metadata)
    query = RetrievalQuery(text="Tôi bị đau ngực")
    result = RetrievalResult(evidence=[chunk], corpus_version="medical-v2")

    assert query.max_candidates == 20
    assert result.evidence[0].metadata.evidence_id == metadata.evidence_id

    with pytest.raises(ValidationError):
        RetrievalQuery(text="Tôi bị đau ngực", patient_id="patient-1")

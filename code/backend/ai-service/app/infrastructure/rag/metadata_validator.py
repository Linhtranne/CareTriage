from collections.abc import Mapping
from typing import Any

from app.domain.schemas import EvidenceMetadata

ALLOWED_METADATA_KEYS = frozenset(EvidenceMetadata.model_fields)

FORBIDDEN_METADATA_KEYS = frozenset(
    {
        "conversation_history",
        "current_message",
        "email",
        "message",
        "patient_id",
        "patient_name",
        "phone",
        "prompt",
        "query",
        "raw_query",
        "session_id",
        "turn_id",
        "user_id",
    }
)


class EvidenceMetadataValidationError(ValueError):
    """Raised when vector metadata violates the safe metadata contract."""


def validate_evidence_metadata(
    raw_metadata: Mapping[str, Any],
) -> EvidenceMetadata:
    """Validate allowlisted provenance metadata before vector persistence."""
    received_keys = set(raw_metadata)
    forbidden_keys = received_keys & FORBIDDEN_METADATA_KEYS
    if forbidden_keys:
        names = ", ".join(sorted(forbidden_keys))
        raise EvidenceMetadataValidationError(f"Forbidden metadata keys: {names}")

    unknown_keys = received_keys - ALLOWED_METADATA_KEYS
    if unknown_keys:
        names = ", ".join(sorted(unknown_keys))
        raise EvidenceMetadataValidationError(f"Unknown metadata keys: {names}")

    try:
        return EvidenceMetadata.model_validate(dict(raw_metadata))
    except ValueError as error:
        raise EvidenceMetadataValidationError(
            "Evidence metadata failed schema validation"
        ) from error

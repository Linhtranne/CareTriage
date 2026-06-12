import hashlib
import json
import re
import unicodedata
from urllib.parse import urlsplit, urlunsplit

from app.domain.schemas import EvidenceSourceType

_WHITESPACE = re.compile(r"\s+")


def _normalize_text(value: str) -> str:
    normalized = unicodedata.normalize("NFKC", value)
    return _WHITESPACE.sub(" ", normalized).strip()


def _canonicalize_url(source_url: str | None) -> str:
    if not source_url:
        return ""

    normalized = _normalize_text(source_url)
    parts = urlsplit(normalized)
    path = parts.path.rstrip("/")
    return urlunsplit(
        (
            parts.scheme.lower(),
            parts.netloc.lower(),
            path,
            parts.query,
            "",
        )
    )


def generate_evidence_id(
    *,
    source_type: EvidenceSourceType,
    source_url: str | None,
    title: str,
    document_version: str | None,
    content: str,
) -> str:
    """Generate a stable identifier from source provenance and chunk content."""
    normalized_content = _normalize_text(content)
    if not normalized_content:
        raise ValueError("Evidence content must not be empty")

    identity = {
        "content": normalized_content,
        "document_version": _normalize_text(document_version or ""),
        "source_type": source_type.value,
        "source_url": _canonicalize_url(source_url),
        "title": _normalize_text(title),
    }
    serialized = json.dumps(
        identity,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

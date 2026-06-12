FORBIDDEN_LOG_KEYS = {
    "message",
    "prompt",
    "raw_text",
    "context",
    "api_key",
    "secret",
    "file_content",
    "patient_message",
    "clinical_reasoning_summary",
    "conversation_history",
    "attachments",
    "query",
    "patient_id",
}


def sanitize_error(e: Exception) -> str:
    """Return exception metadata only, never the exception message."""
    return f"Exception type: {type(e).__name__}"


def assert_safe_log_payload(payload: dict) -> None:
    def walk(value):
        if isinstance(value, dict):
            unsafe_keys = FORBIDDEN_LOG_KEYS.intersection(value.keys())
            if unsafe_keys:
                raise ValueError("Unsafe payload: contains PHI or sensitive data")
            for nested_value in value.values():
                walk(nested_value)
        elif isinstance(value, list):
            for item in value:
                walk(item)

    walk(payload)

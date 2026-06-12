import json
from unittest.mock import MagicMock, patch

import pytest

from app.infrastructure.telemetry.langfuse_telemetry import LangfuseTelemetryClient
from app.infrastructure.telemetry.structured_logger import StructuredLogTelemetryClient


def test_telemetry_client_logs_json_and_excludes_phi():
    # Setup mock logger
    mock_logger = MagicMock()

    with patch("app.infrastructure.telemetry.structured_logger.logger", mock_logger):
        client = StructuredLogTelemetryClient()

        # Test request started
        client.track_request_started("session-123", "triage.analyze")

        # Verify logger was called
        mock_logger.info.assert_called_once()
        log_call = mock_logger.info.call_args[0][0]

        # Verify JSON
        log_data = json.loads(log_call)
        assert log_data["event"] == "request_started"
        assert log_data["session_id"] == "session-123"
        assert log_data["payload"]["action"] == "triage.analyze"

        # Ensure it has a timestamp
        assert "timestamp" in log_data

        # Test PHI inherently not present since method signatures don't allow it
        # No 'message', 'prompt', 'attachments' in payload
        assert "message" not in log_data["payload"]
        assert "prompt" not in log_data["payload"]


def test_telemetry_client_fallback():
    mock_logger = MagicMock()
    with patch("app.infrastructure.telemetry.structured_logger.logger", mock_logger):
        client = StructuredLogTelemetryClient()
        client.track_fallback_applied("session-123", "Low confidence")

        log_call = mock_logger.info.call_args[0][0]
        log_data = json.loads(log_call)
        assert log_data["event"] == "fallback_applied"
        assert log_data["payload"]["reason"] == "Low confidence"


def test_structured_logger_rejects_dangerous_keys():
    client = StructuredLogTelemetryClient()
    with pytest.raises(ValueError, match="Unsafe payload"):
        client._log_event("test_event", "session-123", {"message": "Patient data"})
    with pytest.raises(ValueError, match="Unsafe payload"):
        client._log_event("test_event", "session-123", {"patient_id": "patient-123"})
    with pytest.raises(ValueError, match="Unsafe payload"):
        client._log_event("test_event", "session-123", {"query": "chest pain"})
    with pytest.raises(ValueError, match="Unsafe payload"):
        client._log_event(
            "test_event", "session-123", {"metadata": {"raw_text": "clinical note"}}
        )


def test_structured_logger_sanitizes_error_values():
    mock_logger = MagicMock()
    with patch("app.infrastructure.telemetry.structured_logger.logger", mock_logger):
        client = StructuredLogTelemetryClient()
        client.track_llm_call_failed(
            "session-123", "gemini", "raw prompt: patient has chest pain"
        )

        log_data = json.loads(mock_logger.info.call_args[0][0])
        assert log_data["payload"]["error"] == "Exception type: Exception"
        assert "chest pain" not in json.dumps(log_data)


def test_langfuse_telemetry_rejects_dangerous_keys():
    with patch("app.infrastructure.telemetry.langfuse_telemetry.Langfuse"):
        client = LangfuseTelemetryClient("pk", "sk", "host")
        with pytest.raises(ValueError, match="Unsafe payload"):
            client._check_safe_payload({"prompt": "You are a doctor"})


def test_latency_is_numeric():
    mock_logger = MagicMock()
    with patch("app.infrastructure.telemetry.structured_logger.logger", mock_logger):
        client = StructuredLogTelemetryClient()
        client.track_llm_call_completed("session-123", "gpt-4", 120.5, 42)

        log_call = mock_logger.info.call_args[0][0]
        log_data = json.loads(log_call)
        assert log_data["event"] == "llm_call_completed"
        assert isinstance(log_data["payload"]["latency_ms"], (int, float))
        assert log_data["payload"]["latency_ms"] == 120.5


def test_langfuse_config_missing_returns_noop():
    from app.infrastructure.telemetry.factory import get_telemetry_client
    from app.infrastructure.telemetry.noop_telemetry import NoOpTelemetryClient

    # Setup settings with langfuse provider but no keys
    with patch(
        "app.infrastructure.telemetry.factory.get_settings",
        return_value={"telemetry_provider": "langfuse"},
    ):
        client = get_telemetry_client()
        assert isinstance(client, NoOpTelemetryClient)

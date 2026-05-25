import json
import logging
from unittest.mock import patch, MagicMock
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

package com.caretriage.application.dto;

import com.caretriage.shared.exception.ContractViolationException;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Set;

public record AiSseErrorPayload(
    @JsonProperty("turn_id") String turnId,
    String code,
    String message,
    boolean retryable
) {
    private static final Set<String> ALLOWED_CODES = Set.of(
        "LLM_PHASE_A_FAILED",
        "LLM_EMPTY_RESPONSE",
        "INTERNAL_STREAM_ERROR",
        "STREAM_TIMEOUT"
    );

    public void validateForTurn(String expectedTurnId) {
        if (turnId == null || !turnId.equals(expectedTurnId)) {
            throw new ContractViolationException("Error turn_id mismatch");
        }
        if (code == null || !ALLOWED_CODES.contains(code)) {
            throw new ContractViolationException("Unknown error code: " + code);
        }
        if (message == null || message.isBlank()) {
            throw new ContractViolationException("Error message is required");
        }
    }
}

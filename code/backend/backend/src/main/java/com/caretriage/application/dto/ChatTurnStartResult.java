package com.caretriage.application.dto;

import com.caretriage.domain.entity.ChatTurn;

public record ChatTurnStartResult(
    ChatTurn turn,
    StartStatus status,
    String persistedPayload
) {
    public enum StartStatus {
        NEW_OR_RETRY_FAILED,
        RUNNING_CONFLICT,       // HTTP 409
        TICKET_FINALIZING,      // HTTP 202
        STALE_PENDING,          // Need to reconcile
        COMPLETED_REPLAY        // Replay persisted_payload
    }
}

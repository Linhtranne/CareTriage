package com.caretriage.application.service.impl;

import com.caretriage.application.dto.AiSseFinalPayload;
import com.caretriage.application.dto.PersistedEventPayload;
import com.caretriage.domain.entity.ChatTurn;
import com.caretriage.domain.repository.ChatMessageRepository;
import com.caretriage.domain.repository.ChatTurnRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatTurnReconciliationService {

    private final ChatTurnRepository chatTurnRepository;
    private final ChatTurnFinalizer chatTurnFinalizer;
    private final TicketUpsertService ticketUpsertService;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    private static final int[] BACKOFF_SECONDS = {5, 30, 120};
    private static final int MAX_ATTEMPTS = 3;

    public record ReconcileResult(
        PersistedEventPayload payload,
        boolean isAlreadyDone,
        String errorMessage
    ) {
        public static ReconcileResult ok(PersistedEventPayload payload) {
            return new ReconcileResult(payload, false, null);
        }
        public static ReconcileResult alreadyDone(PersistedEventPayload payload) {
            return new ReconcileResult(payload, true, null);
        }
        public static ReconcileResult failed(String msg) {
            return new ReconcileResult(null, false, msg);
        }
    }

    public ReconcileResult reconcile(Long turnDbId, Long sessionId) {
        // Phase 1: Read (NO lock, NO transaction)
        ChatTurn turn = chatTurnRepository.findById(turnDbId)
            .orElseThrow(() -> new IllegalArgumentException("ChatTurn not found"));

        if (turn.getTicketStatus() != ChatTurn.TicketStatus.PENDING) {
            log.info("Reconcile turn {} already resolved: {}", turnDbId, turn.getTicketStatus());
            PersistedEventPayload payload = PersistedEventPayload.fromJson(turn.getPersistedPayload());
            return ReconcileResult.alreadyDone(payload);
        }

        AiSseFinalPayload finalPayload;
        try {
            finalPayload = AiSseFinalPayload.fromJson(turn.getFinalPayload());
            finalPayload.validateForTurn(turn.getTurnId());
        } catch (com.caretriage.shared.exception.ContractViolationException ex) {
            log.error("Reconcile turn {} has corrupt final_payload", turnDbId);
            chatTurnFinalizer.markReconcileFailed(turnDbId, ChatTurn.TicketStatus.FAILED_PERMANENT, "CORRUPT_PAYLOAD");
            return ReconcileResult.failed("CORRUPT_PAYLOAD");
        }

        // Phase 2: Call TicketUpsertService (isolated transaction)
        TicketUpsertService.TriageTicketResult ticketResult = null;
        boolean upsertSuccess = false;

        try {
            ticketResult = ticketUpsertService.upsertTicket(sessionId, finalPayload);
            upsertSuccess = true;
        } catch (RuntimeException ex) {
            log.error("Reconcile ticket upsert failed for turn {}: {}", turnDbId, ex.getMessage(), ex);
            handleUpsertFailure(turn, ex);
        }

        if (upsertSuccess && ticketResult != null) {
            // Phase 3: Ghi persisted_payload (isolated transaction, checks PENDING)
            String aiMessageId = chatMessageRepository
                .findAiMessageIdBySessionIdAndTurnId(sessionId, turn.getTurnId())
                .orElse(null);

            PersistedEventPayload persistedPayload = new PersistedEventPayload(
                turn.getTurnId(),
                aiMessageId,
                ChatTurn.TicketStatus.READY.name(),
                ticketResult.ticketId(),
                ticketResult.specialtyCode(),
                ticketResult.specialtyName(),
                finalPayload.redFlagDetected()
            );

            boolean recorded = chatTurnFinalizer.recordPersistedPayloadWithCheck(
                turnDbId,
                ChatTurn.TicketStatus.READY,
                ticketResult.ticketId(),
                persistedPayload
            );

            if (!recorded) {
                ChatTurn updatedTurn = chatTurnRepository.findById(turnDbId).orElseThrow();
                PersistedEventPayload payload = PersistedEventPayload.fromJson(updatedTurn.getPersistedPayload());
                return ReconcileResult.alreadyDone(payload);
            }
            return ReconcileResult.ok(persistedPayload);
        } else {
            ChatTurn updatedTurn = chatTurnRepository.findById(turnDbId).orElseThrow();
            PersistedEventPayload payload = PersistedEventPayload.fromJson(updatedTurn.getPersistedPayload());
            return ReconcileResult.failed("Ticket creation failed: " + updatedTurn.getTicketStatus());
        }
    }

    public void handleUpsertFailure(ChatTurn turn, Exception ex) {
        int attempts = turn.getTicketAttemptCount() + 1;
        boolean isPermanent = isPermanentError(ex);
        
        ChatTurn.TicketStatus nextStatus;
        java.time.LocalDateTime nextRetryAt = null;

        if (isPermanent || attempts >= MAX_ATTEMPTS) {
            nextStatus = ChatTurn.TicketStatus.FAILED_PERMANENT;
            log.info("Ticket final failure for turn {} after {} attempts: {}", turn.getId(), attempts, ex.getMessage());
        } else {
            nextStatus = ChatTurn.TicketStatus.FAILED_RETRYABLE;
            int backoffSec = BACKOFF_SECONDS[attempts - 1];
            nextRetryAt = java.time.LocalDateTime.now().plusSeconds(backoffSec);
            log.info("Ticket retryable failure for turn {} (attempt {}): {}", turn.getId(), attempts, ex.getMessage());
        }

        // Perform conditional update for attempt/retry info
        chatTurnRepository.updateTicketRetryConditional(
            turn.getId(),
            ChatTurn.TicketStatus.PENDING,
            nextStatus,
            nextRetryAt
        );

        // Also save persisted payload indicating error
        String aiMessageId = chatMessageRepository
            .findAiMessageIdBySessionIdAndTurnId(turn.getChatSession().getId(), turn.getTurnId())
            .orElse(null);

        boolean redFlagDetected = false;
        if (turn.getFinalPayload() != null) {
            try {
                AiSseFinalPayload finalPayload = objectMapper.readValue(turn.getFinalPayload(), AiSseFinalPayload.class);
                redFlagDetected = finalPayload.redFlagDetected();
            } catch (Exception e) {
                log.warn("Failed to parse final payload in handleUpsertFailure", e);
            }
        }

        PersistedEventPayload errorPayload = new PersistedEventPayload(
            turn.getTurnId(),
            aiMessageId,
            nextStatus.name(),
            null,
            null,
            null,
            redFlagDetected
        );
        chatTurnRepository.updateTicketStatusConditional(
            turn.getId(),
            nextStatus,
            nextStatus,
            null,
            serializeJson(errorPayload)
        );
    }

    private boolean isPermanentError(Exception ex) {
        if (ex instanceof IllegalArgumentException || ex instanceof NullPointerException) {
            return true;
        }
        String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase() : "";
        return msg.contains("validation")
            || msg.contains("constraint")
            || msg.contains("duplicate")
            || msg.contains("not-null");
    }

    private String serializeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize reconciliation payload", e);
        }
    }
}

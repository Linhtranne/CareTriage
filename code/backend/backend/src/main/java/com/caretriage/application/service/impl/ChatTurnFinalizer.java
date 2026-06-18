package com.caretriage.application.service.impl;

import com.caretriage.application.dto.AiSseFinalPayload;
import com.caretriage.application.dto.PersistedEventPayload;
import com.caretriage.domain.entity.ChatMessage;
import com.caretriage.domain.entity.ChatTurn;
import com.caretriage.domain.repository.ChatMessageRepository;
import com.caretriage.domain.repository.ChatTurnRepository;
import com.caretriage.shared.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ChatTurnFinalizer {

    private final ChatTurnRepository chatTurnRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

    public record FinalizeResult(
        String aiMessageId,
        ChatTurn.TicketStatus initialTicketStatus,
        boolean isAlreadyHandled
    ) {}

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public FinalizeResult persistAiAndCompleteTurn(Long turnDbId, AiSseFinalPayload finalPayload) {
        ChatTurn turn = chatTurnRepository.findByIdForUpdate(turnDbId)
            .orElseThrow(() -> new ResourceNotFoundException("ChatTurn not found"));

        if (turn.getStatus() == ChatTurn.TurnStatus.COMPLETED || turn.getStatus() == ChatTurn.TurnStatus.FAILED) {
            log.info("persistAiAndCompleteTurn: turn {} is already completed or failed", turnDbId);
            String existingAiMsgId = chatMessageRepository
                .findAiMessageIdBySessionIdAndTurnId(turn.getChatSession().getId(), turn.getTurnId())
                .orElse(null);
            return new FinalizeResult(existingAiMsgId, turn.getTicketStatus(), true);
        }

        // 1. Create and save AI message
        String finalPayloadJson = serializeJson(finalPayload);
        ChatMessage aiMessage = ChatMessage.builder()
            .chatSession(turn.getChatSession())
            .content(finalPayload.reply())
            .senderType(ChatMessage.SenderType.AI)
            .metadata(finalPayloadJson)
            .turnId(turn.getTurnId())
            .build();
        aiMessage = chatMessageRepository.save(aiMessage);

        // 2. Determine ticket status
        boolean needsTicket = finalPayload.intakeComplete() && "OK".equalsIgnoreCase(finalPayload.classificationStatus());
        ChatTurn.TicketStatus ticketStatus = needsTicket ? ChatTurn.TicketStatus.PENDING : ChatTurn.TicketStatus.NOT_NEEDED;

        // 3. Conditional update turn status to COMPLETED and save finalPayload
        turn.setStatus(ChatTurn.TurnStatus.COMPLETED);
        turn.setTicketStatus(ticketStatus);
        turn.setFinalPayload(finalPayloadJson);
        chatTurnRepository.saveAndFlush(turn);

        return new FinalizeResult(aiMessage.getId().toString(), ticketStatus, false);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean recordPersistedPayloadWithCheck(
            Long turnDbId,
            ChatTurn.TicketStatus ticketStatus,
            String ticketId,
            PersistedEventPayload payload) {
        
        ChatTurn turn = chatTurnRepository.findByIdForUpdate(turnDbId)
            .orElseThrow(() -> new ResourceNotFoundException("ChatTurn not found"));

        if (turn.getTicketStatus() != ChatTurn.TicketStatus.PENDING) {
            log.debug("recordPersistedPayloadWithCheck no-op: turn {} is {}", turnDbId, turn.getTicketStatus());
            return false;
        }

        int updated = chatTurnRepository.updateTicketStatusConditional(
            turnDbId,
            ChatTurn.TicketStatus.PENDING,
            ticketStatus,
            ticketId,
            serializeJson(payload)
        );
        return updated > 0;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordPersistedPayload(
            Long turnDbId,
            ChatTurn.TicketStatus ticketStatus,
            String ticketId,
            PersistedEventPayload payload) {
        chatTurnRepository.updateTicketStatusConditional(
            turnDbId,
            ChatTurn.TicketStatus.PENDING,
            ticketStatus,
            ticketId,
            serializeJson(payload)
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markReconcileFailed(
            Long turnDbId,
            ChatTurn.TicketStatus failedStatus,
            String aiMessageId,
            boolean redFlagDetected,
            String errorCode) {
        ChatTurn turn = chatTurnRepository.findByIdForUpdate(turnDbId)
            .orElseThrow(() -> new ResourceNotFoundException("ChatTurn not found"));
        
        PersistedEventPayload payload = new PersistedEventPayload(
            turn.getTurnId(),
            aiMessageId,
            failedStatus.name(),
            null,
            null,
            null,
            redFlagDetected
        );
        chatTurnRepository.updateTicketStatusAndErrorConditional(
            turnDbId,
            ChatTurn.TicketStatus.PENDING,
            failedStatus,
            null,
            serializeJson(payload),
            errorCode
        );
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markReconcileFailed(
            Long turnDbId,
            ChatTurn.TicketStatus failedStatus,
            String errorCode) {
        ChatTurn turn = chatTurnRepository.findByIdForUpdate(turnDbId)
            .orElseThrow(() -> new ResourceNotFoundException("ChatTurn not found"));
        
        String aiMessageId = chatMessageRepository
            .findAiMessageIdBySessionIdAndTurnId(turn.getChatSession().getId(), turn.getTurnId())
            .orElse(null);
            
        boolean redFlagDetected = false;
        if (turn.getFinalPayload() != null) {
            try {
                AiSseFinalPayload finalPayload = objectMapper.readValue(turn.getFinalPayload(), AiSseFinalPayload.class);
                redFlagDetected = finalPayload.redFlagDetected();
            } catch (Exception e) {
                log.warn("Failed to parse final payload during reconcile fail fallback", e);
            }
        }

        markReconcileFailed(turnDbId, failedStatus, aiMessageId, redFlagDetected, errorCode);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateTurnToStreaming(Long turnDbId) {
        chatTurnRepository.updateStatusConditional(turnDbId, ChatTurn.TurnStatus.STARTED, ChatTurn.TurnStatus.STREAMING);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markTurnFailed(Long turnDbId, String errorCode) {
        chatTurnRepository.failTurnConditional(
            turnDbId,
            ChatTurn.TurnStatus.FAILED,
            errorCode,
            java.util.List.of(ChatTurn.TurnStatus.STARTED, ChatTurn.TurnStatus.STREAMING)
        );
    }

    private String serializeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize chat turn payload", e);
        }
    }
}


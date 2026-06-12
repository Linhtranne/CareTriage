package com.caretriage.application.service.impl;

import com.caretriage.application.dto.AiSseFinalPayload;
import com.caretriage.domain.entity.ChatSession;
import com.caretriage.domain.entity.TicketCategory;
import com.caretriage.domain.entity.TriageTicket;
import com.caretriage.domain.repository.ChatSessionRepository;
import com.caretriage.domain.repository.TicketCategoryRepository;
import com.caretriage.domain.repository.TriageTicketRepository;
import com.caretriage.shared.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TicketUpsertService {

    private final TriageTicketRepository triageTicketRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final TicketCategoryRepository ticketCategoryRepository;
    private final ObjectMapper objectMapper;

    public record TriageTicketResult(
        String ticketId,
        String specialtyCode,
        String specialtyName
    ) {}

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public TriageTicketResult upsertTicket(Long sessionId, AiSseFinalPayload payload) {
        try {
            return performUpsert(sessionId, payload);
        } catch (DataIntegrityViolationException ex) {
            log.info("Ticket upsert conflict detected for session {}, reloading ticket...", sessionId);
            // Race condition: reload ticket from database
            TriageTicket existingTicket = triageTicketRepository.findOptionalByChatSessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("TriageTicket not found after conflict"));
            return new TriageTicketResult(
                existingTicket.getId().toString(),
                payload.triageResult().suggestedDepartmentCode(),
                payload.triageResult().suggestedDepartmentName()
            );
        }
    }

    private TriageTicketResult performUpsert(Long sessionId, AiSseFinalPayload payload) {
        ChatSession session = chatSessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("ChatSession not found"));

        Optional<TriageTicket> existingOpt = triageTicketRepository.findOptionalByChatSessionId(sessionId);
        
        TriageTicket ticket;
        String ticketNumber = "TRIAGE-" + sessionId;
        
        AiSseFinalPayload.TriageResult tr = payload.triageResult();
        String summary = tr != null ? tr.summary() : "Sơ chẩn sức khỏe AI.";
        String urgency = tr != null ? tr.urgencyLevel() : "MEDIUM";
        
        TriageTicket.Priority priority = mapPriority(urgency);
        TriageTicket.Severity severity = mapSeverity(urgency);

        String aiSnapshotStr = null;
        try {
            aiSnapshotStr = objectMapper.writeValueAsString(tr);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize AI analysis result for snapshot: {}", e.getMessage());
        }

        if (existingOpt.isEmpty()) {
            Optional<TicketCategory> defaultCategory = ticketCategoryRepository.findByCode("TRIAGE_GENERAL");

            ticket = TriageTicket.builder()
                .ticketNumber(ticketNumber)
                .title("Triage ticket - session " + sessionId)
                .description(summary)
                .status(TriageTicket.Status.NEW)
                .priority(priority)
                .severity(severity)
                .requester(session.getUser())
                .category(defaultCategory.orElse(null))
                .doctorReviewStatus(TriageTicket.DoctorReviewStatus.AI_ANALYSIS_PENDING_REVIEW)
                .aiAnalysisSnapshot(aiSnapshotStr)
                .chatSession(session)
                .build();
        } else {
            ticket = existingOpt.get();
            ticket.setDescription(summary);
            ticket.setPriority(priority);
            ticket.setSeverity(severity);
            ticket.setAiAnalysisSnapshot(aiSnapshotStr);
            ticket.setUpdatedAt(LocalDateTime.now());
        }

        ticket = triageTicketRepository.saveAndFlush(ticket);
        
        return new TriageTicketResult(
            ticket.getId().toString(),
            tr != null ? tr.suggestedDepartmentCode() : "GENERAL",
            tr != null ? tr.suggestedDepartmentName() : "Nội tổng quát"
        );
    }

    private TriageTicket.Priority mapPriority(String urgency) {
        if (urgency == null) return TriageTicket.Priority.MEDIUM;
        return switch (urgency.toUpperCase()) {
            case "EMERGENCY", "HIGH" -> TriageTicket.Priority.URGENT;
            case "MEDIUM" -> TriageTicket.Priority.MEDIUM;
            default -> TriageTicket.Priority.LOW;
        };
    }

    private TriageTicket.Severity mapSeverity(String urgency) {
        if (urgency == null) return TriageTicket.Severity.MINOR;
        return switch (urgency.toUpperCase()) {
            case "EMERGENCY", "HIGH" -> TriageTicket.Severity.CRITICAL;
            case "MEDIUM" -> TriageTicket.Severity.MAJOR;
            default -> TriageTicket.Severity.MINOR;
        };
    }
}

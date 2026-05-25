package com.caretriage.service.impl;

import com.caretriage.dto.request.AssignTriageTicketRequest;
import com.caretriage.dto.request.ReviewTriageTicketRequest;
import com.caretriage.dto.ChatMessageDTO;
import com.caretriage.dto.response.PagedResponse;
import com.caretriage.dto.response.TriageTicketResponse;
import com.caretriage.entity.TicketCategory;
import com.caretriage.entity.TriageTicket;
import com.caretriage.entity.User;
import com.caretriage.event.TriageTicketStatusChangedEvent;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.TicketCategoryRepository;
import com.caretriage.repository.TriageTicketRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.TriageTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TriageTicketServiceImpl implements TriageTicketService {

    private final TriageTicketRepository triageTicketRepository;
    private final UserRepository userRepository;
    private final TicketCategoryRepository ticketCategoryRepository;
    private final com.caretriage.repository.ChatSessionRepository chatSessionRepository;
    private final com.caretriage.repository.ChatMessageRepository chatMessageRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public PagedResponse<TriageTicketResponse> listPendingTickets(int page, int size, TriageTicket.Priority priority) {
        Pageable pageable = PageRequest.of(page, size);
        Page<TriageTicket> tickets = priority == null
                ? triageTicketRepository.findByStatusOrderByCreatedAtAsc(TriageTicket.Status.NEW, pageable)
                : triageTicketRepository.findByStatusAndPriorityOrderByCreatedAtAsc(TriageTicket.Status.NEW, priority, pageable);

        List<TriageTicketResponse> content = tickets.getContent().stream().map(this::toResponse).toList();
        return PagedResponse.<TriageTicketResponse>builder()
                .content(content)
                .page(tickets.getNumber())
                .size(tickets.getSize())
                .totalElements(tickets.getTotalElements())
                .totalPages(tickets.getTotalPages())
                .last(tickets.isLast())
                .build();
    }

    @Override
    @Transactional
    public TriageTicketResponse assignTicket(AssignTriageTicketRequest request, Long actorUserId) {
        TriageTicket ticket = triageTicketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Triage ticket not found"));

        User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));

        if (ticket.getStatus() != TriageTicket.Status.NEW) {
            throw new IllegalStateException("Only NEW tickets can be assigned");
        }

        TriageTicket.Status previousStatus = ticket.getStatus();
        ticket.setTriageOfficer(assignee);
        ticket.setStatus(TriageTicket.Status.IN_TRIAGE);
        TriageTicket saved = triageTicketRepository.save(ticket);
        eventPublisher.publishEvent(new TriageTicketStatusChangedEvent(saved.getId(), previousStatus, saved.getStatus()));
        return toResponse(saved);
    }

    @Override
    @Transactional
    public TriageTicketResponse reviewTicket(ReviewTriageTicketRequest request, Long actorUserId) {
        TriageTicket ticket = triageTicketRepository.findById(request.getTicketId())
                .orElseThrow(() -> new ResourceNotFoundException("Triage ticket not found"));

        if (ticket.getTriageOfficer() == null || !ticket.getTriageOfficer().getId().equals(actorUserId)) {
            throw new IllegalStateException("Only assigned triage officer can review this ticket");
        }

        if (request.getCategoryId() != null) {
            TicketCategory category = ticketCategoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Ticket category not found"));
            ticket.setCategory(category);
        }

        if (request.getSeverity() != null) {
            ticket.setSeverity(request.getSeverity());
        }

        TriageTicket.Status previousStatus = ticket.getStatus();
        ticket.setStatus(request.getDecision() == ReviewTriageTicketRequest.Decision.APPROVE
                ? TriageTicket.Status.TRIAGED
                : TriageTicket.Status.REJECTED);
        ticket.setTriagedAt(LocalDateTime.now());

        TriageTicket saved = triageTicketRepository.save(ticket);
        eventPublisher.publishEvent(new TriageTicketStatusChangedEvent(saved.getId(), previousStatus, saved.getStatus()));
        return toResponse(saved);
    }

    @Override
    public TriageTicketResponse getTicketDetail(java.util.UUID ticketId, Long actorUserId) {
        TriageTicket ticket = triageTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Triage ticket not found"));
        validateTicketAccess(ticket, actorUserId);
        return toResponse(ticket);
    }

    @Override
    public List<ChatMessageDTO> getTicketChatHistory(java.util.UUID ticketId, Long actorUserId) {
        TriageTicket ticket = triageTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Triage ticket not found"));
        validateTicketAccess(ticket, actorUserId);
        return getChatHistoryByTicket(ticket);
    }

    @Override
    public PagedResponse<TriageTicketResponse> listMyTickets(Long requesterUserId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        List<TriageTicketResponse> all = triageTicketRepository.findByRequesterIdOrderByCreatedAtDesc(requesterUserId)
                .stream()
                .map(this::toResponse)
                .toList();

        int start = Math.min(page * size, all.size());
        int end = Math.min(start + size, all.size());
        List<TriageTicketResponse> content = all.subList(start, end);

        return PagedResponse.<TriageTicketResponse>builder()
                .content(content)
                .page(page)
                .size(size)
                .totalElements(all.size())
                .totalPages((int) Math.ceil((double) all.size() / size))
                .last(end >= all.size())
                .build();
    }

    @Override
    public TriageTicketResponse getMyTicketDetail(UUID ticketId, Long requesterUserId) {
        TriageTicket ticket = triageTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Triage ticket not found"));
        if (ticket.getRequester() == null || !ticket.getRequester().getId().equals(requesterUserId)) {
            throw new ResourceNotFoundException("Triage ticket not found");
        }
        return toResponse(ticket);
    }

    @Override
    public List<ChatMessageDTO> getMyTicketChatHistory(UUID ticketId, Long requesterUserId) {
        TriageTicket ticket = triageTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Triage ticket not found"));
        if (ticket.getRequester() == null || !ticket.getRequester().getId().equals(requesterUserId)) {
            throw new ResourceNotFoundException("Triage ticket not found");
        }

        return getChatHistoryByTicket(ticket);
    }

    private List<ChatMessageDTO> getChatHistoryByTicket(TriageTicket ticket) {
        Long sessionId = extractSessionId(ticket.getMetadata());
        if (sessionId == null) {
            return List.of();
        }

        return chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(m -> ChatMessageDTO.builder()
                        .id(m.getId())
                        .sessionId(sessionId)
                        .content(m.getContent())
                        .senderType(m.getSenderType())
                        .metadata(m.getMetadata())
                        .createdAt(m.getCreatedAt())
                        .status(ChatMessageDTO.MessageStatus.SENT)
                        .build())
                .toList();
    }

    private Long extractSessionId(String metadata) {
        if (metadata == null || metadata.isBlank()) {
            return null;
        }
        try {
            com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(metadata);
            return node.has("session_id") ? node.get("session_id").asLong() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private TriageTicketResponse toResponse(TriageTicket ticket) {
        return TriageTicketResponse.builder()
                .id(ticket.getId())
                .ticketNumber(ticket.getTicketNumber())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .priority(ticket.getPriority())
                .severity(ticket.getSeverity())
                .requesterId(ticket.getRequester() != null ? ticket.getRequester().getId() : null)
                .requesterName(ticket.getRequester() != null ? ticket.getRequester().getFullName() : null)
                .triageOfficerId(ticket.getTriageOfficer() != null ? ticket.getTriageOfficer().getId() : null)
                .triageOfficerName(ticket.getTriageOfficer() != null ? ticket.getTriageOfficer().getFullName() : null)
                .categoryId(ticket.getCategory() != null ? ticket.getCategory().getId() : null)
                .categoryName(ticket.getCategory() != null ? ticket.getCategory().getName() : null)
                .metadata(ticket.getMetadata())
                .doctorReviewStatus(ticket.getDoctorReviewStatus())
                .reviewedById(ticket.getReviewedBy() != null ? ticket.getReviewedBy().getId() : null)
                .reviewedByName(ticket.getReviewedBy() != null ? ticket.getReviewedBy().getFullName() : null)
                .reviewedAt(ticket.getReviewedAt())
                .confirmedDepartment(ticket.getConfirmedDepartment())
                .confirmedUrgency(ticket.getConfirmedUrgency())
                .aiAnalysisSnapshot(ticket.getAiAnalysisSnapshot())
                .doctorEditsSnapshot(ticket.getDoctorEditsSnapshot())
                .doctorConfirmedSummary(ticket.getDoctorConfirmedSummary())
                .doctorNotes(ticket.getDoctorNotes())
                .triagedAt(ticket.getTriagedAt())
                .createdAt(ticket.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public TriageTicketResponse doctorReview(java.util.UUID ticketId, com.caretriage.dto.request.DoctorReviewRequest request, Long doctorUserId) {
        TriageTicket ticket = triageTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Triage ticket not found"));

        validateTicketAccess(ticket, doctorUserId);

        User doctor = userRepository.findById(doctorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        TriageTicket.DoctorReviewStatus reviewStatus;
        try {
            reviewStatus = TriageTicket.DoctorReviewStatus.valueOf(request.getReviewStatus());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new com.caretriage.exception.BusinessException("Trạng thái phê duyệt không hợp lệ: " + request.getReviewStatus());
        }
        ticket.setDoctorReviewStatus(reviewStatus);
        ticket.setReviewedBy(doctor);
        ticket.setReviewedAt(LocalDateTime.now());
        ticket.setDoctorNotes(request.getDoctorNotes());
        ticket.setDoctorConfirmedSummary(request.getConfirmedSummary());

        if (request.getConfirmedDepartmentId() != null) {
            TicketCategory category = ticketCategoryRepository.findById(request.getConfirmedDepartmentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Confirmed department not found"));
            ticket.setCategory(category);
            ticket.setConfirmedDepartment(category.getName());
        }

        if (request.getConfirmedUrgency() != null) {
            ticket.setConfirmedUrgency(request.getConfirmedUrgency());
            TriageTicket.Priority priority = mapPriority(request.getConfirmedUrgency());
            TriageTicket.Severity severity = mapSeverity(request.getConfirmedUrgency());
            ticket.setPriority(priority);
            ticket.setSeverity(severity);
        }

        TriageTicket.Status previousStatus = ticket.getStatus();
        if (reviewStatus == TriageTicket.DoctorReviewStatus.DOCTOR_CONFIRMED || reviewStatus == TriageTicket.DoctorReviewStatus.DOCTOR_EDITED) {
            ticket.setStatus(TriageTicket.Status.TRIAGED);
            ticket.setTriagedAt(LocalDateTime.now());
        } else if (reviewStatus == TriageTicket.DoctorReviewStatus.REJECTED) {
            ticket.setStatus(TriageTicket.Status.REJECTED);
        } else if (reviewStatus == TriageTicket.DoctorReviewStatus.NEEDS_MORE_INFORMATION) {
            ticket.setStatus(TriageTicket.Status.IN_TRIAGE);
        }

        try {
            java.util.Map<String, Object> edits = new java.util.HashMap<>();
            edits.put("original_ai_snapshot", ticket.getAiAnalysisSnapshot());
            edits.put("confirmed_department", ticket.getConfirmedDepartment());
            edits.put("confirmed_urgency", ticket.getConfirmedUrgency());
            edits.put("confirmed_summary", ticket.getDoctorConfirmedSummary());
            edits.put("reviewed_by", doctor.getFullName());
            edits.put("reviewed_at", ticket.getReviewedAt().toString());
            ticket.setDoctorEditsSnapshot(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(edits));
        } catch (Exception e) {
            // Ignore exception
        }

        TriageTicket saved = triageTicketRepository.save(ticket);
        eventPublisher.publishEvent(new TriageTicketStatusChangedEvent(saved.getId(), previousStatus, saved.getStatus()));
        return toResponse(saved);
    }

    private TriageTicket.Priority mapPriority(String urgency) {
        return switch (urgency.toUpperCase()) {
            case "EMERGENCY", "HIGH", "CRITICAL" -> TriageTicket.Priority.URGENT;
            case "MEDIUM" -> TriageTicket.Priority.MEDIUM;
            default -> TriageTicket.Priority.LOW;
        };
    }

    private TriageTicket.Severity mapSeverity(String urgency) {
        return switch (urgency.toUpperCase()) {
            case "EMERGENCY", "CRITICAL" -> TriageTicket.Severity.CRITICAL;
            case "HIGH" -> TriageTicket.Severity.MAJOR;
            case "MEDIUM" -> TriageTicket.Severity.MINOR;
            default -> TriageTicket.Severity.COSMETIC;
        };
    }

    private void validateTicketAccess(TriageTicket ticket, Long actorUserId) {
        User actor = userRepository.findById(actorUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Actor user not found"));
        
        boolean isAdmin = actor.getRoles().stream().anyMatch(r -> r.getName().equals("ADMIN"));
        if (isAdmin) {
            return; // Admin has full access
        }

        boolean isDoctor = actor.getRoles().stream().anyMatch(r -> r.getName().equals("DOCTOR"));
        if (isDoctor) {
            // Doctor can access if it is NEW and unassigned, or assigned to this doctor, or reviewed by this doctor
            boolean isNewUnassigned = ticket.getStatus() == TriageTicket.Status.NEW && ticket.getTriageOfficer() == null;
            boolean isAssignedToMe = ticket.getTriageOfficer() != null && ticket.getTriageOfficer().getId().equals(actor.getId());
            boolean isReviewedByMe = ticket.getReviewedBy() != null && ticket.getReviewedBy().getId().equals(actor.getId());
            
            if (isNewUnassigned || isAssignedToMe || isReviewedByMe) {
                return;
            }
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền truy cập ticket này");
        }

        // Patient can only access their own tickets
        if (ticket.getRequester() != null && ticket.getRequester().getId().equals(actor.getId())) {
            return;
        }

        throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền truy cập ticket này");
    }
}

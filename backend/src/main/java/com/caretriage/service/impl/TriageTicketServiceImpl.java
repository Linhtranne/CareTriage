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
        return toResponse(ticket);
    }

    @Override
    public List<ChatMessageDTO> getTicketChatHistory(java.util.UUID ticketId, Long actorUserId) {
        TriageTicket ticket = triageTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Triage ticket not found"));

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
                .triagedAt(ticket.getTriagedAt())
                .createdAt(ticket.getCreatedAt())
                .build();
    }
}

package com.caretriage.service;

import com.caretriage.dto.ChatMessageDTO;
import com.caretriage.dto.request.AssignTriageTicketRequest;
import com.caretriage.dto.request.ReviewTriageTicketRequest;
import com.caretriage.dto.response.PagedResponse;
import com.caretriage.dto.response.TriageTicketResponse;
import com.caretriage.entity.TriageTicket;

public interface TriageTicketService {
    PagedResponse<TriageTicketResponse> listPendingTickets(int page, int size, TriageTicket.Priority priority);

    TriageTicketResponse assignTicket(AssignTriageTicketRequest request, Long actorUserId);

    TriageTicketResponse reviewTicket(ReviewTriageTicketRequest request, Long actorUserId);

    TriageTicketResponse getTicketDetail(java.util.UUID ticketId, Long actorUserId);

    java.util.List<ChatMessageDTO> getTicketChatHistory(java.util.UUID ticketId, Long actorUserId);

    PagedResponse<TriageTicketResponse> listMyTickets(Long requesterUserId, int page, int size);

    TriageTicketResponse getMyTicketDetail(java.util.UUID ticketId, Long requesterUserId);

    java.util.List<ChatMessageDTO> getMyTicketChatHistory(java.util.UUID ticketId, Long requesterUserId);
}

package com.caretriage.application.service;

import com.caretriage.application.dto.ChatMessageDTO;
import com.caretriage.application.dto.request.AssignTriageTicketRequest;
import com.caretriage.application.dto.request.ReviewTriageTicketRequest;
import com.caretriage.application.dto.response.PagedResponse;
import com.caretriage.application.dto.response.TriageTicketResponse;
import com.caretriage.domain.entity.TriageTicket;

public interface TriageTicketService {
    PagedResponse<TriageTicketResponse> listPendingTickets(int page, int size, TriageTicket.Priority priority);

    TriageTicketResponse assignTicket(AssignTriageTicketRequest request, Long actorUserId);

    TriageTicketResponse reviewTicket(ReviewTriageTicketRequest request, Long actorUserId);

    TriageTicketResponse getTicketDetail(java.util.UUID ticketId, Long actorUserId);

    java.util.List<ChatMessageDTO> getTicketChatHistory(java.util.UUID ticketId, Long actorUserId);

    PagedResponse<TriageTicketResponse> listMyTickets(Long requesterUserId, int page, int size);

    TriageTicketResponse getMyTicketDetail(java.util.UUID ticketId, Long requesterUserId);

    java.util.List<ChatMessageDTO> getMyTicketChatHistory(java.util.UUID ticketId, Long requesterUserId);

    TriageTicketResponse doctorReview(java.util.UUID ticketId, com.caretriage.application.dto.request.DoctorReviewRequest request, Long doctorUserId);
}

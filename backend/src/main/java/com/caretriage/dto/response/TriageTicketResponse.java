package com.caretriage.dto.response;

import com.caretriage.entity.TriageTicket;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class TriageTicketResponse {
    private UUID id;
    private String ticketNumber;
    private String title;
    private String description;
    private TriageTicket.Status status;
    private TriageTicket.Priority priority;
    private TriageTicket.Severity severity;
    private Long requesterId;
    private String requesterName;
    private Long triageOfficerId;
    private String triageOfficerName;
    private Long categoryId;
    private String categoryName;
    private String metadata;
    private LocalDateTime triagedAt;
    private LocalDateTime createdAt;
}

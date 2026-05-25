package com.caretriage.application.dto.response;

import com.caretriage.domain.entity.TriageTicket;
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
    private TriageTicket.DoctorReviewStatus doctorReviewStatus;
    private Long reviewedById;
    private String reviewedByName;
    private LocalDateTime reviewedAt;
    private String confirmedDepartment;
    private String confirmedUrgency;
    private String aiAnalysisSnapshot;
    private String doctorEditsSnapshot;
    private String doctorConfirmedSummary;
    private String doctorNotes;
    private LocalDateTime triagedAt;
    private LocalDateTime createdAt;
}

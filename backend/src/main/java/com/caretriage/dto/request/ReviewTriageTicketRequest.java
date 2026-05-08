package com.caretriage.dto.request;

import com.caretriage.entity.TriageTicket;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class ReviewTriageTicketRequest {

    @NotNull(message = "ticketId is required")
    private UUID ticketId;

    @NotNull(message = "decision is required")
    private Decision decision;

    private Long categoryId;

    private TriageTicket.Severity severity;

    private String notes;

    public enum Decision {
        APPROVE,
        REJECT
    }
}

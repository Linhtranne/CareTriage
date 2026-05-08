package com.caretriage.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class AssignTriageTicketRequest {

    @NotNull(message = "ticketId is required")
    private UUID ticketId;

    @NotNull(message = "assigneeId is required")
    private Long assigneeId;
}

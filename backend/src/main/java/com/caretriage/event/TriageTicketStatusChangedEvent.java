package com.caretriage.event;

import com.caretriage.entity.TriageTicket;

import java.util.UUID;

public record TriageTicketStatusChangedEvent(
        UUID ticketId,
        TriageTicket.Status previousStatus,
        TriageTicket.Status newStatus
) {
}

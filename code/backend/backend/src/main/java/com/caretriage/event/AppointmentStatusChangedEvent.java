package com.caretriage.event;

import com.caretriage.domain.entity.Appointment;

import java.util.UUID;

public record AppointmentStatusChangedEvent(
        Long appointmentId,
        UUID triageTicketId,
        Appointment.AppointmentStatus previousStatus,
        Appointment.AppointmentStatus newStatus
) {
}

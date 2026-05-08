package com.caretriage.listener;

import com.caretriage.entity.Appointment;
import com.caretriage.entity.TriageTicket;
import com.caretriage.event.AppointmentStatusChangedEvent;
import com.caretriage.event.TriageTicketStatusChangedEvent;
import com.caretriage.repository.AppointmentRepository;
import com.caretriage.repository.TriageTicketRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class TriageAppointmentStatusSyncListener {

    private final AppointmentRepository appointmentRepository;
    private final TriageTicketRepository triageTicketRepository;

    @Async
    @EventListener
    @Transactional
    public void onAppointmentStatusChanged(AppointmentStatusChangedEvent event) {
        if (event.triageTicketId() == null) {
            return;
        }

        TriageTicket.Status mappedTicketStatus = mapTicketStatus(event.newStatus());
        if (mappedTicketStatus == null) {
            return;
        }

        TriageTicket ticket = triageTicketRepository.findById(event.triageTicketId()).orElse(null);
        if (ticket == null || ticket.getStatus() == mappedTicketStatus) {
            return;
        }

        ticket.setStatus(mappedTicketStatus);
        if (mappedTicketStatus == TriageTicket.Status.TRIAGED
                || mappedTicketStatus == TriageTicket.Status.REJECTED
                || mappedTicketStatus == TriageTicket.Status.CLOSED) {
            ticket.setTriagedAt(java.time.LocalDateTime.now());
        }
        triageTicketRepository.save(ticket);
        log.info("Synced ticket {} status from appointment {} -> {}", ticket.getTicketNumber(), event.previousStatus(), event.newStatus());
    }

    @Async
    @EventListener
    @Transactional
    public void onTriageTicketStatusChanged(TriageTicketStatusChangedEvent event) {
        Appointment appointment = appointmentRepository.findByTriageTicketId(event.ticketId()).orElse(null);
        if (appointment == null) {
            return;
        }

        Appointment.AppointmentStatus mappedAppointmentStatus = mapAppointmentStatus(event.newStatus());
        if (mappedAppointmentStatus == null || appointment.getStatus() == mappedAppointmentStatus) {
            return;
        }

        appointment.setStatus(mappedAppointmentStatus);
        appointmentRepository.save(appointment);
        log.info("Synced appointment {} status from ticket {} -> {}", appointment.getId(), event.previousStatus(), event.newStatus());
    }

    private TriageTicket.Status mapTicketStatus(Appointment.AppointmentStatus status) {
        return switch (status) {
            case CHECKED_IN -> TriageTicket.Status.NEW;
            case IN_PROGRESS -> TriageTicket.Status.IN_TRIAGE;
            case COMPLETED -> TriageTicket.Status.TRIAGED;
            case CANCELLED, NO_SHOW -> TriageTicket.Status.REJECTED;
            default -> null;
        };
    }

    private Appointment.AppointmentStatus mapAppointmentStatus(TriageTicket.Status status) {
        return switch (status) {
            case NEW -> Appointment.AppointmentStatus.CHECKED_IN;
            case IN_TRIAGE -> Appointment.AppointmentStatus.IN_PROGRESS;
            case TRIAGED, CLOSED -> Appointment.AppointmentStatus.COMPLETED;
            case REJECTED -> Appointment.AppointmentStatus.CANCELLED;
        };
    }
}

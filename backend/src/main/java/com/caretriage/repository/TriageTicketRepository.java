package com.caretriage.repository;

import com.caretriage.entity.TriageTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TriageTicketRepository extends JpaRepository<TriageTicket, Long> {

    List<TriageTicket> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<TriageTicket> findByAssignedDoctorIdOrderByCreatedAtDesc(Long doctorId);

    List<TriageTicket> findByStatus(TriageTicket.TicketStatus status);

    List<TriageTicket> findByUrgencyLevelAndStatus(TriageTicket.UrgencyLevel level, TriageTicket.TicketStatus status);

    Optional<TriageTicket> findByChatSessionId(Long chatSessionId);
}

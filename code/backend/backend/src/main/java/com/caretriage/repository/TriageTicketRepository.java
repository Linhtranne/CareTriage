package com.caretriage.repository;

import com.caretriage.entity.TriageTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TriageTicketRepository extends JpaRepository<TriageTicket, UUID> {

    Optional<TriageTicket> findByTicketNumber(String ticketNumber);

    List<TriageTicket> findByRequesterIdOrderByCreatedAtDesc(Long requesterId);

    List<TriageTicket> findByStatus(TriageTicket.Status status);

    List<TriageTicket> findByPriority(TriageTicket.Priority priority);

    long countByStatus(TriageTicket.Status status);

    Page<TriageTicket> findByStatusOrderByCreatedAtAsc(TriageTicket.Status status, Pageable pageable);

    Page<TriageTicket> findByStatusAndPriorityOrderByCreatedAtAsc(TriageTicket.Status status, TriageTicket.Priority priority, Pageable pageable);

    @Query("SELECT COUNT(t) FROM TriageTicket t WHERE t.triageOfficer.id = :doctorId AND t.requester.id = :patientId")
    long countByTriageOfficerIdAndRequesterId(@Param("doctorId") Long doctorId, @Param("patientId") Long patientId);

    @Query("SELECT COUNT(t) FROM TriageTicket t WHERE t.triageOfficer.id = :doctorId AND t.requester.id = :patientId AND t.status != 'CLOSED' AND t.status != 'REJECTED'")
    long countActiveTicketsByDoctorAndPatient(@Param("doctorId") Long doctorId, @Param("patientId") Long patientId);

    @Query("SELECT t FROM TriageTicket t WHERE t.triageOfficer.id = :doctorId AND t.requester.id = :patientId ORDER BY t.createdAt DESC")
    List<TriageTicket> findByTriageOfficerIdAndRequesterIdOrderByCreatedAtDesc(@Param("doctorId") Long doctorId, @Param("patientId") Long patientId);

    @Query("SELECT t FROM TriageTicket t WHERE t.chatSession.id = :chatSessionId")
    List<TriageTicket> findByChatSessionId(@Param("chatSessionId") Long chatSessionId);
}

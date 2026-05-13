package com.caretriage.repository;

import com.caretriage.entity.TriageTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
}

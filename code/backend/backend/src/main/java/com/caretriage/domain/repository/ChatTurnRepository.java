package com.caretriage.domain.repository;

import com.caretriage.domain.entity.ChatTurn;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatTurnRepository extends JpaRepository<ChatTurn, Long> {

    @Override
    @EntityGraph(attributePaths = {"chatSession", "user"})
    Optional<ChatTurn> findById(Long id);

    @EntityGraph(attributePaths = {"chatSession", "user"})
    Optional<ChatTurn> findByChatSessionIdAndTurnId(Long chatSessionId, String turnId);

    @EntityGraph(attributePaths = {"chatSession", "user"})
    Optional<ChatTurn> findByUserIdAndTurnId(Long userId, String turnId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM ChatTurn t WHERE t.id = :id")
    Optional<ChatTurn> findByIdForUpdate(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE ChatTurn t SET t.status = :newStatus, t.updatedAt = CURRENT_TIMESTAMP WHERE t.id = :id AND t.status = :expectedStatus")
    int updateStatusConditional(
        @Param("id") Long id,
        @Param("expectedStatus") ChatTurn.TurnStatus expectedStatus,
        @Param("newStatus") ChatTurn.TurnStatus newStatus
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ChatTurn t
        SET t.status = :newStatus,
            t.attemptCount = t.attemptCount + 1,
            t.errorCode = NULL,
            t.updatedAt = CURRENT_TIMESTAMP
        WHERE t.id = :id AND t.status = :expectedStatus
        """)
    int retryTurnConditional(
        @Param("id") Long id,
        @Param("expectedStatus") ChatTurn.TurnStatus expectedStatus,
        @Param("newStatus") ChatTurn.TurnStatus newStatus
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ChatTurn t
        SET t.status = :newStatus,
            t.attemptCount = t.attemptCount + 1,
            t.errorCode = NULL,
            t.updatedAt = CURRENT_TIMESTAMP
        WHERE t.id = :id
          AND t.status IN :activeStatuses
          AND t.updatedAt <= :staleBefore
        """)
    int recoverStaleActiveTurn(
        @Param("id") Long id,
        @Param("activeStatuses") java.util.Collection<ChatTurn.TurnStatus> activeStatuses,
        @Param("newStatus") ChatTurn.TurnStatus newStatus,
        @Param("staleBefore") java.time.LocalDateTime staleBefore
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ChatTurn t
        SET t.status = :failedStatus,
            t.errorCode = :errorCode,
            t.updatedAt = CURRENT_TIMESTAMP
        WHERE t.id = :id AND t.status IN :activeStatuses
        """)
    int failTurnConditional(
        @Param("id") Long id,
        @Param("failedStatus") ChatTurn.TurnStatus failedStatus,
        @Param("errorCode") String errorCode,
        @Param("activeStatuses") java.util.Collection<ChatTurn.TurnStatus> activeStatuses
    );

    @Query(value = """
        SELECT CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END
        FROM chat_turns
        WHERE id = :id
          AND status = 'COMPLETED'
          AND ticket_status = 'PENDING'
          AND updated_at <= CURRENT_TIMESTAMP(3) - INTERVAL '30' SECOND
        """, nativeQuery = true)
    boolean isPendingTicketStale(@Param("id") Long id);

    @Query(value = """
        SELECT CASE WHEN COUNT(*) > 0 THEN TRUE ELSE FALSE END
        FROM chat_turns
        WHERE id = :id
          AND (next_ticket_retry_at IS NULL OR next_ticket_retry_at <= CURRENT_TIMESTAMP(3))
        """, nativeQuery = true)
    boolean isTicketRetryEligible(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ChatTurn t
        SET t.ticketStatus     = :newStatus,
            t.ticketId         = :ticketId,
            t.persistedPayload = :persistedPayload,
            t.updatedAt        = CURRENT_TIMESTAMP
        WHERE t.id = :id AND t.ticketStatus = :expectedStatus
        """)
    int updateTicketStatusConditional(
        @Param("id") Long id,
        @Param("expectedStatus") ChatTurn.TicketStatus expectedStatus,
        @Param("newStatus") ChatTurn.TicketStatus newStatus,
        @Param("ticketId") String ticketId,
        @Param("persistedPayload") String persistedPayload
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ChatTurn t
        SET t.ticketStatus     = :newStatus,
            t.ticketId         = :ticketId,
            t.persistedPayload = :persistedPayload,
            t.errorCode        = :errorCode,
            t.updatedAt        = CURRENT_TIMESTAMP
        WHERE t.id = :id AND t.ticketStatus = :expectedStatus
        """)
    int updateTicketStatusAndErrorConditional(
        @Param("id") Long id,
        @Param("expectedStatus") ChatTurn.TicketStatus expectedStatus,
        @Param("newStatus") ChatTurn.TicketStatus newStatus,
        @Param("ticketId") String ticketId,
        @Param("persistedPayload") String persistedPayload,
        @Param("errorCode") String errorCode
    );

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE ChatTurn t
        SET t.ticketStatus       = :newStatus,
            t.ticketAttemptCount = t.ticketAttemptCount + 1,
            t.nextTicketRetryAt  = :nextRetryAt,
            t.updatedAt          = CURRENT_TIMESTAMP
        WHERE t.id = :id AND t.ticketStatus = :expectedStatus
        """)
    int updateTicketRetryConditional(
        @Param("id") Long id,
        @Param("expectedStatus") ChatTurn.TicketStatus expectedStatus,
        @Param("newStatus") ChatTurn.TicketStatus newStatus,
        @Param("nextRetryAt") java.time.LocalDateTime nextRetryAt
    );
}

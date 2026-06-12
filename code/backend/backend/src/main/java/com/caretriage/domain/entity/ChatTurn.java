package com.caretriage.domain.entity;

import jakarta.persistence.*;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_turns", uniqueConstraints = {
    @UniqueConstraint(name = "uq_session_turn", columnNames = {"session_id", "turn_id"}),
    @UniqueConstraint(name = "uq_user_turn", columnNames = {"user_id", "turn_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatTurn {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession chatSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserJpaEntity user;

    @Column(name = "turn_id", nullable = false, length = 36)
    private String turnId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TurnStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_status", length = 20)
    private TicketStatus ticketStatus;

    @Column(name = "final_payload", columnDefinition = "JSON")
    private String finalPayload;

    @Column(name = "persisted_payload", columnDefinition = "JSON")
    private String persistedPayload;

    @Column(name = "ticket_id", length = 36)
    private String ticketId;

    @Column(name = "error_code", length = 64)
    private String errorCode;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private int attemptCount = 1;

    @Column(name = "ticket_attempt_count")
    @Builder.Default
    private int ticketAttemptCount = 0;

    @Column(name = "next_ticket_retry_at")
    private LocalDateTime nextTicketRetryAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum TurnStatus {
        STARTED, STREAMING, COMPLETED, FAILED
    }

    public enum TicketStatus {
        PENDING, READY, NOT_NEEDED, FAILED_RETRYABLE, FAILED_PERMANENT
    }
}

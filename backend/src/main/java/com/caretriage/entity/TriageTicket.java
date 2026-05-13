package com.caretriage.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "triage_tickets", indexes = {
    @Index(name = "idx_ticket_status", columnList = "status"),
    @Index(name = "idx_ticket_priority", columnList = "priority"),
    @Index(name = "idx_ticket_requester", columnList = "requester_id"),
    @Index(name = "idx_ticket_number", columnList = "ticket_number", unique = true)
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriageTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotBlank(message = "Ticket number is required")
    @Size(max = 50, message = "Ticket number must not exceed 50 characters")
    @Column(name = "ticket_number", nullable = false, unique = true, length = 50)
    private String ticketNumber;

    @NotBlank(message = "Title is required")
    @Size(max = 255, message = "Title must not exceed 255 characters")
    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @NotBlank(message = "Description is required")
    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.NEW;

    @NotNull(message = "Priority is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false, length = 20)
    @Builder.Default
    private Priority priority = Priority.MEDIUM;

    @NotNull(message = "Severity is required")
    @Enumerated(EnumType.STRING)
    @Column(name = "severity", nullable = false, length = 20)
    @Builder.Default
    private Severity severity = Severity.MINOR;

    @NotNull(message = "Requester is required")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "triage_officer_id")
    private User triageOfficer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private TicketCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_session_id")
    private ChatSession chatSession;

    @Column(name = "metadata", columnDefinition = "JSON")
    private String metadata;

    @Column(name = "triaged_at")
    private LocalDateTime triagedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum Status {
        NEW, IN_TRIAGE, TRIAGED, CLOSED, REJECTED
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT
    }

    public enum Severity {
        CRITICAL, MAJOR, MINOR, COSMETIC
    }
}

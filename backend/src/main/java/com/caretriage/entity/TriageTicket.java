package com.caretriage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "triage_tickets", indexes = {
    @Index(name = "idx_ticket_patient", columnList = "patient_id"),
    @Index(name = "idx_ticket_doctor", columnList = "assigned_doctor_id"),
    @Index(name = "idx_ticket_status", columnList = "status"),
    @Index(name = "idx_ticket_urgency", columnList = "urgency_level")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class TriageTicket {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chat_session_id", nullable = false)
    private ChatSession chatSession;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_doctor_id")
    private User assignedDoctor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency_level", nullable = false, length = 20)
    @Builder.Default
    private UrgencyLevel urgencyLevel = UrgencyLevel.MEDIUM;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "suggested_department", length = 100)
    private String suggestedDepartment;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(name = "doctor_notes", columnDefinition = "TEXT")
    private String doctorNotes;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private TicketStatus status = TicketStatus.OPEN;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum UrgencyLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum TicketStatus {
        OPEN, ASSIGNED, IN_REVIEW, RESOLVED, CLOSED
    }
}

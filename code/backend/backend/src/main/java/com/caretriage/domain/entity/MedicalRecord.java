package com.caretriage.domain.entity;

import jakarta.persistence.*;
import com.caretriage.infrastructure.persistence.entity.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "medical_records", indexes = {
    @Index(name = "idx_medrec_patient", columnList = "patient_id"),
    @Index(name = "idx_medrec_doctor", columnList = "doctor_id"),
    @Index(name = "idx_medrec_appointment", columnList = "appointment_id"),
    @Index(name = "idx_medrec_created", columnList = "created_at")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id", unique = true)
    private Appointment appointment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private UserJpaEntity patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private UserJpaEntity doctor;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String diagnosis;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    @Column(name = "treatment_plan", columnDefinition = "TEXT")
    private String treatmentPlan;

    @Column(columnDefinition = "TEXT")
    private String prescription;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "vital_signs", columnDefinition = "JSON")
    private String vitalSigns;

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "triage_ticket_id")
    private String triageTicketId;

    @Column(name = "triage_priority", length = 50)
    private String triagePriority;

    @Column(name = "triage_severity", length = 50)
    private String triageSeverity;

    @Column(name = "ai_summary_snapshot", columnDefinition = "TEXT")
    private String aiSummarySnapshot;

    @Column(name = "triage_review_snapshot", columnDefinition = "TEXT")
    private String triageReviewSnapshot;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

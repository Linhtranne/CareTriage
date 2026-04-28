package com.caretriage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_conditions", indexes = {
    @Index(name = "idx_cond_patient", columnList = "patient_id"),
    @Index(name = "idx_cond_name", columnList = "condition_name"),
    @Index(name = "idx_cond_status", columnList = "status")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PatientCondition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "clinical_note_id")
    private Long clinicalNoteId;

    @Column(name = "condition_name", nullable = false)
    private String conditionName;

    @Column(name = "icd_code", length = 20)
    private String icdCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20)
    @Builder.Default
    private Severity severity = Severity.MODERATE;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private ConditionStatus status = ConditionStatus.ACTIVE;

    @Column(name = "diagnosed_date")
    private LocalDate diagnosedDate;

    @Column(name = "resolved_date")
    private LocalDate resolvedDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum Severity {
        MILD, MODERATE, SEVERE
    }

    public enum ConditionStatus {
        ACTIVE, RESOLVED, CHRONIC
    }
}

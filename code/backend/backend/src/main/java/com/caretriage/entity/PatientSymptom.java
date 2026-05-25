package com.caretriage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_symptoms", indexes = {
    @Index(name = "idx_sym_patient", columnList = "patient_id"),
    @Index(name = "idx_sym_name", columnList = "symptom_name")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PatientSymptom {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinical_note_id")
    private ClinicalNote clinicalNote;

    @Column(name = "symptom_name", nullable = false)
    private String symptomName;

    @Enumerated(EnumType.STRING)
    @Column(name = "severity", length = 20)
    @Builder.Default
    private Severity severity = Severity.MODERATE;

    @Column(name = "onset_date")
    private LocalDate onsetDate;

    @Column(name = "duration", length = 100)
    private String duration;

    @Column(name = "body_location", length = 100)
    private String bodyLocation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum Severity {
        MILD, MODERATE, SEVERE
    }
}

package com.caretriage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "patient_medications", indexes = {
    @Index(name = "idx_med_patient", columnList = "patient_id"),
    @Index(name = "idx_med_name", columnList = "medication_name"),
    @Index(name = "idx_med_status", columnList = "status")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class PatientMedication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "patient_id", nullable = false)
    private Long patientId;

    @Column(name = "clinical_note_id")
    private Long clinicalNoteId;

    @Column(name = "medication_name", nullable = false)
    private String medicationName;

    @Column(name = "dosage", length = 100)
    private String dosage;

    @Column(name = "frequency", length = 100)
    private String frequency;

    @Column(name = "route", length = 50)
    private String route;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "prescribing_doctor_id")
    private Long prescribingDoctorId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    @Builder.Default
    private MedicationStatus status = MedicationStatus.ACTIVE;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum MedicationStatus {
        ACTIVE, DISCONTINUED, COMPLETED
    }
}

package com.caretriage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "clinical_notes", indexes = {
    @Index(name = "idx_clinical_note_patient", columnList = "patient_id"),
    @Index(name = "idx_clinical_note_doctor", columnList = "doctor_id"),
    @Index(name = "idx_clinical_note_status", columnList = "extraction_status")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ClinicalNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "doctor_id", nullable = false)
    private User doctor;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    @Enumerated(EnumType.STRING)
    @Column(name = "note_type", nullable = false, length = 20)
    private NoteType noteType;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    @Column(name = "file_path", length = 500)
    private String filePath;

    @Column(name = "file_type", length = 20)
    private String fileType;

    @Enumerated(EnumType.STRING)
    @Column(name = "extraction_status", nullable = false, length = 20)
    @Builder.Default
    private ExtractionStatus extractionStatus = ExtractionStatus.PENDING;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "clinicalNote", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ExtractedEntity> extractedEntities = new ArrayList<>();

    public enum NoteType {
        ADMISSION, PROGRESS, DISCHARGE, CONSULTATION, PRESCRIPTION
    }

    public enum ExtractionStatus {
        PENDING, PROCESSING, COMPLETED, FAILED
    }
}

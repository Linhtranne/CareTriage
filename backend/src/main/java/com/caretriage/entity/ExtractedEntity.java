package com.caretriage.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "extracted_entities", indexes = {
    @Index(name = "idx_entity_note", columnList = "clinical_note_id"),
    @Index(name = "idx_entity_type", columnList = "entity_type"),
    @Index(name = "idx_entity_value", columnList = "entity_value")
})
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ExtractedEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clinical_note_id", nullable = false)
    private ClinicalNote clinicalNote;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false, length = 20)
    private EntityType entityType;

    @Column(name = "entity_value", nullable = false, length = 500)
    private String entityValue;

    @Column(name = "normalized_value", length = 500)
    private String normalizedValue;

    @Column(name = "confidence_score", precision = 3)
    private Double confidenceScore;

    @Column(name = "start_position")
    private Integer startPosition;

    @Column(name = "end_position")
    private Integer endPosition;

    @Column(name = "metadata", columnDefinition = "JSON")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum EntityType {
        MEDICATION, SYMPTOM, CONDITION, DOSAGE, LAB_TEST, PROCEDURE
    }
}

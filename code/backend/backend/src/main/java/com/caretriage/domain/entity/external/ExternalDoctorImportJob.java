package com.caretriage.domain.entity.external;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "external_doctor_import_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExternalDoctorImportJob {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private ExternalDoctorSource source;

    @com.fasterxml.jackson.annotation.JsonProperty("sourceId")
    @Transient
    public Long getExternalSourceId() {
        return source != null ? source.getId() : null;
    }

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ImportJobStatus status;

    private Integer doctorsImported;

    private Integer doctorsUpdated;

    private Integer doctorsFailed;

    @Column(columnDefinition = "TEXT")
    private String errorLog;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
    
    public enum ImportJobStatus {
        RUNNING, SUCCESS, FAILED
    }
}

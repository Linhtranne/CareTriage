package com.caretriage.domain.entity.external;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "external_doctors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExternalDoctor {

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

    @Column(nullable = false)
    private String externalId; // ID from the 3rd-party system

    @Column(nullable = false)
    private String fullName;

    private String email;
    
    private String phone;

    private String specialization;

    private String hospitalName;

    @Column(columnDefinition = "TEXT")
    private String bio;

    private String profileUrl;
    
    private String avatarUrl;
    
    private String sourceUrl;
    
    private String address;
    
    private Double latitude;
    
    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationStatus verificationStatus;

    private Boolean active;

    private Double rating;

    private Integer experienceYears;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum VerificationStatus {
        UNVERIFIED, VERIFIED, REJECTED
    }
}

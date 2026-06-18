package com.caretriage.domain.entity.external;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@Entity
@Table(name = "external_doctor_sources")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExternalDoctorSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String sourceName; // e.g., "DoctorAnywhere", "JioHealth"

    @Column(nullable = false)
    private String baseUrl;

    @Column(nullable = false)
    private String allowedDomain;

    private String city;
    
    private String district;
    
    private Double latitude;
    
    private Double longitude;

    @Column(nullable = false)
    private String apiEndpoint;

    private String apiToken; // Basic auth or Bearer token
    
    private Boolean isActive;

    private LocalDateTime lastCrawledAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

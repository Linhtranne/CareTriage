package com.caretriage.application.dto.doctor;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UnifiedDoctorDTO {
    private String id; // E.g. "INTERNAL_1" or "EXTERNAL_5"
    private String doctorType; // "INTERNAL" or "EXTERNAL"
    private Long internalId;
    private Long externalId;
    
    private String fullName;
    private String avatarUrl;
    private String specialization;
    private String hospitalName;
    private String profileUrl;
    private Double rating;
}

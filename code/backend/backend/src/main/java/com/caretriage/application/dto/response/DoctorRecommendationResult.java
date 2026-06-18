package com.caretriage.application.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorRecommendationResult {
    private List<RecommendedDoctor> recommendations;
    private String rationale;
    private String recommendedDepartment;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedDoctor {
        private String doctorId; // "INT_xxx" or "EXT_xxx"
        private String doctorName;
        private String specialization;
        private double matchScore;
        private String matchReason;
        
        // Enriched data
        private Long internalId;
        private Long externalId;
        private boolean isExternal;
        private String avatarUrl;
        private String profileUrl;
        private String hospitalName;
    }
}

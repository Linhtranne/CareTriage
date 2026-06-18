package com.caretriage.application.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorRecommendationCriteria {
    private String symptoms;
    private String aiSummarySnapshot;
    private String department;
    private String severity;
    private UUID triageTicketId;
}

package com.caretriage.application.ai.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TriageResultDetail {
    private Integer categoryId;
    private String categoryName;
    private String suggestedDepartmentCode;
    private String suggestedDepartmentName;
    private String urgencyLevel;
    private Double confidenceScore;
    private List<String> possibleConditions;
    private List<String> suggestedActions;
    private String departmentMappingStatus;
    private String fallbackReason;
    private String clinicalReasoningSummary;
    private String summary;
    private Boolean redFlagDetected;
}

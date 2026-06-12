package com.caretriage.application.ai.model;

import java.util.List;

public record TriageClassificationResult(
    boolean intakeComplete,
    boolean redFlagDetected,
    List<String> missingInformation,
    String suggestedDepartment,
    String urgencyLevel,
    double confidenceScore,
    List<String> possibleConditions,
    List<String> suggestedActions,
    String clinicalReasoningSummary,
    String summary,
    boolean infectionControl
) {}

package com.caretriage.application.ai.model;

import java.util.List;

public record TriageClassification(
    boolean intakeComplete,
    boolean redFlagDetected,
    List<String> missingInformation,
    TriageResultDetail triageResult
) {}

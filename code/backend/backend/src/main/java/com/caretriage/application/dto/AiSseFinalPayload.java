package com.caretriage.application.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.caretriage.shared.exception.ContractViolationException;
import java.util.List;
import java.util.Set;

public record AiSseFinalPayload(
    @JsonProperty("contract_version") String contractVersion,
    @JsonProperty("turn_id") String turnId,
    String reply,
    @JsonProperty("intake_complete") boolean intakeComplete,
    @JsonProperty("red_flag_detected") boolean redFlagDetected,
    @JsonProperty("missing_information") List<String> missingInformation,
    @JsonProperty("classification_status") String classificationStatus,
    @JsonProperty("classification_error_code") String classificationErrorCode,
    @JsonProperty("triage_result") TriageResult triageResult
) {
    public record TriageResult(
        @JsonProperty("suggested_department_code") String suggestedDepartmentCode,
        @JsonProperty("suggested_department_name") String suggestedDepartmentName,
        @JsonProperty("urgency_level") String urgencyLevel,
        @JsonProperty("possible_conditions") List<String> possibleConditions,
        @JsonProperty("suggested_actions") List<String> suggestedActions,
        @JsonProperty("confidence_score") double confidenceScore,
        @JsonProperty("clinical_reasoning_summary") String clinicalReasoningSummary,
        String summary
    ) {}

    public void validateForTurn(String expectedTurnId) {
        if (!"1".equals(contractVersion)) {
            throw new ContractViolationException("Unsupported contract_version: " + contractVersion);
        }
        if (turnId == null || !turnId.equals(expectedTurnId)) {
            throw new ContractViolationException("turn_id mismatch");
        }
        if (reply == null || reply.isBlank()) {
            throw new ContractViolationException("reply is required");
        }
        if (!Set.of("OK", "DEGRADED").contains(classificationStatus)) {
            throw new ContractViolationException("classification_status must be OK or DEGRADED");
        }
        if (missingInformation == null) {
            throw new ContractViolationException("missing_information is required");
        }
        if ("DEGRADED".equals(classificationStatus)) {
            if (triageResult != null || intakeComplete) {
                throw new ContractViolationException("DEGRADED final cannot complete intake or contain triage_result");
            }
            if (classificationErrorCode == null || classificationErrorCode.isBlank()) {
                throw new ContractViolationException("DEGRADED final requires classification_error_code");
            }
        }
        if (intakeComplete && triageResult == null) {
            throw new ContractViolationException("Completed intake requires triage_result");
        }
    }

    public static AiSseFinalPayload fromJson(String json) {
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper()
                .readValue(json, AiSseFinalPayload.class);
        } catch (com.fasterxml.jackson.core.JsonProcessingException e) {
            throw new ContractViolationException("Invalid final payload JSON", e);
        }
    }
}

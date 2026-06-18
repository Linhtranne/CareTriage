package com.caretriage.application.ai.service;

import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import dev.langchain4j.service.V;

public interface DoctorRecommendationAi {

    @SystemMessage({
        "You are an expert medical triage director.",
        "Your task is to recommend the top 3 best-matching doctors for a patient based on their symptoms, AI summary, and triage severity.",
        "You will be given a list of available doctors and their profiles in JSON format.",
        "You must return the result as a strict JSON object with no markdown formatting.",
        "The JSON should match this schema:",
        "{",
        "  \"recommendedDepartment\": \"string\",",
        "  \"rationale\": \"string\",",
        "  \"recommendations\": [",
        "    { \"doctorId\": \"string\", \"matchScore\": 0.95, \"matchReason\": \"string\" }",
        "  ]",
        "}"
    })
    @UserMessage({
        "Patient Criteria:",
        "Symptoms: {{criteria.symptoms}}",
        "AI Summary: {{criteria.aiSummarySnapshot}}",
        "Triage Severity: {{criteria.severity}}",
        "",
        "Available Doctors:",
        "{{availableDoctors}}"
    })
    String recommendDoctors(@V("criteria") com.caretriage.application.dto.request.DoctorRecommendationCriteria criteria,
                            @V("availableDoctors") String availableDoctorsJson);
}

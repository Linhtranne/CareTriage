package com.caretriage.service;

import java.util.List;
import java.util.Map;

public interface AiClientService {
    Map<String, Object> analyzeSymptoms(String sessionId, String message, List<Map<String, String>> history);
    Map<String, Object> getRecommendation(String sessionId, String message, List<Map<String, String>> history);
    void triggerResearch(Long patientId, String query);
}

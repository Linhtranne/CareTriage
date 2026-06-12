package com.caretriage.application.service;

import java.util.List;
import java.util.Map;
import reactor.core.publisher.Flux;

public interface AiClientService {
    Flux<Map<String, Object>> streamAnalyzeSymptoms(String sessionId, String message, List<Map<String, String>> history, String turnId);
    void triggerResearch(Long patientId, String query);
    boolean checkHealth();
}

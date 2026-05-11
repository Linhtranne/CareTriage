package com.caretriage.service.impl;

import com.caretriage.service.AiClientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiClientServiceImpl implements AiClientService {

    private final RestTemplate restTemplate;

    @Value("${app.ai-service.url}")
    private String aiServiceUrl;

    @Override
    public Map<String, Object> analyzeSymptoms(String sessionId, String message, List<Map<String, String>> history) {
        String url = aiServiceUrl + "/api/triage/analyze";
        return callAiService(url, sessionId, message, history);
    }

    @Override
    public Map<String, Object> getRecommendation(String sessionId, String message, List<Map<String, String>> history) {
        String url = aiServiceUrl + "/api/triage/recommend";
        return callAiService(url, sessionId, message, history);
    }

    @Override
    public void triggerResearch(Long patientId, String query) {
        String url = aiServiceUrl + "/api/triage/research";
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("patient_id", patientId);
            request.put("query", query);

            log.info("Triggering background research for patient: {} with query: {}", patientId, query);
            restTemplate.postForObject(url, request, Map.class);
        } catch (Exception e) {
            log.error("Error triggering AI research: {}", e.getMessage());
        }
    }

    @Override
    public boolean checkHealth() {
        try {
            String url = aiServiceUrl + "/health";
            Map<?, ?> response = restTemplate.getForObject(url, Map.class);
            return response != null && "UP".equals(response.get("status"));
        } catch (Exception e) {
            log.warn("AI Service health check failed: {}", e.getMessage());
            return false;
        }
    }

    private Map<String, Object> callAiService(String url, String sessionId, String message, List<Map<String, String>> history) {

        try {
            Map<String, Object> request = new HashMap<>();
            request.put("session_id", sessionId);
            request.put("message", message);
            request.put("conversation_history", history);

            log.info("Calling AI Service at: {} for session: {}", url, sessionId);
            return restTemplate.postForObject(url, request, Map.class);
        } catch (Exception e) {
            log.error("Error calling AI Service: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("reply", "Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại sau.");
            errorResponse.put("is_complete", false);
            return errorResponse;
        }
    }
}

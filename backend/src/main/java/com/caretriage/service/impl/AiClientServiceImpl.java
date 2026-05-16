package com.caretriage.service.impl;

import com.caretriage.service.AiClientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import io.netty.handler.timeout.ReadTimeoutException;
import java.util.concurrent.TimeoutException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiClientServiceImpl implements AiClientService {

    private final WebClient aiServiceWebClient;

    @Override
    public Map<String, Object> analyzeSymptoms(String sessionId, String message, List<Map<String, String>> history) {
        return callAiService("/api/triage/analyze", sessionId, message, history);
    }

    @Override
    public Map<String, Object> getRecommendation(String sessionId, String message, List<Map<String, String>> history) {
        return callAiService("/api/triage/recommend", sessionId, message, history);
    }

    @Override
    public void triggerResearch(Long patientId, String query) {
        String path = "/api/triage/research";
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("patient_id", patientId);
            request.put("query", query);

            log.info("Triggering background research for patient: {} with query: {}", patientId, query);
            aiServiceWebClient.post()
                    .uri(path)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .subscribe(
                            res -> log.info("Research triggered successfully for patient {}", patientId),
                            err -> log.error("Error in background AI research: {}", err.getMessage())
                    );
        } catch (Exception e) {
            log.error("Error triggering AI research: {}", e.getMessage());
        }
    }

    @Override
    public boolean checkHealth() {
        try {
            Map<?, ?> response = aiServiceWebClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
            return response != null && "UP".equals(response.get("status"));
        } catch (Exception e) {
            log.warn("AI Service health check failed: {}", e.getMessage());
            return false;
        }
    }

    private Map<String, Object> callAiService(String path, String sessionId, String message, List<Map<String, String>> history) {
        try {
            Map<String, Object> request = new HashMap<>();
            request.put("session_id", sessionId);
            request.put("message", message);
            request.put("conversation_history", history);

            log.info("Calling AI Service at: {} for session: {}", path, sessionId);
            Object response = aiServiceWebClient.post()
                    .uri(path)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block();
            return asStringObjectMap(response);
        } catch (WebClientResponseException e) {
            log.error("AI Service HTTP Error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            String replyMsg;
            if (e.getStatusCode().value() == 429) {
                replyMsg = "Hệ thống AI đang quá tải (Quota/Rate Limit). Vui lòng thử lại sau.";
            } else if (e.getStatusCode().is5xxServerError()) {
                replyMsg = "Dịch vụ AI hiện không khả dụng. Vui lòng thử lại sau.";
            } else {
                replyMsg = "Yêu cầu không hợp lệ. Vui lòng kiểm tra lại.";
            }
            return createErrorResponse(replyMsg);
        } catch (Exception e) {
            log.error("Error calling AI Service: {}", e.getMessage());
            String replyMsg = "Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại sau.";
            if (e.getCause() instanceof ReadTimeoutException || e.getCause() instanceof TimeoutException || e.getMessage().contains("timeout")) {
                replyMsg = "Kết nối đến AI service quá hạn. Vui lòng thử lại.";
            } else if (e.getMessage().contains("JSON decoding") || e.getMessage().contains("DecodingException")) {
                replyMsg = "Hệ thống nhận được phản hồi không hợp lệ từ AI. Vui lòng thử lại.";
            }
            return createErrorResponse(replyMsg);
        }
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("reply", message);
        errorResponse.put("is_complete", false);
        return errorResponse;
    }

    private Map<String, Object> asStringObjectMap(Object value) {
        if (!(value instanceof Map<?, ?> rawMap)) {
            log.error("Invalid response schema from AI Service: expected Map but got {}", value == null ? "null" : value.getClass().getName());
            return createErrorResponse("Hệ thống nhận được phản hồi không hợp lệ từ AI. Vui lòng thử lại.");
        }
        Map<String, Object> result = new HashMap<>();
        for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
            if (entry.getKey() instanceof String key) {
                result.put(key, entry.getValue());
            }
        }
        return result;
    }
}

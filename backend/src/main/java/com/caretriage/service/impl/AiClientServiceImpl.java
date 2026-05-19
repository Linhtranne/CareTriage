package com.caretriage.service.impl;

import com.caretriage.service.AiClientService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import io.netty.handler.timeout.ReadTimeoutException;
import io.netty.channel.ConnectTimeoutException;
import reactor.util.retry.Retry;

import java.io.IOException;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeoutException;

@Slf4j
@Service
public class AiClientServiceImpl implements AiClientService {

    private final WebClient aiServiceWebClient;

    @Value("${app.ai-service.retry.max-attempts:3}")
    private int maxAttempts;

    @Value("${app.ai-service.retry.initial-backoff-ms:300}")
    private long initialBackoffMs;

    @Value("${app.ai-service.retry.max-backoff-ms:2000}")
    private long maxBackoffMs;

    public AiClientServiceImpl(WebClient aiServiceWebClient) {
        this.aiServiceWebClient = aiServiceWebClient;
    }

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
                    .retryWhen(Retry.backoff(maxAttempts, Duration.ofMillis(initialBackoffMs))
                            .maxBackoff(Duration.ofMillis(maxBackoffMs))
                            .filter(this::isTransientError))
                    .block();
            return asStringObjectMap(response);
        } catch (Exception e) {
            log.error("AI Service failure after retries for session {}: {}", sessionId, e.getMessage(), e);
            String fallbackMessage = "Hệ thống AI hiện tại đang tạm thời không khả dụng. Nếu bạn đang gặp phải các triệu chứng nguy kịch (khó thở nặng, đau ngực dữ dội, yếu liệt nửa người, co giật, hoặc mất ý thức), vui lòng gọi 115 hoặc di chuyển đến khoa Cấp cứu gần nhất ngay lập tức. Nếu đây không phải tình trạng khẩn cấp, vui lòng thử lại sau vài phút hoặc đặt lịch hẹn khám trực tiếp với bác sĩ.";
            
            Map<String, Object> fallbackResponse = new HashMap<>();
            fallbackResponse.put("reply", fallbackMessage);
            fallbackResponse.put("is_complete", false);
            
            Map<String, Object> triageResult = new HashMap<>();
            triageResult.put("suggested_department_code", "GENERAL_INTERNAL_MEDICINE");
            triageResult.put("suggested_department_name", "Nội tổng quát");
            triageResult.put("urgency_level", "MEDIUM");
            triageResult.put("confidence_score", 0.0);
            triageResult.put("possible_conditions", List.of());
            triageResult.put("suggested_actions", List.of("Thử lại sau vài phút", "Đặt lịch khám trực tiếp", "Gọi 115 nếu có biểu hiện nguy kịch"));
            triageResult.put("fallback", true);
            triageResult.put("fallback_reason", "AI_SERVICE_UNAVAILABLE");
            
            fallbackResponse.put("triage_result", triageResult);
            return fallbackResponse;
        }
    }

    private boolean isTransientError(Throwable throwable) {
        if (throwable instanceof WebClientResponseException ex) {
            int status = ex.getStatusCode().value();
            // Retry strictly on transient server errors or rate limiting (429, 502, 503, 504)
            return status == 429 || status == 502 || status == 503 || status == 504;
        }
        // Retry on connection and read timeouts or netty pipeline issues
        return throwable instanceof ReadTimeoutException
                || throwable instanceof ConnectTimeoutException
                || throwable instanceof TimeoutException
                || throwable instanceof IOException
                || (throwable.getCause() != null && isTransientError(throwable.getCause()));
    }

    private Map<String, Object> asStringObjectMap(Object value) {
        if (!(value instanceof Map<?, ?> rawMap)) {
            log.error("Invalid response schema from AI Service: expected Map but got {}", value == null ? "null" : value.getClass().getName());
            Map<String, Object> errResponse = new HashMap<>();
            errResponse.put("reply", "Hệ thống nhận được phản hồi không hợp lệ từ AI. Vui lòng thử lại.");
            errResponse.put("is_complete", false);
            return errResponse;
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

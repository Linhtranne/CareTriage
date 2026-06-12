package com.caretriage.application.service.impl;

import com.caretriage.application.service.AiClientService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AiClientServiceImpl implements AiClientService {

    private final WebClient aiServiceWebClient;
    private final WebClient aiServiceSseWebClient;

    public AiClientServiceImpl(
            WebClient aiServiceWebClient,
            @Qualifier("aiServiceSseWebClient") WebClient aiServiceSseWebClient) {
        this.aiServiceWebClient = aiServiceWebClient;
        this.aiServiceSseWebClient = aiServiceSseWebClient;
    }

    @Override
    public Flux<Map<String, Object>> streamAnalyzeSymptoms(
            String sessionId,
            String message,
            List<Map<String, String>> history,
            String turnId) {
        Map<String, Object> request = new HashMap<>();
        request.put("session_id", sessionId);
        request.put("message", message);
        request.put("conversation_history", history);
        request.put("turn_id", turnId);

        return aiServiceSseWebClient.post()
                .uri("/api/triage/analyze/stream")
                .bodyValue(request)
                .retrieve()
                .bodyToFlux(new ParameterizedTypeReference<ServerSentEvent<Map<String, Object>>>() {})
                .map(this::toEventMap);
    }

    @Override
    public void triggerResearch(Long patientId, String query) {
        Map<String, Object> request = Map.of(
                "patient_id", patientId,
                "query", query);

        aiServiceWebClient.post()
                .uri("/api/triage/research")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(Map.class)
                .subscribe(
                        ignored -> log.info("Research triggered for patient {}", patientId),
                        error -> log.error(
                                "Background research request failed for patient {}: {}",
                                patientId,
                                error.getMessage()));
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
        } catch (RuntimeException error) {
            log.warn("AI Service health check failed: {}", error.getMessage());
            return false;
        }
    }

    private Map<String, Object> toEventMap(ServerSentEvent<Map<String, Object>> event) {
        Map<String, Object> result = event.data() == null
                ? new HashMap<>()
                : new HashMap<>(event.data());
        result.put("event", event.event());
        return result;
    }
}

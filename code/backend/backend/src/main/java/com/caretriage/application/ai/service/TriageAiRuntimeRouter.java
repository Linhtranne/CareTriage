package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.TriageAiRequest;
import com.caretriage.application.ai.port.TriageAiEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

// import jakarta.annotation.PreDestroy;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Routes triage AI requests to the Java LangChain4j engine.
 * Python runtime has been removed as of Capability 6.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TriageAiRuntimeRouter {

    private final TriageAiEngine triageAiEngine;

    public Flux<Map<String, Object>> streamAnalyzeSymptoms(
            Long sessionId,
            String turnId,
            String userMessage,
            List<Map<String, String>> history) {

        log.info("Routing triage streaming request to Java runtime for turn: {}", turnId);

        List<Map<String, Object>> historyObjects = toObjectHistory(history);
        TriageAiRequest request = TriageAiRequest.builder()
                .sessionId(sessionId)
                .turnId(turnId)
                .currentMessage(userMessage)
                .conversationHistory(historyObjects)
                .build();

        return triageAiEngine.streamAnalyzeSymptoms(request);
    }

    private List<Map<String, Object>> toObjectHistory(List<Map<String, String>> history) {
        List<Map<String, Object>> historyObjects = new ArrayList<>();
        if (history != null) {
            for (Map<String, String> entry : history) {
                historyObjects.add(new HashMap<>(entry));
            }
        }
        return historyObjects;
    }
}

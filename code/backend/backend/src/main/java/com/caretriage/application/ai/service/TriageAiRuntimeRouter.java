package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.TriageAiRequest;
import com.caretriage.application.ai.port.TriageAiEngine;
import com.caretriage.application.service.AiClientService;
import com.caretriage.infrastructure.ai.config.LangChain4jConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import jakarta.annotation.PreDestroy;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicReference;

@Service
@RequiredArgsConstructor
@Slf4j
public class TriageAiRuntimeRouter {

    private final LangChain4jConfig langChain4jConfig;
    private final TriageAiEngine triageAiEngine;
    private final AiClientService aiClientService;
    private final Scheduler shadowScheduler = Schedulers.newBoundedElastic(
            4,
            100,
            "triage-java-shadow");

    public Flux<Map<String, Object>> streamAnalyzeSymptoms(
            Long sessionId,
            String turnId,
            String userMessage,
            List<Map<String, String>> history) {
        
        String runtime = langChain4jConfig.getRuntime();
        RuntimeMode mode = RuntimeMode.from(runtime);

        List<Map<String, Object>> historyObjects = toObjectHistory(history);
        TriageAiRequest request = TriageAiRequest.builder()
                .sessionId(sessionId)
                .turnId(turnId)
                .currentMessage(userMessage)
                .conversationHistory(historyObjects)
                .build();

        if (mode == RuntimeMode.JAVA) {
            log.info("Routing triage streaming request to JAVA runtime for turn: {}", turnId);
            return triageAiEngine.streamAnalyzeSymptoms(request);
        }

        Flux<Map<String, Object>> pythonPrimary = aiClientService.streamAnalyzeSymptoms(
                String.valueOf(sessionId),
                userMessage,
                history,
                turnId);

        if (mode == RuntimeMode.JAVA_SHADOW) {
            return Flux.defer(() -> {
                ShadowComparison comparison = new ShadowComparison(turnId);
                runJavaShadow(request, comparison);
                return pythonPrimary.doOnNext(comparison::acceptPythonEvent);
            });
        } else {
            log.info("Routing triage streaming request to PYTHON runtime for turn: {}", turnId);
        }

        return pythonPrimary;
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

    private void runJavaShadow(TriageAiRequest request, ShadowComparison comparison) {
        long startedAt = System.nanoTime();
        triageAiEngine.streamAnalyzeSymptoms(request)
                .filter(event -> "final".equals(event.get("event")) || "error".equals(event.get("event")))
                .next()
                .subscribeOn(shadowScheduler)
                .timeout(Duration.ofSeconds(120))
                .subscribe(
                        terminalEvent -> comparison.acceptJavaEvent(
                                terminalEvent,
                                elapsedMillis(startedAt)),
                        error -> log.warn(
                                "Java shadow runtime failed for turn {} with type {}",
                                request.getTurnId(),
                                error.getClass().getSimpleName()));
    }

    private long elapsedMillis(long startedAt) {
        return Duration.ofNanos(System.nanoTime() - startedAt).toMillis();
    }

    private Map<String, Object> safeSummary(Map<String, Object> terminalEvent) {
        Map<String, Object> safeSummary = new HashMap<>();
        safeSummary.put("event", terminalEvent.get("event"));
        safeSummary.put("classification_status", terminalEvent.get("classification_status"));
        safeSummary.put("classification_error_code", terminalEvent.get("classification_error_code"));
        safeSummary.put("red_flag_detected", terminalEvent.get("red_flag_detected"));
        Object triageResult = terminalEvent.get("triage_result");
        if (triageResult instanceof Map<?, ?> resultMap) {
            safeSummary.put("suggested_department_code", resultMap.get("suggested_department_code"));
            safeSummary.put("suggested_department_name", resultMap.get("suggested_department_name"));
            safeSummary.put("urgency_level", resultMap.get("urgency_level"));
        }
        return safeSummary;
    }

    private final class ShadowComparison {
        private final String turnId;
        private final long pythonStartedAt = System.nanoTime();
        private final AtomicReference<Map<String, Object>> pythonResult = new AtomicReference<>();
        private final AtomicReference<Map<String, Object>> javaResult = new AtomicReference<>();
        private volatile long pythonLatencyMs;
        private volatile long javaLatencyMs;

        private ShadowComparison(String turnId) {
            this.turnId = turnId;
        }

        private void acceptPythonEvent(Map<String, Object> event) {
            if (!isTerminal(event) || !pythonResult.compareAndSet(null, safeSummary(event))) {
                return;
            }
            pythonLatencyMs = elapsedMillis(pythonStartedAt);
            logIfComplete();
        }

        private void acceptJavaEvent(Map<String, Object> event, long latencyMs) {
            if (!javaResult.compareAndSet(null, safeSummary(event))) {
                return;
            }
            javaLatencyMs = latencyMs;
            logIfComplete();
        }

        private void logIfComplete() {
            Map<String, Object> python = pythonResult.get();
            Map<String, Object> java = javaResult.get();
            if (python == null || java == null) {
                return;
            }
            log.info(
                    "AI shadow parity turn={} match={} pythonLatencyMs={} javaLatencyMs={} python={} java={}",
                    turnId,
                    python.equals(java),
                    pythonLatencyMs,
                    javaLatencyMs,
                    python,
                    java);
        }

        private boolean isTerminal(Map<String, Object> event) {
            Object eventName = event.get("event");
            return "final".equals(eventName) || "error".equals(eventName);
        }
    }

    @PreDestroy
    void disposeShadowScheduler() {
        shadowScheduler.dispose();
    }

    private enum RuntimeMode {
        PYTHON,
        JAVA_SHADOW,
        JAVA;

        static RuntimeMode from(String raw) {
            if (raw == null || raw.isBlank()) {
                return PYTHON;
            }
            return switch (raw.trim().toLowerCase(java.util.Locale.ROOT)) {
                case "java" -> JAVA;
                case "java-shadow", "java_shadow" -> JAVA_SHADOW;
                case "python" -> PYTHON;
                default -> {
                    log.warn("Unknown AI runtime '{}'; falling back to PYTHON", raw);
                    yield PYTHON;
                }
            };
        }
    }
}

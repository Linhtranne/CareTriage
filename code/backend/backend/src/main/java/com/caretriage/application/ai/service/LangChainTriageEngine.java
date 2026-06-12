package com.caretriage.application.ai.service;

import com.caretriage.application.ai.port.TriageAiEngine;
import com.caretriage.application.ai.model.TriageAiRequest;
import com.caretriage.application.ai.model.TriageClassification;
import com.caretriage.application.ai.model.TriageClassificationResult;
import com.caretriage.application.ai.model.PolicyResult;
import com.caretriage.application.ai.model.TriageResultDetail;
import com.caretriage.infrastructure.ai.prompt.TriagePromptFactory;
import dev.langchain4j.data.message.AiMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.data.message.SystemMessage;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.chat.StreamingChatLanguageModel;
import dev.langchain4j.model.output.Response;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import jakarta.annotation.PreDestroy;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.core.publisher.Sinks;
import reactor.core.scheduler.Scheduler;
import reactor.core.scheduler.Schedulers;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.time.Duration;

@Service
@RequiredArgsConstructor
@Slf4j
public class LangChainTriageEngine implements TriageAiEngine {

    private static final Duration CLASSIFICATION_TIMEOUT = Duration.ofSeconds(20);
    private static final int MAX_CONCURRENT_CLASSIFICATIONS = 4;
    private static final int MAX_QUEUED_CLASSIFICATIONS = 100;

    private final ChatLanguageModel chatLanguageModel;
    private final StreamingChatLanguageModel streamingChatLanguageModel;
    private final TriageClassifier triageClassifier;
    private final com.caretriage.application.ai.port.ClinicalRetriever clinicalRetriever;
    private final RagContextBuilder ragContextBuilder;
    private final CitationValidator citationValidator;
    private final com.caretriage.infrastructure.ai.config.LangChain4jConfig langChain4jConfig;
    private final Scheduler classificationScheduler = Schedulers.newBoundedElastic(
            MAX_CONCURRENT_CLASSIFICATIONS,
            MAX_QUEUED_CLASSIFICATIONS,
            "triage-classification");

    private static final Map<String, String> DEPARTMENT_WHITELIST_MAP = Map.of(
        "Nội tổng quát", "GENERAL_INTERNAL_MEDICINE",
        "Tai Mũi Họng", "ENT",
        "Tim mạch", "CARDIOLOGY",
        "Nhi khoa", "PEDIATRICS",
        "Sản phụ khoa", "OBGYN",
        "Da liễu", "DERMATOLOGY",
        "Tiêu hóa", "GASTROENTEROLOGY",
        "Cơ xương khớp", "ORTHOPEDICS",
        "Thần kinh", "NEUROLOGY",
        "Cấp cứu", "EMERGENCY"
    );

    @Override
    public TriageClassification analyzeSymptoms(TriageAiRequest request) {
        log.info("Analyzing symptoms for turn: {}", request.getTurnId());

        // 1. Red Flags Check
        PolicyResult redFlagResult = RedFlagDetector.detectRedFlags(request.getCurrentMessage());
        if (redFlagResult != null && redFlagResult.isTriggered()) {
            log.info("[RED_FLAG] Bypassing LLM due to red-flag match for turn: {}", request.getTurnId());
            return new TriageClassification(
                true,
                true,
                Collections.emptyList(),
                redFlagResult.getTriageResult()
            );
        }

        // 2. Format history for context
        String conversationContext = formatHistory(request.getConversationHistory(), request.getCurrentMessage());

        // 3. Retrieve RAG
        List<com.caretriage.application.ai.model.ClinicalEvidence> evidenceList = Collections.emptyList();
        boolean ragFailed = false;
        try {
            evidenceList = clinicalRetriever.retrieveRelevantInfo(request.getCurrentMessage());
        } catch (Exception e) {
            log.error("RAG retrieval failed: {}", e.getMessage());
            ragFailed = true;
        }

        String ragContext = ragContextBuilder.buildContext(evidenceList);

        // 4. Classify (Phase B)
        try {
            if (ragFailed) {
                return buildDegradedClassification(null);
            }
            TriageClassificationResult classificationResult = triageClassifier.classify(conversationContext, ragContext);
            return mapToTriageClassification(classificationResult);
        } catch (Exception e) {
            log.error("Classification failed: {}", e.getMessage(), e);
            return buildDegradedClassification(null);
        }
    }

    @Override
    public Flux<Map<String, Object>> streamAnalyzeSymptoms(TriageAiRequest request) {
        log.info("Streaming symptoms analysis for turn: {}", request.getTurnId());

        // 1. Red Flags Check
        PolicyResult redFlagResult = RedFlagDetector.detectRedFlags(request.getCurrentMessage());
        if (redFlagResult != null && redFlagResult.isTriggered()) {
            log.info("[RED_FLAG_STREAM] Bypassing LLM due to red-flag match for turn: {}", request.getTurnId());
            return emitRedFlagEvents(request.getTurnId(), redFlagResult);
        }

        // Retrieve and sanitize evidence before Phase A so the streamed reply is grounded.
        List<com.caretriage.application.ai.model.ClinicalEvidence> evidenceList;
        boolean ragFailed = false;
        try {
            evidenceList = clinicalRetriever.retrieveRelevantInfo(request.getCurrentMessage());
        } catch (RuntimeException error) {
            log.warn("RAG retrieval unavailable for turn {}; continuing without evidence.", request.getTurnId());
            evidenceList = Collections.emptyList();
            ragFailed = true;
        }
        String ragContext = ragContextBuilder.buildContext(evidenceList);

        // 2. Phase A Streaming setup
        Sinks.Many<Map<String, Object>> sink = Sinks.many().unicast().onBackpressureBuffer();
        String streamPrompt = buildStreamUserPrompt(request, ragContext);
        List<com.caretriage.application.ai.model.ClinicalEvidence> retrievedEvidence = evidenceList;
        boolean retrievalFailed = ragFailed;

        List<ChatMessage> messages = List.of(
            SystemMessage.from(TriagePromptFactory.SYSTEM_PROMPT),
            UserMessage.from(streamPrompt)
        );

        StringBuilder streamedReply = new StringBuilder();

        streamingChatLanguageModel.generate(messages, new dev.langchain4j.model.StreamingResponseHandler<AiMessage>() {
            private int sequence = 1;

            @Override
            public void onNext(String token) {
                if (token != null) {
                    streamedReply.append(token);
                    Map<String, Object> event = new HashMap<>();
                    event.put("event", "token");
                    event.put("sequence", sequence++);
                    event.put("content", token);
                    event.put("turn_id", request.getTurnId());
                    sink.tryEmitNext(event);
                }
            }

            @Override
            public void onComplete(Response<AiMessage> response) {
                String finalReplyText = streamedReply.toString();
                if (finalReplyText.trim().isEmpty()) {
                    emitError("LLM_EMPTY_RESPONSE", "Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại.");
                    return;
                }

                emitClassificationResult(
                        request,
                        finalReplyText,
                        ragContext,
                        retrievedEvidence,
                        retrievalFailed,
                        sink);
            }

            @Override
            public void onError(Throwable error) {
                log.error("LLM Phase A streaming failed for turn {}: {}", request.getTurnId(), error.getMessage(), error);
                emitError("LLM_PHASE_A_FAILED", "Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại.");
              }

              private void emitError(String errorCode, String message) {
                  Map<String, Object> errorEvent = new HashMap<>();
                  errorEvent.put("event", "error");
                  errorEvent.put("turn_id", request.getTurnId());
                  errorEvent.put("code", errorCode);
                  errorEvent.put("message", message);
                  errorEvent.put("retryable", true);
                  sink.tryEmitNext(errorEvent);
                  sink.tryEmitComplete();
              }
          });

        return sink.asFlux();
    }

    private Flux<Map<String, Object>> emitRedFlagEvents(String turnId, PolicyResult redFlagResult) {
        Map<String, Object> tokenEvent = new HashMap<>();
        tokenEvent.put("event", "token");
        tokenEvent.put("turn_id", turnId);
        tokenEvent.put("sequence", 1);
        tokenEvent.put("content", redFlagResult.getReplyMsg());

        Map<String, Object> finalPayload = new HashMap<>();
        finalPayload.put("contract_version", "1");
        finalPayload.put("turn_id", turnId);
        finalPayload.put("reply", redFlagResult.getReplyMsg());
        finalPayload.put("intake_complete", true);
        finalPayload.put("red_flag_detected", true);
        finalPayload.put("missing_information", Collections.emptyList());
        finalPayload.put("classification_status", "OK");
        finalPayload.put("classification_error_code", null);

        TriageResultDetail raw = redFlagResult.getTriageResult();
        Map<String, Object> triageResult = new HashMap<>();
        triageResult.put("suggested_department_code", raw.getSuggestedDepartmentCode());
        triageResult.put("suggested_department_name", raw.getSuggestedDepartmentName());
        triageResult.put("urgency_level", raw.getUrgencyLevel());
        triageResult.put("confidence_score", raw.getConfidenceScore());
        triageResult.put("possible_conditions", raw.getPossibleConditions());
        triageResult.put("suggested_actions", raw.getSuggestedActions());
        triageResult.put("clinical_reasoning_summary", raw.getClinicalReasoningSummary() != null ? raw.getClinicalReasoningSummary() : "Deterministic red flag rule triggered.");
        triageResult.put("summary", raw.getSummary() != null ? raw.getSummary() : "Emergency warning triggered by reported symptoms.");
        triageResult.put("red_flag_detected", true);
        finalPayload.put("triage_result", triageResult);

        Map<String, Object> finalEvent = new HashMap<>();
        finalEvent.put("event", "final");
        finalEvent.putAll(finalPayload);

        return Flux.just(tokenEvent, finalEvent);
    }

    private String buildStreamUserPrompt(TriageAiRequest request, String ragContext) {
        List<String> conversationLines = new ArrayList<>();
        List<Map<String, Object>> history = request.getConversationHistory();

        int startIdx = Math.max(0, history.size() - 15);
        for (int i = startIdx; i < history.size(); i++) {
            Map<String, Object> item = history.get(i);
            String role = "user".equalsIgnoreCase(String.valueOf(item.get("role"))) ? "Patient" : "Assistant";
            String content = String.valueOf(item.getOrDefault("content", ""));
            if (content.length() > 1000) {
                content = content.substring(0, 1000);
            }
            conversationLines.add(role + ": " + content);
        }

        Map<String, Object> metadata = request.getMetadata();
        if (metadata != null) {
            String age = String.valueOf(metadata.getOrDefault("age", ""));
            String gender = String.valueOf(metadata.getOrDefault("gender", ""));
            String onset = String.valueOf(metadata.getOrDefault("onset", ""));
            if (!age.isEmpty() || !gender.isEmpty() || !onset.isEmpty()) {
                conversationLines.add(0, "[PATIENT PROFILE] Age: " + age + ", Gender: " + gender + ", Onset: " + onset);
            }
        }

        String evidenceSection = ragContext == null || ragContext.isBlank()
                ? ""
                : "\n\nCLINICAL EVIDENCE:\n" + ragContext;

        return "HISTORY:\n" + String.join("\n", conversationLines)
                + "\n\nCURRENT MESSAGE: " + request.getCurrentMessage() + "\n\n"
                + evidenceSection + "\n\n"
                + "Reply conversationally in Vietnamese. Ask only the next necessary "
                + "question, or conclude with a doctor/specialist recommendation when "
                + "symptom, onset, and severity are clear.";
    }

    private String formatHistory(List<Map<String, Object>> history, String currentMessage) {
        List<String> conversationLines = new ArrayList<>();
        if (history != null) {
            for (Map<String, Object> item : history) {
                String role = "user".equalsIgnoreCase(String.valueOf(item.get("role"))) ? "Patient" : "Assistant";
                String content = String.valueOf(item.getOrDefault("content", ""));
                conversationLines.add(role + ": " + content);
            }
        }
        conversationLines.add("Patient: " + currentMessage);
        return String.join("\n", conversationLines);
    }

    private Map<String, Object> buildFinalOkEvent(String turnId, String replyText, TriageClassificationResult res) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "final");
        event.put("contract_version", "1");
        event.put("turn_id", turnId);
        event.put("reply", replyText);

        boolean intakeComplete = res.intakeComplete() && res.suggestedDepartment() != null;
        event.put("intake_complete", intakeComplete);
        event.put("red_flag_detected", res.redFlagDetected() || res.infectionControl());
        event.put("missing_information", intakeComplete ? Collections.emptyList() : res.missingInformation());
        event.put("classification_status", "OK");
        event.put("classification_error_code", null);

        if (intakeComplete) {
            String deptName = res.suggestedDepartment();
            String deptCode = DEPARTMENT_WHITELIST_MAP.getOrDefault(deptName, "GENERAL_INTERNAL_MEDICINE");
            String mappedDeptName = DEPARTMENT_WHITELIST_MAP.containsKey(deptName) ? deptName : "Nội tổng quát";
            String mappingStatus = DEPARTMENT_WHITELIST_MAP.containsKey(deptName) ? "MATCHED" : "LOW_CONFIDENCE_FALLBACK";

            Map<String, Object> triageResult = new HashMap<>();
            triageResult.put("suggested_department_code", deptCode);
            triageResult.put("suggested_department_name", mappedDeptName);
            triageResult.put("urgency_level", res.urgencyLevel() != null ? res.urgencyLevel() : "MEDIUM");
            triageResult.put("confidence_score", res.confidenceScore());
            triageResult.put("possible_conditions", res.possibleConditions() != null ? res.possibleConditions() : Collections.emptyList());
            triageResult.put("suggested_actions", res.suggestedActions() != null ? res.suggestedActions() : Collections.emptyList());
            triageResult.put("department_mapping_status", mappingStatus);
            triageResult.put("clinical_reasoning_summary", res.clinicalReasoningSummary() != null ? res.clinicalReasoningSummary() : "");
            triageResult.put("summary", res.summary() != null ? res.summary() : "");
            triageResult.put("red_flag_detected", res.redFlagDetected() || res.infectionControl());

            event.put("triage_result", triageResult);
        } else {
            event.put("triage_result", null);
        }

        return event;
    }

    private Map<String, Object> buildFinalDegradedEvent(String turnId, String replyText, String errorCode) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "final");
        event.put("contract_version", "1");
        event.put("turn_id", turnId);
        event.put("reply", replyText);
        event.put("intake_complete", false);
        event.put("red_flag_detected", false);
        event.put("missing_information", Collections.emptyList());
        event.put("classification_status", "DEGRADED");
        event.put("classification_error_code", errorCode);
        event.put("triage_result", null);
        return event;
    }

    private TriageClassification mapToTriageClassification(TriageClassificationResult res) {
        boolean intakeComplete = res.intakeComplete() && res.suggestedDepartment() != null;
        TriageResultDetail triageResult = null;
        if (intakeComplete) {
            String deptName = res.suggestedDepartment();
            String deptCode = DEPARTMENT_WHITELIST_MAP.getOrDefault(deptName, "GENERAL_INTERNAL_MEDICINE");
            String mappedDeptName = DEPARTMENT_WHITELIST_MAP.containsKey(deptName) ? deptName : "Nội tổng quát";
            String mappingStatus = DEPARTMENT_WHITELIST_MAP.containsKey(deptName) ? "MATCHED" : "LOW_CONFIDENCE_FALLBACK";

            triageResult = TriageResultDetail.builder()
                    .suggestedDepartmentCode(deptCode)
                    .suggestedDepartmentName(mappedDeptName)
                    .urgencyLevel(res.urgencyLevel() != null ? res.urgencyLevel() : "MEDIUM")
                    .confidenceScore(res.confidenceScore())
                    .possibleConditions(res.possibleConditions())
                    .suggestedActions(res.suggestedActions())
                    .departmentMappingStatus(mappingStatus)
                    .clinicalReasoningSummary(res.clinicalReasoningSummary())
                    .summary(res.summary())
                    .redFlagDetected(res.redFlagDetected() || res.infectionControl())
                    .build();
        }
        return new TriageClassification(
                intakeComplete,
                res.redFlagDetected() || res.infectionControl(),
                intakeComplete ? Collections.emptyList() : res.missingInformation(),
                triageResult
        );
    }

    private TriageClassification buildDegradedClassification(TriageResultDetail fallbackResult) {
        return new TriageClassification(
                false,
                false,
                Collections.emptyList(),
                fallbackResult
        );
    }

    private void emitClassificationResult(
            TriageAiRequest request,
            String finalReplyText,
            String ragContext,
            List<com.caretriage.application.ai.model.ClinicalEvidence> evidence,
            boolean retrievalFailed,
            Sinks.Many<Map<String, Object>> sink) {
        if (retrievalFailed) {
            sink.tryEmitNext(buildFinalDegradedEvent(request.getTurnId(), finalReplyText, "RAG_DEGRADED"));
            sink.tryEmitComplete();
            return;
        }

        String conversationContext = formatHistory(
                request.getConversationHistory(),
                request.getCurrentMessage()) + "\nAssistant: " + finalReplyText;

        Mono<Map<String, Object>> classificationMono = Mono.fromCallable(() -> triageClassifier.classify(conversationContext, ragContext))
                .subscribeOn(classificationScheduler)
                .timeout(CLASSIFICATION_TIMEOUT)
                .map(result -> buildValidatedFinalEvent(request.getTurnId(), finalReplyText, result, evidence))
                .onErrorReturn(buildFinalDegradedEvent(
                        request.getTurnId(),
                        finalReplyText,
                        "LLM_PHASE_B_FAILED"))
                .cache();

        Flux<Map<String, Object>> heartbeatFlux = Flux.interval(Duration.ofSeconds(15))
                .map(ignored -> buildHeartbeatEvent(request.getTurnId(), "classification"));

        Flux.merge(
                        heartbeatFlux.takeUntilOther(classificationMono),
                        classificationMono.flux())
                .subscribe(
                        finalOrHeartbeatEvent -> {
                            sink.tryEmitNext(finalOrHeartbeatEvent);
                            if ("final".equals(finalOrHeartbeatEvent.get("event"))) {
                                sink.tryEmitComplete();
                            }
                        },
                        error -> {
                            log.warn("Phase B pipeline failed for turn {}.", request.getTurnId());
                            sink.tryEmitNext(buildFinalDegradedEvent(
                                    request.getTurnId(),
                                    finalReplyText,
                                    "INTERNAL_STREAM_ERROR"));
                            sink.tryEmitComplete();
                        });
    }

    private Map<String, Object> buildHeartbeatEvent(String turnId, String phase) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "heartbeat");
        event.put("turn_id", turnId);
        event.put("phase", phase);
        return event;
    }

    private Map<String, Object> buildValidatedFinalEvent(
            String turnId,
            String finalReplyText,
            TriageClassificationResult classification,
            List<com.caretriage.application.ai.model.ClinicalEvidence> evidence) {
        Set<String> allowedIds = new java.util.HashSet<>();
        for (com.caretriage.application.ai.model.ClinicalEvidence item : evidence) {
            allowedIds.add(item.evidenceId());
        }
        Set<String> invalidCitations = citationValidator.findInvalidCitations(finalReplyText, allowedIds);
        Map<String, Object> finalEvent = buildFinalOkEvent(turnId, finalReplyText, classification);
        finalEvent.put("citation_status", invalidCitations.isEmpty() ? "VALID" : "DEGRADED");
        finalEvent.put("invalid_citations", invalidCitations);
        return finalEvent;
    }

    @PreDestroy
    void disposeClassificationScheduler() {
        classificationScheduler.dispose();
    }
}

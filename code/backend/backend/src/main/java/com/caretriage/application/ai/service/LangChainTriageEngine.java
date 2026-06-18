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

    private static final String EVENT_KEY = "event";
    private static final String CONTENT_KEY = "content";
    private static final String TURN_ID_KEY = "turn_id";
    private static final String CONTRACT_VERSION_KEY = "contract_version";
    private static final String REPLY_KEY = "reply";
    private static final String INTAKE_COMPLETE_KEY = "intake_complete";
    private static final String RED_FLAG_DETECTED_KEY = "red_flag_detected";
    private static final String MISSING_INFORMATION_KEY = "missing_information";
    private static final String CLASSIFICATION_STATUS_KEY = "classification_status";
    private static final String CLASSIFICATION_ERROR_CODE_KEY = "classification_error_code";
    private static final String TRIAGE_RESULT_KEY = "triage_result";
    private static final String EVENT_FINAL = "final";
    private static final String DEFAULT_DEPT = "Nội tổng quát";
    private static final String DEFAULT_DEPT_CODE = "GENERAL_INTERNAL_MEDICINE";


    private final StreamingChatLanguageModel streamingChatLanguageModel;
    private final TriageClassifier triageClassifier;
    private final com.caretriage.application.ai.port.ClinicalRetriever clinicalRetriever;
    private final RagContextBuilder ragContextBuilder;
    private final CitationValidator citationValidator;
    private final Scheduler classificationScheduler = Schedulers.newBoundedElastic(
            MAX_CONCURRENT_CLASSIFICATIONS,
            MAX_QUEUED_CLASSIFICATIONS,
            "triage-classification");

    private static final Map<String, String> DEPARTMENT_WHITELIST_MAP = Map.ofEntries(
        Map.entry(DEFAULT_DEPT, DEFAULT_DEPT_CODE),
        Map.entry("Tai Mũi Họng", "ENT"),
        Map.entry("Tim mạch", "CARDIOLOGY"),
        Map.entry("Nhi khoa", "PEDIATRICS"),
        Map.entry("Sản phụ khoa", "OBGYN"),
        Map.entry("Da liễu", "DERMATOLOGY"),
        Map.entry("Tiêu hóa", "GASTROENTEROLOGY"),
        Map.entry("Cơ xương khớp", "ORTHOPEDICS"),
        Map.entry("Thần kinh", "NEUROLOGY"),
        Map.entry("Cấp cứu", "EMERGENCY"),
        Map.entry("Răng Hàm Mặt", "DENTISTRY"),
        Map.entry("Nha khoa", "DENTISTRY")
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
            log.error("RAG retrieval failed: {}", e.getClass().getSimpleName());
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
            log.error("Classification failed: {}", e.getClass().getSimpleName(), e);
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
                    event.put(EVENT_KEY, "token");
                    event.put("sequence", sequence++);
                    event.put(CONTENT_KEY, token);
                    event.put(TURN_ID_KEY, request.getTurnId());
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
                log.error("LLM Phase A streaming failed for turn {}: {}", request.getTurnId(), error.getClass().getSimpleName());
                emitError("LLM_PHASE_A_FAILED", "Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại.");
              }

              private void emitError(String errorCode, String message) {
                  Map<String, Object> errorEvent = new HashMap<>();
                  errorEvent.put(EVENT_KEY, "error");
                  errorEvent.put(TURN_ID_KEY, request.getTurnId());
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
        tokenEvent.put(EVENT_KEY, "token");
        tokenEvent.put(TURN_ID_KEY, turnId);
        tokenEvent.put("sequence", 1);
        tokenEvent.put(CONTENT_KEY, redFlagResult.getReplyMsg());

        Map<String, Object> finalPayload = new HashMap<>();
        finalPayload.put(CONTRACT_VERSION_KEY, "1");
        finalPayload.put(TURN_ID_KEY, turnId);
        finalPayload.put(REPLY_KEY, redFlagResult.getReplyMsg());
        finalPayload.put(INTAKE_COMPLETE_KEY, true);
        finalPayload.put(RED_FLAG_DETECTED_KEY, true);
        finalPayload.put(MISSING_INFORMATION_KEY, Collections.emptyList());
        finalPayload.put(CLASSIFICATION_STATUS_KEY, "OK");
        finalPayload.put(CLASSIFICATION_ERROR_CODE_KEY, null);

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
        triageResult.put(RED_FLAG_DETECTED_KEY, true);
        finalPayload.put(TRIAGE_RESULT_KEY, triageResult);

        Map<String, Object> finalEvent = new HashMap<>();
        finalEvent.put(EVENT_KEY, EVENT_FINAL);
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
            String content = String.valueOf(item.getOrDefault(CONTENT_KEY, ""));
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
                + "Trả lời bằng tiếng Việt cho bệnh nhân. Nếu thông tin đã đủ để định hướng chuyên khoa, "
                + "hãy kết luận rõ chuyên khoa cần khám, ví dụ: \"khoa Răng Hàm Mặt\" hoặc \"bác sĩ nha khoa\", "
                + "và nói rằng hệ thống sẽ chuyển sang bước đặt lịch với bác sĩ phù hợp. "
                + "Không liệt kê tên bác sĩ cụ thể trong câu trả lời chat; danh sách bác sĩ sẽ do bước đặt lịch hiển thị. "
                + "Chỉ hỏi thêm 1 câu ngắn nếu thật sự chưa thể chọn chuyên khoa an toàn.";
    }

    private String formatHistory(List<Map<String, Object>> history, String currentMessage) {
        List<String> conversationLines = new ArrayList<>();
        if (history != null) {
            for (Map<String, Object> item : history) {
                String role = "user".equalsIgnoreCase(String.valueOf(item.get("role"))) ? "Patient" : "Assistant";
                String content = String.valueOf(item.getOrDefault(CONTENT_KEY, ""));
                conversationLines.add(role + ": " + content);
            }
        }
        conversationLines.add("Patient: " + currentMessage);
        return String.join("\n", conversationLines);
    }

    @SuppressWarnings("java:S3776")
    private Map<String, Object> buildFinalOkEvent(String turnId, String replyText, TriageClassificationResult res) {
        Map<String, Object> event = new HashMap<>();
        event.put(EVENT_KEY, EVENT_FINAL);
        event.put(CONTRACT_VERSION_KEY, "1");
        event.put(TURN_ID_KEY, turnId);
        event.put(REPLY_KEY, replyText);

        boolean intakeComplete = res.intakeComplete() && res.suggestedDepartment() != null;
        event.put(INTAKE_COMPLETE_KEY, intakeComplete);
        event.put(RED_FLAG_DETECTED_KEY, res.redFlagDetected() || res.infectionControl());
        event.put(MISSING_INFORMATION_KEY, intakeComplete ? Collections.emptyList() : res.missingInformation());
        event.put(CLASSIFICATION_STATUS_KEY, "OK");
        event.put(CLASSIFICATION_ERROR_CODE_KEY, null);

        if (intakeComplete) {
            String deptName = res.suggestedDepartment();
            String deptCode = DEPARTMENT_WHITELIST_MAP.getOrDefault(deptName, DEFAULT_DEPT_CODE);
            String mappedDeptName = DEPARTMENT_WHITELIST_MAP.containsKey(deptName) ? deptName : DEFAULT_DEPT;
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
            triageResult.put(RED_FLAG_DETECTED_KEY, res.redFlagDetected() || res.infectionControl());

            event.put(TRIAGE_RESULT_KEY, triageResult);
        } else {
            event.put(TRIAGE_RESULT_KEY, null);
        }

        return event;
    }

    private Map<String, Object> buildFinalDegradedEvent(String turnId, String replyText, String errorCode) {
        Map<String, Object> event = new HashMap<>();
        event.put(EVENT_KEY, EVENT_FINAL);
        event.put(CONTRACT_VERSION_KEY, "1");
        event.put(TURN_ID_KEY, turnId);
        event.put(REPLY_KEY, replyText);
        event.put(INTAKE_COMPLETE_KEY, false);
        event.put(RED_FLAG_DETECTED_KEY, false);
        event.put(MISSING_INFORMATION_KEY, Collections.emptyList());
        event.put(CLASSIFICATION_STATUS_KEY, "DEGRADED");
        event.put(CLASSIFICATION_ERROR_CODE_KEY, errorCode);
        event.put(TRIAGE_RESULT_KEY, null);
        return event;
    }

    private TriageClassification mapToTriageClassification(TriageClassificationResult res) {
        boolean intakeComplete = res.intakeComplete() && res.suggestedDepartment() != null;
        TriageResultDetail triageResult = null;
        if (intakeComplete) {
            String deptName = res.suggestedDepartment();
            String deptCode = DEPARTMENT_WHITELIST_MAP.getOrDefault(deptName, DEFAULT_DEPT_CODE);
            String mappedDeptName = DEPARTMENT_WHITELIST_MAP.containsKey(deptName) ? deptName : DEFAULT_DEPT;
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
                .switchIfEmpty(Mono.defer(() -> Mono.just(buildFinalDegradedEvent(
                        request.getTurnId(),
                        finalReplyText,
                        "LLM_PHASE_B_EMPTY"))))
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
                            if (EVENT_FINAL.equals(finalOrHeartbeatEvent.get(EVENT_KEY))) {
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
                        },
                        sink::tryEmitComplete);
    }

    private Map<String, Object> buildHeartbeatEvent(String turnId, String phase) {
        Map<String, Object> event = new HashMap<>();
        event.put(EVENT_KEY, "heartbeat");
        event.put(TURN_ID_KEY, turnId);
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

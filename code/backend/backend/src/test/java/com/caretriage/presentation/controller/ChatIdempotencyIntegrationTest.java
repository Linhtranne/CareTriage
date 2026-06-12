package com.caretriage.presentation.controller;

import com.caretriage.application.dto.ChatMessageDTO;
import com.caretriage.domain.entity.ChatSession;
import com.caretriage.domain.entity.ChatTurn;
import com.caretriage.domain.entity.User;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import com.caretriage.domain.repository.ChatSessionRepository;
import com.caretriage.domain.repository.ChatMessageRepository;
import com.caretriage.domain.repository.ChatTurnRepository;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.infrastructure.persistence.repository.UserJpaRepository;
import com.caretriage.application.service.AiClientService;
import com.caretriage.application.ai.port.TriageAiEngine;
import com.caretriage.application.ai.model.TriageAiRequest;
import com.caretriage.infrastructure.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.springframework.http.HttpStatus;
import reactor.core.publisher.Flux;
import reactor.netty.http.client.PrematureCloseException;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

import com.caretriage.infrastructure.config.ChatProperties;
import com.caretriage.application.service.impl.ChatTurnFinalizer;
import com.caretriage.application.service.impl.ChatTurnReconciliationService;
import com.caretriage.application.dto.PersistedEventPayload;
import org.springframework.jdbc.core.JdbcTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = "app.ai.runtime=java")
@ActiveProfiles("test")
public class ChatIdempotencyIntegrationTest {

    private static final Logger log = LoggerFactory.getLogger(ChatIdempotencyIntegrationTest.class);

    @Autowired
    private WebTestClient webTestClient;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserJpaRepository userJpaRepository;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ChatTurnRepository chatTurnRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private ChatProperties chatProperties;

    @Autowired
    private ChatTurnFinalizer chatTurnFinalizer;

    @MockBean
    private ChatTurnReconciliationService chatTurnReconciliationService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @MockBean
    private AiClientService aiClientService;
    
    @MockBean
    private TriageAiEngine triageAiEngine;

    private User testUser;
    private UserJpaEntity testUserJpa;
    private String jwtToken;

    @BeforeEach
    void setUp() {
        chatTurnRepository.deleteAll();
        chatSessionRepository.deleteAll();
        userJpaRepository.deleteAll();

        // Create test user in DB
        testUser = User.builder()
                .email("patient@example.com")
                .username("patient")
                .fullName("John Doe")
                .password("password")
                .build();
        testUser = userRepository.save(testUser);

        testUserJpa = userJpaRepository.findById(testUser.getId())
                .orElseThrow(() -> new IllegalStateException("Test user not found in DB after save"));

        jwtToken = jwtTokenProvider.generateTokenFromEmail(testUser.getEmail());
    }

    @Test
    void firstMessage_Success_And_DuplicateRetry_Conflict() throws Exception {
        // Mock the AI service response stream
        Map<String, Object> mockEvent = new HashMap<>();
        mockEvent.put("event", "token");
        mockEvent.put("content", "Hello");
        when(triageAiEngine.streamAnalyzeSymptoms(any(TriageAiRequest.class)))
                .thenReturn(Flux.just(mockEvent));

        ChatMessageDTO firstMessage = ChatMessageDTO.builder()
                .turnId("123e4567-e89b-12d3-a456-426614174000")
                .content("Tôi bị sốt nhẹ")
                .sessionType(ChatSession.SessionType.TRIAGE)
                .title("Triage Session")
                .build();

        // 1. First request - should succeed
        webTestClient.post().uri("/api/v1/chat/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(firstMessage)
                .exchange()
                .expectStatus().isOk();

        // Verify ChatSession, ChatTurn, and exactly one persisted USER message were created.
        Optional<ChatTurn> turnOpt = chatTurnRepository.findByUserIdAndTurnId(testUser.getId(), "123e4567-e89b-12d3-a456-426614174000");
        assertThat(turnOpt).isPresent();
        ChatTurn turn = turnOpt.get();
        assertThat(turn.getStatus()).isIn(ChatTurn.TurnStatus.STARTED, ChatTurn.TurnStatus.STREAMING);
        assertThat(turn.getChatSession()).isNotNull();
        assertThat(chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(turn.getChatSession().getId()))
                .hasSize(1)
                .allSatisfy(message -> assertThat(message.getSenderType()).isEqualTo(com.caretriage.domain.entity.ChatMessage.SenderType.USER));

        // Save session ID for subsequent requests
        Long sessionId = turn.getChatSession().getId();

        // 2. Duplicate Request with same turnId - should result in Conflict (TURN_IN_PROGRESS)
        webTestClient.post().uri("/api/v1/chat/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(firstMessage)
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.CONFLICT);

        // 3. Retry on the old session endpoint with same turnId - should also result in Conflict
        ChatMessageDTO sessionMessage = ChatMessageDTO.builder()
                .turnId("123e4567-e89b-12d3-a456-426614174000")
                .content("Tôi bị sốt nhẹ")
                .build();

        webTestClient.post().uri("/api/v1/chat/sessions/" + sessionId + "/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(sessionMessage)
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void staleActiveTurn_RetryReusesSessionTurnAndUserMessage() {
        chatProperties.setActiveTurnStaleTimeout(java.time.Duration.ofMillis(50));
        try {
            Map<String, Object> tokenEvent = new HashMap<>();
            tokenEvent.put("event", "token");
            tokenEvent.put("content", "Hello");
            when(triageAiEngine.streamAnalyzeSymptoms(any(TriageAiRequest.class)))
                    .thenReturn(Flux.just(tokenEvent));

            String turnId = "123e4567-e89b-12d3-a456-426614174010";
            ChatMessageDTO message = ChatMessageDTO.builder()
                    .turnId(turnId)
                    .content("Tôi bị sốt nhẹ")
                    .sessionType(ChatSession.SessionType.TRIAGE)
                    .title("Stale active turn")
                    .build();

            webTestClient.post().uri("/api/v1/chat/messages/stream")
                    .header("Authorization", "Bearer " + jwtToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(message)
                    .exchange()
                    .expectStatus().isOk();

            ChatTurn original = chatTurnRepository.findByUserIdAndTurnId(testUser.getId(), turnId)
                    .orElseThrow();
            jdbcTemplate.update(
                    "UPDATE chat_turns SET status = 'STREAMING', updated_at = ? WHERE id = ?",
                    java.sql.Timestamp.valueOf(java.time.LocalDateTime.now().minusSeconds(1)),
                    original.getId());

            webTestClient.post().uri("/api/v1/chat/messages/stream")
                    .header("Authorization", "Bearer " + jwtToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(message)
                    .exchange()
                    .expectStatus().isOk();

            ChatTurn recovered = chatTurnRepository.findById(original.getId()).orElseThrow();
            assertThat(recovered.getAttemptCount()).isEqualTo(2);
            assertThat(chatSessionRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId())).hasSize(1);
            assertThat(chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(
                    recovered.getChatSession().getId()))
                    .hasSize(1)
                    .allSatisfy(chatMessage -> {
                        assertThat(chatMessage.getSenderType())
                                .isEqualTo(com.caretriage.domain.entity.ChatMessage.SenderType.USER);
                        assertThat(chatMessage.getTurnId()).isEqualTo(turnId);
                    });
        } finally {
            chatProperties.setActiveTurnStaleTimeout(java.time.Duration.ofSeconds(150));
        }
    }

    @Test
    void completedTurn_ReplaysPersistedPayload() throws Exception {
        // Create an existing session
        ChatSession session = ChatSession.builder()
                .user(testUserJpa)
                .sessionType(ChatSession.SessionType.TRIAGE)
                .title("Replay Session")
                .status(ChatSession.SessionStatus.ACTIVE)
                .build();
        session = chatSessionRepository.save(session);

        // Pre-create a COMPLETED ChatTurn in database with persisted payload
        String testPersistedPayload = "{\"ticket_status\":\"READY\",\"ticket_id\":\"ticket-abc\",\"specialty_code\":\"CARDIOLOGY\",\"specialty_name\":\"Tim mạch\",\"red_flag_detected\":false}";
        ChatTurn completedTurn = ChatTurn.builder()
                .chatSession(session)
                .user(testUserJpa)
                .turnId("123e4567-e89b-12d3-a456-426614174001")
                .status(ChatTurn.TurnStatus.COMPLETED)
                .ticketStatus(ChatTurn.TicketStatus.READY)
                .persistedPayload(testPersistedPayload)
                .attemptCount(1)
                .build();
        chatTurnRepository.save(completedTurn);

        ChatMessageDTO messageDto = ChatMessageDTO.builder()
                .turnId("123e4567-e89b-12d3-a456-426614174001")
                .content("Tôi bị đau ngực")
                .build();

        // Perform request on session messages stream - should replay persisted payload
        webTestClient.post().uri("/api/v1/chat/sessions/" + session.getId() + "/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(messageDto)
                .exchange()
                .expectStatus().isOk();
    }

    @Test
    void streamEndpoints_BlankContentOrTurnId_ReturnsBadRequest() {
        // 1. Invalid UUID, but valid content -> Should fail due to UUID format
        ChatMessageDTO msg1 = ChatMessageDTO.builder()
                .turnId("test-turn-invalid-uuid")
                .content("Tôi bị sốt")
                .build();
        webTestClient.post().uri("/api/v1/chat/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(msg1)
                .exchange()
                .expectStatus().isBadRequest();

        // 2. Valid UUID, but blank content -> Should fail due to content
        ChatMessageDTO msg2 = ChatMessageDTO.builder()
                .turnId("123e4567-e89b-12d3-a456-426614174000")
                .content("   ")
                .build();
        webTestClient.post().uri("/api/v1/chat/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(msg2)
                .exchange()
                .expectStatus().isBadRequest();

        // 3. Null turnId, but valid content -> Should fail due to null turnId
        ChatMessageDTO msg3 = ChatMessageDTO.builder()
                .turnId(null)
                .content("Tôi bị sốt")
                .build();
        webTestClient.post().uri("/api/v1/chat/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(msg3)
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void concurrentRequests_OnlyOneSessionAndOneTurnCreated() throws Exception {
        when(triageAiEngine.streamAnalyzeSymptoms(any(com.caretriage.application.ai.model.TriageAiRequest.class)))
                .thenReturn(Flux.never());

        String uuid = "123e4567-e89b-12d3-a456-426614174999";
        ChatMessageDTO concurrentMessage = ChatMessageDTO.builder()
                .turnId(uuid)
                .content("Tôi bị sốt cao song song")
                .sessionType(ChatSession.SessionType.TRIAGE)
                .title("Concurrent Session")
                .build();

        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(2);
        java.util.concurrent.CountDownLatch ready = new java.util.concurrent.CountDownLatch(2);
        java.util.concurrent.CountDownLatch start = new java.util.concurrent.CountDownLatch(1);

        java.util.List<java.util.concurrent.Future<Integer>> futures = new java.util.ArrayList<>();

        for (int i = 0; i < 2; i++) {
            futures.add(executor.submit(() -> {
                ready.countDown();
                try {
                    java.util.concurrent.atomic.AtomicInteger statusCode = new java.util.concurrent.atomic.AtomicInteger();
                    start.await();
                    webTestClient.post().uri("/api/v1/chat/messages/stream")
                            .header("Authorization", "Bearer " + jwtToken)
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(concurrentMessage)
                            .exchange()
                            .expectStatus().value(status -> {
                                log.info("Concurrent request finished with status: {}", status);
                                statusCode.set(status);
                            });
                    return statusCode.get();
                } catch (Exception e) {
                    log.error("Concurrent request error", e);
                    return 500;
                }
            }));
        }

        boolean readySucceeded = ready.await(2, java.util.concurrent.TimeUnit.SECONDS);
        assertThat(readySucceeded).isTrue();

        start.countDown();

        java.util.List<Integer> statusCodes = new java.util.ArrayList<>();
        for (java.util.concurrent.Future<Integer> f : futures) {
            statusCodes.add(f.get(5, java.util.concurrent.TimeUnit.SECONDS));
        }

        executor.shutdown();

        log.info("Concurrent requests completed. Status codes: {}", statusCodes);
        assertThat(statusCodes).containsExactlyInAnyOrder(200, 409);

        // Verify that only 1 ChatSession exists
        java.util.List<ChatSession> sessions = chatSessionRepository.findByUserIdOrderByCreatedAtDesc(testUser.getId());
        assertThat(sessions).hasSize(1);

        // Verify that only 1 ChatTurn exists
        Optional<ChatTurn> turnOpt = chatTurnRepository.findByUserIdAndTurnId(testUser.getId(), uuid);
        assertThat(turnOpt).isPresent();

        // Verify that only 1 ChatMessage (USER) is saved
        java.util.List<com.caretriage.domain.entity.ChatMessage> messages = jdbcTemplate.query(
                "SELECT * FROM chat_messages WHERE session_id = ? AND sender_type = 'USER'",
                (rs, rowNum) -> null,
                sessions.get(0).getId()
        );
        assertThat(messages).hasSize(1);
    }

    @Test
    void inactivityTimeout_EmitsStreamTimeoutAndMarksTurnFailed() {
        chatProperties.setInactivityTimeout(java.time.Duration.ofMillis(100));
        chatProperties.setWholeTurnTimeout(java.time.Duration.ofMillis(600));
        try {
            Map<String, Object> tokenEvent = new HashMap<>();
            tokenEvent.put("event", "token");
            tokenEvent.put("content", "initial");

            when(triageAiEngine.streamAnalyzeSymptoms(any(com.caretriage.application.ai.model.TriageAiRequest.class)))
                    .thenReturn(Flux.just(tokenEvent).concatWith(Flux.never()));

            ChatMessageDTO message = ChatMessageDTO.builder()
                    .turnId("123e4567-e89b-12d3-a456-426614174901")
                    .content("Đau bụng")
                    .sessionType(ChatSession.SessionType.TRIAGE)
                    .title("Timeout Test")
                    .build();

            java.util.List<String> results = new java.util.ArrayList<>();
            webTestClient.post().uri("/api/v1/chat/messages/stream")
                    .header("Authorization", "Bearer " + jwtToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(message)
                    .exchange()
                    .expectStatus().isOk()
                    .returnResult(String.class)
                    .getResponseBody()
                    .doOnNext(results::add)
                    .onErrorResume(e -> {
                        if (e instanceof PrematureCloseException || e.getCause() instanceof PrematureCloseException) {
                            return Flux.empty();
                        }
                        return Flux.error(e);
                    })
                    .blockLast();

            String body = String.join("", results);
            assertThat(body).contains("STREAM_TIMEOUT");

            Optional<ChatTurn> turnOpt = chatTurnRepository.findByUserIdAndTurnId(testUser.getId(), "123e4567-e89b-12d3-a456-426614174901");
            assertThat(turnOpt).isPresent();
            assertThat(turnOpt.get().getStatus()).isEqualTo(ChatTurn.TurnStatus.FAILED);
            assertThat(turnOpt.get().getErrorCode()).isEqualTo("STREAM_TIMEOUT");
        } finally {
            chatProperties.setInactivityTimeout(java.time.Duration.ofSeconds(45));
            chatProperties.setWholeTurnTimeout(java.time.Duration.ofSeconds(120));
        }
    }

    @Test
    void wholeTurnTimeout_EmitsStreamTimeoutAndMarksTurnFailed() {
        chatProperties.setInactivityTimeout(java.time.Duration.ofMillis(600));
        chatProperties.setWholeTurnTimeout(java.time.Duration.ofMillis(150));
        try {
            Map<String, Object> msgEvent = new HashMap<>();
            msgEvent.put("event", "message");
            msgEvent.put("content", "token");

            Flux<Map<String, Object>> slowFlux = Flux.interval(java.time.Duration.ofMillis(50))
                    .map(i -> msgEvent)
                    .take(10);

            when(triageAiEngine.streamAnalyzeSymptoms(any(com.caretriage.application.ai.model.TriageAiRequest.class)))
                    .thenReturn(slowFlux);

            ChatMessageDTO message = ChatMessageDTO.builder()
                    .turnId("123e4567-e89b-12d3-a456-426614174902")
                    .content("Đau đầu")
                    .sessionType(ChatSession.SessionType.TRIAGE)
                    .title("Whole-Turn Timeout Test")
                    .build();

            java.util.List<String> results = new java.util.ArrayList<>();
            webTestClient.post().uri("/api/v1/chat/messages/stream")
                    .header("Authorization", "Bearer " + jwtToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(message)
                    .exchange()
                    .expectStatus().isOk()
                    .returnResult(String.class)
                    .getResponseBody()
                    .doOnNext(results::add)
                    .onErrorResume(e -> {
                        if (e instanceof PrematureCloseException || e.getCause() instanceof PrematureCloseException) {
                            return Flux.empty();
                        }
                        return Flux.error(e);
                    })
                    .blockLast();

            String body = String.join("", results);
            assertThat(body).contains("STREAM_TIMEOUT");

            Optional<ChatTurn> turnOpt = chatTurnRepository.findByUserIdAndTurnId(testUser.getId(), "123e4567-e89b-12d3-a456-426614174902");
            assertThat(turnOpt).isPresent();
            assertThat(turnOpt.get().getStatus()).isEqualTo(ChatTurn.TurnStatus.FAILED);
            assertThat(turnOpt.get().getErrorCode()).isEqualTo("STREAM_TIMEOUT");
        } finally {
            chatProperties.setInactivityTimeout(java.time.Duration.ofSeconds(45));
            chatProperties.setWholeTurnTimeout(java.time.Duration.ofSeconds(120));
        }
    }

    @Test
    void clientCancellation_DoesNotMarkTurnFailed_WithClientDisconnected() throws Exception {
        Map<String, Object> tokenEvent = new HashMap<>();
        tokenEvent.put("event", "token");
        tokenEvent.put("content", "token");

        Flux<Map<String, Object>> slowFlux = Flux.interval(java.time.Duration.ofMillis(50))
                .map(i -> tokenEvent);

        when(triageAiEngine.streamAnalyzeSymptoms(any(com.caretriage.application.ai.model.TriageAiRequest.class)))
                .thenReturn(slowFlux);

        ChatMessageDTO message = ChatMessageDTO.builder()
                .turnId("123e4567-e89b-12d3-a456-426614174903")
                .content("Đau tay")
                .sessionType(ChatSession.SessionType.TRIAGE)
                .title("Cancel Test")
                .build();

        webTestClient.post().uri("/api/v1/chat/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(message)
                .exchange()
                .expectStatus().isOk()
                .returnResult(String.class)
                .getResponseBody()
                .take(1)
                .blockLast();

        java.util.concurrent.TimeUnit.MILLISECONDS.sleep(200);

        Optional<ChatTurn> turnOpt = chatTurnRepository.findByUserIdAndTurnId(testUser.getId(), "123e4567-e89b-12d3-a456-426614174903");
        assertThat(turnOpt).isPresent();
        assertThat(turnOpt.get().getStatus()).isIn(ChatTurn.TurnStatus.STARTED, ChatTurn.TurnStatus.STREAMING);
        assertThat(turnOpt.get().getErrorCode()).isNull();
    }

    @Test
    void finalizationFailure_keepsTurnCompletedAndMarksTicketFailed() throws Exception {
        Map<String, Object> finalEvent = new HashMap<>();
        finalEvent.put("event", "final");
        finalEvent.put("contract_version", "1");
        finalEvent.put("turn_id", "123e4567-e89b-12d3-a456-426614174904");
        finalEvent.put("reply", "Clinical reply");
        finalEvent.put("intake_complete", true);
        finalEvent.put("red_flag_detected", true);
        finalEvent.put("classification_status", "OK");
        finalEvent.put("missing_information", java.util.Collections.emptyList());
        finalEvent.put("triage_result", Map.of(
                "suggested_department_code", "EMERGENCY",
                "suggested_department_name", "Cấp cứu",
                "urgency_level", "HIGH",
                "possible_conditions", java.util.Collections.emptyList(),
                "suggested_actions", java.util.Collections.emptyList(),
                "confidence_score", 0.9,
                "clinical_reasoning_summary", "",
                "summary", ""
        ));

        when(triageAiEngine.streamAnalyzeSymptoms(any(com.caretriage.application.ai.model.TriageAiRequest.class)))
                .thenReturn(Flux.just(finalEvent));

        when(chatTurnReconciliationService.reconcile(any(), any()))
                .thenReturn(new ChatTurnReconciliationService.ReconcileResult(null, false, "Simulated reconciliation error"));

        ChatMessageDTO message = ChatMessageDTO.builder()
                .turnId("123e4567-e89b-12d3-a456-426614174904")
                .content("Đau đầu")
                .sessionType(ChatSession.SessionType.TRIAGE)
                .title("Finalization Failure Test")
                .build();

        java.util.List<String> results = new java.util.ArrayList<>();
        webTestClient.post().uri("/api/v1/chat/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(message)
                .exchange()
                .expectStatus().isOk()
                .returnResult(String.class)
                .getResponseBody()
                .doOnNext(results::add)
                .onErrorResume(e -> {
                    if (e instanceof PrematureCloseException || e.getCause() instanceof PrematureCloseException) {
                        return Flux.empty();
                    }
                    return Flux.error(e);
                })
                .blockLast();

        String body = String.join("", results);
        assertThat(body).contains("FINALIZATION_FAILED");

        Optional<ChatTurn> turnOpt = chatTurnRepository.findByUserIdAndTurnId(testUser.getId(), "123e4567-e89b-12d3-a456-426614174904");
        assertThat(turnOpt).isPresent();
        ChatTurn turn = turnOpt.get();
        assertThat(turn.getStatus()).isEqualTo(ChatTurn.TurnStatus.COMPLETED);
        assertThat(turn.getTicketStatus()).isEqualTo(ChatTurn.TicketStatus.FAILED_PERMANENT);

        String persistedPayloadStr = turn.getPersistedPayload();
        assertThat(persistedPayloadStr).isNotNull();
        PersistedEventPayload persistedPayload = PersistedEventPayload.fromJson(persistedPayloadStr);
        assertThat(persistedPayload).isNotNull();
        assertThat(persistedPayload.aiMessageId()).isNotNull();
        assertThat(persistedPayload.redFlagDetected()).isTrue();
    }

    @Test
    void postTerminalEvents_AreDiscarded() throws Exception {
        Map<String, Object> tokenEvent = new HashMap<>();
        tokenEvent.put("event", "token");
        tokenEvent.put("content", "hello");

        Map<String, Object> finalEvent = new HashMap<>();
        finalEvent.put("event", "final");
        finalEvent.put("contract_version", "1");
        finalEvent.put("turn_id", "123e4567-e89b-12d3-a456-426614174905");
        finalEvent.put("reply", "Reply");
        finalEvent.put("intake_complete", false);
        finalEvent.put("red_flag_detected", false);
        finalEvent.put("missing_information", java.util.Collections.emptyList());
        finalEvent.put("classification_status", "DEGRADED");
        finalEvent.put("classification_error_code", "LLM_PHASE_B_FAILED");
        finalEvent.put("triage_result", null);

        Map<String, Object> postTokenEvent = new HashMap<>();
        postTokenEvent.put("event", "token");
        postTokenEvent.put("content", "ignored");

        Flux<Map<String, Object>> sourceFlux = Flux.just(tokenEvent, finalEvent, postTokenEvent);

        when(triageAiEngine.streamAnalyzeSymptoms(any(com.caretriage.application.ai.model.TriageAiRequest.class)))
                .thenReturn(sourceFlux);

        ChatMessageDTO message = ChatMessageDTO.builder()
                .turnId("123e4567-e89b-12d3-a456-426614174905")
                .content("Đau lưng")
                .sessionType(ChatSession.SessionType.TRIAGE)
                .title("Post Terminal Test")
                .build();

        java.util.List<String> results = new java.util.ArrayList<>();
        webTestClient.post().uri("/api/v1/chat/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(message)
                .exchange()
                .expectStatus().isOk()
                .returnResult(String.class)
                .getResponseBody()
                .doOnNext(results::add)
                .onErrorResume(e -> {
                    if (e instanceof PrematureCloseException || e.getCause() instanceof PrematureCloseException) {
                        return Flux.empty();
                    }
                    return Flux.error(e);
                })
                .blockLast();

        String body = String.join("", results);
        assertThat(body).contains("hello");
        assertThat(body).contains("persisted");
        assertThat(body).doesNotContain("ignored");
    }

    @Test
    void ticketFinalizing_FreshPending_ReturnsAccepted() throws Exception {
        ChatSession session = ChatSession.builder()
                .user(testUserJpa)
                .sessionType(ChatSession.SessionType.TRIAGE)
                .status(ChatSession.SessionStatus.ACTIVE)
                .build();
        session = chatSessionRepository.save(session);

        ChatTurn turn = ChatTurn.builder()
                .chatSession(session)
                .user(testUserJpa)
                .turnId("123e4567-e89b-12d3-a456-426614174906")
                .status(ChatTurn.TurnStatus.COMPLETED)
                .ticketStatus(ChatTurn.TicketStatus.PENDING)
                .attemptCount(1)
                .build();
        turn = chatTurnRepository.save(turn);

        ChatMessageDTO messageDto = ChatMessageDTO.builder()
                .turnId("123e4567-e89b-12d3-a456-426614174906")
                .content("Đau chân")
                .build();

        java.util.List<String> results = new java.util.ArrayList<>();
        webTestClient.post().uri("/api/v1/chat/sessions/" + session.getId() + "/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(messageDto)
                .exchange()
                .expectStatus().isEqualTo(HttpStatus.ACCEPTED)
                .returnResult(String.class)
                .getResponseBody()
                .doOnNext(results::add)
                .onErrorResume(e -> {
                    if (e instanceof PrematureCloseException || e.getCause() instanceof PrematureCloseException) {
                        return Flux.empty();
                    }
                    return Flux.error(e);
                })
                .blockLast();
        String body = String.join("", results);
        assertThat(body).contains("TURN_FINALIZING");
    }

    @Test
    void ticketFinalizing_StalePending_TriggersReconciliationAndReplays() throws Exception {
        ChatSession session = ChatSession.builder()
                .user(testUserJpa)
                .sessionType(ChatSession.SessionType.TRIAGE)
                .status(ChatSession.SessionStatus.ACTIVE)
                .build();
        session = chatSessionRepository.save(session);

        ChatTurn turn = ChatTurn.builder()
                .chatSession(session)
                .user(testUserJpa)
                .turnId("123e4567-e89b-12d3-a456-426614174907")
                .status(ChatTurn.TurnStatus.COMPLETED)
                .ticketStatus(ChatTurn.TicketStatus.PENDING)
                .attemptCount(1)
                .build();
        turn = chatTurnRepository.save(turn);

        String payloadJson = "{\"turn_id\":\"123e4567-e89b-12d3-a456-426614174907\",\"ai_message_id\":\"ai-msg-id-123\",\"ticket_status\":\"READY\",\"ticket_id\":\"ticket-123\",\"specialty_code\":\"CARDIOLOGY\",\"specialty_name\":\"Tim mạch\",\"red_flag_detected\":false}";
        jdbcTemplate.update("UPDATE chat_turns SET updated_at = ?, persisted_payload = ? WHERE id = ?",
                java.sql.Timestamp.valueOf(java.time.LocalDateTime.now().minusSeconds(40)), payloadJson, turn.getId());

        PersistedEventPayload payload = new PersistedEventPayload(
                "123e4567-e89b-12d3-a456-426614174907",
                "ai-msg-id-123",
                "READY",
                "ticket-123",
                "CARDIOLOGY",
                "Tim mạch",
                false
        );
        when(chatTurnReconciliationService.reconcile(eq(turn.getId()), eq(session.getId())))
                .thenReturn(new ChatTurnReconciliationService.ReconcileResult(payload, true, null));

        ChatMessageDTO messageDto = ChatMessageDTO.builder()
                .turnId("123e4567-e89b-12d3-a456-426614174907")
                .content("Đau chân")
                .build();

        java.util.List<String> results = new java.util.ArrayList<>();
        webTestClient.post().uri("/api/v1/chat/sessions/" + session.getId() + "/messages/stream")
                .header("Authorization", "Bearer " + jwtToken)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(messageDto)
                .exchange()
                .expectStatus().isOk()
                .returnResult(String.class)
                .getResponseBody()
                .doOnNext(results::add)
                .onErrorResume(e -> {
                    if (e instanceof PrematureCloseException || e.getCause() instanceof PrematureCloseException) {
                        return Flux.empty();
                    }
                    return Flux.error(e);
                })
                .blockLast();
        String body = String.join("", results);
        assertThat(body).contains("persisted");
        assertThat(body).contains("ticket-123");
    }

    @Test
    void markTurnFailed_DoesNotOverwriteCompletedStatus() {
        ChatSession session = ChatSession.builder()
                .user(testUserJpa)
                .sessionType(ChatSession.SessionType.TRIAGE)
                .status(ChatSession.SessionStatus.ACTIVE)
                .build();
        session = chatSessionRepository.save(session);

        ChatTurn turn = ChatTurn.builder()
                .chatSession(session)
                .user(testUserJpa)
                .turnId("123e4567-e89b-12d3-a456-426614174908")
                .status(ChatTurn.TurnStatus.COMPLETED)
                .attemptCount(1)
                .build();
        turn = chatTurnRepository.save(turn);

        chatTurnFinalizer.markTurnFailed(turn.getId(), "SOME_LATE_ERROR");

        ChatTurn updatedTurn = chatTurnRepository.findById(turn.getId()).orElseThrow();
        assertThat(updatedTurn.getStatus()).isEqualTo(ChatTurn.TurnStatus.COMPLETED);
        assertThat(updatedTurn.getErrorCode()).isNull();
    }
}

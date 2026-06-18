package com.caretriage.application.service.impl;

import com.caretriage.application.dto.ChatAttachmentDTO;
import com.caretriage.application.dto.ChatMessageDTO;
import com.caretriage.domain.entity.ChatAttachment;
import com.caretriage.domain.entity.ChatMessage;
import com.caretriage.domain.entity.ChatSession;
import com.caretriage.domain.entity.User;
import com.caretriage.domain.entity.TriageTicket;
import com.caretriage.domain.entity.TicketCategory;
import com.caretriage.shared.exception.ResourceNotFoundException;
import com.caretriage.domain.repository.ChatAttachmentRepository;
import com.caretriage.domain.repository.ChatMessageRepository;
import com.caretriage.domain.repository.ChatSessionRepository;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.domain.repository.TriageTicketRepository;
import com.caretriage.domain.repository.TicketCategoryRepository;
import com.caretriage.domain.repository.AppointmentRepository;
import com.caretriage.domain.repository.ChatTurnRepository;
import com.caretriage.application.service.ChatService;
import com.caretriage.application.service.NotificationService;
import com.caretriage.domain.entity.ChatTurn;
import com.caretriage.application.ai.service.TriageAiRuntimeRouter;
import com.caretriage.application.dto.AiSseFinalPayload;
import com.caretriage.application.dto.ChatTurnStartResult;
import com.caretriage.application.dto.PersistedEventPayload;
import com.caretriage.infrastructure.config.ChatProperties;
import com.caretriage.shared.exception.ContractViolationException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.caretriage.application.ai.service.DocumentExtractionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Locale;
import java.util.concurrent.TimeoutException;
import java.util.concurrent.atomic.AtomicBoolean;
import org.hibernate.exception.ConstraintViolationException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.SignalType;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@SuppressWarnings({"java:S3776", "java:S1141", "java:S138", "java:S1192", "unused", "java:S112"})
public class ChatServiceImpl implements ChatService {

    private static final long MAX_ATTACHMENT_SIZE_BYTES = 10L * 1024 * 1024;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final UserRepository userRepository;
    private final TriageAiRuntimeRouter triageAiRuntimeRouter;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final TriageTicketRepository triageTicketRepository;
    private final TicketCategoryRepository ticketCategoryRepository;
    private final ChatAttachmentRepository chatAttachmentRepository;
    private final DocumentExtractionService documentExtractionService;
    private final NotificationService notificationService;
    private final AppointmentRepository appointmentRepository;
    private final org.springframework.data.redis.core.RedisTemplate<String, Object> redisTemplate;
    private final ChatTurnRepository chatTurnRepository;
    private final ChatTurnFinalizer chatTurnFinalizer;
    private final ChatTurnReconciliationService chatTurnReconciliationService;
    private final ChatProperties chatProperties;
    private final ChatAttachmentPersistenceService chatAttachmentPersistenceService;

    @Override
    @Transactional
    public ChatMessageDTO sendMessage(Long userId, ChatMessageDTO messageDTO) {
        ChatSession session = chatSessionRepository.findById(messageDTO.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("ChatSession not found"));

        // Validate user ownership
        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to chat session");
        }

        // Business Rule: Read-only for completed sessions
        if (session.getStatus() == ChatSession.SessionStatus.COMPLETED) {
            throw new IllegalStateException("Phi\u00ean t\u01b0 v\u1ea5n n\u00e0y \u0111\u00e3 k\u1ebft th\u00fac do l\u1ecbch h\u1eb9n kh\u00e1m \u0111\u00e3 \u0111\u01b0\u1ee3c t\u1ea1o. B\u1ea1n kh\u00f4ng th\u1ec3 g\u1eedi th\u00eam tin nh\u1eafn.");
        }

        ChatMessage message = ChatMessage.builder()
                .chatSession(session)
                .content(messageDTO.getContent())
                .senderType(ChatMessage.SenderType.USER)
                .metadata(messageDTO.getMetadata())
                .build();
        return convertToDTO(chatMessageRepository.save(message));
    }

    @Override
    public ChatAttachmentDTO uploadAttachment(Long userId, Long sessionId, MultipartFile file) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new com.caretriage.shared.exception.ResourceNotFoundException("ChatSession not found"));

        if (!session.getUser().getId().equals(userId)) {
            throw new org.springframework.security.access.AccessDeniedException("Unauthorized access to chat session");
        }

        if (session.getStatus() == ChatSession.SessionStatus.COMPLETED) {
            throw new IllegalStateException("Phi\u00ean t\u01b0 v\u1ea5n n\u00e0y \u0111\u00e3 k\u1ebft th\u00fac do l\u1ecbch h\u1eb9n kh\u00e1m \u0111\u00e3 \u0111\u01b0\u1ee3c t\u1ea1o. B\u1ea1n kh\u00f4ng th\u1ec3 g\u1eedi th\u00eam t\u00e0i li\u1ec7u.");
        }

        // R\u00e0ng bu\u1ed9c t\u1ed1i \u0111a 3 t\u00e0i li\u1ec7u \u0111\u00ednh k\u00e8m
        List<ChatAttachment> existingAttachments = chatAttachmentRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId);
        if (existingAttachments.size() >= 3) {
            throw new IllegalArgumentException("B\u1ea1n \u0111\u00e3 \u0111\u1ea1t gi\u1edbi h\u1ea1n t\u1ed1i \u0111a 3 t\u00e0i li\u1ec7u \u0111\u00ednh k\u00e8m cho phi\u00ean t\u01b0 v\u1ea5n n\u00e0y.");
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File upload is empty");
        }

        String originalFilename = Optional.ofNullable(file.getOriginalFilename())
                .filter(name -> !name.isBlank())
                .orElse("attachment");
                
        if (originalFilename.contains("..") || originalFilename.contains("/") || originalFilename.contains("\\")) {
            throw new IllegalArgumentException("Invalid filename");
        }

        String mimeType = normalizeMimeType(file.getContentType(), originalFilename);

        if (!isSupportedAttachment(mimeType, originalFilename)) {
            throw new com.caretriage.shared.exception.UnsupportedFileTypeException("\u0110\u1ecbnh d\u1ea1ng t\u00e0i li\u1ec7u kh\u00f4ng \u0111\u01b0\u1ee3c h\u1ed7 tr\u1ee3. Ch\u1ec9 h\u1ed7 tr\u1ee3 t\u1ea3i c\u00e1c t\u1ec7p PDF, DOCX, TXT.");
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            throw new IllegalArgumentException("Cannot read uploaded file", e);
        }

        if (fileBytes.length > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new com.caretriage.shared.exception.FileTooLargeException("Dung l\u01b0\u1ee3ng t\u00e0i li\u1ec7u v\u01b0\u1ee3t qu\u00e1 gi\u1edbi h\u1ea1n cho ph\u00e9p (t\u1ed1i \u0111a 10MB).");
        }

        // Phase 1: Create PROCESSING attachment
        ChatAttachment attachment = chatAttachmentPersistenceService.createProcessingAttachment(sessionId, originalFilename, mimeType, fileBytes.length);

        ChatMessage savedSystemMessage;
        try {
            // Phase 2: Extract text/entities outside transaction
            DocumentExtractionService.ExtractionOutput output = documentExtractionService.extractFromFile(fileBytes, originalFilename, mimeType);
            String entitiesJson = null;
            if (output.entities() != null && !output.entities().isEmpty()) {
                try {
                    entitiesJson = objectMapper.writeValueAsString(output.entities());
                } catch (Exception ex) {
                    log.error("Failed to serialize extracted entities for attachment {}", attachment.getId());
                    throw new com.caretriage.shared.exception.AttachmentPersistenceException("Entity serialization failed", ex);
                }
            }
            
            // Phase 3: Update COMPLETED attachment
            savedSystemMessage = chatAttachmentPersistenceService.completeAttachment(attachment.getId(), sessionId, output.rawText(), entitiesJson);
        } catch (Exception e) {
            // Failure Phase
            String errorCode = "SYSTEM_ERROR";
            if (e instanceof com.caretriage.shared.exception.DocumentParsingException ||
                e instanceof com.caretriage.shared.exception.UnsupportedFileTypeException ||
                e instanceof com.caretriage.shared.exception.FileTooLargeException) {
                errorCode = "DOCUMENT_PARSE_FAILED";
            } else if (e instanceof com.caretriage.shared.exception.MedicalEntityExtractionException) {
                errorCode = "ENTITY_EXTRACTION_FAILED";
            } else if (e instanceof com.caretriage.shared.exception.AttachmentPersistenceException) {
                errorCode = "ATTACHMENT_SERIALIZATION_FAILED";
            }
            
            try {
                chatAttachmentPersistenceService.failAttachment(attachment.getId(), sessionId, errorCode);
            } catch (Exception failEx) {
                log.error("Failed to mark attachment {} as FAILED with code {} - Exception: {}", attachment.getId(), errorCode, failEx.getClass().getSimpleName());
                e.addSuppressed(failEx);
            }
            
            if (e instanceof RuntimeException runtimeException) { throw runtimeException; }
            throw new RuntimeException(e);
        }

        ChatMessageDTO savedSystemMessageDTO = convertToDTO(savedSystemMessage);
        messagingTemplate.convertAndSend("/topic/chat/" + sessionId, savedSystemMessageDTO);

        return convertToAttachmentDTO(chatAttachmentRepository.findById(attachment.getId()).orElseThrow());
    }

    @Override
    @Transactional
    public ChatTurnStartResult inspectOrStartFirstTurn(
            Long userId,
            String turnId,
            String userMessage,
            ChatSession.SessionType type,
            String title) {
        Optional<ChatTurn> existing = chatTurnRepository.findByUserIdAndTurnId(userId, turnId);
        if (existing.isPresent()) {
            return resolveExistingTurn(existing.get());
        }

        ChatSession session = createSessionWithoutGreeting(
                userId,
                type == null ? ChatSession.SessionType.TRIAGE : type,
                normalizeTitle(title == null ? userMessage : title));
        ChatMessage userMessageEntity = ChatMessage.builder()
                .chatSession(session)
                .senderType(ChatMessage.SenderType.USER)
                .content(userMessage)
                .turnId(turnId)
                .build();
        chatMessageRepository.save(userMessageEntity);

        ChatTurn turn = ChatTurn.builder()
                .chatSession(session)
                .user(session.getUser())
                .turnId(turnId)
                .status(ChatTurn.TurnStatus.STARTED)
                .ticketStatus(ChatTurn.TicketStatus.PENDING)
                .attemptCount(1)
                .build();
        return new ChatTurnStartResult(
                chatTurnRepository.saveAndFlush(turn),
                ChatTurnStartResult.StartStatus.NEW_OR_RETRY_FAILED,
                null);
    }

    @Override
    @Transactional
    public ChatTurnStartResult inspectOrStartTurn(
            Long userId,
            Long sessionId,
            String turnId,
            String userMessage) {
        Optional<ChatTurn> existing = chatTurnRepository.findByUserIdAndTurnId(userId, turnId);
        if (existing.isPresent()) {
            if (!existing.get().getChatSession().getId().equals(sessionId)) {
                throw new IllegalArgumentException("Turn belongs to a different session");
            }
            return resolveExistingTurn(existing.get());
        }

        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatSession not found"));
        if (!session.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to chat session");
        }
        if (session.getStatus() == ChatSession.SessionStatus.COMPLETED) {
            throw new IllegalStateException("Phi\u00ean t\u01b0 v\u1ea5n \u0111\u00e3 k\u1ebft th\u00fac.");
        }

        chatMessageRepository.save(ChatMessage.builder()
                .chatSession(session)
                .senderType(ChatMessage.SenderType.USER)
                .content(userMessage)
                .turnId(turnId)
                .build());
        ChatTurn turn = ChatTurn.builder()
                .chatSession(session)
                .user(session.getUser())
                .turnId(turnId)
                .status(ChatTurn.TurnStatus.STARTED)
                .ticketStatus(ChatTurn.TicketStatus.PENDING)
                .attemptCount(1)
                .build();
        return new ChatTurnStartResult(
                chatTurnRepository.saveAndFlush(turn),
                ChatTurnStartResult.StartStatus.NEW_OR_RETRY_FAILED,
                null);
    }

    private ChatTurnStartResult resolveExistingTurn(ChatTurn turn) {
        if (turn.getStatus() == ChatTurn.TurnStatus.COMPLETED) {
            if (turn.getTicketStatus() == ChatTurn.TicketStatus.PENDING) {
                ChatTurnStartResult.StartStatus status = chatTurnRepository.isPendingTicketStale(turn.getId())
                        ? ChatTurnStartResult.StartStatus.STALE_PENDING
                        : ChatTurnStartResult.StartStatus.TICKET_FINALIZING;
                return new ChatTurnStartResult(turn, status, null);
            }
            return new ChatTurnStartResult(
                    turn,
                    ChatTurnStartResult.StartStatus.COMPLETED_REPLAY,
                    turn.getPersistedPayload());
        }
        if (turn.getStatus() == ChatTurn.TurnStatus.FAILED) {
            int updated = chatTurnRepository.retryTurnConditional(
                    turn.getId(),
                    ChatTurn.TurnStatus.FAILED,
                    ChatTurn.TurnStatus.STARTED);
            if (updated > 0) {
                return new ChatTurnStartResult(
                        chatTurnRepository.findById(turn.getId()).orElseThrow(),
                        ChatTurnStartResult.StartStatus.NEW_OR_RETRY_FAILED,
                        null);
            }
        }
        if (turn.getStatus() == ChatTurn.TurnStatus.STARTED
                || turn.getStatus() == ChatTurn.TurnStatus.STREAMING) {
            ChatTurn recovered = recoverStaleActiveTurn(turn);
            if (recovered != null) {
                return new ChatTurnStartResult(
                        recovered,
                        ChatTurnStartResult.StartStatus.NEW_OR_RETRY_FAILED,
                        null);
            }
        }
        return new ChatTurnStartResult(turn, ChatTurnStartResult.StartStatus.RUNNING_CONFLICT, null);
    }

    private ChatTurn recoverStaleActiveTurn(ChatTurn turn) {
        java.time.LocalDateTime staleBefore = java.time.LocalDateTime.now()
                .minus(chatProperties.getActiveTurnStaleTimeout());
        if (turn.getUpdatedAt() == null || turn.getUpdatedAt().isAfter(staleBefore)) {
            return null;
        }
        int updated = chatTurnRepository.recoverStaleActiveTurn(
                turn.getId(),
                List.of(ChatTurn.TurnStatus.STARTED, ChatTurn.TurnStatus.STREAMING),
                ChatTurn.TurnStatus.STARTED,
                staleBefore);
        return updated == 0 ? null : chatTurnRepository.findById(turn.getId()).orElseThrow();
    }

    @Override
    public Flux<Map<String, Object>> streamAiResponse(
            Long userId,
            Long sessionId,
            String turnId,
            String userMessage) {
        return Flux.defer(() -> {
            AtomicBoolean terminal = new AtomicBoolean(false);
            List<Map<String, String>> history = chatMessageRepository
                    .findHistoryExcludingTurn(sessionId, turnId)
                    .stream()
                    .map(message -> Map.of(
                            "role", message.getSenderType() == ChatMessage.SenderType.USER ? "user" : "model",
                            "content", message.getContent()))
                    .toList();
            ChatTurn turn = chatTurnRepository.findByChatSessionIdAndTurnId(sessionId, turnId)
                    .orElseThrow(() -> new ResourceNotFoundException("ChatTurn not found"));

            Flux<Map<String, Object>> aiStream = triageAiRuntimeRouter
                    .streamAnalyzeSymptoms(sessionId, turnId, userMessage, history)
                    .doOnSubscribe(ignored -> chatTurnFinalizer.updateTurnToStreaming(turn.getId()))
                    .concatMap(event -> processAiEvent(sessionId, turnId, turn, terminal, event))
                    .timeout(chatProperties.getInactivityTimeout());
            Flux<Map<String, Object>> deadline = Flux.<Map<String, Object>>error(
                            new TimeoutException("WHOLE_TURN_TIMEOUT"))
                    .delaySubscription(chatProperties.getWholeTurnTimeout());

            return Flux.merge(aiStream, deadline)
                    .takeUntil(this::isTerminalEvent)
                    .onErrorResume(error -> handleStreamError(turn, turnId, terminal, error))
                    .doFinally(signal -> {
                        if (signal == SignalType.CANCEL && !terminal.get()) {
                            log.info("Client disconnected for turn {}; state will be recovered if stale", turn.getId());
                        }
                    });
        });
    }

    private Flux<Map<String, Object>> processAiEvent(
            Long sessionId,
            String turnId,
            ChatTurn turn,
            AtomicBoolean terminal,
            Map<String, Object> event) {
        if (terminal.get()) {
            return Flux.empty();
        }
        String eventName = String.valueOf(event.getOrDefault("event", "message"));
        if ("final".equals(eventName)) {
            return finalizeTurn(sessionId, turnId, turn, event)
                    .doOnNext(emitted -> {
                        if (isTerminalEvent(emitted)) {
                            terminal.set(true);
                        }
                    });
        }
        if ("error".equals(eventName)) {
            terminal.set(true);
            chatTurnFinalizer.markTurnFailed(
                    turn.getId(),
                    String.valueOf(event.getOrDefault("code", "INTERNAL_STREAM_ERROR")));
        }
        return Flux.just(event);
    }

    private Flux<Map<String, Object>> finalizeTurn(
            Long sessionId,
            String turnId,
            ChatTurn turn,
            Map<String, Object> finalEvent) {
        ChatTurnFinalizer.FinalizeResult result = null;
        AiSseFinalPayload payload = null;
        try {
            payload = objectMapper.convertValue(finalEvent, AiSseFinalPayload.class);
            payload.validateForTurn(turnId);
            result = chatTurnFinalizer.persistAiAndCompleteTurn(turn.getId(), payload);

            PersistedEventPayload persisted;
            if (result.initialTicketStatus() == ChatTurn.TicketStatus.PENDING) {
                ChatTurnReconciliationService.ReconcileResult reconciliation =
                        chatTurnReconciliationService.reconcile(turn.getId(), sessionId);
                persisted = reconciliation.payload();
                if (persisted == null) {
                    ChatTurn updated = chatTurnRepository.findById(turn.getId()).orElseThrow();
                    persisted = PersistedEventPayload.fromJson(updated.getPersistedPayload());
                }
            } else {
                persisted = new PersistedEventPayload(
                        turnId,
                        result.aiMessageId(),
                        ChatTurn.TicketStatus.NOT_NEEDED.name(),
                        null,
                        null,
                        null,
                        payload.redFlagDetected());
                chatTurnFinalizer.recordPersistedPayload(
                        turn.getId(),
                        ChatTurn.TicketStatus.NOT_NEEDED,
                        null,
                        persisted);
            }
            if (persisted == null) {
                throw new IllegalStateException("Persisted payload is missing");
            }
            Map<String, Object> persistedEvent = new HashMap<>();
            persistedEvent.put("event", "persisted");
            persistedEvent.put("turn_id", turnId);
            persistedEvent.put("ticket_status", persisted.ticketStatus());
            persistedEvent.put("ticket_id", persisted.ticketId());
            persistedEvent.put("specialty_code", persisted.specialtyCode());
            persistedEvent.put("specialty_name", persisted.specialtyName());
            persistedEvent.put("red_flag_detected", persisted.redFlagDetected());
            persistedEvent.put("ai_message_id", persisted.aiMessageId());
            return Flux.just(finalEvent, persistedEvent);
        } catch (Exception error) {
            if (result != null || chatTurnRepository.findById(turn.getId())
                    .map(existing -> existing.getStatus() == ChatTurn.TurnStatus.COMPLETED)
                    .orElse(false)) {
                String aiMessageId = result == null
                        ? chatMessageRepository.findAiMessageIdBySessionIdAndTurnId(sessionId, turnId).orElse(null)
                        : result.aiMessageId();
                chatTurnFinalizer.markReconcileFailed(
                        turn.getId(),
                        classifyTicketFailure(error),
                        aiMessageId,
                        payload != null && payload.redFlagDetected(),
                        normalizeErrorCode(error));
            } else {
                chatTurnFinalizer.markTurnFailed(turn.getId(), "FINALIZATION_FAILED");
            }
            return Flux.just(errorEvent(turnId, "FINALIZATION_FAILED", (error != null ? error.getMessage() : "Unknown error")));
        }
    }

    private Flux<Map<String, Object>> handleStreamError(
            ChatTurn turn,
            String turnId,
            AtomicBoolean terminal,
            Throwable error) {
        if (!terminal.compareAndSet(false, true)) {
            return Flux.empty();
        }
        String code = isTimeout(error) ? "STREAM_TIMEOUT" : "INTERNAL_STREAM_ERROR";
        chatTurnFinalizer.markTurnFailed(turn.getId(), code);
        return Flux.just(errorEvent(turnId, code, (error != null ? error.getMessage() : "Unknown error")));
    }

    private Map<String, Object> errorEvent(String turnId, String code, String message) {
        Map<String, Object> event = new HashMap<>();
        event.put("event", "error");
        event.put("turn_id", turnId);
        event.put("code", code);
        event.put("message", message == null ? code : message);
        return event;
    }

    private boolean isTerminalEvent(Map<String, Object> event) {
        String name = String.valueOf(event.getOrDefault("event", ""));
        return "persisted".equals(name) || "error".equals(name);
    }

    private boolean isTimeout(Throwable error) {
        for (Throwable current = error; current != null; current = current.getCause()) {
            if (current instanceof TimeoutException
                    || current.getClass().getSimpleName().contains("Timeout")) {
                return true;
            }
        }
        return false;
    }

    private ChatTurn.TicketStatus classifyTicketFailure(Exception error) {
        return error instanceof org.springframework.dao.TransientDataAccessException
                ? ChatTurn.TicketStatus.FAILED_RETRYABLE
                : ChatTurn.TicketStatus.FAILED_PERMANENT;
    }

    private String normalizeErrorCode(Exception error) {
        if (error instanceof ContractViolationException) {
            return "CONTRACT_VIOLATION";
        }
        return isTimeout(error) ? "TIMEOUT" : "FINALIZATION_FAILED";
    }


    @Override
    public List<ChatMessageDTO> getSessionHistory(Long sessionId) {
        // 1. Get from MySQL (Cold Storage)
        List<ChatMessageDTO> history = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toCollection(java.util.ArrayList::new));
                
        // 2. Get from Redis (Hot Storage)
        List<Object> redisMsgs = redisTemplate.opsForList().range("chat:session:" + sessionId, 0, -1);
        if (redisMsgs != null) {
            java.util.Set<String> seen = history.stream()
                    .map(this::historyKey)
                    .collect(Collectors.toCollection(java.util.LinkedHashSet::new));
            for (Object obj : redisMsgs) {
                try {
                    ChatMessageDTO dto = objectMapper.convertValue(obj, ChatMessageDTO.class);
                    if (seen.add(historyKey(dto))) {
                        history.add(dto);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse message from Redis", e);
                }
            }
        }
        history.sort(java.util.Comparator.comparing(
                ChatMessageDTO::getCreatedAt,
                java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())));
        return history;
    }

    private String historyKey(ChatMessageDTO message) {
        if (message.getLegacyRedisId() != null) {
            return "legacy:" + message.getLegacyRedisId();
        }
        if (message.getId() != null) {
            return "db:" + message.getId();
        }
        return String.join("|",
                String.valueOf(message.getSessionId()),
                String.valueOf(message.getTurnId()),
                String.valueOf(message.getSenderType()),
                String.valueOf(message.getContent()));
    }

    @Override
    public org.springframework.data.domain.Page<ChatMessageDTO> getSessionHistory(Long sessionId, org.springframework.data.domain.Pageable pageable) {
        return chatMessageRepository.findByChatSessionId(sessionId, pageable)
                .map(this::convertToDTO);
    }

    @Override
    @Transactional
    public void updateOnlineStatus(String email, boolean isOnline) {
        userRepository.findByEmail(email).ifPresent(user -> {
            // Logic to update user online status if entity supports it
            log.info("User {} is now {}", email, isOnline ? "ONLINE" : "OFFLINE");
        });
    }

    @Override
    @Transactional
    public ChatSession createSession(Long userId, ChatSession.SessionType type, String title) {
        ChatSession savedSession = createSessionWithoutGreeting(userId, type, title);

        if (type == ChatSession.SessionType.TRIAGE) {
            String greeting = "Ch\u00e0o b\u1ea1n! T\u00f4i l\u00e0 tr\u1ee3 l\u00fd AI c\u1ee7a CareTriage. T\u00f4i c\u00f3 th\u1ec3 gi\u00fap b\u1ea1n s\u01a1 ch\u1ea9n c\u00e1c tri\u1ec7u ch\u1ee9ng s\u1ee9c kh\u1ecfe ngay b\u00e2y gi\u1edd. B\u1ea1n \u0111ang g\u1eb7p v\u1ea5n \u0111\u1ec1 g\u00ec ho\u1eb7c mu\u1ed1n t\u01b0 v\u1ea5n v\u1ec1 tri\u1ec7u ch\u1ee9ng n\u00e0o?";
            ChatMessage systemGreeting = ChatMessage.builder()
                    .chatSession(savedSession)
                    .content(greeting)
                    .senderType(ChatMessage.SenderType.AI)
                    .build();
            chatMessageRepository.save(systemGreeting);
            savedSession.setLastMessageContent(greeting);
            savedSession.setLastMessageTime(java.time.LocalDateTime.now());
            chatSessionRepository.save(savedSession);
        }
        return savedSession;
    }

    private ChatSession createSessionWithoutGreeting(
            Long userId,
            ChatSession.SessionType type,
            String title) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ChatSession session = ChatSession.builder()
                .user(com.caretriage.infrastructure.persistence.mapper.UserMapper.INSTANCE.toEntity(user))
                .sessionType(type)
                .title(title)
                .status(ChatSession.SessionStatus.ACTIVE)
                .build();
        return chatSessionRepository.save(session);
    }

    private String normalizeTitle(String rawTitle) {
        String normalized = rawTitle == null ? "" : rawTitle.replaceAll("\\s+", " ").trim();
        if (normalized.isEmpty()) {
            return "T\u01b0 v\u1ea5n s\u1ee9c kh\u1ecfe";
        }
        return normalized.length() <= 60 ? normalized : normalized.substring(0, 60);
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.caretriage.application.dto.ChatSessionDTO> getUserSessions(Long userId) {
        return chatSessionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToSessionDTO)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<com.caretriage.application.dto.ChatSessionDTO> searchSessions(Long userId, String query) {
        return chatSessionRepository.findByUserIdAndTitleContainingIgnoreCaseOrderByLastMessageTimeDesc(userId, query)
                .stream()
                .map(this::convertToSessionDTO)
                .toList();
    }

    @Override
    @Transactional
    public void deleteSession(Long userId, Long sessionId) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatSession not found"));
        if (!session.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to chat session");
        }
        chatSessionRepository.delete(session);
    }

    @Override
    @Transactional
    public ChatSession updateSessionTitle(Long sessionId, String title) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        session.setTitle(title);
        return chatSessionRepository.save(session);
    }

    private String normalizeMimeType(String mimeType, String originalFilename) {
        if (mimeType != null && !mimeType.isBlank()) {
            return mimeType;
        }

        String lower = originalFilename == null ? "" : originalFilename.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    private boolean isSupportedAttachment(String mimeType, String originalFilename) {
        String lower = originalFilename == null ? "" : originalFilename.toLowerCase();
        return "application/pdf".equals(mimeType)
                || "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(mimeType)
                || "text/plain".equals(mimeType)
                || lower.endsWith(".pdf")
                || lower.endsWith(".docx")
                || lower.endsWith(".txt");
    }







    private ChatAttachmentDTO convertToAttachmentDTO(ChatAttachment attachment) {
        return ChatAttachmentDTO.builder()
                .id(attachment.getId())
                .sessionId(attachment.getChatSession().getId())
                .originalFilename(attachment.getOriginalFilename())
                .mimeType(attachment.getMimeType())
                .fileSize(attachment.getFileSize())
                .extractionStatus(attachment.getExtractionStatus())
                .createdAt(attachment.getCreatedAt())
                .build();
    }

    private ChatMessageDTO convertToDTO(ChatMessage message) {
        return ChatMessageDTO.builder()
                .id(message.getId())
                .sessionId(message.getChatSession().getId())
                .content(message.getContent())
                .senderType(message.getSenderType())
                .metadata(message.getMetadata())
                .turnId(message.getTurnId())
                .createdAt(message.getCreatedAt())
                .status(ChatMessageDTO.MessageStatus.SENT)
                .build();
    }

    private com.caretriage.application.dto.ChatSessionDTO convertToSessionDTO(ChatSession session) {
        return com.caretriage.application.dto.ChatSessionDTO.builder()
                .id(session.getId())
                .userId(session.getUser().getId())
                .sessionType(session.getSessionType())
                .status(session.getStatus())
                .title(session.getTitle())
                .lastMessageContent(session.getLastMessageContent())
                .lastMessageTime(session.getLastMessageTime())
                .aiSummary(session.getAiSummary())
                .suggestedDepartment(session.getSuggestedDepartment())
                .urgencyLevel(session.getUrgencyLevel())
                .createdAt(session.getCreatedAt())
                .build();
    }





    private TriageTicket.Priority maxPriority(TriageTicket.Priority oldP, TriageTicket.Priority newP) {
        if (oldP == null) return newP;
        if (newP == null) return oldP;
        return oldP.ordinal() >= newP.ordinal() ? oldP : newP;
    }

    private TriageTicket.Severity maxSeverity(TriageTicket.Severity oldS, TriageTicket.Severity newS) {
        if (oldS == null) return newS;
        if (newS == null) return oldS;
        return oldS.ordinal() <= newS.ordinal() ? oldS : newS;
    }



    private String buildConversationSummary(List<ChatMessage> historyMessages) {
        String transcript = historyMessages.stream()
                .map(m -> m.getSenderType() + ": " + m.getContent())
                .collect(Collectors.joining("\n"));
        return transcript.length() > 2000 ? transcript.substring(0, 2000) : transcript;
    }

    private Map<String, Object> asStringObjectMap(Object value) {
        if (!(value instanceof Map<?, ?> rawMap)) {
            return new HashMap<>();
        }
        Map<String, Object> result = new HashMap<>();
        for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
            if (entry.getKey() instanceof String key) {
                result.put(key, entry.getValue());
            }
        }
        return result;
    }

    private String extractMetadataForTicket(Map<String, Object> triageResult, Long sessionId) {
        try {
            Map<String, Object> metadata = new HashMap<>();
            if (triageResult != null) {
                metadata.putAll(triageResult);
            }
            metadata.put("session_id", sessionId);
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            return null;
        }
    }

    private TriageTicket.Priority mapPriority(String urgency) {
        return switch (urgency.toUpperCase()) {
            case "EMERGENCY", "HIGH", "CRITICAL" -> TriageTicket.Priority.URGENT;
            case "MEDIUM" -> TriageTicket.Priority.MEDIUM;
            default -> TriageTicket.Priority.LOW;
        };
    }

    private TriageTicket.Severity mapSeverity(String urgency) {
        return switch (urgency.toUpperCase()) {
            case "EMERGENCY", "CRITICAL" -> TriageTicket.Severity.CRITICAL;
            case "HIGH" -> TriageTicket.Severity.MAJOR;
            case "MEDIUM" -> TriageTicket.Severity.MINOR;
            default -> TriageTicket.Severity.COSMETIC;
        };
    }

    @Override
    public boolean isConstraintViolation(Throwable error, String constraintName) {
        String expected = constraintName.toLowerCase(Locale.ROOT);
        for (Throwable current = error; current != null; current = current.getCause()) {
            if (current instanceof ConstraintViolationException violation
                    && violation.getConstraintName() != null
                    && violation.getConstraintName().equalsIgnoreCase(constraintName)) {
                return true;
            }
            if (current.getMessage() != null
                    && current.getMessage().toLowerCase(Locale.ROOT).contains(expected)) {
                return true;
            }
        }
        return false;
    }
}


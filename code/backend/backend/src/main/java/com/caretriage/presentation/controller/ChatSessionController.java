package com.caretriage.presentation.controller;

import com.caretriage.domain.entity.ChatSession;
import com.caretriage.application.service.ChatService;
import com.caretriage.application.service.AiClientService;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.domain.repository.ChatSessionRepository;
import com.caretriage.domain.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import com.caretriage.application.dto.ChatAttachmentDTO;
import com.caretriage.application.dto.ChatSessionDTO;
import com.caretriage.application.dto.ChatMessageDTO;
import com.caretriage.application.dto.PersistedEventPayload;
import com.caretriage.domain.entity.ChatTurn;
import com.caretriage.domain.repository.ChatTurnRepository;
import com.caretriage.application.service.impl.ChatTurnReconciliationService;
import com.caretriage.shared.exception.ResourceNotFoundException;
import com.caretriage.shared.exception.ConflictException;
import org.springframework.http.HttpStatus;
import java.util.Map;
import java.util.HashMap;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatSessionController {

    private final ChatService chatService;
    private final UserRepository userRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final AiClientService aiClientService;
    private final ChatTurnRepository chatTurnRepository;
    private final ChatTurnReconciliationService chatTurnReconciliationService;

    private static final String USER_NOT_FOUND_MSG = "User not found";

    @GetMapping("/health/ai")
    public ResponseEntity<Map<String, Object>> getAiHealth() {
        boolean isUp = aiClientService.checkHealth();
        Map<String, Object> response = new HashMap<>();
        response.put("status", isUp ? "UP" : "DOWN");
        response.put("service", "caretriage-ai-service");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/sessions")
    public ResponseEntity<ChatSessionDTO> createSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "TRIAGE") ChatSession.SessionType type,
            @RequestParam(required = false) String title) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));

        String sessionTitle = title != null ? title : "Tư vấn " + type.toString().toLowerCase();
        ChatSession session = chatService.createSession(user.getId(), type, sessionTitle);
        return ResponseEntity.ok(convertToDTO(session));
    }

    @PostMapping(value = "/sessions/{sessionId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ChatAttachmentDTO> uploadAttachment(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @RequestParam("file") MultipartFile file) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));

        return ResponseEntity.ok(chatService.uploadAttachment(user.getId(), sessionId, file));
    }

    @PostMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<ChatMessageDTO> sendMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @RequestBody ChatMessageDTO messageDTO) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));

        messageDTO.setSessionId(sessionId);
        ChatMessageDTO savedMessage = chatService.sendMessage(user.getId(), messageDTO);
        return ResponseEntity.ok(savedMessage);
    }

    private boolean isValidUUID(String uuidStr) {
        if (uuidStr == null) return false;
        try {
            java.util.UUID.fromString(uuidStr);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private Flux<ServerSentEvent<Map<String, Object>>> buildSessionPrefixFlux(ChatSession session) {
        Map<String, Object> sessionEventData = new HashMap<>();
        sessionEventData.put("session_id", session.getId());
        sessionEventData.put("title", session.getTitle());
        sessionEventData.put("session_type", session.getSessionType().name());

        return Flux.just(
            ServerSentEvent.<Map<String, Object>>builder(sessionEventData).event("session").build()
        );
    }

    private Map<String, Object> buildPersistedEvent(String turnId, PersistedEventPayload payload, boolean replayed) {
        Map<String, Object> persistedEvent = new HashMap<>();
        persistedEvent.put("event", "persisted");
        persistedEvent.put("turn_id", turnId);
        persistedEvent.put("ticket_status", payload != null ? payload.ticketStatus() : null);
        persistedEvent.put("ticket_id", payload != null ? payload.ticketId() : null);
        persistedEvent.put("specialty_code", payload != null ? payload.specialtyCode() : null);
        persistedEvent.put("specialty_name", payload != null ? payload.specialtyName() : null);
        persistedEvent.put("red_flag_detected", payload != null && payload.redFlagDetected());
        if (replayed) {
            persistedEvent.put("replayed", true);
        }
        return persistedEvent;
    }

    private ResponseEntity<Flux<ServerSentEvent<Map<String, Object>>>> resolveWinningTurn(
            ChatTurn winningTurn,
            ChatMessageDTO messageDTO,
            Long userId,
            Flux<ServerSentEvent<Map<String, Object>>> prefixFlux) {
        
        Long sessionId = winningTurn.getChatSession().getId();
        
        if (winningTurn.getStatus() == ChatTurn.TurnStatus.STARTED || winningTurn.getStatus() == ChatTurn.TurnStatus.STREAMING) {
            throw new ConflictException("TURN_IN_PROGRESS");
        }
        
        if (winningTurn.getStatus() == ChatTurn.TurnStatus.COMPLETED) {
            if (winningTurn.getTicketStatus() == ChatTurn.TicketStatus.PENDING) {
                if (chatTurnRepository.isPendingTicketStale(winningTurn.getId())) {
                    chatTurnReconciliationService.reconcile(winningTurn.getId(), sessionId);
                    ChatTurn updatedTurn = chatTurnRepository.findById(winningTurn.getId()).orElseThrow();
                    PersistedEventPayload payload = PersistedEventPayload.fromJson(updatedTurn.getPersistedPayload());
                    Map<String, Object> persistedEvent = buildPersistedEvent(messageDTO.getTurnId(), payload, false);
                    
                    Flux<ServerSentEvent<Map<String, Object>>> replayFlux = Flux.just(
                        ServerSentEvent.<Map<String, Object>>builder(persistedEvent).event("persisted").build()
                    );
                    Flux<ServerSentEvent<Map<String, Object>>> body = prefixFlux != null ? prefixFlux.concatWith(replayFlux) : replayFlux;
                    return ResponseEntity.ok().contentType(MediaType.TEXT_EVENT_STREAM).body(body);
                } else {
                    Map<String, Object> data = Map.of("status", "TURN_FINALIZING");
                    Flux<ServerSentEvent<Map<String, Object>>> stream = Flux.just(
                        ServerSentEvent.<Map<String, Object>>builder(data).event("status").build()
                    );
                    return ResponseEntity.status(HttpStatus.ACCEPTED).contentType(MediaType.TEXT_EVENT_STREAM).body(stream);
                }
            } else {
                PersistedEventPayload payload = PersistedEventPayload.fromJson(winningTurn.getPersistedPayload());
                Map<String, Object> persistedEvent = buildPersistedEvent(messageDTO.getTurnId(), payload, true);
                
                Flux<ServerSentEvent<Map<String, Object>>> replayFlux = Flux.just(
                    ServerSentEvent.<Map<String, Object>>builder(persistedEvent).event("persisted").build()
                );
                Flux<ServerSentEvent<Map<String, Object>>> body = prefixFlux != null ? prefixFlux.concatWith(replayFlux) : replayFlux;
                return ResponseEntity.ok().contentType(MediaType.TEXT_EVENT_STREAM).body(body);
            }
        }
        
        if (winningTurn.getStatus() == ChatTurn.TurnStatus.FAILED) {
            int updated = chatTurnRepository.retryTurnConditional(winningTurn.getId(), ChatTurn.TurnStatus.FAILED, ChatTurn.TurnStatus.STARTED);
            if (updated > 0) {
                Flux<ServerSentEvent<Map<String, Object>>> stream = chatService.streamAiResponse(
                        userId, sessionId, messageDTO.getTurnId(), messageDTO.getContent())
                        .map(event -> {
                            String eventName = String.valueOf(event.getOrDefault("event", "message"));
                            return ServerSentEvent.<Map<String, Object>>builder(event)
                                    .event(eventName)
                                    .build();
                        });
                Flux<ServerSentEvent<Map<String, Object>>> body = prefixFlux != null ? prefixFlux.concatWith(stream) : stream;
                return ResponseEntity.ok().contentType(MediaType.TEXT_EVENT_STREAM).body(body);
            } else {
                throw new ConflictException("TURN_IN_PROGRESS");
            }
        }
        
        throw new ConflictException("TURN_IN_PROGRESS");
    }

    private ResponseEntity<Flux<ServerSentEvent<Map<String, Object>>>> handleTurnStartResult(
            com.caretriage.application.dto.ChatTurnStartResult startResult,
            ChatMessageDTO messageDTO,
            Long userId,
            Long sessionId,
            Flux<ServerSentEvent<Map<String, Object>>> prefixFlux) {

        if (startResult.status() == com.caretriage.application.dto.ChatTurnStartResult.StartStatus.RUNNING_CONFLICT) {
            throw new ConflictException("TURN_IN_PROGRESS");
        }

        if (startResult.status() == com.caretriage.application.dto.ChatTurnStartResult.StartStatus.TICKET_FINALIZING) {
            Map<String, Object> data = Map.of("status", "TURN_FINALIZING");
            Flux<ServerSentEvent<Map<String, Object>>> stream = Flux.just(
                ServerSentEvent.<Map<String, Object>>builder(data).event("status").build()
            );
            return ResponseEntity.status(HttpStatus.ACCEPTED).contentType(MediaType.TEXT_EVENT_STREAM).body(stream);
        }

        if (startResult.status() == com.caretriage.application.dto.ChatTurnStartResult.StartStatus.STALE_PENDING) {
            chatTurnReconciliationService.reconcile(startResult.turn().getId(), sessionId);
            ChatTurn updatedTurn = chatTurnRepository.findById(startResult.turn().getId()).orElseThrow();
            PersistedEventPayload payload = PersistedEventPayload.fromJson(updatedTurn.getPersistedPayload());
            Map<String, Object> persistedEvent = buildPersistedEvent(messageDTO.getTurnId(), payload, false);
            
            Flux<ServerSentEvent<Map<String, Object>>> replayFlux = Flux.just(
                ServerSentEvent.<Map<String, Object>>builder(persistedEvent).event("persisted").build()
            );
            Flux<ServerSentEvent<Map<String, Object>>> body = prefixFlux != null ? prefixFlux.concatWith(replayFlux) : replayFlux;
            return ResponseEntity.ok().contentType(MediaType.TEXT_EVENT_STREAM).body(body);
        }

        if (startResult.status() == com.caretriage.application.dto.ChatTurnStartResult.StartStatus.COMPLETED_REPLAY) {
            PersistedEventPayload payload = PersistedEventPayload.fromJson(startResult.persistedPayload());
            Map<String, Object> persistedEvent = buildPersistedEvent(messageDTO.getTurnId(), payload, true);
            
            Flux<ServerSentEvent<Map<String, Object>>> replayFlux = Flux.just(
                ServerSentEvent.<Map<String, Object>>builder(persistedEvent).event("persisted").build()
            );
            Flux<ServerSentEvent<Map<String, Object>>> body = prefixFlux != null ? prefixFlux.concatWith(replayFlux) : replayFlux;
            return ResponseEntity.ok().contentType(MediaType.TEXT_EVENT_STREAM).body(body);
        }

        Flux<ServerSentEvent<Map<String, Object>>> stream = chatService.streamAiResponse(
                userId, sessionId, messageDTO.getTurnId(), messageDTO.getContent())
                .map(event -> {
                    String eventName = String.valueOf(event.getOrDefault("event", "message"));
                    return ServerSentEvent.<Map<String, Object>>builder(event)
                            .event(eventName)
                            .build();
                });
        Flux<ServerSentEvent<Map<String, Object>>> body = prefixFlux != null ? prefixFlux.concatWith(stream) : stream;
        return ResponseEntity.ok().contentType(MediaType.TEXT_EVENT_STREAM).body(body);
    }

    private ResponseEntity<Flux<ServerSentEvent<Map<String, Object>>>> handleStreamRequest(
            User user,
            Long sessionId, // null for first message
            ChatMessageDTO messageDTO) {
        
        if (messageDTO.getTurnId() == null || messageDTO.getTurnId().trim().isEmpty() ||
            !isValidUUID(messageDTO.getTurnId()) ||
            messageDTO.getContent() == null || messageDTO.getContent().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (messageDTO.getSessionType() == null) {
            messageDTO.setSessionType(com.caretriage.domain.entity.ChatSession.SessionType.TRIAGE);
        }

        com.caretriage.application.dto.ChatTurnStartResult startResult;
        try {
            if (sessionId == null) {
                startResult = chatService.inspectOrStartFirstTurn(
                    user.getId(),
                    messageDTO.getTurnId(),
                    messageDTO.getContent(),
                    messageDTO.getSessionType(),
                    messageDTO.getTitle()
                );
            } else {
                startResult = chatService.inspectOrStartTurn(
                    user.getId(),
                    sessionId,
                    messageDTO.getTurnId(),
                    messageDTO.getContent()
                );
            }
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            if (chatService.isConstraintViolation(e, "uq_user_turn")) {
                ChatTurn winningTurn = chatTurnRepository.findByUserIdAndTurnId(user.getId(), messageDTO.getTurnId())
                        .orElseThrow(() -> new ConflictException("TURN_IN_PROGRESS"));
                
                Flux<ServerSentEvent<Map<String, Object>>> prefixFlux = null;
                if (sessionId == null) {
                    prefixFlux = buildSessionPrefixFlux(winningTurn.getChatSession());
                }
                return resolveWinningTurn(winningTurn, messageDTO, user.getId(), prefixFlux);
            } else {
                throw e;
            }
        }

        Long activeSessionId = sessionId != null ? sessionId : startResult.turn().getChatSession().getId();
        Flux<ServerSentEvent<Map<String, Object>>> prefixFlux = null;
        if (sessionId == null) {
            prefixFlux = buildSessionPrefixFlux(startResult.turn().getChatSession());
        }
        return handleTurnStartResult(startResult, messageDTO, user.getId(), activeSessionId, prefixFlux);
    }

    @PostMapping(value = "/messages/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<Flux<ServerSentEvent<Map<String, Object>>>> streamFirstMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ChatMessageDTO messageDTO) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));
        return handleStreamRequest(user, null, messageDTO);
    }

    @PostMapping(value = "/sessions/{sessionId}/messages/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public ResponseEntity<Flux<ServerSentEvent<Map<String, Object>>>> streamMessage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @RequestBody ChatMessageDTO messageDTO) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));
        return handleStreamRequest(user, sessionId, messageDTO);
    }

    @GetMapping("/sessions/active")
    public ResponseEntity<ChatSessionDTO> getActiveSession(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));

        ChatSessionDTO activeSession = chatSessionRepository
                .findFirstByUserIdAndSessionTypeAndStatusOrderByLastMessageTimeDescCreatedAtDesc(
                        user.getId(),
                        ChatSession.SessionType.TRIAGE,
                        ChatSession.SessionStatus.ACTIVE)
                .map(this::convertToDTO)
                .orElse(null);

        return ResponseEntity.ok(activeSession);
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getUserSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String query) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));

        if (query != null && !query.isEmpty()) {
            return ResponseEntity.ok(chatService.searchSessions(user.getId(), query));
        }
        return ResponseEntity.ok(chatService.getUserSessions(user.getId()));
    }

    @GetMapping("/sessions/{sessionId}/history")
    public ResponseEntity<?> getHistory(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));

        boolean ownsSession = chatSessionRepository.existsByIdAndUserId(sessionId, user.getId());
        if (!ownsSession) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(chatService.getSessionHistory(sessionId));
    }

    @PostMapping("/sessions/{sessionId}/turns/{turnId}/retry-ticket")
    public ResponseEntity<?> retryTicket(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @PathVariable String turnId) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));

        ChatTurn turn = chatTurnRepository.findByChatSessionIdAndTurnId(sessionId, turnId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatTurn not found"));

        if (!turn.getChatSession().getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Unauthorized access to chat session");
        }

        if (!chatTurnRepository.isTicketRetryEligible(turn.getId())) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("error", "Ticket retry backoff active. Please wait."));
        }

        ChatTurnReconciliationService.ReconcileResult result = chatTurnReconciliationService.reconcile(turn.getId(), sessionId);
        if (result.payload() != null) {
            return ResponseEntity.ok(result.payload());
        } else {
            ChatTurn updatedTurn = chatTurnRepository.findById(turn.getId()).orElseThrow();
            PersistedEventPayload errorPayload = PersistedEventPayload.fromJson(updatedTurn.getPersistedPayload());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorPayload);
        }
    }

    @PostMapping("/sessions/{sessionId}/complete-triage")
    public ResponseEntity<Map<String, Object>> completeTriage(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @RequestParam(defaultValue = "false") Boolean forceSubmit) {
        return ResponseEntity.status(HttpStatus.GONE).build();
    }


    @PatchMapping("/sessions/{sessionId}/title")
    public ResponseEntity<ChatSessionDTO> updateSessionTitle(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> body) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException(USER_NOT_FOUND_MSG));

        if (!chatSessionRepository.existsById(sessionId)) {
            return ResponseEntity.notFound().build();
        }

        boolean ownsSession = chatSessionRepository.existsByIdAndUserId(sessionId, user.getId());
        if (!ownsSession) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        String title = body.get("title");
        if (title == null || title.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        if (title.trim().length() > 200) {
            return ResponseEntity.badRequest().build();
        }

        ChatSession updatedSession = chatService.updateSessionTitle(sessionId, title.trim());
        return ResponseEntity.ok(convertToDTO(updatedSession));
    }

    private ChatSessionDTO convertToDTO(ChatSession session) {
        return ChatSessionDTO.builder()
                .id(session.getId())
                .userId(session.getUser().getId())
                .sessionType(session.getSessionType())
                .status(session.getStatus())
                .aiSummary(session.getAiSummary())
                .suggestedDepartment(session.getSuggestedDepartment())
                .urgencyLevel(session.getUrgencyLevel())
                .title(session.getTitle())
                .createdAt(session.getCreatedAt())
                .build();
    }
}

package com.caretriage.controller;

import com.caretriage.entity.ChatSession;
import com.caretriage.service.ChatService;
import com.caretriage.security.JwtTokenProvider;
import com.caretriage.repository.UserRepository;
import com.caretriage.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.caretriage.dto.ChatSessionDTO;
import java.util.Map;
import java.util.HashMap;


@RestController
@RequestMapping("/api/v1/chat")
@RequiredArgsConstructor
public class ChatSessionController {

    private final ChatService chatService;
    private final UserRepository userRepository;
    private final com.caretriage.service.AiClientService aiClientService;

    @GetMapping("/health/ai")
    public ResponseEntity<Map<String, Object>> getAiHealth() {
        boolean isUp = aiClientService.checkHealth();
        Map<String, Object> response = new HashMap<>();
        response.put("status", isUp ? "UP" : "DOWN");
        response.put("service", "caretriage-ai-service");
        return ResponseEntity.ok(response);
    }


    @PostMapping("/sessions")

    public ResponseEntity<com.caretriage.dto.ChatSessionDTO> createSession(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "TRIAGE") ChatSession.SessionType type,
            @RequestParam(required = false) String title) {

        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String sessionTitle = title != null ? title : "Tư vấn " + type.toString().toLowerCase();
        ChatSession session = chatService.createSession(user.getId(), type, sessionTitle);
        return ResponseEntity.ok(convertToDTO(session));
    }

    @GetMapping("/sessions/active")
    public ResponseEntity<ChatSessionDTO> getActiveSession(
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));

        ChatSessionDTO activeSession = chatService.getUserSessions(user.getId()).stream()
                .filter(session -> session.getSessionType() == ChatSession.SessionType.TRIAGE)
                .filter(session -> session.getStatus() == ChatSession.SessionStatus.ACTIVE)
                .findFirst()
                .orElse(null);

        return ResponseEntity.ok(activeSession);
    }

    @GetMapping("/sessions")
    public ResponseEntity<?> getUserSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(required = false) String query) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (query != null && !query.isEmpty()) {
            return ResponseEntity.ok(chatService.searchSessions(user.getId(), query));
        }
        return ResponseEntity.ok(chatService.getUserSessions(user.getId()));
    }

    @GetMapping("/sessions/{sessionId}/history")
    public ResponseEntity<?> getHistory(
            @PathVariable Long sessionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.util.Streamable.of(org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending())).stream().findFirst().get();
        // Since we want newest first for infinite scroll (bottom-up), but traditional paging is top-down.
        // Actually for infinite scroll (scroll up to load more), we need descending order.
        return ResponseEntity.ok(chatService.getSessionHistory(sessionId, org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending())));
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
                .createdAt(session.getCreatedAt())
                .build();
    }
}

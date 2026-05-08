package com.caretriage.service.impl;

import com.caretriage.dto.ChatMessageDTO;
import com.caretriage.entity.ChatMessage;
import com.caretriage.entity.ChatSession;
import com.caretriage.entity.User;
import com.caretriage.entity.TriageTicket;
import com.caretriage.entity.TicketCategory;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.ChatMessageRepository;
import com.caretriage.repository.ChatSessionRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.repository.TriageTicketRepository;
import com.caretriage.repository.TicketCategoryRepository;
import com.caretriage.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.caretriage.service.AiClientService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import java.util.List;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final UserRepository userRepository;
    private final AiClientService aiClientService;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;
    private final TriageTicketRepository triageTicketRepository;
    private final TicketCategoryRepository ticketCategoryRepository;

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
            throw new RuntimeException("Cannot send message to a completed chat session");
        }

        ChatMessage message = ChatMessage.builder()
                .chatSession(session)
                .content(messageDTO.getContent())
                .senderType(ChatMessage.SenderType.USER)
                .metadata(messageDTO.getMetadata())
                .build();

        ChatMessage savedMessage = chatMessageRepository.save(message);
        
        // Cập nhật thông tin tin nhắn cuối cùng cho session
        session.setLastMessageContent(savedMessage.getContent());
        session.setLastMessageTime(savedMessage.getCreatedAt());
        chatSessionRepository.save(session);

        // Trigger AI processing if it's a TRIAGE session
        if (session.getSessionType() == ChatSession.SessionType.TRIAGE) {
            processAiResponse(session.getId(), message.getContent());
        }
        
        return convertToDTO(savedMessage);
    }

    @Async
    @Override
    @Transactional
    public void processAiResponse(Long sessionId, String userMessage) {
        try {
            ChatSession session = chatSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

            // 1. Gửi trạng thái "AI is typing..."
            String destination = "/topic/chat/" + sessionId;
            Map<String, Object> typingStatus = new HashMap<>();
            typingStatus.put("type", "TYPING");
            typingStatus.put("senderType", "AI");
            messagingTemplate.convertAndSend(destination, typingStatus);

            // 2. Chuẩn bị lịch sử hội thoại cho AI
            List<ChatMessage> historyMessages = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId);
            List<Map<String, String>> history = historyMessages.stream()
                    .map(m -> {
                        Map<String, String> entry = new HashMap<>();
                        entry.put("role", m.getSenderType() == ChatMessage.SenderType.USER ? "user" : "model");
                        entry.put("content", m.getContent());
                        return entry;
                    })
                    .collect(Collectors.toList());

            // 3. Gọi AI Service
            Map<String, Object> aiResponse = aiClientService.analyzeSymptoms(sessionId.toString(), userMessage, history);
            String aiContent = (String) aiResponse.get("reply");

            // 4. Lưu phản hồi của AI
            ChatMessage aiMessage = ChatMessage.builder()
                    .chatSession(session)
                    .content(aiContent)
                    .senderType(ChatMessage.SenderType.AI)
                    .metadata(objectMapper.writeValueAsString(aiResponse)) // Lưu toàn bộ metadata AI trả về dạng JSON chuẩn
                    .build();
            
            ChatMessage savedAiMessage = chatMessageRepository.save(aiMessage);

            // Cập nhật thông tin tin nhắn cuối cùng từ AI
            session.setLastMessageContent(savedAiMessage.getContent());
            session.setLastMessageTime(savedAiMessage.getCreatedAt());
            chatSessionRepository.save(session);

            // 5. Broadcast tin nhắn AI qua WebSocket
            messagingTemplate.convertAndSend(destination, convertToDTO(savedAiMessage));

            // 6. Auto-create triage ticket when triage is complete
            if (Boolean.TRUE.equals(aiResponse.get("is_complete"))) {
                createTriageTicketIfNeeded(session, aiResponse, historyMessages);
            }

        } catch (Exception e) {
            log.error("Error processing AI response for session {}: {}", sessionId, e.getMessage());
            // Có thể gửi tin nhắn lỗi qua WebSocket ở đây
        }
    }

    @Override
    public List<ChatMessageDTO> getSessionHistory(Long sessionId) {
        return chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
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
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        ChatSession session = ChatSession.builder()
                .user(user)
                .sessionType(type)
                .title(title)
                .status(ChatSession.SessionStatus.ACTIVE)
                .build();

        ChatSession savedSession = chatSessionRepository.save(session);

        // Scenario 1: Gửi lời chào tự động nếu là phiên Triage
        if (type == ChatSession.SessionType.TRIAGE) {
            String greeting = "Chào bạn! Tôi là trợ lý AI của CareTriage. Tôi có thể giúp bạn sơ chẩn các triệu chứng sức khỏe ngay bây giờ. Bạn đang gặp vấn đề gì hoặc muốn tư vấn về triệu chứng nào?";
            
            ChatMessage systemGreeting = ChatMessage.builder()
                    .chatSession(savedSession)
                    .content(greeting)
                    .senderType(ChatMessage.SenderType.AI)
                    .build();
            
            chatMessageRepository.save(systemGreeting);
            
            // Cập nhật last message cho greeting
            savedSession.setLastMessageContent(greeting);
            savedSession.setLastMessageTime(java.time.LocalDateTime.now());
            chatSessionRepository.save(savedSession);
        }

        return savedSession;
    }

    @Override
    public List<com.caretriage.dto.ChatSessionDTO> getUserSessions(Long userId) {
        return chatSessionRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::convertToSessionDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<com.caretriage.dto.ChatSessionDTO> searchSessions(Long userId, String query) {
        return chatSessionRepository.findByUserIdAndTitleContainingIgnoreCaseOrderByLastMessageTimeDesc(userId, query)
                .stream()
                .map(this::convertToSessionDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateSessionTitle(Long sessionId, String title) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        session.setTitle(title);
        chatSessionRepository.save(session);
    }

    private ChatMessageDTO convertToDTO(ChatMessage message) {
        return ChatMessageDTO.builder()
                .id(message.getId())
                .sessionId(message.getChatSession().getId())
                .content(message.getContent())
                .senderType(message.getSenderType())
                .metadata(message.getMetadata())
                .createdAt(message.getCreatedAt())
                .status(ChatMessageDTO.MessageStatus.SENT)
                .build();
    }

    private com.caretriage.dto.ChatSessionDTO convertToSessionDTO(ChatSession session) {
        return com.caretriage.dto.ChatSessionDTO.builder()
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

    private void createTriageTicketIfNeeded(ChatSession session, Map<String, Object> aiResponse, List<ChatMessage> historyMessages) {
        String ticketNumber = "TRIAGE-" + session.getId();
        if (triageTicketRepository.findByTicketNumber(ticketNumber).isPresent()) {
            return;
        }

        Map<String, Object> triageResult = (Map<String, Object>) aiResponse.get("triage_result");
        String summary = triageResult != null && triageResult.get("summary") != null
                ? String.valueOf(triageResult.get("summary"))
                : buildConversationSummary(historyMessages);

        String urgency = triageResult != null ? String.valueOf(triageResult.getOrDefault("urgency_level", "MEDIUM")) : "MEDIUM";
        String suggestedDepartment = triageResult != null ? String.valueOf(triageResult.getOrDefault("suggested_department", "Nội tổng quát")) : "Nội tổng quát";

        TriageTicket.Priority priority = mapPriority(urgency);
        TriageTicket.Severity severity = mapSeverity(urgency);

        Optional<TicketCategory> defaultCategory = ticketCategoryRepository.findByCode("TRIAGE_GENERAL");

        TriageTicket ticket = TriageTicket.builder()
                .ticketNumber(ticketNumber)
                .title("Triage ticket - session " + session.getId())
                .description(summary)
                .status(TriageTicket.Status.NEW)
                .priority(priority)
                .severity(severity)
                .requester(session.getUser())
                .category(defaultCategory.orElse(null))
                .metadata(extractMetadataForTicket(triageResult, session.getId()))
                .build();

        triageTicketRepository.save(ticket);

        session.setStatus(ChatSession.SessionStatus.COMPLETED);
        session.setAiSummary(summary);
        session.setSuggestedDepartment(suggestedDepartment);
        session.setUrgencyLevel(urgency);
        chatSessionRepository.save(session);
    }

    private String buildConversationSummary(List<ChatMessage> historyMessages) {
        String transcript = historyMessages.stream()
                .map(m -> m.getSenderType() + ": " + m.getContent())
                .collect(Collectors.joining("\n"));
        return transcript.length() > 2000 ? transcript.substring(0, 2000) : transcript;
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
}

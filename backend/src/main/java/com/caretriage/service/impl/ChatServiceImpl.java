package com.caretriage.service.impl;

import com.caretriage.dto.ChatAttachmentDTO;
import com.caretriage.dto.ChatMessageDTO;
import com.caretriage.entity.ChatAttachment;
import com.caretriage.entity.ChatMessage;
import com.caretriage.entity.ChatSession;
import com.caretriage.entity.User;
import com.caretriage.entity.TriageTicket;
import com.caretriage.entity.TicketCategory;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.ChatAttachmentRepository;
import com.caretriage.repository.ChatMessageRepository;
import com.caretriage.repository.ChatSessionRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.repository.TriageTicketRepository;
import com.caretriage.repository.TicketCategoryRepository;
import com.caretriage.service.ChatService;
import com.caretriage.service.NotificationService;
import com.caretriage.entity.Notification.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import com.caretriage.service.AiClientService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatServiceImpl implements ChatService {

    private static final long MAX_ATTACHMENT_SIZE_BYTES = 20L * 1024 * 1024;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final UserRepository userRepository;
    private final AiClientService aiClientService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;
    private final TriageTicketRepository triageTicketRepository;
    private final TicketCategoryRepository ticketCategoryRepository;
    private final ChatAttachmentRepository chatAttachmentRepository;
    private final WebClient.Builder webClientBuilder;
    private final NotificationService notificationService;

    @Value("${app.ai-service.url}")
    private String aiServiceUrl;

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

        return convertToDTO(savedMessage);
    }

    @Override
    @Transactional
    public ChatAttachmentDTO uploadAttachment(Long userId, Long sessionId, MultipartFile file) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatSession not found"));

        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to chat session");
        }

        if (session.getStatus() == ChatSession.SessionStatus.COMPLETED) {
            throw new RuntimeException("Cannot upload file to a completed chat session");
        }

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File upload is empty");
        }

        String originalFilename = Optional.ofNullable(file.getOriginalFilename())
                .filter(name -> !name.isBlank())
                .orElse("attachment");
        String mimeType = normalizeMimeType(file.getContentType(), originalFilename);

        if (!isSupportedAttachment(mimeType, originalFilename)) {
            throw new RuntimeException("Unsupported file type. Please upload PDF, image, Word or text files.");
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Cannot read uploaded file", e);
        }

        if (fileBytes.length > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new RuntimeException("File size exceeds 20MB limit");
        }

        ChatAttachment attachment = ChatAttachment.builder()
                .chatSession(session)
                .originalFilename(originalFilename)
                .mimeType(mimeType)
                .fileSize((long) fileBytes.length)
                .fileContent(fileBytes)
                .extractionStatus(ChatAttachment.ExtractionStatus.PROCESSING)
                .build();
        attachment = chatAttachmentRepository.save(attachment);

        String systemMessageText;
        try {
            Map<String, Object> aiResponse = extractAttachmentContext(fileBytes, originalFilename, mimeType);
            Map<String, Object> result = asStringObjectMap(aiResponse.get("result"));
            attachment.setExtractedText(result.get("raw_text") != null ? String.valueOf(result.get("raw_text")) : null);
            attachment.setExtractionStatus(ChatAttachment.ExtractionStatus.COMPLETED);
            systemMessageText = "Đã tải lên tài liệu: " + originalFilename;
        } catch (Exception e) {
            log.error("Error extracting attachment for session {}: {}", sessionId, e.getMessage(), e);
            attachment.setExtractionStatus(ChatAttachment.ExtractionStatus.FAILED);
            systemMessageText = "Đã tải lên tài liệu: " + originalFilename + " nhưng hệ thống chưa phân tích được nội dung.";
        }

        attachment = chatAttachmentRepository.save(attachment);

        ChatMessage systemMessage = ChatMessage.builder()
                .chatSession(session)
                .content(systemMessageText)
                .senderType(ChatMessage.SenderType.SYSTEM)
                .metadata(buildAttachmentMetadata(attachment))
                .build();
        ChatMessage savedSystemMessage = chatMessageRepository.save(systemMessage);

        session.setLastMessageContent(savedSystemMessage.getContent());
        session.setLastMessageTime(savedSystemMessage.getCreatedAt());
        chatSessionRepository.save(session);

        ChatMessageDTO savedSystemMessageDTO = convertToDTO(savedSystemMessage);
        messagingTemplate.convertAndSend("/topic/chat/" + sessionId, savedSystemMessageDTO);

        return convertToAttachmentDTO(attachment);
    }

    @Async
    @Override
    @Transactional
    public void processAiResponse(Long sessionId, String userMessage) {
        String destination = "/topic/chat/" + sessionId;
        try {
            ChatSession session = chatSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

            // Chỉ xử lý AI cho session TRIAGE
            if (session.getSessionType() != ChatSession.SessionType.TRIAGE) {
                return;
            }

            // 1. Gửi trạng thái "AI is typing..."
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

            List<Map<String, String>> attachmentHistory = chatAttachmentRepository
                    .findByChatSessionIdAndExtractionStatusOrderByCreatedAtAsc(sessionId, ChatAttachment.ExtractionStatus.COMPLETED)
                    .stream()
                    .map(this::toAttachmentHistoryEntry)
                    .collect(Collectors.toList());
            if (!attachmentHistory.isEmpty()) {
                history.addAll(0, attachmentHistory);
            }

            // 3. Gọi AI Service
            Map<String, Object> aiResponse = aiClientService.analyzeSymptoms(sessionId.toString(), userMessage, history);
            String aiContent = (String) aiResponse.get("reply");

            // 4. Lưu phản hồi của AI
            ChatMessage aiMessage = ChatMessage.builder()
                    .chatSession(session)
                    .content(aiContent)
                    .senderType(ChatMessage.SenderType.AI)
                    .metadata(objectMapper.writeValueAsString(aiResponse))
                    .build();

            ChatMessage savedAiMessage = chatMessageRepository.save(aiMessage);

            // Cập nhật thông tin tin nhắn cuối cùng từ AI
            session.setLastMessageContent(savedAiMessage.getContent());
            session.setLastMessageTime(savedAiMessage.getCreatedAt());
            chatSessionRepository.save(session);

            // Smoke test: Trigger notification for user when AI responds
            notificationService.createNotification(
                session.getUser().getId(),
                "Tin nhắn mới từ AI",
                aiContent.length() > 50 ? aiContent.substring(0, 47) + "..." : aiContent,
                NotificationType.CHAT,
                session.getId(),
                "CHAT_SESSION"
            );

            if (Boolean.TRUE.equals(aiResponse.get("is_complete"))) {
                createTriageTicketIfNeeded(session, aiResponse, historyMessages);
            }

            ChatMessageDTO savedAiMessageDTO = convertToDTO(savedAiMessage);
            Runnable broadcast = () -> {
                messagingTemplate.convertAndSend(destination, savedAiMessageDTO);
                log.info("AI response broadcasted to {}", destination);
            };

            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        broadcast.run();
                    }
                });
            } else {
                broadcast.run();
            }

        } catch (Exception e) {
            log.error("Error processing AI response for session {}: {}", sessionId, e.getMessage(), e);
            // Gửi thông báo lỗi qua WebSocket để frontend tắt typing indicator
            Map<String, Object> errorMsg = new HashMap<>();
            errorMsg.put("type", "ERROR");
            errorMsg.put("senderType", "SYSTEM");
            errorMsg.put("content", "Xin lỗi, hệ thống AI đang gặp sự cố. Vui lòng thử lại.");
            messagingTemplate.convertAndSend(destination, errorMsg);
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

    private Map<String, Object> extractAttachmentContext(byte[] fileBytes, String originalFilename, String mimeType) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", new ByteArrayResource(fileBytes) {
            @Override
            public String getFilename() {
                return originalFilename;
            }
        }).contentType(MediaType.parseMediaType(mimeType));

        Object response = webClientBuilder.build()
                .post()
                .uri(aiServiceUrl + "/api/ehr/extract-file")
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(Object.class)
                .block();
        return asStringObjectMap(response);
    }

    private String normalizeMimeType(String mimeType, String originalFilename) {
        if (mimeType != null && !mimeType.isBlank()) {
            return mimeType;
        }

        String lower = originalFilename == null ? "" : originalFilename.toLowerCase();
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".doc")) return "application/msword";
        if (lower.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".gif")) return "image/gif";
        if (lower.endsWith(".txt")) return "text/plain";
        return "application/octet-stream";
    }

    private boolean isSupportedAttachment(String mimeType, String originalFilename) {
        String lower = originalFilename == null ? "" : originalFilename.toLowerCase();
        return mimeType.startsWith("image/")
                || "application/pdf".equals(mimeType)
                || "application/msword".equals(mimeType)
                || "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(mimeType)
                || "text/plain".equals(mimeType)
                || lower.endsWith(".pdf")
                || lower.endsWith(".doc")
                || lower.endsWith(".docx")
                || lower.endsWith(".png")
                || lower.endsWith(".jpg")
                || lower.endsWith(".jpeg")
                || lower.endsWith(".webp")
                || lower.endsWith(".gif")
                || lower.endsWith(".txt");
    }

    private String buildAttachmentMetadata(ChatAttachment attachment) {
        try {
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("attachment_id", attachment.getId());
            metadata.put("original_filename", attachment.getOriginalFilename());
            metadata.put("mime_type", attachment.getMimeType());
            metadata.put("file_size", attachment.getFileSize());
            metadata.put("extraction_status", attachment.getExtractionStatus().name());
            return objectMapper.writeValueAsString(metadata);
        } catch (Exception e) {
            return null;
        }
    }

    private String buildAttachmentContext(ChatAttachment attachment) {
        String extractedText = attachment.getExtractedText() == null ? "" : attachment.getExtractedText();
        if (extractedText.length() > 4000) {
            extractedText = extractedText.substring(0, 4000) + "...";
        }

        return "Tài liệu đính kèm: " + attachment.getOriginalFilename()
                + "\nNội dung trích xuất:\n" + extractedText;
    }

    private Map<String, String> toAttachmentHistoryEntry(ChatAttachment attachment) {
        Map<String, String> entry = new HashMap<>();
        entry.put("role", "system");
        entry.put("content", buildAttachmentContext(attachment));
        return entry;
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

        Map<String, Object> triageResult = asStringObjectMap(aiResponse.get("triage_result"));
        String summary = triageResult.get("summary") != null
                ? String.valueOf(triageResult.get("summary"))
                : buildConversationSummary(historyMessages);

        String urgency = String.valueOf(triageResult.getOrDefault("urgency_level", "MEDIUM"));
        String suggestedDepartment = String.valueOf(triageResult.getOrDefault("suggested_department", "Nội tổng quát"));

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
}

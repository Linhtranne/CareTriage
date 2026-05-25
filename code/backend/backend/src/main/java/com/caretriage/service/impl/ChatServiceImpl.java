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
import com.caretriage.repository.AppointmentRepository;
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

    private static final long MAX_ATTACHMENT_SIZE_BYTES = 10L * 1024 * 1024;
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
    private final AppointmentRepository appointmentRepository;

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
            throw new IllegalStateException("Phiên tư vấn này đã kết thúc do lịch hẹn khám đã được tạo. Bạn không thể gửi thêm tin nhắn.");
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
            throw new IllegalStateException("Phiên tư vấn này đã kết thúc do lịch hẹn khám đã được tạo. Bạn không thể gửi thêm tài liệu.");
        }

        // Ràng buộc tối đa 3 tài liệu đính kèm
        List<ChatAttachment> existingAttachments = chatAttachmentRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId);
        if (existingAttachments.size() >= 3) {
            throw new RuntimeException("Bạn đã đạt giới hạn tối đa 3 tài liệu đính kèm cho phiên tư vấn này.");
        }

        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File upload is empty");
        }

        String originalFilename = Optional.ofNullable(file.getOriginalFilename())
                .filter(name -> !name.isBlank())
                .orElse("attachment");
        String mimeType = normalizeMimeType(file.getContentType(), originalFilename);

        if (!isSupportedAttachment(mimeType, originalFilename)) {
            throw new RuntimeException("Định dạng tài liệu không được hỗ trợ. Chỉ hỗ trợ tải các tệp PDF, DOCX, TXT hoặc Hình ảnh (JPEG, PNG, WEBP).");
        }

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (Exception e) {
            throw new RuntimeException("Cannot read uploaded file", e);
        }

        if (fileBytes.length > MAX_ATTACHMENT_SIZE_BYTES) {
            throw new RuntimeException("Dung lượng tài liệu vượt quá giới hạn cho phép (tối đa 10MB).");
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
            attachment.setExtractionSource("LLM_MULTIMODAL");
            try {
                if (result.get("entities") != null) {
                    attachment.setExtractedEntitiesJson(objectMapper.writeValueAsString(result.get("entities")));
                }
            } catch (Exception ex) {
                log.warn("Failed to serialize extracted entities for attachment: {}", ex.getMessage());
            }
            systemMessageText = "Đã tải lên tài liệu: " + originalFilename;
        } catch (Exception e) {
            log.error("Error extracting attachment for session {}: {}", sessionId, e.getMessage(), e);
            attachment.setExtractionStatus(ChatAttachment.ExtractionStatus.FAILED);
            attachment.setExtractionSource("LLM_MULTIMODAL");
            attachment.setExtractionErrorMessage(e.getMessage());
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
                || "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(mimeType)
                || "text/plain".equals(mimeType)
                || lower.endsWith(".pdf")
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

    @Override
    @Transactional
    public Map<String, Object> completeTriage(Long userId, Long sessionId, Boolean forceSubmit) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ChatSession not found"));

        if (!session.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to chat session");
        }

        // Get chat history
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

        // Pass last user message to recommend
        String lastUserMessage = historyMessages.stream()
                .filter(m -> m.getSenderType() == ChatMessage.SenderType.USER)
                .map(ChatMessage::getContent)
                .reduce((first, second) -> second)
                .orElse("Nhận khuyến nghị sơ chẩn sức khỏe.");

        // Call AI Service /recommend
        Map<String, Object> aiResponse = aiClientService.getRecommendation(sessionId.toString(), lastUserMessage, history);

        Boolean recommendationReady = Boolean.TRUE.equals(aiResponse.get("recommendation_ready"));
        Boolean intakeComplete = Boolean.TRUE.equals(aiResponse.get("intake_complete"));

        Map<String, Object> result = new HashMap<>();
        result.put("recommendation_ready", recommendationReady);
        result.put("intake_complete", intakeComplete);
        result.put("missing_information", aiResponse.getOrDefault("missing_information", List.of()));
        result.put("reply", aiResponse.get("reply"));

        // If forceSubmit is true or recommendationReady is true, create/update ticket
        if (Boolean.TRUE.equals(recommendationReady) || Boolean.TRUE.equals(forceSubmit)) {
            // Save AI recommendation message into the chat session
            ChatMessage aiRecMessage = ChatMessage.builder()
                    .chatSession(session)
                    .content(String.valueOf(aiResponse.get("reply")))
                    .senderType(ChatMessage.SenderType.AI)
                    .metadata(serializeJson(aiResponse))
                    .build();
            chatMessageRepository.save(aiRecMessage);

            // Create or update TriageTicket
            TriageTicket ticket = createOrUpdateTriageTicket(session, aiResponse, historyMessages);
            
            // Convert ticket to simplified map response
            Map<String, Object> ticketInfo = new HashMap<>();
            ticketInfo.put("ticketNumber", ticket.getTicketNumber());
            ticketInfo.put("status", ticket.getStatus().name());
            ticketInfo.put("priority", ticket.getPriority().name());
            ticketInfo.put("severity", ticket.getSeverity().name());
            ticketInfo.put("title", ticket.getTitle());
            ticketInfo.put("description", ticket.getDescription());
            
            result.put("ticket", ticketInfo);
        }

        return result;
    }

    private String serializeJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }

    private TriageTicket createOrUpdateTriageTicket(ChatSession session, Map<String, Object> aiResponse, List<ChatMessage> historyMessages) {
        String ticketNumber = "TRIAGE-" + session.getId();
        Optional<TriageTicket> existingOpt = triageTicketRepository.findByTicketNumber(ticketNumber);

        Map<String, Object> triageResult = asStringObjectMap(aiResponse.get("triage_result"));
        String summary = triageResult.get("summary") != null
                ? String.valueOf(triageResult.get("summary"))
                : buildConversationSummary(historyMessages);

        String urgency = String.valueOf(triageResult.getOrDefault("urgency_level", "MEDIUM"));
        String suggestedDepartment = String.valueOf(triageResult.getOrDefault("suggested_department", "Nội tổng quát"));

        TriageTicket.Priority priority = mapPriority(urgency);
        TriageTicket.Severity severity = mapSeverity(urgency);

        // Tự động kiểm tra xem có tài liệu nào bị lỗi phân tích OCR hay không để đánh dấu khẩn cấp
        List<ChatAttachment> attachments = chatAttachmentRepository.findByChatSessionIdOrderByCreatedAtAsc(session.getId());
        boolean hasFailedAttachment = attachments.stream()
                .anyMatch(a -> a.getExtractionStatus() == ChatAttachment.ExtractionStatus.FAILED);

        if (hasFailedAttachment) {
            priority = TriageTicket.Priority.URGENT;
            severity = TriageTicket.Severity.MAJOR;
            triageResult.put("red_flag_detected", true);
            triageResult.put("attachment_extraction_failed", true);
            triageResult.put("system_alert_note", "Có tài liệu y khoa đính kèm phân tích thất bại. Cần bác sĩ kiểm tra thủ công.");
        }

        TriageTicket ticket;

        if (existingOpt.isEmpty()) {
            Optional<TicketCategory> defaultCategory = ticketCategoryRepository.findByCode("TRIAGE_GENERAL");
            String aiSnapshotStr = null;
            try {
                aiSnapshotStr = objectMapper.writeValueAsString(triageResult);
            } catch (Exception e) {
                log.warn("Failed to serialize AI analysis result for snapshot: {}", e.getMessage());
            }

            ticket = TriageTicket.builder()
                    .ticketNumber(ticketNumber)
                    .title("Triage ticket - session " + session.getId())
                    .description(summary)
                    .status(TriageTicket.Status.NEW)
                    .priority(priority)
                    .severity(severity)
                    .requester(session.getUser())
                    .category(defaultCategory.orElse(null))
                    .metadata(extractMetadataForTicket(triageResult, session.getId()))
                    .doctorReviewStatus(TriageTicket.DoctorReviewStatus.AI_ANALYSIS_PENDING_REVIEW)
                    .aiAnalysisSnapshot(aiSnapshotStr)
                    .chatSession(session)
                    .build();
            ticket = triageTicketRepository.save(ticket);
        } else {
            ticket = existingOpt.get();
            if (hasFailedAttachment) {
                ticket.setPriority(priority);
                ticket.setSeverity(severity);
                try {
                    Map<String, Object> existingMeta = new HashMap<>();
                    if (ticket.getMetadata() != null) {
                        existingMeta = objectMapper.readValue(ticket.getMetadata(), Map.class);
                    }
                    existingMeta.put("red_flag_detected", true);
                    existingMeta.put("attachment_extraction_failed", true);
                    ticket.setMetadata(objectMapper.writeValueAsString(existingMeta));
                } catch (Exception ex) {
                    log.warn("Failed to update failed attachment flags in metadata: {}", ex.getMessage());
                }
            }
            if (ticket.getChatSession() == null) {
                ticket.setChatSession(session);
            }
            boolean hasAppointment = appointmentRepository.existsByTriageTicketId(ticket.getId());
            boolean isEditableStatus = ticket.getStatus() == TriageTicket.Status.NEW || ticket.getStatus() == TriageTicket.Status.IN_TRIAGE;

            if (isEditableStatus && !hasAppointment) {
                // Soft Update main fields
                ticket.setDescription(summary);
                ticket.setPriority(maxPriority(ticket.getPriority(), priority));
                ticket.setSeverity(maxSeverity(ticket.getSeverity(), severity));

                if (ticket.getDoctorReviewStatus() == TriageTicket.DoctorReviewStatus.AI_ANALYSIS_PENDING_REVIEW) {
                    try {
                        ticket.setAiAnalysisSnapshot(objectMapper.writeValueAsString(triageResult));
                    } catch (Exception e) {
                        log.warn("Failed to update AI analysis snapshot: {}", e.getMessage());
                    }
                }

                // Merge and update metadata
                try {
                    Map<String, Object> existingMetadata = new HashMap<>();
                    if (ticket.getMetadata() != null) {
                        try {
                            existingMetadata = objectMapper.readValue(ticket.getMetadata(), Map.class);
                        } catch (Exception e) {
                            log.warn("Failed to parse existing metadata for ticket {}: {}", ticketNumber, e.getMessage());
                        }
                    }
                    existingMetadata.putAll(triageResult);
                    existingMetadata.put("latest_recommendation", aiResponse.get("reply"));
                    existingMetadata.put("missing_information", aiResponse.getOrDefault("missing_information", List.of()));
                    existingMetadata.put("intake_complete", aiResponse.getOrDefault("intake_complete", false));
                    existingMetadata.put("recommendation_ready", aiResponse.getOrDefault("recommendation_ready", false));
                    existingMetadata.put("updated_from_session_at", java.time.LocalDateTime.now().toString());

                    ticket.setMetadata(objectMapper.writeValueAsString(existingMetadata));
                } catch (Exception e) {
                    log.error("Error merging metadata for ticket soft-update: {}", e.getMessage());
                }
                ticket = triageTicketRepository.save(ticket);
            } else {
                // Only append update note to metadata
                try {
                    Map<String, Object> existingMetadata = new HashMap<>();
                    if (ticket.getMetadata() != null) {
                        try {
                            existingMetadata = objectMapper.readValue(ticket.getMetadata(), Map.class);
                        } catch (Exception e) {
                            log.warn("Failed to parse existing metadata: {}", e.getMessage());
                        }
                    }
                    List<String> updatesLog = (List<String>) existingMetadata.getOrDefault("patient_update_notes", new java.util.ArrayList<String>());
                    updatesLog.add("Patient submitted updated AI recommendation at " + java.time.LocalDateTime.now() 
                            + ". Latest urgency recommendation: " + urgency + " (" + suggestedDepartment + ")");
                    existingMetadata.put("patient_update_notes", updatesLog);
                    existingMetadata.put("last_ignored_update_at", java.time.LocalDateTime.now().toString());

                    ticket.setMetadata(objectMapper.writeValueAsString(existingMetadata));
                } catch (Exception e) {
                    log.error("Error appending update notes to ticket metadata: {}", e.getMessage());
                }
                ticket = triageTicketRepository.save(ticket);
            }
        }

        // Complete the ChatSession
        session.setStatus(ChatSession.SessionStatus.COMPLETED);
        session.setAiSummary(summary);
        session.setSuggestedDepartment(suggestedDepartment);
        session.setUrgencyLevel(urgency);
        chatSessionRepository.save(session);

        return ticket;
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

    private void createTriageTicketIfNeeded(ChatSession session, Map<String, Object> aiResponse, List<ChatMessage> historyMessages) {
        createOrUpdateTriageTicket(session, aiResponse, historyMessages);
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

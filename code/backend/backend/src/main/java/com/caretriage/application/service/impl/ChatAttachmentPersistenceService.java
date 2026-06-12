package com.caretriage.application.service.impl;

import com.caretriage.domain.entity.ChatAttachment;
import com.caretriage.domain.entity.ChatMessage;
import com.caretriage.domain.entity.ChatSession;
import com.caretriage.domain.repository.ChatAttachmentRepository;
import com.caretriage.domain.repository.ChatMessageRepository;
import com.caretriage.domain.repository.ChatSessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatAttachmentPersistenceService {

    private final ChatAttachmentRepository chatAttachmentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatSessionRepository chatSessionRepository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ChatAttachment createProcessingAttachment(Long sessionId, String originalFilename, String mimeType, long fileSize) {
        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalStateException("Session not found"));

        ChatAttachment attachment = ChatAttachment.builder()
                .chatSession(session)
                .originalFilename(originalFilename)
                .mimeType(mimeType)
                .fileSize(fileSize)
                .extractionStatus(ChatAttachment.ExtractionStatus.PROCESSING)
                .build();
        return chatAttachmentRepository.save(attachment);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ChatMessage completeAttachment(Long attachmentId, Long sessionId, String rawText, String entitiesJson) {
        ChatAttachment attachment = chatAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalStateException("Attachment not found"));

        attachment.setExtractedText(rawText);
        attachment.setExtractionStatus(ChatAttachment.ExtractionStatus.COMPLETED);
        attachment.setExtractionSource("LLM_MULTIMODAL");
        if (entitiesJson != null) {
            attachment.setExtractedEntitiesJson(entitiesJson);
        }
        chatAttachmentRepository.save(attachment);

        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalStateException("Session not found"));

        String systemMessageText = "\u0110\u00e3 t\u1ea3i l\u00ean t\u00e0i li\u1ec7u: " + attachment.getOriginalFilename();
        ChatMessage systemMessage = ChatMessage.builder()
                .chatSession(session)
                .content(systemMessageText)
                .senderType(ChatMessage.SenderType.SYSTEM)
                .metadata(buildAttachmentMetadata(attachment))
                .build();
        ChatMessage savedSystemMessage = chatMessageRepository.save(systemMessage);

        session.setLastMessageContent(savedSystemMessage.getContent());
        session.setLastMessageTime(savedSystemMessage.getCreatedAt() != null ? savedSystemMessage.getCreatedAt() : LocalDateTime.now());
        chatSessionRepository.save(session);

        return savedSystemMessage;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ChatMessage failAttachment(Long attachmentId, Long sessionId, String errorCode) {
        ChatAttachment attachment = chatAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new IllegalStateException("Attachment not found"));

        attachment.setExtractionStatus(ChatAttachment.ExtractionStatus.FAILED);
        attachment.setExtractionSource("LLM_MULTIMODAL");
        attachment.setExtractionErrorMessage(errorCode);
        chatAttachmentRepository.save(attachment);

        log.error("Attachment {} failed with error code: {}", attachmentId, errorCode);

        ChatSession session = chatSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalStateException("Session not found"));

        String systemMessageText = "\u0110\u00e3 t\u1ea3i l\u00ean t\u00e0i li\u1ec7u: " + attachment.getOriginalFilename() + " nh\u01b0ng h\u1ec7 th\u1ed1ng ch\u01b0a ph\u00e2n t\u00edch \u0111\u01b0\u1ee3c n\u1ed9i dung.";
        ChatMessage systemMessage = ChatMessage.builder()
                .chatSession(session)
                .content(systemMessageText)
                .senderType(ChatMessage.SenderType.SYSTEM)
                .metadata(buildAttachmentMetadata(attachment))
                .build();
        ChatMessage savedSystemMessage = chatMessageRepository.save(systemMessage);

        session.setLastMessageContent(savedSystemMessage.getContent());
        session.setLastMessageTime(savedSystemMessage.getCreatedAt() != null ? savedSystemMessage.getCreatedAt() : LocalDateTime.now());
        chatSessionRepository.save(session);

        return savedSystemMessage;
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
            throw new com.caretriage.shared.exception.AttachmentPersistenceException("Failed to serialize attachment metadata", e);
        }
    }
}

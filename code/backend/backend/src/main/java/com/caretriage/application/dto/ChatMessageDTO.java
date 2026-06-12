package com.caretriage.application.dto;

import com.caretriage.domain.entity.ChatMessage.SenderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDTO {
    private Long id;
    private Long sessionId;
    private String content;
    private SenderType senderType;
    private String metadata;
    private String turnId;
    private Long legacyRedisId;
    private LocalDateTime createdAt;
    
    private com.caretriage.domain.entity.ChatSession.SessionType sessionType;
    private String title;
    
    // For specific UI states
    public enum MessageStatus {
        SENDING, SENT, DELIVERED, READ, ERROR
    }
    private MessageStatus status;
}

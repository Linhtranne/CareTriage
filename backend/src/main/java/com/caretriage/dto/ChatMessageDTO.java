package com.caretriage.dto;

import com.caretriage.entity.ChatMessage.SenderType;
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
    private LocalDateTime createdAt;
    
    // For specific UI states
    public enum MessageStatus {
        SENDING, SENT, DELIVERED, READ, ERROR
    }
    private MessageStatus status;
}

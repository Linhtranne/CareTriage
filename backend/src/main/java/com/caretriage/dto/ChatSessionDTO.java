package com.caretriage.dto;

import com.caretriage.entity.ChatSession;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ChatSessionDTO {
    private Long id;
    private Long userId;
    private ChatSession.SessionType sessionType;
    private ChatSession.SessionStatus status;
    private String aiSummary;
    private String suggestedDepartment;
    private String urgencyLevel;
    private String title;
    private String lastMessageContent;
    private LocalDateTime lastMessageTime;
    private LocalDateTime createdAt;
}

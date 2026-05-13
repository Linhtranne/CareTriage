package com.caretriage.dto;

import com.caretriage.entity.ChatAttachment;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ChatAttachmentDTO {
    private Long id;
    private Long sessionId;
    private String originalFilename;
    private String mimeType;
    private Long fileSize;
    private ChatAttachment.ExtractionStatus extractionStatus;
    private LocalDateTime createdAt;
}

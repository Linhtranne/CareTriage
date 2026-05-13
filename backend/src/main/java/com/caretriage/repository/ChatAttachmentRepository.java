package com.caretriage.repository;

import com.caretriage.entity.ChatAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatAttachmentRepository extends JpaRepository<ChatAttachment, Long> {
    List<ChatAttachment> findByChatSessionIdOrderByCreatedAtAsc(Long sessionId);

    List<ChatAttachment> findByChatSessionIdAndExtractionStatusOrderByCreatedAtAsc(
            Long sessionId,
            ChatAttachment.ExtractionStatus extractionStatus);
}

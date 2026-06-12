package com.caretriage.domain.repository;

import com.caretriage.domain.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findByChatSessionIdOrderByCreatedAtAsc(Long sessionId);

    @org.springframework.data.jpa.repository.Query("SELECT m FROM ChatMessage m WHERE m.chatSession.id = :sessionId AND (m.turnId IS NULL OR m.turnId != :turnId) ORDER BY m.createdAt ASC")
    List<ChatMessage> findHistoryExcludingTurn(
            @org.springframework.data.repository.query.Param("sessionId") Long sessionId, 
            @org.springframework.data.repository.query.Param("turnId") String turnId
    );
    
    Page<ChatMessage> findByChatSessionId(Long sessionId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT CAST(m.id AS string) FROM ChatMessage m WHERE m.chatSession.id = :sessionId AND m.turnId = :turnId AND m.senderType = 'AI'")
    java.util.Optional<String> findAiMessageIdBySessionIdAndTurnId(@org.springframework.data.repository.query.Param("sessionId") Long sessionId, @org.springframework.data.repository.query.Param("turnId") String turnId);

    boolean existsByChatSessionIdAndLegacyRedisId(Long chatSessionId, Long legacyRedisId);
}

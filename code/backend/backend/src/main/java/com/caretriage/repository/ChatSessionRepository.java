package com.caretriage.repository;

import com.caretriage.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {

    List<ChatSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<ChatSession> findByUserIdAndTitleContainingIgnoreCaseOrderByLastMessageTimeDesc(Long userId, String title);

    List<ChatSession> findByUserIdAndStatus(Long userId, ChatSession.SessionStatus status);

    List<ChatSession> findByStatus(ChatSession.SessionStatus status);
}

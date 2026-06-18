package com.caretriage.application.service;

import com.caretriage.application.dto.ChatAttachmentDTO;
import com.caretriage.application.dto.ChatMessageDTO;
import com.caretriage.application.dto.ChatSessionDTO;
import com.caretriage.domain.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import reactor.core.publisher.Flux;

public interface ChatService {
    ChatMessageDTO sendMessage(Long userId, ChatMessageDTO messageDTO);
    Flux<Map<String, Object>> streamAiResponse(Long userId, Long sessionId, String turnId, String userMessage);
    com.caretriage.application.dto.ChatTurnStartResult inspectOrStartTurn(Long userId, Long sessionId, String turnId, String userMessage);
    com.caretriage.application.dto.ChatTurnStartResult inspectOrStartFirstTurn(Long userId, String turnId, String userMessage, ChatSession.SessionType type, String title);
    List<ChatMessageDTO> getSessionHistory(Long sessionId);
    Page<ChatMessageDTO> getSessionHistory(Long sessionId, Pageable pageable);
    void updateOnlineStatus(String email, boolean isOnline);
    ChatSession createSession(Long userId, ChatSession.SessionType type, String title);
    ChatAttachmentDTO uploadAttachment(Long userId, Long sessionId, MultipartFile file);
    List<ChatSessionDTO> getUserSessions(Long userId);
    List<ChatSessionDTO> searchSessions(Long userId, String query);
    void deleteSession(Long userId, Long sessionId);
    
    

    

    com.caretriage.domain.entity.ChatSession updateSessionTitle(Long sessionId, String title);
    boolean isConstraintViolation(Throwable error, String constraintName);
}

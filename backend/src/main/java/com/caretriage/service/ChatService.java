package com.caretriage.service;

import com.caretriage.dto.ChatAttachmentDTO;
import com.caretriage.dto.ChatMessageDTO;
import com.caretriage.dto.ChatSessionDTO;
import com.caretriage.entity.ChatSession;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ChatService {
    ChatMessageDTO sendMessage(Long userId, ChatMessageDTO messageDTO);
    void processAiResponse(Long sessionId, String userMessage);
    List<ChatMessageDTO> getSessionHistory(Long sessionId);
    Page<ChatMessageDTO> getSessionHistory(Long sessionId, Pageable pageable);
    void updateOnlineStatus(String email, boolean isOnline);
    ChatSession createSession(Long userId, ChatSession.SessionType type, String title);
    ChatAttachmentDTO uploadAttachment(Long userId, Long sessionId, MultipartFile file);
    List<ChatSessionDTO> getUserSessions(Long userId);
    List<ChatSessionDTO> searchSessions(Long userId, String query);
    void updateSessionTitle(Long sessionId, String title);
}

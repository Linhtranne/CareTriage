package com.caretriage.presentation.controller;

import com.caretriage.application.dto.ChatMessageDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {
    private final SimpMessagingTemplate messagingTemplate;

    @org.springframework.beans.factory.annotation.Value("${app.chat.max-message-length:4000}")
    private int maxMessageLength;



    @MessageMapping("/chat.addUser")
    public void addUser(@Payload ChatMessageDTO chatMessage, 
                        SimpMessageHeaderAccessor headerAccessor, 
                        Principal principal) {
        // Add username in web socket session
        String username = principal != null ? principal.getName() : "Anonymous";
        headerAccessor.getSessionAttributes().put("username", username);
        
        log.info("User {} joined chat session {}", username, chatMessage.getSessionId());
    }

    @org.springframework.messaging.handler.annotation.MessageExceptionHandler
    public void handleException(Exception exception, Principal principal) {
        log.error("WebSocket Error for user {}: {}", principal != null ? principal.getName() : "Unknown", exception.getMessage());
        if (principal != null) {
            java.util.Map<String, Object> errorBody = new java.util.HashMap<>();
            errorBody.put("type", "ERROR");
            errorBody.put("senderType", "SYSTEM");
            errorBody.put("content", exception.getMessage());
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", errorBody);
        }
    }
}

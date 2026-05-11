package com.caretriage.controller;

import com.caretriage.dto.ChatMessageDTO;
import com.caretriage.entity.ChatMessage;
import com.caretriage.service.ChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.util.HtmlUtils;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.caretriage.repository.UserRepository userRepository;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessageDTO chatMessage, Principal principal) {
        if (principal == null) {
            log.error("Unauthorized WebSocket message attempt");
            return;
        }

        log.info("Received message from {}: {}", principal.getName(), chatMessage.getContent());

        // Sanitize content for XSS protection
        chatMessage.setContent(HtmlUtils.htmlEscape(chatMessage.getContent()));

        com.caretriage.entity.User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
        ChatMessageDTO savedMessage = chatService.sendMessage(user.getId(), chatMessage);

        // Broadcast to the specific session topic
        String destination = "/topic/chat/" + chatMessage.getSessionId();
        messagingTemplate.convertAndSend(destination, savedMessage);
        
        // Kích hoạt xử lý AI bất đồng bộ nếu là session TRIAGE
        // Gọi qua interface proxy để @Async có hiệu lực
        if (chatMessage.getContent() != null) {
            chatService.processAiResponse(chatMessage.getSessionId(), chatMessage.getContent());
        }
        
        log.info("Broadcasted message and triggered AI for session: {}", chatMessage.getSessionId());
    }

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
            messagingTemplate.convertAndSendToUser(principal.getName(), "/queue/errors", exception.getMessage());
        }
    }
}

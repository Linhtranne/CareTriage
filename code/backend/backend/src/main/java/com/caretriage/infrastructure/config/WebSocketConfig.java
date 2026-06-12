package com.caretriage.infrastructure.config;

import com.caretriage.infrastructure.security.AuthChannelInterceptorAdapter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final AuthChannelInterceptorAdapter authChannelInterceptorAdapter;

    @org.springframework.beans.factory.annotation.Value("${app.websocket.allowed-origins}")
    private String allowedOrigins;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // /topic: dành cho phát tin nhắn chung (broadcast, group chat)
        // /queue: dành cho gửi tin nhắn cá nhân (1-1)
        config.enableSimpleBroker("/topic", "/queue");
        
        // Tiền tố cho các tin nhắn từ client gửi lên @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
        
        // Tiền tố cho các tin nhắn riêng tư gửi qua @SendToUser
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        String[] origins = allowedOrigins != null && !allowedOrigins.isBlank()
                ? allowedOrigins.split(",")
                : new String[]{"http://localhost:5173", "http://localhost:5174", "http://localhost:3000"};
        registry.addEndpoint("/ws-chat")
                .setAllowedOrigins(origins)
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Đăng ký interceptor để xác thực JWT khi kết nối
        registration.interceptors(authChannelInterceptorAdapter);
    }
}

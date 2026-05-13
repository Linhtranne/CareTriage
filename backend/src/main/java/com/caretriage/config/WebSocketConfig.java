package com.caretriage.config;

import com.caretriage.security.AuthChannelInterceptorAdapter;
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
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*") // Cho phép kết nối từ mọi nguồn trong môi trường dev
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        // Đăng ký interceptor để xác thực JWT khi kết nối
        registration.interceptors(authChannelInterceptorAdapter);
    }
}

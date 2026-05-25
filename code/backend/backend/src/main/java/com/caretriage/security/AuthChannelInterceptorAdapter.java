package com.caretriage.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Slf4j
@Component
@RequiredArgsConstructor
public class AuthChannelInterceptorAdapter implements ChannelInterceptor {

    private final JwtTokenProvider tokenProvider;
    private final CustomUserDetailsService userDetailsService;
    private final ChatAuthorizationService chatAuthorizationService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null) {
            StompCommand command = accessor.getCommand();

            if (StompCommand.CONNECT.equals(command)) {
                String token = accessor.getFirstNativeHeader("Authorization");
                log.debug("WebSocket CONNECT attempt");

                if (StringUtils.hasText(token) && token.startsWith("Bearer ")) {
                    token = token.substring(7);
                    if (tokenProvider.validateToken(token)) {
                        String email = tokenProvider.getEmailFromToken(token);
                        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                        
                        UsernamePasswordAuthenticationToken authentication = 
                                new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                        
                        accessor.setUser(authentication);
                        if (accessor.getSessionAttributes() != null) {
                            accessor.getSessionAttributes().put("AUTH_USER", authentication);
                        }
                        log.info("WebSocket session authenticated for user: {}", email);
                    } else {
                        log.warn("Invalid JWT token provided in WebSocket CONNECT");
                        throw new org.springframework.messaging.MessageDeliveryException("Unauthorized: Invalid JWT token");
                    }
                } else {
                    log.warn("No Bearer token found in WebSocket CONNECT headers");
                    throw new org.springframework.messaging.MessageDeliveryException("Unauthorized: Missing or malformed token");
                }
            } else {
                // Restore authentication for all other commands
                if (accessor.getUser() == null && accessor.getSessionAttributes() != null) {
                    Object authUser = accessor.getSessionAttributes().get("AUTH_USER");
                    if (authUser instanceof org.springframework.security.core.Authentication) {
                        accessor.setUser((org.springframework.security.core.Authentication) authUser);
                    }
                }
                
                if (StompCommand.SUBSCRIBE.equals(command)) {
                    String destination = accessor.getDestination();
                    org.springframework.security.core.Authentication authentication = 
                            (org.springframework.security.core.Authentication) accessor.getUser();
                    
                    log.debug("WebSocket SUBSCRIBE attempt to {} by user: {}", destination, 
                            authentication != null ? authentication.getName() : "Anonymous");

                    if (authentication == null) {
                        log.warn("Anonymous SUBSCRIBE attempt to {} rejected", destination);
                        throw new org.springframework.messaging.MessageDeliveryException("Unauthorized: User not authenticated");
                    }

                    if (!chatAuthorizationService.canSubscribeToDestination(authentication, destination)) {
                        log.warn("User {} is unauthorized to subscribe to {}", authentication.getName(), destination);
                        throw new org.springframework.messaging.MessageDeliveryException("Access Denied: You are not authorized to subscribe to this channel");
                    }
                }
            }
        }
        // Always return original message in interceptor so STOMP handler doesn't lose context
        return message;
    }
}

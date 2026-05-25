package com.caretriage.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthChannelInterceptorAdapterTest {

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private CustomUserDetailsService userDetailsService;

    @Mock
    private ChatAuthorizationService chatAuthorizationService;

    @Mock
    private MessageChannel messageChannel;

    @InjectMocks
    private AuthChannelInterceptorAdapter interceptor;

    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        userDetails = new User("user@example.com", "password", Collections.emptyList());
    }

    @Test
    void testPreSend_ConnectSuccess() {
        // Arrange
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer valid_jwt_token");
        accessor.setLeaveMutable(true); // Allow mutations during test
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(tokenProvider.validateToken("valid_jwt_token")).thenReturn(true);
        when(tokenProvider.getEmailFromToken("valid_jwt_token")).thenReturn("user@example.com");
        when(userDetailsService.loadUserByUsername("user@example.com")).thenReturn(userDetails);

        // Act
        Message<?> result = interceptor.preSend(message, messageChannel);

        // Assert
        assertNotNull(result);
        StompHeaderAccessor resultAccessor = StompHeaderAccessor.wrap(result);
        assertNotNull(resultAccessor.getUser());
        assertEquals("user@example.com", resultAccessor.getUser().getName());
    }

    @Test
    void testPreSend_ConnectInvalidTokenThrowsException() {
        // Arrange
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.addNativeHeader("Authorization", "Bearer invalid_jwt_token");
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(tokenProvider.validateToken("invalid_jwt_token")).thenReturn(false);

        // Act & Assert
        MessageDeliveryException exception = assertThrows(MessageDeliveryException.class, () -> {
            interceptor.preSend(message, messageChannel);
        });
        assertTrue(exception.getMessage().contains("Invalid JWT token"));
    }

    @Test
    void testPreSend_ConnectMissingTokenThrowsException() {
        // Arrange
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        // Act & Assert
        MessageDeliveryException exception = assertThrows(MessageDeliveryException.class, () -> {
            interceptor.preSend(message, messageChannel);
        });
        assertTrue(exception.getMessage().contains("Missing or malformed token"));
    }

    @Test
    void testPreSend_SubscribeAuthorized() {
        // Arrange
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/chat/123");
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null);
        accessor.setUser(auth);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(chatAuthorizationService.canSubscribeToDestination(auth, "/topic/chat/123")).thenReturn(true);

        // Act
        Message<?> result = interceptor.preSend(message, messageChannel);

        // Assert
        assertNotNull(result);
        verify(chatAuthorizationService, times(1)).canSubscribeToDestination(auth, "/topic/chat/123");
    }

    @Test
    void testPreSend_SubscribeUnauthorizedThrowsException() {
        // Arrange
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/chat/123");
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null);
        accessor.setUser(auth);
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        when(chatAuthorizationService.canSubscribeToDestination(auth, "/topic/chat/123")).thenReturn(false);

        // Act & Assert
        MessageDeliveryException exception = assertThrows(MessageDeliveryException.class, () -> {
            interceptor.preSend(message, messageChannel);
        });
        assertTrue(exception.getMessage().contains("not authorized to subscribe"));
    }

    @Test
    void testPreSend_SubscribeAnonymousThrowsException() {
        // Arrange
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.SUBSCRIBE);
        accessor.setDestination("/topic/chat/123");
        Message<byte[]> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());

        // Act & Assert
        MessageDeliveryException exception = assertThrows(MessageDeliveryException.class, () -> {
            interceptor.preSend(message, messageChannel);
        });
        assertTrue(exception.getMessage().contains("User not authenticated"));
    }
}

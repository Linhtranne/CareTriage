package com.caretriage.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class WebSocketRateLimiterTest {

    private WebSocketRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new WebSocketRateLimiter();
        // Configure using ReflectionTestUtils to simulate @Value injection
        ReflectionTestUtils.setField(rateLimiter, "enabled", true);
        ReflectionTestUtils.setField(rateLimiter, "maxMessagesPerMinute", 3); // Small limit for testing
    }

    @Test
    void testIsAllowed_UnderLimit() {
        Long sessionId = 1L;
        assertTrue(rateLimiter.isAllowed(sessionId));
        assertTrue(rateLimiter.isAllowed(sessionId));
        assertTrue(rateLimiter.isAllowed(sessionId));
    }

    @Test
    void testIsAllowed_ExceedsLimit() {
        Long sessionId = 1L;
        assertTrue(rateLimiter.isAllowed(sessionId));
        assertTrue(rateLimiter.isAllowed(sessionId));
        assertTrue(rateLimiter.isAllowed(sessionId));
        
        // 4th request exceeds the limit of 3
        assertFalse(rateLimiter.isAllowed(sessionId));
    }

    @Test
    void testIsAllowed_IndependentSessions() {
        Long session1 = 1L;
        Long session2 = 2L;

        assertTrue(rateLimiter.isAllowed(session1));
        assertTrue(rateLimiter.isAllowed(session1));
        assertTrue(rateLimiter.isAllowed(session1));
        assertFalse(rateLimiter.isAllowed(session1)); // session 1 blocked

        // session 2 should still be allowed
        assertTrue(rateLimiter.isAllowed(session2));
    }

    @Test
    void testIsAllowed_RateLimiterDisabled() {
        ReflectionTestUtils.setField(rateLimiter, "enabled", false);
        Long sessionId = 1L;

        assertTrue(rateLimiter.isAllowed(sessionId));
        assertTrue(rateLimiter.isAllowed(sessionId));
        assertTrue(rateLimiter.isAllowed(sessionId));
        assertTrue(rateLimiter.isAllowed(sessionId)); // Allowed even over limit
    }

    @Test
    void testCleanupObsoleteSessions() {
        Long sessionId = 1L;
        assertTrue(rateLimiter.isAllowed(sessionId));

        // Since the timestamp is current, cleanup should NOT evict it
        rateLimiter.cleanupObsoleteSessions();
        
        // Trigger exceeding limit to prove it was not cleared
        assertTrue(rateLimiter.isAllowed(sessionId));
        assertTrue(rateLimiter.isAllowed(sessionId));
        assertFalse(rateLimiter.isAllowed(sessionId));
    }
}

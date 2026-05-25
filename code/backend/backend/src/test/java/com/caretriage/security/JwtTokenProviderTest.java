package com.caretriage.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider(
                "caretriage-super-secret-key-that-is-at-least-256-bits-long-for-hs256",
                3600000,
                604800000
        );
    }

    @Test
    void testGenerateTokenAndExtractEmail() {
        UserDetails userDetails = new User("test@example.com", "password", new ArrayList<>());
        Authentication auth = new UsernamePasswordAuthenticationToken(userDetails, null);

        String token = jwtTokenProvider.generateToken(auth);
        assertNotNull(token);

        String email = jwtTokenProvider.getEmailFromToken(token);
        assertEquals("test@example.com", email);
    }

    @Test
    void testValidateToken_Success() {
        String token = jwtTokenProvider.generateTokenFromEmail("valid@example.com");
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    void testValidateToken_InvalidSignature() {
        String invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ2YWxpZEBleGFtcGxlLmNvbSJ9.dummySignature";
        assertFalse(jwtTokenProvider.validateToken(invalidToken));
    }
}

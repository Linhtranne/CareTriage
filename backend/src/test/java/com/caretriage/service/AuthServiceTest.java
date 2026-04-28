package com.caretriage.service;

import com.caretriage.dto.request.LoginRequest;
import com.caretriage.dto.request.RegisterRequest;
import com.caretriage.dto.response.AuthResponse;
import com.caretriage.entity.Role;
import com.caretriage.entity.User;
import com.caretriage.repository.RoleRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.security.JwtTokenProvider;
import com.caretriage.service.impl.AuthServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthServiceImpl authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User user;
    private Role role;

    @BeforeEach
    void setUp() {
        registerRequest = new RegisterRequest();
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("Password123@");
        registerRequest.setFullName("Test User");
        registerRequest.setRole("PATIENT");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("test@example.com");
        loginRequest.setPassword("Password123@");

        role = Role.builder().id(1L).name("PATIENT").build();
        user = User.builder()
                .id(1L)
                .email("test@example.com")
                .username("test@example.com")
                .password("hashedPassword")
                .fullName("Test User")
                .roles(Set.of(role))
                .isActive(true)
                .deleted(false)
                .build();
    }

    @Test
    void testRegister_Success() {
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(roleRepository.findByName(anyString())).thenReturn(Optional.of(role));
        when(passwordEncoder.encode(anyString())).thenReturn("hashedPassword");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(jwtTokenProvider.generateTokenFromEmail(anyString())).thenReturn("dummyToken");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("dummyRefreshToken");

        AuthResponse response = authService.register(registerRequest);

        assertNotNull(response);
        assertEquals("dummyToken", response.getToken());
        assertEquals("dummyRefreshToken", response.getRefreshToken());
        assertEquals("test@example.com", response.getUser().getEmail());
        verify(userRepository, times(1)).save(any(User.class));
    }

    @Test
    void testRegister_EmailExists_ThrowsException() {
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        Exception exception = assertThrows(RuntimeException.class, () -> {
            authService.register(registerRequest);
        });

        assertEquals("Email đã được sử dụng", exception.getMessage());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void testLogin_Success() {
        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(user));
        when(jwtTokenProvider.generateToken(any(Authentication.class))).thenReturn("dummyToken");
        when(jwtTokenProvider.generateRefreshToken(anyString())).thenReturn("dummyRefreshToken");

        AuthResponse response = authService.login(loginRequest);

        assertNotNull(response);
        assertEquals("dummyToken", response.getToken());
        assertEquals("dummyRefreshToken", response.getRefreshToken());
    }

    @Test
    void testLogin_UserInactive_ThrowsException() {
        Authentication auth = mock(Authentication.class);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        
        User inactiveUser = User.builder()
                .id(1L)
                .email("test@example.com")
                .isActive(false)
                .build();
                
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.of(inactiveUser));

        Exception exception = assertThrows(RuntimeException.class, () -> {
            authService.login(loginRequest);
        });

        assertEquals("Tài khoản đã bị khóa", exception.getMessage());
    }
}

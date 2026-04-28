package com.caretriage.service;

import com.caretriage.dto.request.LoginRequest;
import com.caretriage.dto.request.RegisterRequest;
import com.caretriage.dto.response.AuthResponse;
import com.caretriage.entity.Role;
import com.caretriage.entity.User;
import com.caretriage.repository.UserRepository;
import com.caretriage.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email đã được sử dụng");
        }

        Role role = Role.PATIENT;
        if (request.getRole() != null) {
            try {
                role = Role.valueOf(request.getRole().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // Default to PATIENT
            }
        }

        User user = User.builder()
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .role(role)
                .isActive(true)
                .build();

        user = userRepository.save(user);

        String token = jwtTokenProvider.generateTokenFromEmail(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        return buildAuthResponse(user, token, refreshToken);
    }

    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getIsActive()) {
            throw new RuntimeException("Tài khoản đã bị khóa");
        }

        String token = jwtTokenProvider.generateToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        return buildAuthResponse(user, token, refreshToken);
    }

    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new RuntimeException("Refresh token không hợp lệ");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newToken = jwtTokenProvider.generateTokenFromEmail(email);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(email);

        return buildAuthResponse(user, newToken, newRefreshToken);
    }

    private AuthResponse buildAuthResponse(User user, String token, String refreshToken) {
        return AuthResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .email(user.getEmail())
                        .phone(user.getPhone())
                        .role(user.getRole().name())
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .build();
    }
}

package com.caretriage.application.service.impl;

import com.caretriage.application.dto.request.LoginRequest;
import com.caretriage.application.dto.request.RegisterRequest;
import com.caretriage.application.dto.response.AuthResponse;
import com.caretriage.domain.entity.Role;
import com.caretriage.domain.entity.User;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.domain.repository.RoleRepository;
import com.caretriage.infrastructure.security.JwtTokenProvider;
import com.caretriage.application.service.AuthService;
import com.caretriage.shared.exception.BusinessException;
import com.caretriage.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import com.caretriage.application.service.TwoFactorService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final TwoFactorService twoFactorService;

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException("Email đã được sử dụng");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BusinessException("Số điện thoại đã được sử dụng");
        }

        String roleName = "PATIENT";
        if (request.getRole() != null) {
            roleName = request.getRole().toUpperCase();
        }

        final String finalRoleName = roleName;
        Role role = roleRepository.findByName(finalRoleName)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(finalRoleName)
                        .description("Default " + finalRoleName + " role")
                        .build()));

        User user = User.builder()
                .username(request.getEmail()) // Use email as username for now
                .fullName(request.getFullName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .phone(request.getPhone())
                .roles(new java.util.HashSet<>(java.util.List.of(role)))
                .isActive(true)
                .deleted(false)
                .build();

        String token = jwtTokenProvider.generateTokenFromEmail(user.getEmail());
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        user.setRefreshToken(refreshToken);
        user = userRepository.save(user);

        return buildAuthResponse(user, token, refreshToken);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!user.getIsActive()) {
            throw new DisabledException("Tài khoản đã bị khóa");
        }

        if (user.getTwoFactorEmail() != null && user.getTwoFactorEmail()) {
            twoFactorService.generateAndSendOtp(user);
            String tempToken = jwtTokenProvider.generateTempTokenFromEmail(user.getEmail());
            return AuthResponse.builder()
                    .token(tempToken)
                    .refreshToken("2FA_REQUIRED")
                    .build();
        }

        String token = jwtTokenProvider.generateToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getEmail());

        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        return buildAuthResponse(user, token, refreshToken);
    }

    @Override
    public AuthResponse refreshToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BadCredentialsException("Refresh token không hợp lệ");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRefreshToken() == null || !user.getRefreshToken().equals(refreshToken)) {
            throw new BadCredentialsException("Refresh token has been revoked or is invalid");
        }

        String newToken = jwtTokenProvider.generateTokenFromEmail(email);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(email);

        user.setRefreshToken(newRefreshToken);
        userRepository.save(user);

        return buildAuthResponse(user, newToken, newRefreshToken);
    }

    @Override
    public void logout(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new BadCredentialsException("Refresh token không hợp lệ");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getRefreshToken() != null && user.getRefreshToken().equals(refreshToken)) {
            user.setRefreshToken(null);
            userRepository.save(user);
        }
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
                        .role(user.getRoles().stream()
                                .map(Role::getName)
                                .collect(java.util.stream.Collectors.joining(", ")))
                        .avatarUrl(user.getAvatarUrl())
                        .build())
                .build();
    }
}

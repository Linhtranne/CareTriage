package com.caretriage.controller;

import com.caretriage.dto.request.TwoFactorRequest;
import com.caretriage.dto.response.ApiResponse;
import com.caretriage.dto.response.AuthResponse;
import com.caretriage.entity.Role;
import com.caretriage.entity.User;
import com.caretriage.repository.UserRepository;
import com.caretriage.security.JwtTokenProvider;
import com.caretriage.service.TwoFactorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/2fa")
@RequiredArgsConstructor
public class TwoFactorController {

    private final TwoFactorService twoFactorService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> verify(@Valid @RequestBody TwoFactorRequest request,
                                                            @RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        
        String tempToken = authHeader.substring(7);
        if (!jwtTokenProvider.validateToken(tempToken)) {
            throw new RuntimeException("Invalid or expired temporary token");
        }
        
        String email = jwtTokenProvider.getEmailFromToken(tempToken);
        
        if (!twoFactorService.verifyOtp(email, request.getOtp())) {
            throw new RuntimeException("OTP không hợp lệ hoặc đã hết hạn");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate real tokens
        String token = jwtTokenProvider.generateTokenFromEmail(email);
        String refreshToken = jwtTokenProvider.generateRefreshToken(email);

        user.setRefreshToken(refreshToken);
        userRepository.save(user);

        twoFactorService.clearOtp(email);

        AuthResponse authResponse = AuthResponse.builder()
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

        return ResponseEntity.ok(ApiResponse.success("Xác thực 2FA thành công", authResponse));
    }

    @PostMapping("/enable")
    public ResponseEntity<ApiResponse<Void>> enable2fa(@RequestHeader("Authorization") String authHeader) {
        String email = extractEmailFromHeader(authHeader);
        User user = userRepository.findByEmail(email).orElseThrow();
        
        twoFactorService.generateAndSendOtp(user);
        
        return ResponseEntity.ok(ApiResponse.success("Mã OTP đã được gửi đến email để xác nhận bật 2FA", null));
    }

    @PostMapping("/confirm-enable")
    public ResponseEntity<ApiResponse<Void>> confirmEnable2fa(@Valid @RequestBody TwoFactorRequest request,
                                                              @RequestHeader("Authorization") String authHeader) {
        String email = extractEmailFromHeader(authHeader);
        User user = userRepository.findByEmail(email).orElseThrow();

        if (!twoFactorService.verifyOtp(email, request.getOtp())) {
            throw new RuntimeException("OTP không hợp lệ hoặc đã hết hạn");
        }

        user.setTwoFactorEmail(true);
        userRepository.save(user);
        twoFactorService.clearOtp(email);

        return ResponseEntity.ok(ApiResponse.success("Đã bật 2FA thành công", null));
    }

    @PostMapping("/disable")
    public ResponseEntity<ApiResponse<Void>> disable2fa(@RequestHeader("Authorization") String authHeader) {
        String email = extractEmailFromHeader(authHeader);
        User user = userRepository.findByEmail(email).orElseThrow();
        
        user.setTwoFactorEmail(false);
        userRepository.save(user);
        
        return ResponseEntity.ok(ApiResponse.success("Đã tắt 2FA thành công", null));
    }

    private String extractEmailFromHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Missing or invalid Authorization header");
        }
        String token = authHeader.substring(7);
        return jwtTokenProvider.getEmailFromToken(token);
    }
}

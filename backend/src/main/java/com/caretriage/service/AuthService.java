package com.caretriage.service;

import com.caretriage.dto.request.LoginRequest;
import com.caretriage.dto.request.RegisterRequest;
import com.caretriage.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
    void logout(String refreshToken);
}

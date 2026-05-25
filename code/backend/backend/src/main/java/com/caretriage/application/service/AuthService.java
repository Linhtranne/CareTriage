package com.caretriage.application.service;

import com.caretriage.application.dto.request.LoginRequest;
import com.caretriage.application.dto.request.RegisterRequest;
import com.caretriage.application.dto.response.AuthResponse;

public interface AuthService {
    AuthResponse register(RegisterRequest request);
    AuthResponse login(LoginRequest request);
    AuthResponse refreshToken(String refreshToken);
    void logout(String refreshToken);
}

package com.caretriage.application.service;

import com.caretriage.domain.entity.User;

public interface TwoFactorService {
    String generateAndSendOtp(User user);
    boolean verifyOtp(String email, String otp);
    void clearOtp(String email);
}

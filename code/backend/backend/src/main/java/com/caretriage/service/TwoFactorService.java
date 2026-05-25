package com.caretriage.service;

import com.caretriage.entity.User;

public interface TwoFactorService {
    String generateAndSendOtp(User user);
    boolean verifyOtp(String email, String otp);
    void clearOtp(String email);
}

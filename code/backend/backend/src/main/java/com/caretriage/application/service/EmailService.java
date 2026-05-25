package com.caretriage.application.service;

public interface EmailService {
    void sendOtpEmail(String toEmail, String otp);
}

package com.caretriage.application.service.impl;

import com.caretriage.application.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailServiceImpl implements EmailService {

    @Override
    public void sendOtpEmail(String toEmail, String otp) {
        // In a real application, you would use JavaMailSender here.
        // For now, we just print the OTP to the console/log so we can test the 2FA flow.
        log.info("=========================================================");
        log.info("MOCK EMAIL SENDER");
        log.info("To: {}", toEmail);
        log.info("Subject: Your CareTriage Verification Code");
        log.info("Body: Your 2FA code is: {}", otp);
        log.info("=========================================================");
    }
}

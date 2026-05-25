package com.caretriage.service.impl;

import com.caretriage.entity.User;
import com.caretriage.service.EmailService;
import com.caretriage.service.TwoFactorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class TwoFactorServiceImpl implements TwoFactorService {

    private final EmailService emailService;
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(1);

    @Override
    public String generateAndSendOtp(User user) {
        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));
        
        String email = user.getEmail();
        otpStorage.put(email, otp);
        
        // Auto-expire after 5 minutes
        scheduler.schedule(() -> {
            otpStorage.remove(email);
        }, 5, TimeUnit.MINUTES);

        // Send OTP via Email (mock)
        emailService.sendOtpEmail(email, otp);
        
        return otp;
    }

    @Override
    public boolean verifyOtp(String email, String otp) {
        String storedOtp = otpStorage.get(email);
        return storedOtp != null && storedOtp.equals(otp);
    }

    @Override
    public void clearOtp(String email) {
        otpStorage.remove(email);
    }
}

package com.caretriage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TwoFactorRequest {
    @NotBlank(message = "OTP is required")
    private String otp;
    
    // Optional tempToken if we want to pass it in body, but usually it's in Authorization header
    private String tempToken;
}

package com.caretriage.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private Set<String> roles;
    private Boolean isActive;
    private Boolean deleted;
    private Boolean twoFactorEmail;
    private Boolean twoFactorSms;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

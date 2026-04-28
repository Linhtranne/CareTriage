package com.caretriage.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String refreshToken;
    private UserInfo user;

    @Data
    @Builder
    @AllArgsConstructor
    public static class UserInfo {
        private Long id;
        private String fullName;
        private String email;
        private String phone;
        private String role;
        private String avatarUrl;
    }
}

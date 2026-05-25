package com.caretriage.domain.entity;

import lombok.*;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class User {
    private Long id;
    private String username;
    private String email;
    private String password;
    private String fullName;
    private String phone;
    private String avatarUrl;
    private String refreshToken;
    @Builder.Default private Boolean twoFactorEmail = false;
    @Builder.Default private Boolean twoFactorSms = false;
    @Builder.Default private Boolean isActive = true;
    @Builder.Default private Boolean deleted = false;
    @Builder.Default private Set<Role> roles = new HashSet<>();
    private PatientProfile patientProfile;
    private DoctorProfile doctorProfile;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

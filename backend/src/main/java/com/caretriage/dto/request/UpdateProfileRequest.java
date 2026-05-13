package com.caretriage.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    private String fullName;
    private String phone;
    private String avatarUrl;

    // Patient profile fields
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String bloodType;
    private String allergies;
    private String insuranceNumber;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String chronicConditions;

    // Doctor profile fields
    private String bio;
    private String specialization;
    private Integer experienceYears;
    private String degrees;
    private String hospitalName;
}

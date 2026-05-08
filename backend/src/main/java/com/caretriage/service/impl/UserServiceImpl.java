package com.caretriage.service.impl;

import com.caretriage.dto.request.UpdateProfileRequest;
import com.caretriage.dto.response.DepartmentResponse;
import com.caretriage.dto.response.UserProfileResponse;
import com.caretriage.entity.DoctorProfile;
import com.caretriage.entity.PatientProfile;
import com.caretriage.entity.Role;
import com.caretriage.entity.User;
import com.caretriage.repository.DoctorProfileRepository;
import com.caretriage.repository.PatientProfileRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PatientProfileRepository patientProfileRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return mapToResponse(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update core user fields
        if (request.getFullName() != null) user.setFullName(request.getFullName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());

        userRepository.save(user);

        // Update role-specific profile
        boolean isDoctor = user.getRoles().stream().anyMatch(r -> r.getName().equals("DOCTOR"));
        boolean isPatient = user.getRoles().stream().anyMatch(r -> r.getName().equals("PATIENT"));

        if (isDoctor) {
            DoctorProfile profile = doctorProfileRepository.findByUserId(user.getId())
                    .orElseGet(() -> DoctorProfile.builder().user(user).build());
            
            if (request.getBio() != null) profile.setBio(request.getBio());
            if (request.getSpecialization() != null) profile.setSpecialization(request.getSpecialization());
            if (request.getExperienceYears() != null) profile.setExperienceYears(request.getExperienceYears());
            if (request.getDegrees() != null) profile.setDegrees(request.getDegrees());
            if (request.getHospitalName() != null) profile.setHospitalName(request.getHospitalName());
            
            doctorProfileRepository.save(profile);
        } else if (isPatient) {
            PatientProfile profile = patientProfileRepository.findByUserId(user.getId())
                    .orElseGet(() -> PatientProfile.builder().user(user).build());
            
            if (request.getDateOfBirth() != null) profile.setDateOfBirth(request.getDateOfBirth());
            if (request.getGender() != null) profile.setGender(request.getGender());
            if (request.getAddress() != null) profile.setAddress(request.getAddress());
            if (request.getBloodType() != null) profile.setBloodType(request.getBloodType());
            if (request.getAllergies() != null) profile.setAllergies(request.getAllergies());
            if (request.getInsuranceNumber() != null) profile.setInsuranceNumber(request.getInsuranceNumber());
            if (request.getEmergencyContactName() != null) profile.setEmergencyContactName(request.getEmergencyContactName());
            if (request.getEmergencyContactPhone() != null) profile.setEmergencyContactPhone(request.getEmergencyContactPhone());
            if (request.getChronicConditions() != null) profile.setChronicConditions(request.getChronicConditions());
            
            patientProfileRepository.save(profile);
        }

        return mapToResponse(user);
    }

    private UserProfileResponse mapToResponse(User user) {
        UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRoles().stream().map(Role::getName).collect(Collectors.joining(",")))
                .twoFactorEmail(user.getTwoFactorEmail())
                .twoFactorSms(user.getTwoFactorSms());

        // Try to get patient profile
        patientProfileRepository.findByUserId(user.getId()).ifPresent(p -> {
            builder.dateOfBirth(p.getDateOfBirth())
                    .gender(p.getGender())
                    .address(p.getAddress())
                    .bloodType(p.getBloodType())
                    .allergies(p.getAllergies())
                    .insuranceNumber(p.getInsuranceNumber())
                    .emergencyContactName(p.getEmergencyContactName())
                    .emergencyContactPhone(p.getEmergencyContactPhone())
                    .chronicConditions(p.getChronicConditions());
        });

        // Try to get doctor profile
        doctorProfileRepository.findByUserId(user.getId()).ifPresent(d -> {
            builder.bio(d.getBio())
                    .specialization(d.getSpecialization())
                    .experienceYears(d.getExperienceYears())
                    .degrees(d.getDegrees())
                    .hospitalName(d.getHospitalName())
                    .departments(d.getDepartments().stream()
                            .map(dept -> DepartmentResponse.builder()
                                    .id(dept.getId())
                                    .code(dept.getCode())
                                    .name(dept.getName())
                                    .slug(dept.getSlug())
                                    .description(dept.getDescription())
                                    .imageUrl(dept.getImageUrl())
                                    .status(dept.getStatus())
                                    .build())
                            .collect(Collectors.toList()));
        });

        return builder.build();
    }
}

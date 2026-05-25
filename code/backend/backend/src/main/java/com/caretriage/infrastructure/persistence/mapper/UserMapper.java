package com.caretriage.infrastructure.persistence.mapper;

import com.caretriage.domain.entity.Role;
import com.caretriage.domain.entity.User;
import com.caretriage.infrastructure.persistence.entity.RoleJpaEntity;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.stream.Collectors;

@Component
public class UserMapper {
    public static final UserMapper INSTANCE = new UserMapper(RoleMapper.INSTANCE);

    private final RoleMapper roleMapper;

    public UserMapper(RoleMapper roleMapper) {
        this.roleMapper = roleMapper;
    }

    public User toDomain(UserJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return User.builder()
                .id(entity.getId())
                .username(entity.getUsername())
                .email(entity.getEmail())
                .password(entity.getPassword())
                .fullName(entity.getFullName())
                .phone(entity.getPhone())
                .avatarUrl(entity.getAvatarUrl())
                .refreshToken(entity.getRefreshToken())
                .twoFactorEmail(entity.getTwoFactorEmail())
                .twoFactorSms(entity.getTwoFactorSms())
                .isActive(entity.getIsActive())
                .deleted(entity.getDeleted())
                .roles(toDomainRoles(entity.getRoles()))
                .patientProfile(entity.getPatientProfile())
                .doctorProfile(entity.getDoctorProfile())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public UserJpaEntity toEntity(User domain) {
        if (domain == null) {
            return null;
        }

        return UserJpaEntity.builder()
                .id(domain.getId())
                .username(domain.getUsername())
                .email(domain.getEmail())
                .password(domain.getPassword())
                .fullName(domain.getFullName())
                .phone(domain.getPhone())
                .avatarUrl(domain.getAvatarUrl())
                .refreshToken(domain.getRefreshToken())
                .twoFactorEmail(domain.getTwoFactorEmail())
                .twoFactorSms(domain.getTwoFactorSms())
                .isActive(domain.getIsActive())
                .deleted(domain.getDeleted())
                .roles(toJpaRoles(domain.getRoles()))
                .patientProfile(domain.getPatientProfile())
                .doctorProfile(domain.getDoctorProfile())
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .build();
    }

    private Set<Role> toDomainRoles(Set<RoleJpaEntity> roles) {
        if (roles == null) {
            return null;
        }

        return roles.stream()
                .map(roleMapper::toDomain)
                .collect(Collectors.toSet());
    }

    private Set<RoleJpaEntity> toJpaRoles(Set<Role> roles) {
        if (roles == null) {
            return null;
        }

        return roles.stream()
                .map(roleMapper::toEntity)
                .collect(Collectors.toSet());
    }
}

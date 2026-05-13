package com.caretriage.service.impl;

import com.caretriage.dto.response.AdminUserResponse;
import com.caretriage.dto.response.PagedResponse;
import com.caretriage.entity.Role;
import com.caretriage.entity.User;
import com.caretriage.repository.RoleRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<AdminUserResponse> getAllUsers(int page, int size, String search, String role, Boolean isActive) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<User> userPage;

        if (search != null && !search.isBlank()) {
            userPage = userRepository.searchUsers(search.trim(), pageable);
        } else if (role != null && !role.isBlank()) {
            userPage = userRepository.findByRolesName(role, pageable);
        } else if (isActive != null) {
            userPage = userRepository.findByIsActive(isActive, pageable);
        } else {
            userPage = userRepository.findAll(pageable);
        }

        var content = userPage.getContent().stream()
                .map(this::mapToAdminResponse)
                .collect(Collectors.toList());

        return PagedResponse.<AdminUserResponse>builder()
                .content(content)
                .page(userPage.getNumber())
                .size(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .last(userPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToAdminResponse(user);
    }

    @Override
    @Transactional
    public AdminUserResponse changeUserRole(Long userId, String roleName) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check business rule: Admin cannot demote themselves
        String currentUsername = getCurrentUsername();
        if (user.getUsername().equals(currentUsername)) {
            log.warn("Admin audit: Self-demotion attempt blocked for user {}", currentUsername);
            throw new RuntimeException("Bạn không thể tự thay đổi vai trò của chính mình để tránh lỗi vận hành hệ thống.");
        }

        Role newRole = roleRepository.findByName(roleName)
                .orElseThrow(() -> new RuntimeException("Role not found: " + roleName));

        user.setRoles(Collections.singleton(newRole));
        User updatedUser = userRepository.save(user);

        log.info("Admin audit: User {} role changed to {} by admin {}", user.getUsername(), roleName, currentUsername);
        return mapToAdminResponse(updatedUser);
    }

    @Override
    @Transactional
    public AdminUserResponse toggleUserActive(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check business rule: Admin cannot lock themselves
        String currentUsername = getCurrentUsername();
        if (user.getUsername().equals(currentUsername)) {
            log.warn("Admin audit: Self-locking attempt blocked for user {}", currentUsername);
            throw new RuntimeException("Bạn không thể tự khóa tài khoản của chính mình.");
        }

        user.setIsActive(!user.getIsActive());
        User updatedUser = userRepository.save(user);

        log.info("Admin audit: User {} status toggled to {} by admin {}", 
                 user.getUsername(), user.getIsActive() ? "ACTIVE" : "INACTIVE", currentUsername);
        return mapToAdminResponse(updatedUser);
    }

    private String getCurrentUsername() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof UserDetails) {
            return ((UserDetails) principal).getUsername();
        } else {
            return principal.toString();
        }
    }

    private AdminUserResponse mapToAdminResponse(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .roles(user.getRoles().stream().map(Role::getName).collect(Collectors.toSet()))
                .isActive(user.getIsActive())
                .deleted(user.getDeleted())
                .twoFactorEmail(user.getTwoFactorEmail())
                .twoFactorSms(user.getTwoFactorSms())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}

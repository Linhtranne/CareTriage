package com.caretriage.service;

import com.caretriage.dto.response.AdminUserResponse;
import com.caretriage.dto.response.PagedResponse;

public interface AdminUserService {
    PagedResponse<AdminUserResponse> getAllUsers(int page, int size, String search, String role, Boolean isActive);
    AdminUserResponse getUserById(Long id);
    AdminUserResponse changeUserRole(Long userId, String roleName);
    AdminUserResponse toggleUserActive(Long userId);
    AdminUserResponse updateUserProfile(Long userId, AdminUserResponse request);
}

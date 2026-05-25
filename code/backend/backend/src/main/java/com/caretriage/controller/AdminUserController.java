package com.caretriage.controller;

import com.caretriage.dto.request.ChangeRoleRequest;
import com.caretriage.dto.response.AdminUserResponse;
import com.caretriage.dto.response.ApiResponse;
import com.caretriage.dto.response.PagedResponse;
import com.caretriage.service.AdminUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin User Management", description = "Admin endpoints for managing users")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN', 'ROLE_SUPER_ADMIN')")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "Get all users (paginated, searchable)")
    public ResponseEntity<ApiResponse<PagedResponse<AdminUserResponse>>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean isActive) {
        PagedResponse<AdminUserResponse> users = adminUserService.getAllUsers(page, size, search, role, isActive);
        return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getUserById(@PathVariable Long id) {
        AdminUserResponse user = adminUserService.getUserById(id);
        return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", user));
    }

    @PatchMapping("/{id}/role")
    @Operation(summary = "Change user role")
    public ResponseEntity<ApiResponse<AdminUserResponse>> changeRole(
            @PathVariable Long id,
            @Valid @RequestBody ChangeRoleRequest request) {
        AdminUserResponse user = adminUserService.changeUserRole(id, request.getRoleName());
        return ResponseEntity.ok(ApiResponse.success("Role updated successfully", user));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Toggle user active/inactive status")
    public ResponseEntity<ApiResponse<AdminUserResponse>> toggleActive(@PathVariable Long id) {
        AdminUserResponse user = adminUserService.toggleUserActive(id);
        return ResponseEntity.ok(ApiResponse.success("User status updated successfully", user));
    }

    @PatchMapping("/{id}/profile")
    @Operation(summary = "Update user profile details (Admin)")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateProfile(
            @PathVariable Long id,
            @RequestBody AdminUserResponse request) {
        AdminUserResponse user = adminUserService.updateUserProfile(id, request);
        return ResponseEntity.ok(ApiResponse.success("Hồ sơ người dùng đã được cập nhật thành công", user));
    }
}

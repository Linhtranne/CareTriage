package com.caretriage.controller;

import com.caretriage.dto.request.UpdateProfileRequest;
import com.caretriage.dto.response.ApiResponse;
import com.caretriage.dto.response.UserProfileResponse;
import com.caretriage.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "Endpoints for managing user profiles")
public class UserController {

    private final UserService userService;
    private final com.caretriage.service.AvatarStorageService avatarStorageService;

    @GetMapping("/profile")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(Authentication authentication) {
        String email = authentication.getName();
        UserProfileResponse profile = userService.getCurrentUserProfile(email);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update current user profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            Authentication authentication,
            @RequestBody UpdateProfileRequest request) {
        String email = authentication.getName();
        UserProfileResponse updatedProfile = userService.updateProfile(email, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updatedProfile));
    }

    @PostMapping("/profile/avatar")
    @Operation(summary = "Upload profile avatar")
    public ResponseEntity<ApiResponse<String>> uploadAvatar(
            Authentication authentication,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng chọn file để upload"));
        }

        // Basic validation
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Chỉ chấp nhận định dạng ảnh (JPG, PNG, GIF)"));
        }

        if (file.getSize() > 5 * 1024 * 1024) { // 5MB
            return ResponseEntity.badRequest().body(ApiResponse.error("Dung lượng ảnh tối đa là 5MB"));
        }

        String email = authentication.getName();
        // We need userId to organize files in Firebase
        UserProfileResponse profile = userService.getCurrentUserProfile(email);
        
        String avatarUrl = avatarStorageService.uploadAvatar(profile.getId(), file);
        
        return ResponseEntity.ok(ApiResponse.success("Upload avatar thành công", avatarUrl));
    }
}

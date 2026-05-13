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
}

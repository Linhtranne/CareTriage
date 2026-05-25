package com.caretriage.service;

import com.caretriage.dto.request.UpdateProfileRequest;
import com.caretriage.dto.response.UserProfileResponse;

public interface UserService {
    UserProfileResponse getCurrentUserProfile(String email);
    UserProfileResponse updateProfile(String email, UpdateProfileRequest request);
}

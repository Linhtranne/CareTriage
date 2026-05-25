package com.caretriage.application.service;

import com.caretriage.application.dto.request.UpdateProfileRequest;
import com.caretriage.application.dto.response.UserProfileResponse;

public interface UserService {
    UserProfileResponse getCurrentUserProfile(String email);
    UserProfileResponse updateProfile(String email, UpdateProfileRequest request);
}

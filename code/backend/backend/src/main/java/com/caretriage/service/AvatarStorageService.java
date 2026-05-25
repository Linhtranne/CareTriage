package com.caretriage.service;

import org.springframework.web.multipart.MultipartFile;

public interface AvatarStorageService {
    String uploadAvatar(Long userId, MultipartFile file);
    void deleteAvatar(String fileUrl);
}

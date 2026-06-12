package com.caretriage.application.service.impl;

import com.caretriage.application.service.AvatarStorageService;
import com.caretriage.application.service.FirebaseStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import com.caretriage.shared.exception.BusinessException;

@Service
@RequiredArgsConstructor
public class AvatarStorageServiceImpl implements AvatarStorageService {

    private final FirebaseStorageService firebaseStorageService;

    @Override
    public String uploadAvatar(Long userId, MultipartFile file) {
        try {
            if (file.isEmpty()) throw new BusinessException("File is empty");
            
            // Basic validation for avatars too
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new BusinessException("Only images allowed");
            }

            String originalName = file.getOriginalFilename();
            String extension = "jpg";
            if (originalName != null && originalName.contains(".")) {
                extension = originalName.substring(originalName.lastIndexOf(".") + 1).toLowerCase();
            }

            return firebaseStorageService.uploadFile("avatars", userId.toString(), file.getBytes(), contentType, extension);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read avatar bytes", e);
        }
    }

    @Override
    public void deleteAvatar(String fileUrl) {
        firebaseStorageService.deleteFile(fileUrl);
    }
}

package com.caretriage.service;

import org.springframework.web.multipart.MultipartFile;

public interface FirebaseStorageService {
    /**
     * Upload a file to Firebase Storage
     * @param folder Folder in the bucket (e.g., "avatars", "departments")
     * @param identifier Unique identifier
     * @param content Byte array of the file content
     * @param contentType MIME type of the file
     * @param extension File extension (e.g., "jpg", "png")
     * @return The public URL of the uploaded file
     */
    String uploadFile(String folder, String identifier, byte[] content, String contentType, String extension);

    /**
     * Delete a file from Firebase Storage
     * @param fileUrl The full public URL of the file
     */
    void deleteFile(String fileUrl);
}

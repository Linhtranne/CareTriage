package com.caretriage.service.impl;

import com.caretriage.service.FirebaseStorageService;
import com.google.cloud.storage.Blob;
import com.google.cloud.storage.Bucket;
import com.google.firebase.cloud.StorageClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@Slf4j
public class FirebaseStorageServiceImpl implements FirebaseStorageService {

    @Value("${app.firebase.bucket-name}")
    private String bucketName;

    @Override
    public String uploadFile(String folder, String identifier, byte[] content, String contentType, String extension) {
        try {
            String fileName = String.format("%s/%s/%s.%s", 
                folder, identifier, UUID.randomUUID().toString(), extension);
            
            Bucket bucket = StorageClient.getInstance().bucket(bucketName);
            
            Blob blob = bucket.create(fileName, content, contentType);
            
            return String.format("https://firebasestorage.googleapis.com/v0/b/%s/o/%s?alt=media", 
                bucketName, fileName.replace("/", "%2F"));
            
        } catch (Exception e) {
            log.error("Failed to upload file to Firebase folder: {}", folder, e);
            throw new RuntimeException("Could not upload file: " + e.getMessage());
        }
    }

    @Override
    public void deleteFile(String fileUrl) {
        if (fileUrl == null || fileUrl.isEmpty()) return;

        try {
            String prefix = String.format("https://firebasestorage.googleapis.com/v0/b/%s/o/", bucketName);
            if (fileUrl.startsWith(prefix)) {
                String path = fileUrl.substring(prefix.length(), fileUrl.indexOf("?alt=media"));
                path = path.replace("%2F", "/");
                
                Bucket bucket = StorageClient.getInstance().bucket(bucketName);
                Blob blob = bucket.get(path);
                if (blob != null) {
                    blob.delete();
                    log.info("Deleted file from Firebase: {}", path);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to delete file from Firebase: {}", fileUrl, e);
        }
    }
}

package com.caretriage.controller;

import com.caretriage.dto.response.ApiResponse;
import com.caretriage.service.LandingContentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class LandingContentController {

    private final LandingContentService service;

    @GetMapping("/public/landing-content")
    public ResponseEntity<ApiResponse<Map<String, String>>> getLandingContent(
            @RequestParam(defaultValue = "vi") String lang) {
        Map<String, String> content = service.getContentByLanguage(lang);
        return ResponseEntity.ok(ApiResponse.success("Content fetched successfully", content));
    }

    @PutMapping("/admin/landing-content")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> updateLandingContent(
            @RequestBody Map<String, String> request,
            @RequestParam(defaultValue = "vi") String lang) {
        
        request.forEach((fullKey, value) -> {
            String[] parts = fullKey.split("\\.");
            if (parts.length == 2) {
                service.updateContent(parts[0], parts[1], value, lang);
            }
        });
        
        return ResponseEntity.ok(ApiResponse.success("Content updated successfully", null));
    }
}

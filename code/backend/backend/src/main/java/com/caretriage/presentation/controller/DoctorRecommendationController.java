package com.caretriage.presentation.controller;

import com.caretriage.application.dto.request.DoctorRecommendationCriteria;
import com.caretriage.application.dto.response.DoctorRecommendationResult;
import com.caretriage.application.service.DoctorRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/recommendations")
@RequiredArgsConstructor
public class DoctorRecommendationController {

    private final DoctorRecommendationService doctorRecommendationService;

    @PostMapping("/doctors")
    @PreAuthorize("hasRole('PATIENT') or hasRole('DOCTOR') or hasRole('ADMIN')")
    public ResponseEntity<DoctorRecommendationResult> recommendDoctors(@RequestBody DoctorRecommendationCriteria criteria) {
        DoctorRecommendationResult result = doctorRecommendationService.recommendDoctors(criteria);
        return ResponseEntity.ok(result);
    }
}

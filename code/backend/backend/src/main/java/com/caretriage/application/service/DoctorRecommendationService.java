package com.caretriage.application.service;

import com.caretriage.application.dto.request.DoctorRecommendationCriteria;
import com.caretriage.application.dto.response.DoctorRecommendationResult;

public interface DoctorRecommendationService {
    DoctorRecommendationResult recommendDoctors(DoctorRecommendationCriteria criteria);
}

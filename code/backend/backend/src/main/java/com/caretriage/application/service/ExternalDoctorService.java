package com.caretriage.application.service;

import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorImportJob;
import com.caretriage.domain.entity.external.ExternalDoctorSource;

import java.util.List;

public interface ExternalDoctorService {
    
    /**
     * Trigger a sync job from an external source API.
     */
    ExternalDoctorImportJob triggerSync(Long sourceId);

    /**
     * Get all external doctors.
     */
    List<ExternalDoctor> getAllExternalDoctors();
    
    /**
     * Find doctors by specialization.
     */
    List<ExternalDoctor> findBySpecialization(String specialization);

    /**
     * Approve an external doctor to be bookable.
     */
    ExternalDoctor approveDoctor(Long doctorId);

    List<ExternalDoctor> bulkApproveDoctors(List<Long> doctorIds);

    List<ExternalDoctor> approveAllUnverifiedDoctors();

    /**
     * Get all external sources
     */
    List<ExternalDoctorSource> getAllSources();

    /**
     * Create a new External Doctor Source
     */
    ExternalDoctorSource createSource(ExternalDoctorSource source);

    /**
     * Get preview of doctors imported by a specific job
     */
    List<ExternalDoctor> getJobPreview(Long jobId);

    /**
     * Find nearby sources based on location
     */
    List<ExternalDoctorSource> findNearbySources(Double lat, Double lng, Double radiusKm);

    /**
     * Delete an external doctor by ID
     */
    void deleteExternalDoctor(Long id);

    /**
     * Delete all external doctors
     */
    void deleteAllExternalDoctors();
}


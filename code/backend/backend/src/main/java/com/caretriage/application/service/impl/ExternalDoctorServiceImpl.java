package com.caretriage.application.service.impl;

import com.caretriage.application.service.ExternalDoctorCrawlerService;
import com.caretriage.application.service.ExternalDoctorService;
import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorImportJob;
import com.caretriage.domain.entity.external.ExternalDoctorSource;
import com.caretriage.domain.repository.ExternalDoctorImportJobRepository;
import com.caretriage.domain.repository.ExternalDoctorRepository;
import com.caretriage.domain.repository.ExternalDoctorSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalDoctorServiceImpl implements ExternalDoctorService {

    private final ExternalDoctorRepository externalDoctorRepository;
    private final ExternalDoctorSourceRepository sourceRepository;
    private final ExternalDoctorImportJobRepository importJobRepository;
    private final ExternalDoctorCrawlerService crawlerService;

    @Override
    public ExternalDoctorImportJob triggerSync(Long sourceId) {
        ExternalDoctorSource source = sourceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source not found: " + sourceId));

        ExternalDoctorImportJob job = ExternalDoctorImportJob.builder()
                .source(source)
                .status(ExternalDoctorImportJob.ImportJobStatus.RUNNING)
                .doctorsImported(0)
                .doctorsUpdated(0)
                .doctorsFailed(0)
                .build();
        
        job = importJobRepository.save(job);

        // Use Crawler Logic
        try {
            log.info("Starting sync for source: {}", source.getSourceName());
            
            List<ExternalDoctor> parsedDoctors = crawlerService.crawlDoctors(source);
            
            for (ExternalDoctor extDoc : parsedDoctors) {
                ExternalDoctor existingDoc = externalDoctorRepository.findByExternalIdAndSourceId(extDoc.getExternalId(), source.getId());
                if (existingDoc == null) {
                    externalDoctorRepository.save(extDoc);
                    job.setDoctorsImported(job.getDoctorsImported() + 1);
                } else {
                    // Update specific fields
                    existingDoc.setFullName(extDoc.getFullName());
                    existingDoc.setSpecialization(extDoc.getSpecialization());
                    externalDoctorRepository.save(existingDoc);
                    job.setDoctorsUpdated(job.getDoctorsUpdated() + 1);
                }
            }
            
            source.setLastCrawledAt(LocalDateTime.now());
            sourceRepository.save(source);

            job.setStatus(ExternalDoctorImportJob.ImportJobStatus.SUCCESS);
        } catch (Exception e) {
            log.error("Failed to sync external doctors", e);
            job.setStatus(ExternalDoctorImportJob.ImportJobStatus.FAILED);
            job.setErrorLog(e.getClass().getSimpleName());
        } finally {
            job.setCompletedAt(LocalDateTime.now());
            importJobRepository.save(job);
        }

        return job;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExternalDoctor> getAllExternalDoctors() {
        return externalDoctorRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExternalDoctor> findBySpecialization(String specialization) {
        return externalDoctorRepository.findBySpecializationContainingIgnoreCase(specialization);
    }

    @Override
    @Transactional
    public ExternalDoctor approveDoctor(Long doctorId) {
        ExternalDoctor doctor = externalDoctorRepository.findById(doctorId)
                .orElseThrow(() -> new IllegalArgumentException("Doctor not found"));
        doctor.setVerificationStatus(ExternalDoctor.VerificationStatus.VERIFIED);
        doctor.setActive(true);
        return externalDoctorRepository.save(doctor);
    }

    @Override
    @Transactional
    public List<ExternalDoctor> bulkApproveDoctors(List<Long> doctorIds) {
        List<ExternalDoctor> doctors = externalDoctorRepository.findAllById(doctorIds);
        doctors.forEach(doctor -> {
            doctor.setVerificationStatus(ExternalDoctor.VerificationStatus.VERIFIED);
            doctor.setActive(true);
        });
        return externalDoctorRepository.saveAll(doctors);
    }

    @Override
    @Transactional
    public List<ExternalDoctor> approveAllUnverifiedDoctors() {
        List<ExternalDoctor> doctors = externalDoctorRepository.findAll()
            .stream()
            .filter(d -> d.getVerificationStatus() == ExternalDoctor.VerificationStatus.UNVERIFIED)
            .toList();
        doctors.forEach(doctor -> {
            doctor.setVerificationStatus(ExternalDoctor.VerificationStatus.VERIFIED);
            doctor.setActive(true);
        });
        return externalDoctorRepository.saveAll(doctors);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExternalDoctorSource> getAllSources() {
        return sourceRepository.findAll();
    }

    @Override
    @Transactional
    public ExternalDoctorSource createSource(ExternalDoctorSource source) {
        if (source.getIsActive() == null) {
            source.setIsActive(true);
        }
        return sourceRepository.save(source);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExternalDoctor> getJobPreview(Long jobId) {
        ExternalDoctorImportJob job = importJobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Import job not found"));
                
        // Return doctors created after the job started for this source
        return externalDoctorRepository.findBySourceIdAndCreatedAtAfter(
                job.getSource().getId(), job.getStartedAt());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExternalDoctorSource> findNearbySources(Double lat, Double lng, Double radiusKm) {
        List<ExternalDoctorSource> activeSources = sourceRepository.findByIsActiveTrue();
        
        if (lat == null || lng == null) {
            return activeSources;
        }

        return activeSources.stream()
                .filter(source -> {
                    if (source.getLatitude() == null || source.getLongitude() == null) {
                        return false; // Skip sources without location
                    }
                    double distance = calculateDistance(lat, lng, source.getLatitude(), source.getLongitude());
                    return distance <= radiusKm;
                })
                .toList();
    }

    /**
     * Calculate Haversine distance in km
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    @Override
    @Transactional
    public void deleteExternalDoctor(Long id) {
        externalDoctorRepository.deleteById(id);
    }

    @Override
    @Transactional
    public void deleteAllExternalDoctors() {
        externalDoctorRepository.deleteAll();
    }
}


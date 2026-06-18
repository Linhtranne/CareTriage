package com.caretriage.domain.repository;

import com.caretriage.domain.entity.external.ExternalDoctor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExternalDoctorRepository extends JpaRepository<ExternalDoctor, Long> {
    List<ExternalDoctor> findBySpecializationContainingIgnoreCase(String specialization);
    ExternalDoctor findByExternalIdAndSourceId(String externalId, Long sourceId);
    List<ExternalDoctor> findBySourceIdAndCreatedAtAfter(Long sourceId, java.time.LocalDateTime createdAt);
}

package com.caretriage.domain.repository;

import com.caretriage.domain.entity.DoctorProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface DoctorProfileRepository extends JpaRepository<DoctorProfile, Long>, JpaSpecificationExecutor<DoctorProfile> {
    Optional<DoctorProfile> findByUserId(Long userId);

    long countByDepartmentsId(Long departmentId);

    java.util.List<DoctorProfile> findBySpecializationContainingIgnoreCase(String specialization);
}

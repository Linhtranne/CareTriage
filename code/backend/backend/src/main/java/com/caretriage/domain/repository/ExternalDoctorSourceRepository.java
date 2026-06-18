package com.caretriage.domain.repository;

import com.caretriage.domain.entity.external.ExternalDoctorSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExternalDoctorSourceRepository extends JpaRepository<ExternalDoctorSource, Long> {
    List<ExternalDoctorSource> findByIsActiveTrue();
}

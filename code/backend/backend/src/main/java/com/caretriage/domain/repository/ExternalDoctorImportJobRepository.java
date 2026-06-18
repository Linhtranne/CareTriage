package com.caretriage.domain.repository;

import com.caretriage.domain.entity.external.ExternalDoctorImportJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ExternalDoctorImportJobRepository extends JpaRepository<ExternalDoctorImportJob, Long> {
}

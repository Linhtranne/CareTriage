package com.caretriage.repository;

import com.caretriage.entity.PatientMedication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientMedicationRepository extends JpaRepository<PatientMedication, Long> {

    List<PatientMedication> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<PatientMedication> findByPatientIdAndStatus(Long patientId, PatientMedication.MedicationStatus status);

    @Query("SELECT DISTINCT pm.patientId FROM PatientMedication pm WHERE LOWER(pm.medicationName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Long> findPatientIdsByMedicationName(@Param("name") String name);

    @Query("SELECT pm.medicationName, COUNT(pm) as cnt FROM PatientMedication pm GROUP BY pm.medicationName ORDER BY cnt DESC")
    List<Object[]> findTopMedications();
}

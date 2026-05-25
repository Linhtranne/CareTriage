package com.caretriage.repository;

import com.caretriage.entity.PatientSymptom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientSymptomRepository extends JpaRepository<PatientSymptom, Long> {

    List<PatientSymptom> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<PatientSymptom> findByPatientId(Long patientId);

    @Query("SELECT DISTINCT ps.patient.id FROM PatientSymptom ps WHERE LOWER(ps.symptomName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Long> findPatientIdsBySymptomName(@Param("name") String name);

    @Query("SELECT ps.symptomName, COUNT(ps) as cnt FROM PatientSymptom ps GROUP BY ps.symptomName ORDER BY cnt DESC")
    List<Object[]> findTopSymptoms();
}

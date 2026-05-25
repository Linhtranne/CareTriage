package com.caretriage.repository;

import com.caretriage.entity.PatientCondition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PatientConditionRepository extends JpaRepository<PatientCondition, Long> {

    List<PatientCondition> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<PatientCondition> findByPatientIdAndStatus(Long patientId, PatientCondition.ConditionStatus status);

    @Query("SELECT DISTINCT pc.patient.id FROM PatientCondition pc WHERE LOWER(pc.conditionName) LIKE LOWER(CONCAT('%', :name, '%'))")
    List<Long> findPatientIdsByConditionName(@Param("name") String name);

    @Query("SELECT pc.conditionName, COUNT(pc) as cnt FROM PatientCondition pc GROUP BY pc.conditionName ORDER BY cnt DESC")
    List<Object[]> findTopConditions();
}

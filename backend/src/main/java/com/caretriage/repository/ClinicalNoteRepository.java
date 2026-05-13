package com.caretriage.repository;

import com.caretriage.entity.ClinicalNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ClinicalNoteRepository extends JpaRepository<ClinicalNote, Long> {

    List<ClinicalNote> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<ClinicalNote> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    List<ClinicalNote> findByExtractionStatus(ClinicalNote.ExtractionStatus status);

    List<ClinicalNote> findByPatientIdAndExtractionStatus(Long patientId, ClinicalNote.ExtractionStatus status);

    List<ClinicalNote> findByPatientIdAndDoctorId(Long patientId, Long doctorId);

    @Query("SELECT cn FROM ClinicalNote cn WHERE cn.patient.id = :patientId AND cn.noteType = :noteType ORDER BY cn.createdAt DESC")
    List<ClinicalNote> findByPatientIdAndNoteType(@Param("patientId") Long patientId, @Param("noteType") ClinicalNote.NoteType noteType);

    @Query("SELECT COUNT(cn) FROM ClinicalNote cn WHERE cn.patient.id = :patientId")
    long countByPatientId(@Param("patientId") Long patientId);

    long countByExtractionStatus(ClinicalNote.ExtractionStatus status);
}

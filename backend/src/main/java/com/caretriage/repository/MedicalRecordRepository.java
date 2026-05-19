package com.caretriage.repository;

import com.caretriage.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    List<MedicalRecord> findByDoctorIdOrderByCreatedAtDesc(Long doctorId);

    Optional<MedicalRecord> findByAppointmentId(Long appointmentId);

    @Query("SELECT COUNT(m) FROM MedicalRecord m WHERE m.doctor.id = :doctorId AND m.patient.id = :patientId")
    long countByDoctorIdAndPatientId(@Param("doctorId") Long doctorId, @Param("patientId") Long patientId);

    @Query("SELECT m FROM MedicalRecord m WHERE m.doctor.id = :doctorId AND m.patient.id = :patientId ORDER BY m.createdAt DESC")
    List<MedicalRecord> findByDoctorIdAndPatientIdOrderByCreatedAtDesc(@Param("doctorId") Long doctorId, @Param("patientId") Long patientId);
}

package com.caretriage.repository;

import com.caretriage.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(Long patientId);

    List<Appointment> findByDoctorIdOrderByAppointmentDateDesc(Long doctorId);

    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);

    List<Appointment> findByPatientIdAndStatus(Long patientId, Appointment.AppointmentStatus status);

    List<Appointment> findByDoctorIdAndStatus(Long doctorId, Appointment.AppointmentStatus status);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND a.status NOT IN ('CANCELLED', 'NO_SHOW') " +
           "AND ((a.appointmentTime <= :endTime AND a.endTime >= :startTime))")
    List<Appointment> findConflictingAppointments(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime
    );

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.status = :status")
    long countByDoctorIdAndStatus(@Param("doctorId") Long doctorId, @Param("status") Appointment.AppointmentStatus status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.patient.id = :patientId AND a.status = :status")
    long countByPatientIdAndStatus(@Param("patientId") Long patientId, @Param("status") Appointment.AppointmentStatus status);
}

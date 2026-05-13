package com.caretriage.repository;

import com.caretriage.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByPatientIdOrderByAppointmentDateDesc(Long patientId);

    List<Appointment> findByDoctorIdOrderByAppointmentDateDesc(Long doctorId);

    List<Appointment> findByDoctorIdAndAppointmentDate(Long doctorId, LocalDate date);

    List<Appointment> findByPatientIdAndStatus(Long patientId, Appointment.AppointmentStatus status);

    List<Appointment> findByDoctorIdAndStatus(Long doctorId, Appointment.AppointmentStatus status);

    List<Appointment> findByPatientIdAndAppointmentDate(Long patientId, LocalDate appointmentDate);

    boolean existsByTriageTicketId(UUID triageTicketId);

    java.util.Optional<Appointment> findByTriageTicketId(UUID triageTicketId);

    @Query("SELECT a FROM Appointment a WHERE a.doctor.id = :doctorId " +
           "AND a.appointmentDate = :date " +
           "AND a.status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS') " +
           "AND (:excludeId IS NULL OR a.id != :excludeId) " +
           "AND (:startTime < a.endTime AND :endTime > a.appointmentTime)")
    List<Appointment> findConflictingAppointments(
            @Param("doctorId") Long doctorId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("excludeId") Long excludeId
    );

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.doctor.id = :doctorId AND a.status = :status")
    long countByDoctorIdAndStatus(@Param("doctorId") Long doctorId, @Param("status") Appointment.AppointmentStatus status);

    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.patient.id = :patientId AND a.status = :status")
    long countByPatientIdAndStatus(@Param("patientId") Long patientId, @Param("status") Appointment.AppointmentStatus status);

    @Query("SELECT a.status, COUNT(a) FROM Appointment a GROUP BY a.status")
    List<Object[]> countAppointmentsByStatus();

    @Query("SELECT a.status, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :startDate AND :endDate " +
           "GROUP BY a.status")
    List<Object[]> countAppointmentsByStatusBetween(@Param("startDate") LocalDate startDate,
                                                    @Param("endDate") LocalDate endDate);

    @Query("SELECT a.appointmentDate, COUNT(a) FROM Appointment a " +
           "WHERE a.appointmentDate BETWEEN :startDate AND :endDate " +
           "GROUP BY a.appointmentDate ORDER BY a.appointmentDate ASC")
    List<Object[]> countAppointmentsByDateBetween(@Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate);
}

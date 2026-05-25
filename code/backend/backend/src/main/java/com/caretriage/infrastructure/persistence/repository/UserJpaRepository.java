package com.caretriage.infrastructure.persistence.repository;

import com.caretriage.infrastructure.persistence.entity.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface UserJpaRepository extends JpaRepository<UserJpaEntity, Long>, JpaSpecificationExecutor<UserJpaEntity> {
    Optional<UserJpaEntity> findByEmail(String email);
    Optional<UserJpaEntity> findByUsername(String username);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByPhone(String phone);
    long countByRolesName(String roleName);
    long countByIsActive(boolean isActive);

    @Query("SELECT u FROM UserJpaEntity u WHERE " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<UserJpaEntity> searchUsers(@Param("keyword") String keyword, Pageable pageable);

    Page<UserJpaEntity> findByRolesName(String roleName, Pageable pageable);

    Page<UserJpaEntity> findByIsActive(Boolean isActive, Pageable pageable);

    @Query(value = "SELECT u.id " +
           "FROM users u " +
           "LEFT JOIN patient_profiles p ON p.user_id = u.id " +
           "LEFT JOIN appointments a ON a.patient_id = u.id AND a.doctor_id = :doctorId AND a.status != 'CANCELLED' " +
           "LEFT JOIN medical_records m ON m.patient_id = u.id AND m.doctor_id = :doctorId " +
           "LEFT JOIN triage_tickets t ON t.requester_id = u.id AND t.triage_officer_id = :doctorId " +
           "LEFT JOIN appointments future_a ON future_a.patient_id = u.id AND future_a.doctor_id = :doctorId " +
           "    AND future_a.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS') " +
           "    AND future_a.appointment_date >= :today " +
           "WHERE (a.id IS NOT NULL OR m.id IS NOT NULL OR t.id IS NOT NULL) " +
           "AND (:search IS NULL OR :search = '' OR " +
           "     LOWER(u.full_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "     LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "AND (:relationshipSource IS NULL OR :relationshipSource = '' OR " +
           "     (:relationshipSource = 'APPOINTMENT' AND a.id IS NOT NULL) OR " +
           "     (:relationshipSource = 'MEDICAL_RECORD' AND m.id IS NOT NULL) OR " +
           "     (:relationshipSource = 'TRIAGE_TICKET' AND t.id IS NOT NULL)) " +
           "AND (:ticketStatus IS NULL OR :ticketStatus = '' OR (t.id IS NOT NULL AND t.status = :ticketStatus)) " +
           "AND (:hasUpcomingAppointment = false OR future_a.id IS NOT NULL) " +
           "AND (:hasMedicalRecord = false OR m.id IS NOT NULL) " +
           "GROUP BY u.id, u.full_name " +
           "ORDER BY " +
           "    GREATEST( " +
           "        COALESCE(MAX(a.updated_at), '1970-01-01 00:00:00'), " +
           "        COALESCE(MAX(m.created_at), '1970-01-01 00:00:00'), " +
           "        COALESCE(MAX(t.updated_at), '1970-01-01 00:00:00') " +
           "    ) DESC, " +
           "    u.full_name ASC",
           countQuery = "SELECT COUNT(DISTINCT u.id) " +
                        "FROM users u " +
                        "LEFT JOIN patient_profiles p ON p.user_id = u.id " +
                        "LEFT JOIN appointments a ON a.patient_id = u.id AND a.doctor_id = :doctorId AND a.status != 'CANCELLED' " +
                        "LEFT JOIN medical_records m ON m.patient_id = u.id AND m.doctor_id = :doctorId " +
                        "LEFT JOIN triage_tickets t ON t.requester_id = u.id AND t.triage_officer_id = :doctorId " +
                        "LEFT JOIN appointments future_a ON future_a.patient_id = u.id AND future_a.doctor_id = :doctorId " +
                        "    AND future_a.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS') " +
                        "    AND future_a.appointment_date >= :today " +
                        "WHERE (a.id IS NOT NULL OR m.id IS NOT NULL OR t.id IS NOT NULL) " +
                        "AND (:search IS NULL OR :search = '' OR " +
                        "     LOWER(u.full_name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
                        "     LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
                        "     LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%'))) " +
                        "AND (:relationshipSource IS NULL OR :relationshipSource = '' OR " +
                        "     (:relationshipSource = 'APPOINTMENT' AND a.id IS NOT NULL) OR " +
                        "     (:relationshipSource = 'MEDICAL_RECORD' AND m.id IS NOT NULL) OR " +
                        "     (:relationshipSource = 'TRIAGE_TICKET' AND t.id IS NOT NULL)) " +
                        "AND (:ticketStatus IS NULL OR :ticketStatus = '' OR (t.id IS NOT NULL AND t.status = :ticketStatus)) " +
                        "AND (:hasUpcomingAppointment = false OR future_a.id IS NOT NULL) " +
                        "AND (:hasMedicalRecord = false OR m.id IS NOT NULL)",
           nativeQuery = true)
    Page<Long> findPatientIdsByDoctorRelation(
            @Param("doctorId") Long doctorId,
            @Param("search") String search,
            @Param("relationshipSource") String relationshipSource,
            @Param("ticketStatus") String ticketStatus,
            @Param("hasUpcomingAppointment") Boolean hasUpcomingAppointment,
            @Param("hasMedicalRecord") Boolean hasMedicalRecord,
            @Param("today") java.time.LocalDate today,
            Pageable pageable);
}


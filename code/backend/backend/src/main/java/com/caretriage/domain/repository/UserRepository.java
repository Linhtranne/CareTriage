package com.caretriage.domain.repository;

import com.caretriage.domain.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

public interface UserRepository {
    Optional<User> findById(Long id);
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Boolean existsByUsername(String username);
    Boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    User save(User user);
    void delete(User user);
    List<User> findAll();
    Page<User> findAll(Pageable pageable);
    long count();
    Page<User> findAll(Specification<com.caretriage.infrastructure.persistence.entity.UserJpaEntity> spec, Pageable pageable);
    
    long countByRolesName(String roleName);
    long countByIsActive(boolean isActive);

    Page<User> searchUsers(String keyword, Pageable pageable);
    Page<User> findByRolesName(String roleName, Pageable pageable);
    Page<User> findByIsActive(Boolean isActive, Pageable pageable);

    @SuppressWarnings("java:S107")
    Page<Long> findPatientIdsByDoctorRelation(
            Long doctorId,
            String search,
            String relationshipSource,
            String ticketStatus,
            Boolean hasUpcomingAppointment,
            Boolean hasMedicalRecord,
            LocalDate today,
            Pageable pageable);
}

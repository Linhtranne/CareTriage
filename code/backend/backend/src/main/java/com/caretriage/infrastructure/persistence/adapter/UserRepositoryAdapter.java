package com.caretriage.infrastructure.persistence.adapter;

import com.caretriage.domain.entity.User;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import com.caretriage.infrastructure.persistence.mapper.UserMapper;
import com.caretriage.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class UserRepositoryAdapter implements UserRepository {
    
    private final UserJpaRepository jpaRepository;
    private final UserMapper mapper;

    @Override
    public Optional<User> findById(Long id) {
        return jpaRepository.findById(id).map(mapper::toDomain);
    }

    @Override
    public Optional<User> findByUsername(String username) {
        return jpaRepository.findByUsername(username).map(mapper::toDomain);
    }

    @Override
    public Optional<User> findByEmail(String email) {
        return jpaRepository.findByEmail(email).map(mapper::toDomain);
    }

    @Override
    public Boolean existsByUsername(String username) {
        return jpaRepository.existsByUsername(username);
    }

    @Override
    public Boolean existsByEmail(String email) {
        return jpaRepository.existsByEmail(email);
    }

    @Override
    public boolean existsByPhone(String phone) {
        return jpaRepository.existsByPhone(phone);
    }

    @Override
    public User save(User user) {
        UserJpaEntity entity = mapper.toEntity(user);
        return mapper.toDomain(jpaRepository.save(entity));
    }

    @Override
    public void delete(User user) {
        jpaRepository.delete(mapper.toEntity(user));
    }

    @Override
    public List<User> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).collect(Collectors.toList());
    }

    @Override
    public Page<User> findAll(Pageable pageable) {
        return jpaRepository.findAll(pageable).map(mapper::toDomain);
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }

    @Override
    public Page<User> findAll(Specification<UserJpaEntity> spec, Pageable pageable) {
        return jpaRepository.findAll(spec, pageable).map(mapper::toDomain);
    }

    @Override
    public long countByRolesName(String roleName) {
        return jpaRepository.countByRolesName(roleName);
    }

    @Override
    public long countByIsActive(boolean isActive) {
        return jpaRepository.countByIsActive(isActive);
    }

    @Override
    public Page<User> searchUsers(String keyword, Pageable pageable) {
        return jpaRepository.searchUsers(keyword, pageable).map(mapper::toDomain);
    }

    @Override
    public Page<User> findByRolesName(String roleName, Pageable pageable) {
        return jpaRepository.findByRolesName(roleName, pageable).map(mapper::toDomain);
    }

    @Override
    public Page<User> findByIsActive(Boolean isActive, Pageable pageable) {
        return jpaRepository.findByIsActive(isActive, pageable).map(mapper::toDomain);
    }

    @Override
    public Page<Long> findPatientIdsByDoctorRelation(
            Long doctorId, String search, String relationshipSource, 
            String ticketStatus, Boolean hasUpcomingAppointment, 
            Boolean hasMedicalRecord, LocalDate today, Pageable pageable) {
        return jpaRepository.findPatientIdsByDoctorRelation(doctorId, search, relationshipSource, 
                ticketStatus, hasUpcomingAppointment, hasMedicalRecord, today, pageable);
    }
}

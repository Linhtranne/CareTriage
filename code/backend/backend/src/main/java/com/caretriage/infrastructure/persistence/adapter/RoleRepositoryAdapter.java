package com.caretriage.infrastructure.persistence.adapter;

import com.caretriage.domain.entity.Role;
import com.caretriage.domain.repository.RoleRepository;
import com.caretriage.infrastructure.persistence.entity.RoleJpaEntity;
import com.caretriage.infrastructure.persistence.mapper.RoleMapper;
import com.caretriage.infrastructure.persistence.repository.RoleJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
@RequiredArgsConstructor
public class RoleRepositoryAdapter implements RoleRepository {
    
    private final RoleJpaRepository jpaRepository;
    private final RoleMapper mapper;

    @Override
    public Optional<Role> findByName(String name) {
        return jpaRepository.findByName(name).map(mapper::toDomain);
    }

    @Override
    public Role save(Role role) {
        RoleJpaEntity entity = mapper.toEntity(role);
        return mapper.toDomain(jpaRepository.save(entity));
    }

    @Override
    public List<Role> findAll() {
        return jpaRepository.findAll().stream().map(mapper::toDomain).collect(Collectors.toList());
    }
}

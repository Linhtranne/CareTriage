package com.caretriage.infrastructure.persistence.mapper;

import com.caretriage.domain.entity.Role;
import com.caretriage.infrastructure.persistence.entity.RoleJpaEntity;
import org.springframework.stereotype.Component;

@Component
public class RoleMapper {
    public static final RoleMapper INSTANCE = new RoleMapper();

    public Role toDomain(RoleJpaEntity entity) {
        if (entity == null) {
            return null;
        }

        return Role.builder()
                .id(entity.getId())
                .name(entity.getName())
                .description(entity.getDescription())
                .deleted(entity.getDeleted())
                .build();
    }

    public RoleJpaEntity toEntity(Role domain) {
        if (domain == null) {
            return null;
        }

        return RoleJpaEntity.builder()
                .id(domain.getId())
                .name(domain.getName())
                .description(domain.getDescription())
                .deleted(domain.getDeleted())
                .build();
    }
}

package com.caretriage.domain.repository;

import com.caretriage.domain.entity.Role;
import java.util.Optional;
import java.util.List;

public interface RoleRepository {
    Optional<Role> findByName(String name);
    Role save(Role role);
    List<Role> findAll();
}

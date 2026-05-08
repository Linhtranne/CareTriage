package com.caretriage.repository;

import com.caretriage.entity.Department;
import com.caretriage.entity.DepartmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DepartmentRepository extends JpaRepository<Department, Long>, JpaSpecificationExecutor<Department> {

    Optional<Department> findByCode(String code);

    Optional<Department> findByName(String name);

    Optional<Department> findBySlug(String slug);

    List<Department> findByNameContainingIgnoreCase(String name);

    List<Department> findAllByStatus(DepartmentStatus status);

    boolean existsByCode(String code);

    boolean existsByName(String name);

    boolean existsBySlug(String slug);
}

package com.caretriage.service.impl;

import com.caretriage.dto.request.DepartmentRequest;
import com.caretriage.dto.response.DepartmentResponse;
import com.caretriage.dto.response.PagedResponse;
import com.caretriage.entity.Department;
import com.caretriage.entity.DepartmentStatus;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.DepartmentRepository;
import com.caretriage.repository.DoctorProfileRepository;
import com.caretriage.service.DepartmentService;
import com.caretriage.util.StringUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    @Override
    public PagedResponse<DepartmentResponse> getAllDepartments(String search, Pageable pageable) {
        Page<Department> departments;
        if (search != null && !search.trim().isEmpty()) {
            // Simplification: Using search in name for now
            // In a real app, you might want more complex search
            departments = departmentRepository.findAll((root, query, cb) -> 
                cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%"), pageable);
        } else {
            departments = departmentRepository.findAll(pageable);
        }

        List<DepartmentResponse> content = departments.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return PagedResponse.<DepartmentResponse>builder()
                .content(content)
                .page(departments.getNumber())
                .size(departments.getSize())
                .totalElements(departments.getTotalElements())
                .totalPages(departments.getTotalPages())
                .last(departments.isLast())
                .build();
    }

    @Override
    public DepartmentResponse getDepartmentById(Long id) {
        return departmentRepository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));
    }

    @Override
    public DepartmentResponse getDepartmentBySlug(String slug) {
        return departmentRepository.findBySlug(slug)
                .map(this::mapToResponse)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with slug: " + slug));
    }

    @Override
    @Transactional
    public DepartmentResponse createDepartment(DepartmentRequest request) {
        if (departmentRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Mã chuyên khoa đã tồn tại: " + request.getCode());
        }
        if (departmentRepository.existsByName(request.getName())) {
            throw new RuntimeException("Tên chuyên khoa đã tồn tại: " + request.getName());
        }

        String slug = StringUtils.slugify(request.getName());
        if (departmentRepository.existsBySlug(slug)) {
            // If slug exists, append a random suffix or handle it
            slug = slug + "-" + System.currentTimeMillis() % 1000;
        }

        Department department = Department.builder()
                .code(request.getCode())
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .status(request.getStatus() != null ? request.getStatus() : DepartmentStatus.ACTIVE)
                .build();

        return mapToResponse(departmentRepository.save(department));
    }

    @Override
    @Transactional
    public DepartmentResponse updateDepartment(Long id, DepartmentRequest request) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        if (!department.getCode().equals(request.getCode()) && departmentRepository.existsByCode(request.getCode())) {
            throw new RuntimeException("Mã chuyên khoa đã tồn tại: " + request.getCode());
        }

        if (!department.getName().equals(request.getName())) {
            if (departmentRepository.existsByName(request.getName())) {
                throw new RuntimeException("Tên chuyên khoa đã tồn tại: " + request.getName());
            }
            department.setName(request.getName());
            department.setSlug(StringUtils.slugify(request.getName()));
        }

        department.setCode(request.getCode());
        department.setDescription(request.getDescription());
        department.setImageUrl(request.getImageUrl());
        if (request.getStatus() != null) {
            department.setStatus(request.getStatus());
        }

        return mapToResponse(departmentRepository.save(department));
    }

    @Override
    @Transactional
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + id));

        long doctorCount = doctorProfileRepository.countByDepartmentsId(id);
        if (doctorCount > 0) {
            throw new RuntimeException("Không thể xóa chuyên khoa này vì vẫn còn " + doctorCount + " bác sĩ đang trực thuộc.");
        }

        departmentRepository.delete(department);
    }

    private DepartmentResponse mapToResponse(Department department) {
        return DepartmentResponse.builder()
                .id(department.getId())
                .code(department.getCode())
                .name(department.getName())
                .slug(department.getSlug())
                .description(department.getDescription())
                .imageUrl(department.getImageUrl())
                .status(department.getStatus())
                .createdAt(department.getCreatedAt())
                .updatedAt(department.getUpdatedAt())
                .build();
    }
}

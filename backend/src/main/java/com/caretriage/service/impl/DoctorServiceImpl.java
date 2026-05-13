package com.caretriage.service.impl;

import com.caretriage.dto.request.DoctorDepartmentRequest;
import com.caretriage.dto.response.DepartmentResponse;
import com.caretriage.dto.response.DoctorResponse;
import com.caretriage.dto.response.PagedResponse;
import com.caretriage.entity.Department;
import com.caretriage.entity.DoctorProfile;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.DepartmentRepository;
import com.caretriage.repository.DoctorProfileRepository;
import com.caretriage.service.DoctorService;
import jakarta.persistence.criteria.Join;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorProfileRepository doctorProfileRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public void assignDepartments(Long doctorId, DoctorDepartmentRequest request) {
        DoctorProfile doctorProfile = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found with id: " + doctorId));

        Set<Department> departments = new HashSet<>();
        for (Long deptId : request.getDepartmentIds()) {
            Department dept = departmentRepository.findById(deptId)
                    .orElseThrow(() -> new ResourceNotFoundException("Department not found with id: " + deptId));
            departments.add(dept);
        }

        doctorProfile.setDepartments(departments);
        doctorProfileRepository.save(doctorProfile);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DepartmentResponse> getDoctorDepartments(Long doctorId) {
        DoctorProfile doctorProfile = doctorProfileRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor profile not found with id: " + doctorId));

        return doctorProfile.getDepartments().stream()
                .map(this::mapToDepartmentResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PagedResponse<DoctorResponse> getPublicDoctors(Long departmentId, String search, int page, int size) {
        Specification<DoctorProfile> spec = Specification.where(null);

        if (departmentId != null) {
            spec = spec.and((root, query, cb) -> {
                Join<DoctorProfile, Department> departments = root.join("departments");
                return cb.equal(departments.get("id"), departmentId);
            });
        }

        if (search != null && !search.isEmpty()) {
            spec = spec.and((root, query, cb) -> 
                cb.like(cb.lower(root.get("user").get("fullName")), "%" + search.toLowerCase() + "%")
            );
        }

        Page<DoctorProfile> doctorPage = doctorProfileRepository.findAll(spec, PageRequest.of(page, size));

        List<DoctorResponse> content = doctorPage.getContent().stream()
                .map(this::mapToDoctorResponse)
                .collect(Collectors.toList());

        return PagedResponse.<DoctorResponse>builder()
                .content(content)
                .page(doctorPage.getNumber())
                .size(doctorPage.getSize())
                .totalElements(doctorPage.getTotalElements())
                .totalPages(doctorPage.getTotalPages())
                .last(doctorPage.isLast())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public DoctorResponse getDoctorById(Long id) {
        DoctorProfile doctor = doctorProfileRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + id));
        return mapToDoctorResponse(doctor);
    }

    private DepartmentResponse mapToDepartmentResponse(Department dept) {
        return DepartmentResponse.builder()
                .id(dept.getId())
                .code(dept.getCode())
                .name(dept.getName())
                .slug(dept.getSlug())
                .description(dept.getDescription())
                .imageUrl(dept.getImageUrl())
                .status(dept.getStatus())
                .build();
    }

    private DoctorResponse mapToDoctorResponse(DoctorProfile d) {
        return DoctorResponse.builder()
                .id(d.getUser().getId())
                .fullName(d.getUser().getFullName())
                .email(d.getUser().getEmail())
                .phone(d.getUser().getPhone())
                .avatarUrl(d.getUser().getAvatarUrl())
                .bio(d.getBio())
                .specialization(d.getSpecialization())
                .experienceYears(d.getExperienceYears())
                .hospitalName(d.getHospitalName())
                .departments(d.getDepartments().stream()
                        .map(this::mapToDepartmentResponse)
                        .collect(Collectors.toList()))
                .build();
    }
}

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
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DoctorProfileRepository doctorProfileRepository;
    private final com.caretriage.service.FirebaseStorageService firebaseStorageService;

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

        // Clean up image from Firebase
        if (department.getImageUrl() != null) {
            firebaseStorageService.deleteFile(department.getImageUrl());
        }

        departmentRepository.delete(department);
    }

    @Override
    public String uploadImage(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("Vui lòng chọn file để upload");
        }

        if (file.getSize() > 5 * 1024 * 1024) { // 5MB
            throw new RuntimeException("Dung lượng ảnh tối đa là 5MB");
        }

        try {
            // 1. Verify Magic Bytes / Parse with ImageIO
            BufferedImage originalImage = ImageIO.read(file.getInputStream());
            if (originalImage == null) {
                throw new RuntimeException("File không phải là định dạng ảnh hợp lệ (hoặc bị lỗi)");
            }

            // 2. Limit Dimensions (Prevent Image Bombs)
            int maxWidth = 4096;
            int maxHeight = 4096;
            if (originalImage.getWidth() > maxWidth || originalImage.getHeight() > maxHeight) {
                throw new RuntimeException("Kích thước ảnh quá lớn (tối đa 4096x4096px)");
            }

            // 3. Re-encode image (Strip malicious payloads/metadata)
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            String targetExtension = "png";
            String targetContentType = "image/png";
            
            // Re-drawing into a new BufferedImage also helps strip extra metadata/hidden blocks
            BufferedImage sanitizedImage = new BufferedImage(
                    originalImage.getWidth(), originalImage.getHeight(), BufferedImage.TYPE_INT_ARGB);
            Graphics2D g2d = sanitizedImage.createGraphics();
            g2d.drawImage(originalImage, 0, 0, null);
            g2d.dispose();

            ImageIO.write(sanitizedImage, targetExtension, baos);
            byte[] sanitizedBytes = baos.toByteArray();

            // 4. Random filename without original name
            String identifier = "dept-" + System.currentTimeMillis();
            
            return firebaseStorageService.uploadFile("departments", identifier, sanitizedBytes, targetContentType, targetExtension);

        } catch (IOException e) {
            throw new RuntimeException("Lỗi xử lý hình ảnh: " + e.getMessage());
        }
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

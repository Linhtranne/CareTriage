package com.caretriage.service;

import com.caretriage.dto.request.DepartmentRequest;
import com.caretriage.dto.response.DepartmentResponse;
import com.caretriage.dto.response.PagedResponse;
import org.springframework.data.domain.Pageable;

public interface DepartmentService {
    PagedResponse<DepartmentResponse> getAllDepartments(String search, Pageable pageable);
    
    DepartmentResponse getDepartmentById(Long id);
    
    DepartmentResponse getDepartmentBySlug(String slug);
    
    DepartmentResponse createDepartment(DepartmentRequest request);
    
    DepartmentResponse updateDepartment(Long id, DepartmentRequest request);
    
    void deleteDepartment(Long id);

    String uploadImage(org.springframework.web.multipart.MultipartFile file);
}

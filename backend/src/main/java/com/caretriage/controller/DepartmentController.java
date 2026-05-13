package com.caretriage.controller;

import com.caretriage.dto.request.DepartmentRequest;
import com.caretriage.dto.response.ApiResponse;
import com.caretriage.dto.response.DepartmentResponse;
import com.caretriage.dto.response.PagedResponse;
import com.caretriage.service.DepartmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/departments")
@RequiredArgsConstructor
@Tag(name = "Department Management", description = "Endpoints for managing hospital departments")
public class DepartmentController {

    private final DepartmentService departmentService;

    @GetMapping
    @Operation(summary = "Get all departments (paginated, searchable)")
    public ResponseEntity<ApiResponse<PagedResponse<DepartmentResponse>>> getAllDepartments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String search) {
        
        Sort sort = direction.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PagedResponse<DepartmentResponse> departments = departmentService.getAllDepartments(search, pageable);
        return ResponseEntity.ok(ApiResponse.success("Departments retrieved successfully", departments));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get department by ID")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getDepartmentById(@PathVariable Long id) {
        DepartmentResponse department = departmentService.getDepartmentById(id);
        return ResponseEntity.ok(ApiResponse.success("Department retrieved successfully", department));
    }

    @GetMapping("/slug/{slug}")
    @Operation(summary = "Get department by slug")
    public ResponseEntity<ApiResponse<DepartmentResponse>> getDepartmentBySlug(@PathVariable String slug) {
        DepartmentResponse department = departmentService.getDepartmentBySlug(slug);
        return ResponseEntity.ok(ApiResponse.success("Department retrieved successfully", department));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create new department (Admin only)")
    public ResponseEntity<ApiResponse<DepartmentResponse>> createDepartment(
            @Valid @RequestBody DepartmentRequest request) {
        DepartmentResponse department = departmentService.createDepartment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Department created successfully", department));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update department (Admin only)")
    public ResponseEntity<ApiResponse<DepartmentResponse>> updateDepartment(
            @PathVariable Long id,
            @Valid @RequestBody DepartmentRequest request) {
        DepartmentResponse department = departmentService.updateDepartment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Department updated successfully", department));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete department (Admin only)")
    public ResponseEntity<ApiResponse<Void>> deleteDepartment(@PathVariable Long id) {
        departmentService.deleteDepartment(id);
        return ResponseEntity.ok(ApiResponse.success("Department deleted successfully", null));
    }
}

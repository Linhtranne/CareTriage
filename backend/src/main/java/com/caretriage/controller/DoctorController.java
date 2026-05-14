package com.caretriage.controller;

import com.caretriage.dto.response.ApiResponse;
import com.caretriage.dto.request.DoctorDepartmentRequest;
import com.caretriage.dto.response.DepartmentResponse;
import com.caretriage.dto.response.DoctorPublicResponse;
import com.caretriage.dto.response.DoctorResponse;
import com.caretriage.dto.response.PagedResponse;
import com.caretriage.dto.response.TimeSlotResponse;
import com.caretriage.service.DoctorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/doctors")
@RequiredArgsConstructor
@Tag(name = "Doctor Management", description = "APIs for doctor management and specialty assignment")
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    @Operation(summary = "Lấy danh sách bác sĩ công khai", description = "Danh sách bác sĩ có hỗ trợ phân trang và lọc theo chuyên khoa")
    public ResponseEntity<ApiResponse<PagedResponse<DoctorPublicResponse>>> getPublicDoctors(
            @RequestParam(required = false) Long departmentId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        PagedResponse<DoctorPublicResponse> response = doctorService.getPublicDoctors(departmentId, search, page, size);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách bác sĩ thành công", response));
    }

    @PutMapping("/{id}/departments")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Gán chuyên khoa cho bác sĩ", description = "Cập nhật danh sách chuyên khoa mà bác sĩ đảm nhiệm (chỉ Admin)")
    public ResponseEntity<ApiResponse<Void>> assignDepartments(
            @PathVariable Long id,
            @Valid @RequestBody DoctorDepartmentRequest request) {
        doctorService.assignDepartments(id, request);
        return ResponseEntity.ok(ApiResponse.success("Gán chuyên khoa thành công", null));
    }

    @GetMapping("/{id}/departments")
    @Operation(summary = "Lấy danh sách chuyên khoa của bác sĩ", description = "Trả về danh sách các chuyên khoa mà bác sĩ đang trực thuộc")
    public ResponseEntity<ApiResponse<List<DepartmentResponse>>> getDoctorDepartments(@PathVariable Long id) {
        List<DepartmentResponse> departments = doctorService.getDoctorDepartments(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chuyên khoa thành công", departments));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết bác sĩ", description = "Trả về thông tin chi tiết của một bác sĩ cụ thể")
    public ResponseEntity<ApiResponse<DoctorPublicResponse>> getDoctorById(@PathVariable Long id) {
        DoctorPublicResponse response = doctorService.getDoctorById(id);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết bác sĩ thành công", response));
    }

    @GetMapping("/{id}/slots")
    @Operation(summary = "Lấy khung giờ trống của bác sĩ", description = "Trả về danh sách khung giờ trống của bác sĩ theo ngày (Công khai)")
    public ResponseEntity<ApiResponse<List<TimeSlotResponse>>> getDoctorSlots(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<TimeSlotResponse> slots = doctorService.getAvailableSlots(id, date);
        return ResponseEntity.ok(ApiResponse.success("Lấy khung giờ trống thành công", slots));
    }
}

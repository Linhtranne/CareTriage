package com.caretriage.controller;

import com.caretriage.dto.request.MedicalRecordRequest;
import com.caretriage.dto.response.ApiResponse;
import com.caretriage.dto.response.MedicalRecordResponse;
import com.caretriage.service.MedicalRecordService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/medical-records")
@RequiredArgsConstructor
@Tag(name = "Medical Records", description = "API quản lý hồ sơ bệnh án")
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    @PostMapping
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    @Operation(summary = "Tạo hồ sơ bệnh án mới", description = "Chỉ bác sĩ hoặc admin có quyền tạo")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> createRecord(
            @Valid @RequestBody MedicalRecordRequest request,
            Authentication authentication) {
        MedicalRecordResponse response = medicalRecordService.createRecord(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo hồ sơ bệnh án thành công", response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Lấy chi tiết hồ sơ bệnh án")
    public ResponseEntity<ApiResponse<MedicalRecordResponse>> getRecordById(
            @PathVariable Long id,
            Authentication authentication) {
        MedicalRecordResponse response = medicalRecordService.getRecordById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin hồ sơ thành công", response));
    }

    @GetMapping("/patient/{patientId}")
    @Operation(summary = "Lấy lịch sử khám của bệnh nhân", description = "Bệnh nhân chỉ xem được lịch sử của chính mình")
    public ResponseEntity<ApiResponse<List<MedicalRecordResponse>>> getPatientHistory(
            @PathVariable Long patientId,
            Authentication authentication) {
        List<MedicalRecordResponse> history = medicalRecordService.getPatientHistory(patientId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử khám thành công", history));
    }
}

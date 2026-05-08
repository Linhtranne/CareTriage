package com.caretriage.controller;

import com.caretriage.dto.response.ApiResponse;
import com.caretriage.dto.response.AppointmentResponse;
import com.caretriage.service.ExaminationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/examination")
@RequiredArgsConstructor
@Tag(name = "Examination Management", description = "APIs for managing the examination process")
public class ExaminationController {

    private final ExaminationService examinationService;

    @PostMapping("/start/{appointmentId}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Bắt đầu ca khám", description = "Bác sĩ bắt đầu ca khám cho bệnh nhân, tạo phiên làm việc và cập nhật trạng thái lịch hẹn")
    public ResponseEntity<ApiResponse<AppointmentResponse>> startExamination(
            @PathVariable Long appointmentId,
            Authentication authentication) {
        String doctorEmail = authentication.getName();
        AppointmentResponse response = examinationService.startExamination(appointmentId, doctorEmail);
        return ResponseEntity.ok(ApiResponse.success("Bắt đầu ca khám thành công", response));
    }
}

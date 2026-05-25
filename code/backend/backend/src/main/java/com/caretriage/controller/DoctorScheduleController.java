package com.caretriage.controller;

import com.caretriage.dto.request.DoctorScheduleRequest;
import com.caretriage.dto.response.ApiResponse;
import com.caretriage.dto.response.DoctorScheduleResponse;
import com.caretriage.entity.User;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.DoctorScheduleService;
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
@RequestMapping("/api/v1/schedules")
@RequiredArgsConstructor
@Tag(name = "Doctor Schedule Management", description = "APIs for managing doctor schedules")
public class DoctorScheduleController {

    private final DoctorScheduleService scheduleService;
    private final UserRepository userRepository;

    @GetMapping("/doctor/{doctorId}")
    @Operation(summary = "Lịch làm việc bác sĩ", description = "Lấy lịch làm việc của bác sĩ (công khai)")
    public ResponseEntity<ApiResponse<List<DoctorScheduleResponse>>> getDoctorSchedules(
            @PathVariable Long doctorId) {
        List<DoctorScheduleResponse> schedules = scheduleService.getDoctorSchedules(doctorId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch làm việc thành công", schedules));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Lịch làm việc của tôi", description = "Bác sĩ xem lịch làm việc của mình")
    public ResponseEntity<ApiResponse<List<DoctorScheduleResponse>>> getMySchedules(
            Authentication authentication) {
        Long userId = getUserId(authentication);
        List<DoctorScheduleResponse> schedules = scheduleService.getDoctorSchedules(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch làm việc thành công", schedules));
    }

    @PostMapping
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Tạo lịch làm việc", description = "Bác sĩ tạo ca làm việc mới")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> createSchedule(
            @Valid @RequestBody DoctorScheduleRequest request,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        DoctorScheduleResponse response = scheduleService.createSchedule(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo lịch làm việc thành công", response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Cập nhật lịch làm việc", description = "Bác sĩ cập nhật ca làm việc")
    public ResponseEntity<ApiResponse<DoctorScheduleResponse>> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody DoctorScheduleRequest request,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        DoctorScheduleResponse response = scheduleService.updateSchedule(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lịch làm việc thành công", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Xóa lịch làm việc", description = "Bác sĩ xóa ca làm việc")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        scheduleService.deleteSchedule(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa lịch làm việc thành công"));
    }

    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng"));
        return user.getId();
    }
}

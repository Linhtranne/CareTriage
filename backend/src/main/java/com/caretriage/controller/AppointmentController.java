package com.caretriage.controller;

import com.caretriage.dto.request.AppointmentRequest;
import com.caretriage.dto.request.CancelAppointmentRequest;
import com.caretriage.dto.request.CreateAppointmentFromTicketRequest;
import com.caretriage.dto.request.UpdateAppointmentStatusRequest;
import com.caretriage.dto.response.ApiResponse;
import com.caretriage.dto.response.AppointmentResponse;
import com.caretriage.dto.response.TimeSlotResponse;
import com.caretriage.entity.User;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.AppointmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/appointments")
@RequiredArgsConstructor
@Tag(name = "Appointment Management", description = "APIs for managing appointments")
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Đặt lịch khám", description = "Bệnh nhân đặt lịch khám với bác sĩ")
    public ResponseEntity<ApiResponse<AppointmentResponse>> bookAppointment(
            @Valid @RequestBody AppointmentRequest request,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        AppointmentResponse response = appointmentService.bookAppointment(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đặt lịch khám thành công", response));
    }

    @PostMapping("/from-ticket")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Tạo lịch hẹn từ triage ticket", description = "Bác sĩ tạo lịch hẹn trực tiếp từ phiếu triage")
    public ResponseEntity<ApiResponse<AppointmentResponse>> createFromTicket(
            @Valid @RequestBody CreateAppointmentFromTicketRequest request,
            Authentication authentication) {
        Long doctorId = getUserId(authentication);
        AppointmentResponse response = appointmentService.createAppointmentFromTicket(doctorId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo lịch hẹn từ triage ticket thành công", response));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('PATIENT')")
    @Operation(summary = "Lịch hẹn của tôi", description = "Lấy danh sách lịch hẹn của bệnh nhân")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getMyAppointments(
            @RequestParam(required = false) String status,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        List<AppointmentResponse> appointments = appointmentService.getPatientAppointments(userId, status);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch hẹn thành công", appointments));
    }

    @GetMapping("/doctor")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Lịch hẹn của bác sĩ", description = "Lấy danh sách lịch hẹn cho bác sĩ")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getDoctorAppointments(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String status,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        List<AppointmentResponse> appointments = appointmentService.getDoctorAppointments(userId, date, status);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lịch hẹn thành công", appointments));
    }

    @GetMapping("/doctor/today")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Lịch hẹn hôm nay", description = "Lấy danh sách lịch hẹn hôm nay cho bác sĩ")
    public ResponseEntity<ApiResponse<List<AppointmentResponse>>> getDoctorTodayAppointments(
            Authentication authentication) {
        Long userId = getUserId(authentication);
        List<AppointmentResponse> appointments = appointmentService.getDoctorTodayAppointments(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch hẹn hôm nay thành công", appointments));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR', 'ADMIN')")
    @Operation(summary = "Chi tiết lịch hẹn", description = "Xem chi tiết một lịch hẹn")
    public ResponseEntity<ApiResponse<AppointmentResponse>> getAppointmentById(
            @PathVariable Long id,
            Authentication authentication) {
        AppointmentResponse response = appointmentService.getAppointmentById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết lịch hẹn thành công", response));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('PATIENT', 'DOCTOR')")
    @Operation(summary = "Hủy lịch hẹn", description = "Hủy lịch hẹn với lý do (yêu cầu trước ít nhất 02 tiếng)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> cancelAppointment(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CancelAppointmentRequest request,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        AppointmentResponse response = appointmentService.cancelAppointment(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Hủy lịch hẹn thành công", response));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('DOCTOR')")
    @Operation(summary = "Cập nhật trạng thái", description = "Bác sĩ cập nhật trạng thái lịch hẹn (CONFIRMED, IN_PROGRESS, COMPLETED)")
    public ResponseEntity<ApiResponse<AppointmentResponse>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAppointmentStatusRequest request,
            Authentication authentication) {
        Long userId = getUserId(authentication);
        AppointmentResponse response = appointmentService.updateAppointmentStatus(id, userId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật trạng thái thành công", response));
    }

    @GetMapping("/slots")
    @Operation(summary = "Khung giờ trống", description = "Lấy danh sách khung giờ trống của bác sĩ theo ngày")
    public ResponseEntity<ApiResponse<List<TimeSlotResponse>>> getAvailableSlots(
            @RequestParam Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<TimeSlotResponse> slots = appointmentService.getAvailableSlots(doctorId, date);
        return ResponseEntity.ok(ApiResponse.success("Lấy khung giờ trống thành công", slots));
    }

    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new com.caretriage.exception.ResourceNotFoundException("Không tìm thấy người dùng"));
        return user.getId();
    }
}

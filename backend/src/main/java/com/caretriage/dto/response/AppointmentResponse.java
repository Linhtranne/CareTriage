package com.caretriage.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {
    private Long id;
    private Long patientId;
    private String patientName;
    private String patientAvatar;
    private String patientPhone;
    private Long doctorId;
    private String doctorName;
    private String doctorAvatar;
    private String doctorSpecialization;
    private Long departmentId;
    private String departmentName;
    private LocalDate appointmentDate;
    private LocalTime appointmentTime;
    private LocalTime endTime;
    private String status;
    private String reason;
    private String notes;
    private String cancellationReason;
    private UUID triageTicketId;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

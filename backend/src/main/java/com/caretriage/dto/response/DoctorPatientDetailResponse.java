package com.caretriage.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorPatientDetailResponse {
    private Long patientId;
    private String fullName;
    private String email;
    private String phone;
    private String avatarUrl;
    private LocalDateTime createdAt;

    // Profile details
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String bloodType;
    private String allergies;
    private String insuranceNumber;
    private String emergencyContactName;
    private String emergencyContactPhone;
    private String chronicConditions;

    // Summary counters
    private Long totalAppointments;
    private Long completedAppointments;
    private Long totalMedicalRecords;
    private Long totalTriageTickets;
    private Long activeTriageTickets;

    // Lists (max 5 items)
    private List<AppointmentResponse> recentAppointments;
    private List<MedicalRecordResponse> recentMedicalRecords;
    private List<TriageTicketResponse> recentTriageTickets;
}

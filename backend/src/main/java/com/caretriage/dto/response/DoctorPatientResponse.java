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
public class DoctorPatientResponse {
    private Long patientId;
    private String fullName;
    private String email;
    private String phone;
    private String gender;
    private LocalDate dateOfBirth;
    private Integer age;
    private String avatarUrl;
    private List<String> relationshipSources;
    private LocalDateTime lastAppointmentDate;
    private LocalDateTime nextAppointmentDate;
    private Long medicalRecordCount;
    private Long triageTicketCount;
    private String latestTicketStatus;
    private LocalDateTime lastInteractionAt;
}

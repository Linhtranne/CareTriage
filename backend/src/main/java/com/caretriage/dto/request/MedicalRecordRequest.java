package com.caretriage.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordRequest {
    
    @NotNull(message = "ID lịch hẹn không được để trống")
    private Long appointmentId;

    @NotBlank(message = "Triệu chứng không được để trống")
    private String symptoms;

    @NotBlank(message = "Chẩn đoán không được để trống")
    private String diagnosis;

    private String treatmentPlan;
    
    private String prescription;
    
    private String notes;
    
    private String vitalSigns; // JSON format
    
    private LocalDate followUpDate;
}

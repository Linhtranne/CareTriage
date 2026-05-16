package com.caretriage.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.FutureOrPresent;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicalRecordRequest {
    
    @NotNull(message = "ID lịch hẹn không được để trống")
    private Long appointmentId;

    @NotBlank(message = "Triệu chứng không được để trống")
    @Size(max = 2000, message = "Triệu chứng không được vượt quá 2000 ký tự")
    private String symptoms;

    @NotBlank(message = "Chẩn đoán không được để trống")
    @Size(max = 1000, message = "Chẩn đoán không được vượt quá 1000 ký tự")
    private String diagnosis;

    @Size(max = 4000, message = "Phác đồ điều trị không được vượt quá 4000 ký tự")
    private String treatmentPlan;
    
    @Size(max = 8000, message = "Đơn thuốc không được vượt quá 8000 ký tự")
    private String prescription;
    
    @Size(max = 4000, message = "Ghi chú không được vượt quá 4000 ký tự")
    private String notes;
    
    @Size(max = 2000, message = "Sinh hiệu không được vượt quá 2000 ký tự")
    private String vitalSigns; // JSON format
    
    @FutureOrPresent(message = "Ngày tái khám không được trong quá khứ")
    private LocalDate followUpDate;
}

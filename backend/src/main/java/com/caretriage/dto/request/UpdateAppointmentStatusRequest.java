package com.caretriage.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAppointmentStatusRequest {

    @NotBlank(message = "Status is required")
    private String status;

    @Size(max = 2000, message = "Notes cannot exceed 2000 characters")
    private String notes;
}

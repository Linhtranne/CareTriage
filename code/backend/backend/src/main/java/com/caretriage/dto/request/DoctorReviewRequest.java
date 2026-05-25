package com.caretriage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DoctorReviewRequest {
    @NotBlank(message = "Review status is required")
    private String reviewStatus; // DOCTOR_CONFIRMED, DOCTOR_EDITED, NEEDS_MORE_INFORMATION, REJECTED
    
    private String confirmedSummary;
    
    private Long confirmedDepartmentId; // ID chuyên khoa khớp với TicketCategory
    
    private String confirmedUrgency; // LOW, MEDIUM, HIGH, URGENT
    
    private String doctorNotes;
}

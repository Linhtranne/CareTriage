package com.caretriage.service;

import com.caretriage.dto.response.AppointmentResponse;

public interface ExaminationService {
    AppointmentResponse startExamination(Long appointmentId, String doctorEmail);
}

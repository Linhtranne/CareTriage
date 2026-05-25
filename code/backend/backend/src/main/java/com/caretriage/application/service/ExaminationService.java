package com.caretriage.application.service;

import com.caretriage.application.dto.response.AppointmentResponse;

public interface ExaminationService {
    AppointmentResponse startExamination(Long appointmentId, String doctorEmail);
}

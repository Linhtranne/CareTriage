package com.caretriage.application.service;

import com.caretriage.application.dto.request.AppointmentRequest;
import com.caretriage.domain.entity.Appointment;
import com.caretriage.domain.entity.external.ExternalDoctorBookingToken;

public interface ExternalAppointmentService {

    /**
     * Book an appointment with an external doctor
     */
    Appointment bookExternalAppointment(Long patientId, AppointmentRequest request);

    /**
     * Get booking token info
     */
    ExternalDoctorBookingToken getBookingToken(String token);

    /**
     * Accept the booking via token
     */
    Appointment acceptBooking(String token);

    /**
     * Reject the booking via token
     */
    Appointment rejectBooking(String token, String reason);

    /**
     * Propose a new time for the booking via token
     */
    Appointment proposeNewTime(String token, String newTime);
}

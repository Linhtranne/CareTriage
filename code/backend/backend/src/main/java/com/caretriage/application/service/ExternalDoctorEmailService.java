package com.caretriage.application.service;

import com.caretriage.domain.entity.Appointment;
import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorBookingToken;

public interface ExternalDoctorEmailService {

    /**
     * Send booking email to external doctor with a secure token link.
     */
    void sendBookingEmail(Appointment appointment, ExternalDoctor externalDoctor, ExternalDoctorBookingToken token);
}

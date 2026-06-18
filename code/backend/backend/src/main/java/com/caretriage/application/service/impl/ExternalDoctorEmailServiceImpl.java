package com.caretriage.application.service.impl;

import org.springframework.transaction.annotation.Transactional;

import com.caretriage.application.service.ExternalDoctorEmailService;
import com.caretriage.domain.entity.Appointment;
import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorBookingToken;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class ExternalDoctorEmailServiceImpl implements ExternalDoctorEmailService {

    private final JavaMailSender javaMailSender;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    @Override
    public void sendBookingEmail(Appointment appointment, ExternalDoctor externalDoctor, ExternalDoctorBookingToken token) {
        if (externalDoctor.getEmail() == null || externalDoctor.getEmail().isEmpty()) {
            log.warn("Cannot send email to external doctor {}, email is missing", externalDoctor.getFullName());
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(externalDoctor.getEmail());
            message.setSubject("New Appointment Booking Request - CareTriage");
            
            String bookingLink = frontendUrl + "/external/booking/confirm?token=" + token.getToken();
            
            String body = String.format("""
                Dear Dr. %s,
                
                You have received a new appointment booking request through CareTriage.
                
                Patient Details:
                Name: %s
                Date: %s
                Reason: %s
                
                Please click the link below to confirm or reject this booking:
                %s
                
                This link will expire at: %s
                
                Best regards,
                CareTriage Team
                """, 
                externalDoctor.getFullName(),
                appointment.getPatient().getFullName(),
                appointment.getAppointmentDate().toString() + " " + appointment.getAppointmentTime().toString(),
                appointment.getReason(),
                bookingLink,
                token.getExpiresAt().toString()
            );

            message.setText(body);
            
            // NOTE: Usually we would execute this async or via MQ to not block the main thread
            // For now, doing it synchronously as an MVP
            javaMailSender.send(message);
            log.info("Booking email sent successfully to {}", externalDoctor.getEmail());
            
        } catch (Exception e) {
            log.error("Failed to send booking email to {}", externalDoctor.getEmail(), e);
            throw new RuntimeException("Failed to send booking email", e);
        }
    }
}



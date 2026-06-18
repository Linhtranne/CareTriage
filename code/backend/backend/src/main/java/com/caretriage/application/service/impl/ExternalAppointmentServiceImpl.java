package com.caretriage.application.service.impl;

import com.caretriage.application.dto.request.AppointmentRequest;
import com.caretriage.application.service.ExternalAppointmentService;
import com.caretriage.application.service.ExternalDoctorEmailService;
import com.caretriage.domain.entity.Appointment;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import com.caretriage.domain.entity.external.ExternalDoctor;
import com.caretriage.domain.entity.external.ExternalDoctorBookingToken;
import com.caretriage.domain.repository.AppointmentRepository;
import com.caretriage.domain.repository.ExternalDoctorBookingTokenRepository;
import com.caretriage.domain.repository.ExternalDoctorRepository;
import com.caretriage.infrastructure.persistence.repository.UserJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExternalAppointmentServiceImpl implements ExternalAppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ExternalDoctorRepository externalDoctorRepository;
    private final UserJpaRepository patientRepository;
    private final ExternalDoctorBookingTokenRepository tokenRepository;
    private final ExternalDoctorEmailService emailService;

    @Override
    @Transactional
    public Appointment bookExternalAppointment(Long patientId, AppointmentRequest request) {
        ExternalDoctor doctor = externalDoctorRepository.findById(request.getExternalDoctorId())
                .orElseThrow(() -> new IllegalArgumentException("External Doctor not found"));
                
        if (!Boolean.TRUE.equals(doctor.getActive()) || doctor.getVerificationStatus() != ExternalDoctor.VerificationStatus.VERIFIED) {
            throw new IllegalStateException("Doctor is not active or verified");
        }

        UserJpaEntity patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));

        Appointment appointment = Appointment.builder()
                .patient(patient)
                // doctor is left null because it's an external doctor
                .doctor(null)
                .externalDoctor(doctor)
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                // .department(...) we don't map departmentId here simply to keep it short, or we can fetch it if needed.
                .reason(request.getReason())
                .status(Appointment.AppointmentStatus.PENDING)
                .build();
                
        appointment = appointmentRepository.save(appointment);

        // Generate Token
        String tokenStr = UUID.randomUUID().toString();
        ExternalDoctorBookingToken token = ExternalDoctorBookingToken.builder()
                .appointment(appointment)
                .externalDoctor(doctor)
                .token(tokenStr)
                .status(ExternalDoctorBookingToken.TokenStatus.PENDING)
                .expiresAt(LocalDateTime.now().plusHours(24)) // 24 hours validity
                .build();
                
        tokenRepository.save(token);

        // Send Email
        try {
            emailService.sendBookingEmail(appointment, doctor, token);
        } catch (Exception e) {
            log.error("Failed to send booking email to {}", doctor.getEmail(), e);
            // Non-blocking in business flow for now, might queue in real world
        }

        return appointment;
    }

    @Override
    @Transactional(readOnly = true)
    public ExternalDoctorBookingToken getBookingToken(String token) {
        return tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));
    }

    @Override
    @Transactional
    public Appointment acceptBooking(String token) {
        ExternalDoctorBookingToken bookingToken = validateAndGetToken(token);
        
        Appointment appointment = bookingToken.getAppointment();
        appointment.setStatus(Appointment.AppointmentStatus.CONFIRMED);
        appointment = appointmentRepository.save(appointment);

        bookingToken.setStatus(ExternalDoctorBookingToken.TokenStatus.USED);
        tokenRepository.save(bookingToken);

        return appointment;
    }

    @Override
    @Transactional
    public Appointment rejectBooking(String token, String reason) {
        ExternalDoctorBookingToken bookingToken = validateAndGetToken(token);
        
        Appointment appointment = bookingToken.getAppointment();
        appointment.setStatus(Appointment.AppointmentStatus.CANCELLED);
        appointment.setNotes("Rejected by external doctor: " + reason);
        appointment = appointmentRepository.save(appointment);

        bookingToken.setStatus(ExternalDoctorBookingToken.TokenStatus.USED);
        tokenRepository.save(bookingToken);

        return appointment;
    }

    @Override
    @Transactional
    public Appointment proposeNewTime(String token, String newTime) {
        ExternalDoctorBookingToken bookingToken = validateAndGetToken(token);
        
        Appointment appointment = bookingToken.getAppointment();
        appointment.setStatus(Appointment.AppointmentStatus.PENDING);
        appointment.setNotes("Doctor proposed new time: " + newTime);
        appointment = appointmentRepository.save(appointment);

        // Keep token pending so user can accept it? 
        // Actually, token is for doctor. We'd need a token for patient to accept.
        // For MVP, just mark token used and require manual patient contact.
        bookingToken.setStatus(ExternalDoctorBookingToken.TokenStatus.USED);
        tokenRepository.save(bookingToken);

        return appointment;
    }
    
    private ExternalDoctorBookingToken validateAndGetToken(String token) {
        ExternalDoctorBookingToken bookingToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));
                
        if (bookingToken.getStatus() != ExternalDoctorBookingToken.TokenStatus.PENDING) {
            throw new IllegalStateException("Token is already " + bookingToken.getStatus());
        }
        
        if (bookingToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            bookingToken.setStatus(ExternalDoctorBookingToken.TokenStatus.EXPIRED);
            tokenRepository.save(bookingToken);
            throw new IllegalStateException("Token is expired");
        }
        
        return bookingToken;
    }
}

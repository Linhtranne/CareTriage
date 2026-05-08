package com.caretriage.service;

import com.caretriage.dto.response.AppointmentResponse;
import com.caretriage.entity.*;
import com.caretriage.entity.Appointment.AppointmentStatus;
import com.caretriage.exception.ConflictException;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.*;
import com.caretriage.service.impl.ExaminationServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ExaminationServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PatientProfileRepository patientProfileRepository;
    @Mock
    private ClinicalNoteRepository clinicalNoteRepository;
    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private ExaminationServiceImpl examinationService;

    private User doctor;
    private User patient;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        doctor = User.builder().id(1L).email("doctor@test.com").fullName("Doctor Test").roles(Collections.emptySet()).build();
        patient = User.builder().id(2L).email("patient@test.com").fullName("Patient Test").build();
        appointment = Appointment.builder()
                .id(100L)
                .doctor(doctor)
                .patient(patient)
                .status(AppointmentStatus.CONFIRMED)
                .build();
    }

    @Test
    void startExamination_Success() {
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(userRepository.findByEmail("doctor@test.com")).thenReturn(Optional.of(doctor));
        when(clinicalNoteRepository.save(any(ClinicalNote.class))).thenAnswer(i -> i.getArguments()[0]);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        AppointmentResponse response = examinationService.startExamination(100L, "doctor@test.com");

        assertNotNull(response);
        assertEquals("IN_PROGRESS", response.getStatus());
        verify(appointmentRepository).save(appointment);
        verify(clinicalNoteRepository).save(any(ClinicalNote.class));
        verify(auditLogRepository).save(any(AuditLog.class));
    }

    @Test
    void startExamination_AppointmentNotFound() {
        when(appointmentRepository.findById(100L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> 
            examinationService.startExamination(100L, "doctor@test.com"));
    }

    @Test
    void startExamination_AccessDenied() {
        User otherDoctor = User.builder().id(3L).email("other@test.com").roles(Collections.emptySet()).build();
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(userRepository.findByEmail("other@test.com")).thenReturn(Optional.of(otherDoctor));

        assertThrows(AccessDeniedException.class, () -> 
            examinationService.startExamination(100L, "other@test.com"));
    }

    @Test
    void startExamination_InvalidStatus() {
        appointment.setStatus(AppointmentStatus.COMPLETED);
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(userRepository.findByEmail("doctor@test.com")).thenReturn(Optional.of(doctor));

        assertThrows(ConflictException.class, () -> 
            examinationService.startExamination(100L, "doctor@test.com"));
    }

    @Test
    void startExamination_CreatesPatientProfileIfMissing() {
        patient.setPatientProfile(null);
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(userRepository.findByEmail("doctor@test.com")).thenReturn(Optional.of(doctor));
        when(clinicalNoteRepository.save(any(ClinicalNote.class))).thenAnswer(i -> i.getArguments()[0]);
        when(appointmentRepository.save(any(Appointment.class))).thenAnswer(i -> i.getArguments()[0]);

        examinationService.startExamination(100L, "doctor@test.com");

        verify(patientProfileRepository).save(any(PatientProfile.class));
    }
}

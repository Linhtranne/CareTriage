package com.caretriage.application.service;

import com.caretriage.application.dto.request.MedicalRecordRequest;
import com.caretriage.application.dto.response.MedicalRecordResponse;
import com.caretriage.domain.entity.Appointment;
import com.caretriage.domain.entity.MedicalRecord;
import com.caretriage.domain.entity.Role;
import com.caretriage.domain.entity.User;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import com.caretriage.shared.exception.BusinessException;
import com.caretriage.domain.repository.AppointmentRepository;
import com.caretriage.domain.repository.MedicalRecordRepository;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.application.service.impl.MedicalRecordServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;

import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MedicalRecordServiceTest {

    @Mock
    private MedicalRecordRepository medicalRecordRepository;

    @Mock
    private AppointmentRepository appointmentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AiClientService aiClientService;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private MedicalRecordServiceImpl medicalRecordService;

    private User doctor;
    private User patient;
    private UserJpaEntity doctorEntity;
    private UserJpaEntity patientEntity;
    private Appointment appointment;
    private MedicalRecordRequest createRequest;

    @BeforeEach
    void setUp() {
        doctor = User.builder().id(1L).email("doctor@test.com").roles(Set.of(Role.builder().name("DOCTOR").build())).build();
        patient = User.builder().id(2L).email("patient@test.com").roles(Set.of(Role.builder().name("PATIENT").build())).build();
        doctorEntity = UserJpaEntity.builder()
                .id(1L)
                .username("doctor")
                .email("doctor@test.com")
                .password("hashed_password")
                .fullName("Doctor Test")
                .build();
        patientEntity = UserJpaEntity.builder()
                .id(2L)
                .username("patient")
                .email("patient@test.com")
                .password("hashed_password")
                .fullName("Patient Test")
                .build();

        appointment = Appointment.builder()
                .id(100L)
                .doctor(doctorEntity)
                .patient(patientEntity)
                .status(Appointment.AppointmentStatus.COMPLETED)
                .build();

        createRequest = new MedicalRecordRequest();
        createRequest.setAppointmentId(100L);
        createRequest.setDiagnosis("Test Diagnosis");
    }

    @Test
    void createRecord_Success() {
        when(userRepository.findByEmail("doctor@test.com")).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(medicalRecordRepository.findByAppointmentId(100L)).thenReturn(Optional.empty());

        MedicalRecord savedRecord = MedicalRecord.builder()
                .id(1L)
                .appointment(appointment)
                .patient(patientEntity)
                .doctor(doctorEntity)
                .diagnosis("Test Diagnosis")
                .build();

        when(medicalRecordRepository.save(any(MedicalRecord.class))).thenReturn(savedRecord);

        MedicalRecordResponse response = medicalRecordService.createRecord(createRequest, "doctor@test.com");

        assertNotNull(response);
        assertEquals(1L, response.getId());
        assertEquals("Test Diagnosis", response.getDiagnosis());
        verify(medicalRecordRepository).save(any(MedicalRecord.class));
    }

    @Test
    void createRecord_DuplicateAppointment_ThrowsBusinessException() {
        when(userRepository.findByEmail("doctor@test.com")).thenReturn(Optional.of(doctor));
        when(appointmentRepository.findById(100L)).thenReturn(Optional.of(appointment));
        when(medicalRecordRepository.findByAppointmentId(100L)).thenReturn(Optional.of(new MedicalRecord()));

        BusinessException exception = assertThrows(BusinessException.class, () ->
                medicalRecordService.createRecord(createRequest, "doctor@test.com"));

        assertEquals("Hồ sơ bệnh án cho lịch hẹn này đã tồn tại", exception.getMessage());
        verify(medicalRecordRepository, never()).save(any(MedicalRecord.class));
    }

    @Test
    void getRecordById_PatientAccessOwnRecord_Success() {
        MedicalRecord record = MedicalRecord.builder()
                .id(1L)
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointment(appointment)
                .build();

        when(medicalRecordRepository.findById(1L)).thenReturn(Optional.of(record));
        when(userRepository.findByEmail("patient@test.com")).thenReturn(Optional.of(patient));

        MedicalRecordResponse response = medicalRecordService.getRecordById(1L, "patient@test.com");

        assertNotNull(response);
        assertEquals(1L, response.getId());
    }

    @Test
    void getRecordById_PatientAccessOtherRecord_ThrowsAccessDeniedException() {
        User otherPatient = User.builder().id(3L).email("other@test.com").roles(Set.of(Role.builder().name("PATIENT").build())).build();
        MedicalRecord record = MedicalRecord.builder()
                .id(1L)
                .patient(patientEntity) // record belongs to patient 2L
                .build();

        when(medicalRecordRepository.findById(1L)).thenReturn(Optional.of(record));
        when(userRepository.findByEmail("other@test.com")).thenReturn(Optional.of(otherPatient));

        assertThrows(AccessDeniedException.class, () ->
                medicalRecordService.getRecordById(1L, "other@test.com"));
    }

    @Test
    void getRecordById_DoctorAccessAnyRecord_Success() {
        MedicalRecord record = MedicalRecord.builder()
                .id(1L)
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointment(appointment)
                .build();

        when(medicalRecordRepository.findById(1L)).thenReturn(Optional.of(record));
        when(userRepository.findByEmail("doctor@test.com")).thenReturn(Optional.of(doctor));

        MedicalRecordResponse response = medicalRecordService.getRecordById(1L, "doctor@test.com");

        assertNotNull(response);
        assertEquals(1L, response.getId());
    }
}

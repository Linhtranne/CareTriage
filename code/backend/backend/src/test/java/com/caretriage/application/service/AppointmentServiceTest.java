package com.caretriage.application.service;

import com.caretriage.application.dto.request.CancelAppointmentRequest;
import com.caretriage.application.dto.request.CreateAppointmentFromTicketRequest;
import com.caretriage.application.dto.request.UpdateAppointmentStatusRequest;
import com.caretriage.application.dto.response.AppointmentResponse;
import com.caretriage.domain.entity.Appointment;
import com.caretriage.domain.entity.Appointment.AppointmentStatus;
import com.caretriage.domain.entity.ChatSession;
import com.caretriage.domain.entity.DoctorSchedule;
import com.caretriage.domain.entity.Role;
import com.caretriage.domain.entity.TriageTicket;
import com.caretriage.domain.entity.User;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import com.caretriage.shared.exception.BusinessException;
import com.caretriage.domain.repository.AppointmentRepository;
import com.caretriage.domain.repository.DepartmentRepository;
import com.caretriage.domain.repository.DoctorScheduleRepository;
import com.caretriage.domain.repository.TriageTicketRepository;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.application.service.impl.AppointmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AppointmentServiceTest {

    @Mock
    private AppointmentRepository appointmentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private DepartmentRepository departmentRepository;
    @Mock
    private DoctorScheduleRepository doctorScheduleRepository;
    @Mock
    private TriageTicketRepository triageTicketRepository;
    @Mock
    private com.caretriage.domain.repository.ChatSessionRepository chatSessionRepository;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    private User patient;
    private User doctor;
    private UserJpaEntity patientEntity;
    private UserJpaEntity doctorEntity;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        patient = new User();
        patient.setId(1L);
        patient.setFullName("Patient One");

        patientEntity = UserJpaEntity.builder()
                .id(1L)
                .username("patient")
                .email("patient@test.com")
                .password("hashed_password")
                .fullName("Patient One")
                .build();

        doctor = new User();
        doctor.setId(2L);
        doctor.setFullName("Doctor One");

        doctorEntity = UserJpaEntity.builder()
                .id(2L)
                .username("doctor")
                .email("doctor@test.com")
                .password("hashed_password")
                .fullName("Doctor One")
                .build();

        appointment = Appointment.builder()
                .id(1L)
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(LocalDate.now().plusDays(1))
                .appointmentTime(LocalTime.of(10, 0))
                .status(AppointmentStatus.PENDING)
                .build();
    }

    @Test
    void getPatientAppointments_SingleStatus_Success() {
        when(appointmentRepository.findByPatientIdAndStatusInOrderByAppointmentDateDesc(eq(1L), any()))
                .thenReturn(Collections.singletonList(appointment));

        List<AppointmentResponse> result = appointmentService.getPatientAppointments(1L, "PENDING");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("PENDING", result.get(0).getStatus());
        verify(appointmentRepository).findByPatientIdAndStatusInOrderByAppointmentDateDesc(eq(1L), argThat(list -> 
            list.size() == 1 && list.contains(AppointmentStatus.PENDING)
        ));
    }

    @Test
    void getPatientAppointments_MultiStatus_Success() {
        when(appointmentRepository.findByPatientIdAndStatusInOrderByAppointmentDateDesc(eq(1L), any()))
                .thenReturn(Collections.singletonList(appointment));

        List<AppointmentResponse> result = appointmentService.getPatientAppointments(1L, "PENDING,CONFIRMED");

        assertNotNull(result);
        verify(appointmentRepository).findByPatientIdAndStatusInOrderByAppointmentDateDesc(eq(1L), argThat(list -> 
            list.size() == 2 && list.contains(AppointmentStatus.PENDING) && list.contains(AppointmentStatus.CONFIRMED)
        ));
    }

    @Test
    void getPatientAppointments_InvalidStatus_ThrowsException() {
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.getPatientAppointments(1L, "INVALID_STATUS");
        });

        assertTrue(exception.getMessage().contains("Trạng thái không hợp lệ"));
    }

    @Test
    void cancelAppointment_Success() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        when(appointmentRepository.save(any())).thenReturn(appointment);

        CancelAppointmentRequest request = new CancelAppointmentRequest();
        request.setCancellationReason("Change of plans");

        AppointmentResponse result = appointmentService.cancelAppointment(1L, 1L, request);

        assertNotNull(result);
        assertEquals("CANCELLED", result.getStatus());
        verify(appointmentRepository).save(argThat(a -> 
            a.getStatus() == AppointmentStatus.CANCELLED && "Change of plans".equals(a.getCancellationReason())
        ));
    }

    @Test
    void cancelAppointment_Unauthorized_ThrowsException() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));

        org.springframework.security.access.AccessDeniedException exception = assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
            appointmentService.cancelAppointment(1L, 99L, null); // 99L is not patient or doctor
        });

        assertEquals("Bạn không có quyền hủy lịch hẹn này", exception.getMessage());
    }

    @Test
    void cancelAppointment_TooLate_ThrowsException() {
        // Set appointment to 1 hour from now
        appointment.setAppointmentDate(LocalDate.now());
        appointment.setAppointmentTime(LocalTime.now().plusHours(1));
        
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));

        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.cancelAppointment(1L, 1L, null);
        });

        assertEquals("Không thể hủy lịch hẹn trước giờ khám ít hơn 02 tiếng", exception.getMessage());
    }

    @Test
    void updateAppointmentStatus_Unauthorized_ThrowsException() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        
        org.springframework.security.access.AccessDeniedException exception = assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
            appointmentService.updateAppointmentStatus(1L, 99L, new UpdateAppointmentStatusRequest());
        });
        assertEquals("Bạn không có quyền cập nhật lịch hẹn này", exception.getMessage());
    }

    @Test
    void updateAppointmentStatus_InvalidStatus_ThrowsException() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        
        UpdateAppointmentStatusRequest request = new UpdateAppointmentStatusRequest();
        request.setStatus("INVALID");
        
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.updateAppointmentStatus(1L, 2L, request);
        });
        assertEquals("Trạng thái không hợp lệ: INVALID", exception.getMessage());
    }

    @Test
    void updateAppointmentStatus_Transition_ThrowsException() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        
        UpdateAppointmentStatusRequest request = new UpdateAppointmentStatusRequest();
        request.setStatus("COMPLETED"); // PENDING -> COMPLETED is invalid
        
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.updateAppointmentStatus(1L, 2L, request);
        });
        assertTrue(exception.getMessage().contains("Không thể chuyển trạng thái từ"));
    }

    @Test
    void createAppointmentFromTicket_Success() {
        doctor = new User();
        doctor.setId(2L);
        doctor.setFullName("Doctor One");
        Role doctorRole = new Role();
        doctorRole.setName("DOCTOR");
        doctor.setRoles(java.util.Collections.singleton(doctorRole));

        TriageTicket ticket = TriageTicket.builder()
                .id(java.util.UUID.randomUUID())
                .ticketNumber("TRIAGE-1")
                .description("Sore throat")
                .requester(patientEntity)
                .doctorReviewStatus(TriageTicket.DoctorReviewStatus.DOCTOR_CONFIRMED)
                .build();

        CreateAppointmentFromTicketRequest request = new CreateAppointmentFromTicketRequest();
        request.setTicketId(ticket.getId());
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setAppointmentTime(LocalTime.of(10, 0));
        request.setDepartmentId(1L);

        when(triageTicketRepository.findById(ticket.getId())).thenReturn(Optional.of(ticket));
        when(appointmentRepository.existsByTriageTicketId(ticket.getId())).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctor));

        when(appointmentRepository.findByPatientIdAndAppointmentDate(eq(1L), any())).thenReturn(Collections.emptyList());
        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setStartTime(LocalTime.of(8, 0));
        schedule.setEndTime(LocalTime.of(12, 0));
        when(doctorScheduleRepository.findByDoctorIdAndDayOfWeekAndIsActiveTrue(eq(2L), any()))
                .thenReturn(Collections.singletonList(schedule));
        when(appointmentRepository.findConflictingAppointments(any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        
        Appointment savedAppointment = Appointment.builder()
                .id(99L)
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .status(AppointmentStatus.PENDING)
                .build();
        when(appointmentRepository.save(any())).thenReturn(savedAppointment);
        when(appointmentRepository.findById(99L)).thenReturn(Optional.of(savedAppointment));

        // Act
        AppointmentResponse result = appointmentService.createAppointmentFromTicket(2L, request);

        // Assert
        assertNotNull(result);
        assertEquals(TriageTicket.DoctorReviewStatus.APPOINTMENT_CREATED, ticket.getDoctorReviewStatus());
        verify(triageTicketRepository).save(ticket);
    }

    @Test
    void createAppointmentFromTicket_Success_LocksSession() {
        doctor = new User();
        doctor.setId(2L);
        doctor.setFullName("Doctor One");
        Role doctorRole = new Role();
        doctorRole.setName("DOCTOR");
        doctor.setRoles(java.util.Collections.singleton(doctorRole));

        ChatSession session = new ChatSession();
        session.setId(10L);
        session.setStatus(ChatSession.SessionStatus.ACTIVE);

        TriageTicket ticket = TriageTicket.builder()
                .id(java.util.UUID.randomUUID())
                .ticketNumber("TRIAGE-2")
                .description("Headache")
                .requester(patientEntity)
                .doctorReviewStatus(TriageTicket.DoctorReviewStatus.DOCTOR_EDITED)
                .chatSession(session)
                .build();

        CreateAppointmentFromTicketRequest request = new CreateAppointmentFromTicketRequest();
        request.setTicketId(ticket.getId());
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setAppointmentTime(LocalTime.of(10, 0));
        request.setDepartmentId(1L);

        when(triageTicketRepository.findById(ticket.getId())).thenReturn(Optional.of(ticket));
        when(appointmentRepository.existsByTriageTicketId(ticket.getId())).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctor));

        when(appointmentRepository.findByPatientIdAndAppointmentDate(eq(1L), any())).thenReturn(Collections.emptyList());
        DoctorSchedule schedule = new DoctorSchedule();
        schedule.setStartTime(LocalTime.of(8, 0));
        schedule.setEndTime(LocalTime.of(12, 0));
        when(doctorScheduleRepository.findByDoctorIdAndDayOfWeekAndIsActiveTrue(eq(2L), any()))
                .thenReturn(Collections.singletonList(schedule));
        when(appointmentRepository.findConflictingAppointments(any(), any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());
        
        Appointment savedAppointment = Appointment.builder()
                .id(99L)
                .patient(patientEntity)
                .doctor(doctorEntity)
                .appointmentDate(request.getAppointmentDate())
                .appointmentTime(request.getAppointmentTime())
                .status(AppointmentStatus.PENDING)
                .build();
        when(appointmentRepository.save(any())).thenReturn(savedAppointment);
        when(appointmentRepository.findById(99L)).thenReturn(Optional.of(savedAppointment));

        // Act
        AppointmentResponse result = appointmentService.createAppointmentFromTicket(2L, request);

        // Assert
        assertNotNull(result);
        assertEquals(TriageTicket.DoctorReviewStatus.APPOINTMENT_CREATED, ticket.getDoctorReviewStatus());
        assertEquals(ChatSession.SessionStatus.COMPLETED, session.getStatus());
        verify(chatSessionRepository).save(session);
    }

    @Test
    void createAppointmentFromTicket_UnreviewedTicket_ThrowsException() {
        doctor = new User();
        doctor.setId(2L);
        doctor.setFullName("Doctor One");
        Role doctorRole = new Role();
        doctorRole.setName("DOCTOR");
        doctor.setRoles(java.util.Collections.singleton(doctorRole));

        TriageTicket ticket = TriageTicket.builder()
                .id(java.util.UUID.randomUUID())
                .ticketNumber("TRIAGE-3")
                .description("Back pain")
                .requester(patientEntity)
                .doctorReviewStatus(TriageTicket.DoctorReviewStatus.AI_ANALYSIS_PENDING_REVIEW)
                .build();

        CreateAppointmentFromTicketRequest request = new CreateAppointmentFromTicketRequest();
        request.setTicketId(ticket.getId());
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setAppointmentTime(LocalTime.of(10, 0));
        request.setDepartmentId(1L);

        when(triageTicketRepository.findById(ticket.getId())).thenReturn(Optional.of(ticket));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctor));

        // Act & Assert
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.createAppointmentFromTicket(2L, request);
        });
        assertTrue(exception.getMessage().contains("Bác sĩ cần xác nhận hoặc điều chỉnh phiếu"));
    }

    @Test
    void createAppointmentFromTicket_NonDoctorNonAdmin_ThrowsAccessDenied() {
        User patientUser = new User();
        patientUser.setId(1L);
        patientUser.setFullName("Patient Actor");
        Role patientRole = new Role();
        patientRole.setName("PATIENT");
        patientUser.setRoles(java.util.Collections.singleton(patientRole));

        TriageTicket ticket = TriageTicket.builder()
                .id(java.util.UUID.randomUUID())
                .ticketNumber("TRIAGE-4")
                .doctorReviewStatus(TriageTicket.DoctorReviewStatus.DOCTOR_CONFIRMED)
                .build();

        CreateAppointmentFromTicketRequest request = new CreateAppointmentFromTicketRequest();
        request.setTicketId(ticket.getId());
        request.setAppointmentDate(LocalDate.now().plusDays(1));
        request.setAppointmentTime(LocalTime.of(10, 0));
        request.setDepartmentId(1L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(patientUser));

        // Act & Assert
        assertThrows(org.springframework.security.access.AccessDeniedException.class, () -> {
            appointmentService.createAppointmentFromTicket(1L, request);
        });
    }
}

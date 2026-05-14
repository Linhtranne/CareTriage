package com.caretriage.service;

import com.caretriage.dto.request.CancelAppointmentRequest;
import com.caretriage.dto.response.AppointmentResponse;
import com.caretriage.entity.Appointment;
import com.caretriage.entity.Appointment.AppointmentStatus;
import com.caretriage.entity.User;
import com.caretriage.exception.BusinessException;
import com.caretriage.exception.ResourceNotFoundException;
import com.caretriage.repository.AppointmentRepository;
import com.caretriage.repository.DepartmentRepository;
import com.caretriage.repository.DoctorScheduleRepository;
import com.caretriage.repository.TriageTicketRepository;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.impl.AppointmentServiceImpl;
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
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private AppointmentServiceImpl appointmentService;

    private User patient;
    private User doctor;
    private Appointment appointment;

    @BeforeEach
    void setUp() {
        patient = new User();
        patient.setId(1L);
        patient.setFullName("Patient One");

        doctor = new User();
        doctor.setId(2L);
        doctor.setFullName("Doctor One");

        appointment = Appointment.builder()
                .id(1L)
                .patient(patient)
                .doctor(doctor)
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
            appointmentService.updateAppointmentStatus(1L, 99L, new com.caretriage.dto.request.UpdateAppointmentStatusRequest());
        });
        assertEquals("Bạn không có quyền cập nhật lịch hẹn này", exception.getMessage());
    }

    @Test
    void updateAppointmentStatus_InvalidStatus_ThrowsException() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        
        com.caretriage.dto.request.UpdateAppointmentStatusRequest request = new com.caretriage.dto.request.UpdateAppointmentStatusRequest();
        request.setStatus("INVALID");
        
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.updateAppointmentStatus(1L, 2L, request);
        });
        assertEquals("Trạng thái không hợp lệ: INVALID", exception.getMessage());
    }

    @Test
    void updateAppointmentStatus_Transition_ThrowsException() {
        when(appointmentRepository.findById(1L)).thenReturn(Optional.of(appointment));
        
        com.caretriage.dto.request.UpdateAppointmentStatusRequest request = new com.caretriage.dto.request.UpdateAppointmentStatusRequest();
        request.setStatus("COMPLETED"); // PENDING -> COMPLETED is invalid
        
        BusinessException exception = assertThrows(BusinessException.class, () -> {
            appointmentService.updateAppointmentStatus(1L, 2L, request);
        });
        assertTrue(exception.getMessage().contains("Không thể chuyển trạng thái từ"));
    }
}

package com.caretriage.application.service;

import com.caretriage.application.dto.response.DoctorPublicResponse;
import com.caretriage.application.dto.response.DoctorResponse;
import com.caretriage.application.dto.response.PagedResponse;
import com.caretriage.domain.entity.Department;
import com.caretriage.domain.entity.DoctorProfile;
import com.caretriage.domain.repository.DepartmentRepository;
import com.caretriage.domain.repository.DoctorProfileRepository;
import com.caretriage.application.service.AppointmentService;
import com.caretriage.application.service.impl.DoctorServiceImpl;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import com.caretriage.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DoctorServiceTest {

    @Mock
    private DoctorProfileRepository doctorProfileRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private AppointmentService appointmentService;

    @InjectMocks
    private DoctorServiceImpl doctorService;

    private UserJpaEntity doctorUser;
    private DoctorProfile doctorProfile;
    private Department department;

    @BeforeEach
    void setUp() {
        doctorUser = UserJpaEntity.builder()
                .username("doctor")
                .password("hashed_password")
                .id(1L)
                .fullName("Dr. John Doe")
                .email("john@example.com")
                .build();

        department = Department.builder()
                .id(1L)
                .name("Cardiology")
                .code("CARD")
                .build();

        doctorProfile = DoctorProfile.builder()
                .id(1L)
                .user(doctorUser)
                .specialization("Cardiologist")
                .departments(new HashSet<>(Collections.singletonList(department)))
                .build();
    }

    @Test
    void getPublicDoctors_All_Success() {
        Page<DoctorProfile> page = new PageImpl<>(Collections.singletonList(doctorProfile));
        when(doctorProfileRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        PagedResponse<DoctorPublicResponse> response = doctorService.getPublicDoctors(null, null, 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("Dr. John Doe", response.getContent().get(0).getFullName());
        verify(doctorProfileRepository, times(1)).findAll(any(Specification.class), any(PageRequest.class));
    }

    @Test
    void getPublicDoctors_FilterByDepartment_Success() {
        Page<DoctorProfile> page = new PageImpl<>(Collections.singletonList(doctorProfile));
        when(doctorProfileRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        PagedResponse<DoctorPublicResponse> response = doctorService.getPublicDoctors(1L, null, 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertEquals("Cardiology", response.getContent().get(0).getDepartments().get(0).getName());
    }

    @Test
    void getPublicDoctors_SearchByName_Success() {
        Page<DoctorProfile> page = new PageImpl<>(Collections.singletonList(doctorProfile));
        when(doctorProfileRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        PagedResponse<DoctorPublicResponse> response = doctorService.getPublicDoctors(null, "John", 0, 10);

        assertNotNull(response);
        assertEquals(1, response.getContent().size());
        assertTrue(response.getContent().get(0).getFullName().contains("John"));
    }

    @Test
    void getPublicDoctors_NoResults_Success() {
        Page<DoctorProfile> page = new PageImpl<>(Collections.emptyList());
        when(doctorProfileRepository.findAll(any(Specification.class), any(PageRequest.class))).thenReturn(page);

        PagedResponse<DoctorPublicResponse> response = doctorService.getPublicDoctors(999L, "NonExistent", 0, 10);

        assertNotNull(response);
        assertEquals(0, response.getContent().size());
        assertEquals(0, response.getTotalElements());
    }

    @Test
    void getAvailableSlots_Success() {
        java.time.LocalDate date = java.time.LocalDate.now().plusDays(1);
        when(doctorProfileRepository.existsById(1L)).thenReturn(true);
        when(appointmentService.getAvailableSlots(eq(1L), eq(date))).thenReturn(Collections.emptyList());

        List<?> slots = doctorService.getAvailableSlots(1L, date);

        assertNotNull(slots);
        verify(appointmentService, times(1)).getAvailableSlots(eq(1L), eq(date));
    }

    @Test
    void getAvailableSlots_DoctorNotFound_ThrowsException() {
        java.time.LocalDate date = java.time.LocalDate.now().plusDays(1);
        when(doctorProfileRepository.existsById(999L)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> {
            doctorService.getAvailableSlots(999L, date);
        });
    }
}

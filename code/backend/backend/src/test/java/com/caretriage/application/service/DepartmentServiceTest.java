package com.caretriage.application.service;

import com.caretriage.application.dto.request.DepartmentRequest;
import com.caretriage.application.dto.response.DepartmentResponse;
import com.caretriage.domain.entity.Department;
import com.caretriage.domain.entity.DepartmentStatus;
import com.caretriage.shared.exception.ResourceNotFoundException;
import com.caretriage.domain.repository.DepartmentRepository;
import com.caretriage.domain.repository.DoctorProfileRepository;
import com.caretriage.application.service.impl.DepartmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DepartmentServiceTest {

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private DoctorProfileRepository doctorProfileRepository;

    @InjectMocks
    private DepartmentServiceImpl departmentService;

    private Department department;
    private DepartmentRequest request;

    @BeforeEach
    void setUp() {
        department = Department.builder()
                .id(1L)
                .code("CARD")
                .name("Cardiology")
                .slug("cardiology")
                .status(DepartmentStatus.ACTIVE)
                .build();

        request = DepartmentRequest.builder()
                .code("CARD")
                .name("Cardiology")
                .status(DepartmentStatus.ACTIVE)
                .build();
    }

    @Test
    void whenGetById_thenReturnResponse() {
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        
        DepartmentResponse response = departmentService.getDepartmentById(1L);
        
        assertThat(response.getCode()).isEqualTo("CARD");
        verify(departmentRepository).findById(1L);
    }

    @Test
    void whenGetByInvalidId_thenThrowException() {
        when(departmentRepository.findById(99L)).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> departmentService.getDepartmentById(99L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void whenCreateWithDuplicateCode_thenThrowException() {
        when(departmentRepository.existsByCode("CARD")).thenReturn(true);
        
        assertThatThrownBy(() -> departmentService.createDepartment(request))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Mã chuyên khoa đã tồn tại");
    }

    @Test
    void whenDeleteWithDoctors_thenThrowException() {
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(doctorProfileRepository.countByDepartmentsId(1L)).thenReturn(5L);
        
        assertThatThrownBy(() -> departmentService.deleteDepartment(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("vẫn còn 5 bác sĩ");
    }

    @Test
    void whenDeleteSuccess_thenCallDelete() {
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(department));
        when(doctorProfileRepository.countByDepartmentsId(1L)).thenReturn(0L);
        
        departmentService.deleteDepartment(1L);
        
        verify(departmentRepository).delete(any(Department.class));
    }
}

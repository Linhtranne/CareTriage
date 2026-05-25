package com.caretriage.controller;

import com.caretriage.dto.request.CancelAppointmentRequest;
import com.caretriage.dto.response.AppointmentResponse;
import com.caretriage.service.AppointmentService;
import com.caretriage.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AppointmentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AppointmentService appointmentService;

    @MockBean
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "patient@example.com", roles = "PATIENT")
    void getMyAppointments_CsvStatus_ReturnsOk() throws Exception {
        AppointmentResponse resp = AppointmentResponse.builder()
                .id(1L)
                .status("PENDING")
                .build();
        
        when(appointmentService.getPatientAppointments(anyLong(), eq("PENDING,CONFIRMED")))
                .thenReturn(Collections.singletonList(resp));

        // Mock userRepository to return a user when findByEmail is called (used by getUserId in controller)
        com.caretriage.entity.User mockUser = new com.caretriage.entity.User();
        mockUser.setId(1L);
        when(userRepository.findByEmail(anyString())).thenReturn(java.util.Optional.of(mockUser));

        mockMvc.perform(get("/api/v1/appointments/my")
                .param("status", "PENDING,CONFIRMED")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].status").value("PENDING"));
    }

    @Test
    @WithMockUser(username = "patient2@example.com", roles = "PATIENT")
    void getAppointmentById_AnotherPatient_ReturnsForbidden() throws Exception {
        AppointmentResponse resp = AppointmentResponse.builder()
                .id(1L)
                .patientId(1L) // Belongs to user 1
                .status("PENDING")
                .build();
        
        when(appointmentService.getAppointmentById(eq(1L), anyString()))
                .thenThrow(new com.caretriage.exception.BusinessException("Bạn không có quyền xem chi tiết lịch hẹn này"));

        com.caretriage.entity.User mockUser = new com.caretriage.entity.User();
        mockUser.setId(2L);
        when(userRepository.findByEmail(anyString())).thenReturn(java.util.Optional.of(mockUser));

        mockMvc.perform(get("/api/v1/appointments/1"))
                .andExpect(status().isBadRequest()) // BusinessException is handled as 400 Bad Request in GlobalExceptionHandler
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Bạn không có quyền xem chi tiết lịch hẹn này"));
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = "PATIENT")
    void cancelAppointment_EmptyReason_ReturnsBadRequest() throws Exception {
        CancelAppointmentRequest request = new CancelAppointmentRequest(""); // Empty reason

        mockMvc.perform(patch("/api/v1/appointments/1/cancel")
                .content(objectMapper.writeValueAsString(request))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = "PATIENT")
    void cancelAppointment_PatchMethod_ReturnsOk() throws Exception {
        AppointmentResponse resp = AppointmentResponse.builder()
                .id(1L)
                .status("CANCELLED")
                .build();
        
        when(appointmentService.cancelAppointment(anyLong(), anyLong(), any()))
                .thenReturn(resp);

        com.caretriage.entity.User mockUser = new com.caretriage.entity.User();
        mockUser.setId(1L);
        when(userRepository.findByEmail(anyString())).thenReturn(java.util.Optional.of(mockUser));

        CancelAppointmentRequest request = new CancelAppointmentRequest("No longer needed");

        mockMvc.perform(patch("/api/v1/appointments/1/cancel")
                .content(objectMapper.writeValueAsString(request))
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));
    }
}

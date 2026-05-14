package com.caretriage.controller;

import com.caretriage.dto.response.DoctorPublicResponse;
import com.caretriage.dto.response.TimeSlotResponse;
import com.caretriage.service.DoctorService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DoctorControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DoctorService doctorService;

    @Test
    public void getDoctorSlots_Success() throws Exception {
        Long doctorId = 1L;
        LocalDate date = LocalDate.now().plusDays(1);
        List<TimeSlotResponse> slots = Arrays.asList(
                TimeSlotResponse.builder().startTime(LocalTime.of(8, 0)).endTime(LocalTime.of(8, 30)).available(true).build(),
                TimeSlotResponse.builder().startTime(LocalTime.of(8, 30)).endTime(LocalTime.of(9, 0)).available(false).build()
        );

        when(doctorService.getAvailableSlots(eq(doctorId), eq(date))).thenReturn(slots);

        mockMvc.perform(get("/api/v1/doctors/" + doctorId + "/slots")
                        .param("date", date.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data[0].startTime").value("08:00:00"))
                .andExpect(jsonPath("$.data[0].available").value(true))
                .andExpect(jsonPath("$.data[1].available").value(false));
    }

    @Test
    public void getDoctorSlots_InvalidDate_Past() throws Exception {
        Long doctorId = 1L;
        LocalDate date = LocalDate.now().minusDays(1);

        when(doctorService.getAvailableSlots(eq(doctorId), eq(date)))
                .thenThrow(new com.caretriage.exception.BusinessException("Không thể xem lịch khám trong quá khứ"));

        mockMvc.perform(get("/api/v1/doctors/" + doctorId + "/slots")
                        .param("date", date.toString()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Không thể xem lịch khám trong quá khứ"));
    }

    @Test
    public void getDoctorSlots_DoctorNotFound() throws Exception {
        Long doctorId = 999L;
        LocalDate date = LocalDate.now().plusDays(1);

        when(doctorService.getAvailableSlots(eq(doctorId), eq(date)))
                .thenThrow(new com.caretriage.exception.ResourceNotFoundException("Không tìm thấy bác sĩ với ID: " + doctorId));

        mockMvc.perform(get("/api/v1/doctors/" + doctorId + "/slots")
                        .param("date", date.toString()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }
}

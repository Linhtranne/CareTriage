package com.caretriage.service;

import com.caretriage.dto.request.AppointmentRequest;
import com.caretriage.dto.request.CancelAppointmentRequest;
import com.caretriage.dto.request.CreateAppointmentFromTicketRequest;
import com.caretriage.dto.request.UpdateAppointmentStatusRequest;
import com.caretriage.dto.response.AppointmentResponse;
import com.caretriage.dto.response.TimeSlotResponse;

import java.time.LocalDate;
import java.util.List;

public interface AppointmentService {

    AppointmentResponse bookAppointment(Long patientId, AppointmentRequest request);

    AppointmentResponse cancelAppointment(Long appointmentId, Long userId, CancelAppointmentRequest request);

    List<AppointmentResponse> getPatientAppointments(Long patientId, String status);

    List<AppointmentResponse> getDoctorAppointments(Long doctorId, LocalDate date, String status);

    List<AppointmentResponse> getDoctorTodayAppointments(Long doctorId);

    AppointmentResponse updateAppointmentStatus(Long appointmentId, Long doctorId, UpdateAppointmentStatusRequest request);

    List<TimeSlotResponse> getAvailableSlots(Long doctorId, LocalDate date);

    AppointmentResponse getAppointmentById(Long appointmentId);

    AppointmentResponse createAppointmentFromTicket(Long doctorId, CreateAppointmentFromTicketRequest request);
}

package com.caretriage.application.service;

import com.caretriage.application.dto.request.DoctorDepartmentRequest;
import com.caretriage.application.dto.response.DepartmentResponse;
import com.caretriage.application.dto.response.DoctorPublicResponse;
// import com.caretriage.application.dto.response.DoctorResponse;
import com.caretriage.application.dto.response.PagedResponse;
import com.caretriage.application.dto.response.TimeSlotResponse;
import com.caretriage.application.dto.response.DoctorPatientResponse;
import com.caretriage.application.dto.response.DoctorPatientDetailResponse;

import java.util.List;

public interface DoctorService {
    void assignDepartments(Long doctorId, DoctorDepartmentRequest request);
    List<DepartmentResponse> getDoctorDepartments(Long doctorId);
    PagedResponse<DoctorPublicResponse> getPublicDoctors(Long departmentId, String search, int page, int size);
    DoctorPublicResponse getDoctorById(Long id);
    List<TimeSlotResponse> getAvailableSlots(Long doctorId, java.time.LocalDate date);
    PagedResponse<DoctorPatientResponse> getDoctorPatients(Long doctorId, String search, String relationshipSource, String ticketStatus, Boolean hasUpcomingAppointment, Boolean hasMedicalRecord, int page, int size);
    DoctorPatientDetailResponse getDoctorPatientDetail(Long doctorId, Long patientId);
}

package com.caretriage.service;

import com.caretriage.dto.request.DoctorDepartmentRequest;
import com.caretriage.dto.response.DepartmentResponse;
import com.caretriage.dto.response.DoctorPublicResponse;
import com.caretriage.dto.response.DoctorResponse;
import com.caretriage.dto.response.PagedResponse;
import com.caretriage.dto.response.TimeSlotResponse;

import java.util.List;

public interface DoctorService {
    void assignDepartments(Long doctorId, DoctorDepartmentRequest request);
    List<DepartmentResponse> getDoctorDepartments(Long doctorId);
    PagedResponse<DoctorPublicResponse> getPublicDoctors(Long departmentId, String search, int page, int size);
    DoctorPublicResponse getDoctorById(Long id);
    List<TimeSlotResponse> getAvailableSlots(Long doctorId, java.time.LocalDate date);
}

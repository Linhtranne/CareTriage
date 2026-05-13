package com.caretriage.service;

import com.caretriage.dto.request.DoctorDepartmentRequest;
import com.caretriage.dto.response.DepartmentResponse;
import com.caretriage.dto.response.DoctorResponse;
import com.caretriage.dto.response.PagedResponse;

import java.util.List;

public interface DoctorService {
    void assignDepartments(Long doctorId, DoctorDepartmentRequest request);
    List<DepartmentResponse> getDoctorDepartments(Long doctorId);
    PagedResponse<DoctorResponse> getPublicDoctors(Long departmentId, String search, int page, int size);
    DoctorResponse getDoctorById(Long id);
}

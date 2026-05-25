package com.caretriage.service;

import com.caretriage.dto.request.MedicalRecordRequest;
import com.caretriage.dto.response.MedicalRecordResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MedicalRecordService {
    MedicalRecordResponse createRecord(MedicalRecordRequest request, String doctorEmail);
    
    MedicalRecordResponse getRecordById(Long id, String userEmail);
    
    List<MedicalRecordResponse> getPatientHistory(Long patientId, String userEmail);
    
    Page<MedicalRecordResponse> getPatientHistoryPaged(Long patientId, Pageable pageable);
}

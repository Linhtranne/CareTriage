package com.caretriage.application.service;

import com.caretriage.application.dto.EHRDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface EHRService {

    EHRDto.ExtractionResultDto extractFromText(String text, Long patientId, Long doctorId, String noteType);

    EHRDto.ExtractionResultDto extractFromFile(MultipartFile file, Long patientId, Long doctorId, String noteType);

    List<EHRDto.ClinicalNoteDto> getNotesByPatient(Long patientId);

    EHRDto.ExtractionResultDto getEntitiesByNoteId(Long noteId);

    EHRDto.PatientEHRSummaryDto getPatientEHRSummary(Long patientId);

    void deleteNote(Long noteId, Long userId);

    List<EHRDto.PatientSearchResultDto> searchPatients(EHRDto.SearchCriteria criteria, int page, int size);

    EHRDto.EHRStatisticsDto getStatistics();
}

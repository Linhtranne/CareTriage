package com.caretriage.controller;

import com.caretriage.dto.EHRDto;
import com.caretriage.service.EHRService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ehr")
@RequiredArgsConstructor
public class EHRController {

    private final EHRService ehrService;

    /**
     * Extract medical entities from clinical note text.
     * Access: DOCTOR, ADMIN
     */
    @PostMapping("/extract")
    public ResponseEntity<EHRDto.ExtractionResultDto> extractFromText(
            @RequestBody EHRDto.ExtractTextRequest request) {
        EHRDto.ExtractionResultDto result = ehrService.extractFromText(
                request.getText(),
                request.getPatientId(),
                1L, // TODO: get from SecurityContext
                request.getNoteType()
        );
        return ResponseEntity.ok(result);
    }

    /**
     * Extract medical entities from uploaded PDF/Word file.
     * Access: DOCTOR, ADMIN
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<EHRDto.ExtractionResultDto> extractFromFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientId") Long patientId,
            @RequestParam(value = "noteType", defaultValue = "PROGRESS") String noteType) {
        EHRDto.ExtractionResultDto result = ehrService.extractFromFile(
                file,
                patientId,
                1L, // TODO: get from SecurityContext
                noteType
        );
        return ResponseEntity.ok(result);
    }

    /**
     * Get all clinical notes for a patient.
     * Access: DOCTOR, PATIENT(own)
     */
    @GetMapping("/notes/{patientId}")
    public ResponseEntity<List<EHRDto.ClinicalNoteDto>> getNotesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ehrService.getNotesByPatient(patientId));
    }

    /**
     * Get extracted entities for a specific clinical note.
     * Access: DOCTOR, PATIENT(own)
     */
    @GetMapping("/entities/{noteId}")
    public ResponseEntity<EHRDto.ExtractionResultDto> getEntitiesByNote(@PathVariable Long noteId) {
        return ResponseEntity.ok(ehrService.getEntitiesByNoteId(noteId));
    }

    /**
     * Advanced search: find patients by symptoms, medications, conditions.
     * Access: DOCTOR, ADMIN
     * Example: GET /api/ehr/search?symptom=đau đầu&medication=paracetamol&condition=cao huyết áp
     */
    @GetMapping("/search")
    public ResponseEntity<List<Long>> searchPatients(
            @RequestParam(required = false) String symptom,
            @RequestParam(required = false) String medication,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String severity) {

        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder()
                .symptom(symptom)
                .medication(medication)
                .condition(condition)
                .dateFrom(dateFrom)
                .dateTo(dateTo)
                .severity(severity)
                .build();

        return ResponseEntity.ok(ehrService.searchPatients(criteria));
    }

    /**
     * Get EHR statistics: top medications, conditions, symptoms.
     * Access: DOCTOR, ADMIN
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        return ResponseEntity.ok(ehrService.getStatistics());
    }
}

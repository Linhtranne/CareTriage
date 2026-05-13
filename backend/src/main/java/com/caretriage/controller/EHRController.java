package com.caretriage.controller;

import com.caretriage.dto.EHRDto;
import com.caretriage.entity.User;
import com.caretriage.repository.UserRepository;
import com.caretriage.service.EHRService;
import com.caretriage.util.FileValidationUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ehr")
@RequiredArgsConstructor
@Slf4j
public class EHRController {

    private final EHRService ehrService;
    private final UserRepository userRepository;

    /**
     * Extract medical entities from clinical note text.
     * Access: DOCTOR, ADMIN
     */
    @PostMapping("/extract")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<EHRDto.ExtractionResultDto> extractFromText(
            @Valid @RequestBody EHRDto.ExtractTextRequest request,
            Authentication authentication) {
        Long doctorId = getUserId(authentication);
        EHRDto.ExtractionResultDto result = ehrService.extractFromText(
                request.getText(),
                request.getPatientId(),
                doctorId,
                request.getNoteType());
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Extract medical entities from uploaded PDF/Word file.
     * Access: DOCTOR, ADMIN
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<EHRDto.ExtractionResultDto> extractFromFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientId") Long patientId,
            @RequestParam(value = "noteType", defaultValue = "PROGRESS") String noteType,
            Authentication authentication) {
        
        if (!FileValidationUtil.isValidEhrFile(file)) {
            log.warn("Invalid file upload attempt: {}", file.getOriginalFilename());
            return ResponseEntity.badRequest().build();
        }

        Long doctorId = getUserId(authentication);
        EHRDto.ExtractionResultDto result = ehrService.extractFromFile(
                file,
                patientId,
                doctorId,
                noteType);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    /**
     * Get all clinical notes for a patient.
     * Access: DOCTOR, ADMIN, PATIENT(own)
     */
    @GetMapping("/notes/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN') or @userSecurity.isPatient(#patientId)")
    public ResponseEntity<List<EHRDto.ClinicalNoteDto>> getNotesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ehrService.getNotesByPatient(patientId));
    }

    /**
     * Get extracted entities for a specific clinical note.
     * Access: DOCTOR, ADMIN, PATIENT(own)
     */
    @GetMapping("/entities/{noteId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN', 'PATIENT')")
    public ResponseEntity<EHRDto.ExtractionResultDto> getEntitiesByNote(@PathVariable Long noteId) {
        return ResponseEntity.ok(ehrService.getEntitiesByNoteId(noteId));
    }

    /**
     * Get EHR summary for a patient.
     * Access: DOCTOR, ADMIN, PATIENT(own)
     */
    @GetMapping("/summary/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN') or @userSecurity.isPatient(#patientId)")
    public ResponseEntity<EHRDto.PatientEHRSummaryDto> getPatientEHRSummary(@PathVariable Long patientId) {
        return ResponseEntity.ok(ehrService.getPatientEHRSummary(patientId));
    }

    /**
     * Delete (archive) a clinical note.
     * Access: DOCTOR(owner), ADMIN
     */
    @DeleteMapping("/notes/{noteId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<Void> deleteNote(@PathVariable Long noteId, Authentication authentication) {
        Long userId = getUserId(authentication);
        ehrService.deleteNote(noteId, userId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Advanced search: find patients by symptoms, medications, conditions.
     * Access: DOCTOR, ADMIN
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<List<EHRDto.PatientSearchResultDto>> searchPatients(
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
     * Get EHR statistics.
     * Access: DOCTOR, ADMIN
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<EHRDto.EHRStatisticsDto> getStatistics() {
        return ResponseEntity.ok(ehrService.getStatistics());
    }

    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}

package com.caretriage.presentation.controller;

import com.caretriage.application.dto.EHRDto;
import com.caretriage.application.dto.response.ApiResponse;
import com.caretriage.domain.entity.User;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.application.service.EHRService;
import com.caretriage.shared.utils.FileValidationUtil;
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
    public ResponseEntity<ApiResponse<EHRDto.ExtractionResultDto>> extractFromText(
            @Valid @RequestBody EHRDto.ExtractTextRequest request,
            Authentication authentication) {
        Long doctorId = getUserId(authentication);
        EHRDto.ExtractionResultDto result = ehrService.extractFromText(
                request.getText(),
                request.getPatientId(),
                doctorId,
                request.getNoteType());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Trích xuất ghi chú lâm sàng thành công", result));
    }

    /**
     * Extract medical entities from uploaded PDF/Word file.
     * Access: DOCTOR, ADMIN
     */
    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<EHRDto.ExtractionResultDto>> extractFromFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("patientId") Long patientId,
            @RequestParam(value = "noteType", defaultValue = "PROGRESS") String noteType,
            Authentication authentication) {
        
        if (!FileValidationUtil.isValidEhrFile(file)) {
            log.warn("Invalid file upload attempt: {}", file.getOriginalFilename());
            return ResponseEntity.badRequest().body(ApiResponse.error("File tải lên không hợp lệ. Chỉ hỗ trợ PDF, Word và văn bản TXT."));
        }

        Long doctorId = getUserId(authentication);
        EHRDto.ExtractionResultDto result = ehrService.extractFromFile(
                file,
                patientId,
                doctorId,
                noteType);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tải tập tin và trích xuất thành công", result));
    }

    /**
     * Get all clinical notes for a patient.
     * Access: DOCTOR, ADMIN, PATIENT(own)
     */
    @GetMapping("/notes/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN') or @userSecurity.isPatient(#patientId)")
    public ResponseEntity<ApiResponse<List<EHRDto.ClinicalNoteDto>>> getNotesByPatient(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách ghi chú thành công", ehrService.getNotesByPatient(patientId)));
    }

    /**
     * Get extracted entities for a specific clinical note.
     * Access: DOCTOR, ADMIN, PATIENT(own)
     */
    @GetMapping("/entities/{noteId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN') or @userSecurity.isPatientOwnerOfNote(#noteId)")
    public ResponseEntity<ApiResponse<EHRDto.ExtractionResultDto>> getEntitiesByNote(@PathVariable Long noteId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy thực thể y khoa thành công", ehrService.getEntitiesByNoteId(noteId)));
    }

    /**
     * Get EHR summary for a patient.
     * Access: DOCTOR, ADMIN, PATIENT(own)
     */
    @GetMapping("/summary/{patientId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN') or @userSecurity.isPatient(#patientId)")
    public ResponseEntity<ApiResponse<EHRDto.PatientEHRSummaryDto>> getPatientEHRSummary(@PathVariable Long patientId) {
        return ResponseEntity.ok(ApiResponse.success("Lấy tóm tắt bệnh án thành công", ehrService.getPatientEHRSummary(patientId)));
    }

    /**
     * Delete (archive) a clinical note.
     * Access: DOCTOR(owner), ADMIN
     */
    @DeleteMapping("/notes/{noteId}")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteNote(@PathVariable Long noteId, Authentication authentication) {
        Long userId = getUserId(authentication);
        ehrService.deleteNote(noteId, userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa ghi chú lâm sàng thành công"));
    }

    /**
     * Advanced search: find patients by symptoms, medications, conditions.
     * Access: DOCTOR, ADMIN
     */
    @GetMapping("/search")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EHRDto.PatientSearchResultDto>>> searchPatients(
            @RequestParam(required = false) String symptom,
            @RequestParam(required = false) String medication,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String severity,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        if (page < 0) {
            throw new IllegalArgumentException("Page index must not be less than zero");
        }
        if (size <= 0) {
            throw new IllegalArgumentException("Page size must be greater than zero");
        }

        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder()
                .symptom(symptom)
                .medication(medication)
                .condition(condition)
                .dateFrom(dateFrom)
                .dateTo(dateTo)
                .severity(severity)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Tìm kiếm bệnh nhân thành công", ehrService.searchPatients(criteria, page, size)));
    }

    /**
     * Get EHR statistics.
     * Access: DOCTOR, ADMIN
     */
    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('DOCTOR', 'ADMIN')")
    public ResponseEntity<ApiResponse<EHRDto.EHRStatisticsDto>> getStatistics() {
        return ResponseEntity.ok(ApiResponse.success("Lấy số liệu thống kê thành công", ehrService.getStatistics()));
    }

    private Long getUserId(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return user.getId();
    }
}

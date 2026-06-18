package com.caretriage.application.service.impl;

import com.caretriage.application.ai.service.DocumentExtractionService;
import com.caretriage.application.dto.EHRDto;
import com.caretriage.domain.entity.*;
import com.caretriage.domain.repository.*;
import com.caretriage.application.service.EHRService;
import com.caretriage.shared.exception.DocumentParsingException;
import com.caretriage.shared.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

/**
 * EHR service implementation that uses Java-native document extraction.
 * Does NOT call Python AI service or WebClient for EHR operations.
 */
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class EHRServiceImpl implements EHRService {

    private final ClinicalNoteRepository clinicalNoteRepository;
    private final ExtractedEntityRepository extractedEntityRepository;
    private final PatientMedicationRepository patientMedicationRepository;
    private final PatientConditionRepository patientConditionRepository;
    private final PatientSymptomRepository patientSymptomRepository;
    private final UserRepository userRepository;
    private final DocumentExtractionService documentExtractionService;
    private final EhrExtractionPersistenceService ehrExtractionPersistenceService;

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Extract medical entities from plain text.
     * AI call is intentionally outside @Transactional to prevent connection pool exhaustion.
     */
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public EHRDto.ExtractionResultDto extractFromText(String text, Long patientId, Long doctorId, String noteType) {
        log.info("Starting EHR extraction from text for patient {} by doctor {}", patientId, doctorId);

        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        ClinicalNote note = ehrExtractionPersistenceService.createInitialNote(patient, doctor, parseNoteType(noteType), text, "TEXT", null);

        try {
            DocumentExtractionService.ExtractionOutput output = documentExtractionService.extractFromText(text);
            return ehrExtractionPersistenceService.saveAndProcessResult(note.getId(), output, patient, doctor);
        } catch (RuntimeException e) {
            ehrExtractionPersistenceService.markNoteFailed(note.getId(), "ENTITY_EXTRACTION_FAILED");
            throw e;
        }
    }

    /**
     * Extract medical entities from an uploaded file.
     * AI call is intentionally outside @Transactional.
     */
    @Override
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public EHRDto.ExtractionResultDto extractFromFile(MultipartFile file, Long patientId, Long doctorId, String noteType) {
        log.info("Starting EHR extraction from file for patient {}", patientId);

        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        byte[] fileBytes;
        try {
            fileBytes = file.getBytes();
        } catch (IOException e) {
            throw new DocumentParsingException("Failed to read uploaded file", e);
        }

        ClinicalNote note = ehrExtractionPersistenceService.createInitialNote(
                patient, doctor, parseNoteType(noteType), null,
                getFileExtension(file.getOriginalFilename()), null);

        try {
            DocumentExtractionService.ExtractionOutput output = documentExtractionService.extractFromFile(
                    fileBytes, file.getOriginalFilename(), file.getContentType());

            // Update note with extracted text
            if (output.rawText() != null && !output.rawText().isBlank()) {
                ehrExtractionPersistenceService.updateNoteRawText(note.getId(), output.rawText());
            }

            return ehrExtractionPersistenceService.saveAndProcessResult(note.getId(), output, patient, doctor);
        } catch (RuntimeException e) {
            ehrExtractionPersistenceService.markNoteFailed(note.getId(), "DOCUMENT_PARSE_FAILED");
            throw e;
        }
    }

    @Override
    public List<EHRDto.ClinicalNoteDto> getNotesByPatient(Long patientId) {
        return clinicalNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .filter(note -> note.getExtractionStatus() != ClinicalNote.ExtractionStatus.ARCHIVED)
                .map(this::toNoteDto)
                .collect(Collectors.toList());
    }

    @Override
    public EHRDto.ExtractionResultDto getEntitiesByNoteId(Long noteId) {
        ClinicalNote note = clinicalNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Clinical note not found: " + noteId));

        List<ExtractedEntity> entities = extractedEntityRepository.findByClinicalNoteId(noteId);

        return EHRDto.ExtractionResultDto.builder()
                .clinicalNoteId(noteId)
                .rawText(note.getRawText())
                .noteType(note.getNoteType().name())
                .extractionStatus(note.getExtractionStatus().name())
                .createdAt(note.getCreatedAt())
                .entities(entities.stream().map(this::toEntityDto).collect(Collectors.toList()))
                .medications(filterByType(entities, ExtractedEntity.EntityType.MEDICATION))
                .symptoms(filterByType(entities, ExtractedEntity.EntityType.SYMPTOM))
                .conditions(filterByType(entities, ExtractedEntity.EntityType.CONDITION))
                .dosages(filterByType(entities, ExtractedEntity.EntityType.DOSAGE))
                .labTests(filterByType(entities, ExtractedEntity.EntityType.LAB_TEST))
                .procedures(filterByType(entities, ExtractedEntity.EntityType.PROCEDURE))
                .build();
    }

    @Override
    public EHRDto.PatientEHRSummaryDto getPatientEHRSummary(Long patientId) {
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));

        long totalNotes = clinicalNoteRepository.countByPatientId(patientId);

        List<EHRDto.PatientMedicationDto> activeMeds = patientMedicationRepository
                .findByPatientIdAndStatus(patientId, PatientMedication.MedicationStatus.ACTIVE)
                .stream().map(this::toMedicationDto).collect(Collectors.toList());

        List<EHRDto.PatientConditionDto> activeConds = patientConditionRepository
                .findByPatientIdAndStatus(patientId, PatientCondition.ConditionStatus.ACTIVE)
                .stream().map(this::toConditionDto).collect(Collectors.toList());

        List<EHRDto.PatientSymptomDto> recentSymptoms = patientSymptomRepository
                .findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream().limit(5).map(this::toSymptomDto).collect(Collectors.toList());

        return EHRDto.PatientEHRSummaryDto.builder()
                .patientId(patientId)
                .patientName(patient.getFullName())
                .totalNotes(totalNotes)
                .activeMedications(activeMeds)
                .activeConditions(activeConds)
                .recentSymptoms(recentSymptoms)
                .build();
    }

    @Override
    @Transactional
    public void deleteNote(Long noteId, Long userId) {
        ClinicalNote note = clinicalNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Note not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        boolean isAdmin = user.getRoles().stream()
                .anyMatch(r -> r.getName().equals("ROLE_ADMIN"));
        boolean isOwner = note.getDoctor().getId().equals(userId);

        if (!isAdmin && !isOwner) {
            throw new AccessDeniedException("Unauthorized to delete this note");
        }

        note.setExtractionStatus(ClinicalNote.ExtractionStatus.ARCHIVED);
        clinicalNoteRepository.save(note);
        log.info("Note {} archived by user {}", noteId, userId);
    }

    @Override
    public List<EHRDto.PatientSearchResultDto> searchPatients(EHRDto.SearchCriteria criteria, int page, int size) {
        // Validate severity if provided
        if (criteria.getSeverity() != null && !criteria.getSeverity().isBlank()) {
            try {
                PatientSymptom.Severity.valueOf(criteria.getSeverity().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid severity: '" + criteria.getSeverity() + "'. Valid values are: MILD, MODERATE, SEVERE.");
            }
        }

        LocalDate dateFrom = parseLocalDate(criteria.getDateFrom());
        LocalDate dateTo = parseLocalDate(criteria.getDateTo());

        if (dateFrom != null && dateTo != null && dateFrom.isAfter(dateTo)) {
            throw new IllegalArgumentException("dateFrom must be before or equal to dateTo");
        }

        org.springframework.data.jpa.domain.Specification<com.caretriage.infrastructure.persistence.entity.UserJpaEntity> spec =
                com.caretriage.domain.repository.specification.EHRSpecification.searchPatients(
                        criteria.getSymptom(),
                        criteria.getMedication(),
                        criteria.getCondition(),
                        criteria.getSeverity(),
                        dateFrom,
                        dateTo,
                        criteria.isEmpty()
                );

        int pageSize = Math.min(size, 100);
        Pageable pageable = PageRequest.of(page, pageSize);
        Page<User> patientsPage = userRepository.findAll(spec, pageable);

        return patientsPage.getContent().stream()
                .map(patient -> toPatientSearchResult(patient, criteria))
                .collect(Collectors.toList());
    }

    @Override
    public EHRDto.EHRStatisticsDto getStatistics() {
        long totalNotes = clinicalNoteRepository.count();
        long completedNotes = clinicalNoteRepository.countByExtractionStatus(ClinicalNote.ExtractionStatus.COMPLETED);
        long failedNotes = clinicalNoteRepository.countByExtractionStatus(ClinicalNote.ExtractionStatus.FAILED);

        List<EHRDto.EntityFrequencyDto> topMeds = patientMedicationRepository.findTopMedications().stream()
                .limit(10)
                .map(row -> EHRDto.EntityFrequencyDto.builder()
                        .name((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<EHRDto.EntityFrequencyDto> topConds = patientConditionRepository.findTopConditions().stream()
                .limit(10)
                .map(row -> EHRDto.EntityFrequencyDto.builder()
                        .name((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        List<EHRDto.EntityFrequencyDto> topSymptoms = patientSymptomRepository.findTopSymptoms().stream()
                .limit(10)
                .map(row -> EHRDto.EntityFrequencyDto.builder()
                        .name((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        return EHRDto.EHRStatisticsDto.builder()
                .totalNotes(totalNotes)
                .completedNotes(completedNotes)
                .failedNotes(failedNotes)
                .topMedications(topMeds)
                .topConditions(topConds)
                .topSymptoms(topSymptoms)
                .build();
    }

    // ─── Mapper Helpers ───────────────────────────────────────────────────────

    private EHRDto.PatientSearchResultDto toPatientSearchResult(User patient, EHRDto.SearchCriteria criteria) {
        long totalNotes = clinicalNoteRepository.countByPatientId(patient.getId());

        List<String> medications = (criteria != null && criteria.getMedication() != null && !criteria.getMedication().isBlank())
                ? patientMedicationRepository.findByPatientIdAndStatus(patient.getId(), PatientMedication.MedicationStatus.ACTIVE)
                        .stream()
                        .map(PatientMedication::getMedicationName)
                        .filter(name -> name.toLowerCase().contains(criteria.getMedication().toLowerCase()))
                        .collect(Collectors.toList())
                : Collections.emptyList();

        List<String> conditions = (criteria != null && criteria.getCondition() != null && !criteria.getCondition().isBlank())
                ? patientConditionRepository.findByPatientIdAndStatus(patient.getId(), PatientCondition.ConditionStatus.ACTIVE)
                        .stream()
                        .map(PatientCondition::getConditionName)
                        .filter(name -> name.toLowerCase().contains(criteria.getCondition().toLowerCase()))
                        .collect(Collectors.toList())
                : Collections.emptyList();

        List<String> symptoms = (criteria != null && criteria.getSymptom() != null && !criteria.getSymptom().isBlank())
                ? patientSymptomRepository.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                        .stream()
                        .map(PatientSymptom::getSymptomName)
                        .filter(name -> name.toLowerCase().contains(criteria.getSymptom().toLowerCase()))
                        .collect(Collectors.toList())
                : Collections.emptyList();

        return EHRDto.PatientSearchResultDto.builder()
                .patientId(patient.getId())
                .patientName(patient.getFullName())
                .email(patient.getEmail())
                .totalNotes(totalNotes)
                .matchedSymptoms(symptoms)
                .matchedMedications(medications)
                .matchedConditions(conditions)
                .build();
    }

    private List<EHRDto.ExtractedEntityDto> filterByType(
            List<ExtractedEntity> entities, ExtractedEntity.EntityType type) {
        return entities.stream()
                .filter(e -> e.getEntityType() == type)
                .map(this::toEntityDto)
                .collect(Collectors.toList());
    }

    private EHRDto.ExtractedEntityDto toEntityDto(ExtractedEntity entity) {
        return EHRDto.ExtractedEntityDto.builder()
                .entityType(entity.getEntityType().name())
                .entityValue(entity.getEntityValue())
                .normalizedValue(entity.getNormalizedValue())
                .confidenceScore(entity.getConfidenceScore())
                .startPosition(entity.getStartPosition())
                .endPosition(entity.getEndPosition())
                .build();
    }

    private EHRDto.ClinicalNoteDto toNoteDto(ClinicalNote note) {
        return EHRDto.ClinicalNoteDto.builder()
                .id(note.getId())
                .patientId(note.getPatient().getId())
                .doctorId(note.getDoctor().getId())
                .noteType(note.getNoteType().name())
                .rawText(note.getRawText() != null && note.getRawText().length() > 200
                        ? note.getRawText().substring(0, 200) + "..."
                        : note.getRawText())
                .fileType(note.getFileType())
                .extractionStatus(note.getExtractionStatus().name())
                .createdAt(note.getCreatedAt() != null ? note.getCreatedAt().toString() : null)
                .entityCount(note.getExtractedEntities() != null ? note.getExtractedEntities().size() : 0)
                .build();
    }

    private EHRDto.PatientMedicationDto toMedicationDto(PatientMedication med) {
        return EHRDto.PatientMedicationDto.builder()
                .id(med.getId())
                .medicationName(med.getMedicationName())
                .dosage(med.getDosage())
                .frequency(med.getFrequency())
                .status(med.getStatus().name())
                .startDate(med.getStartDate() != null ? med.getStartDate().toString() : null)
                .build();
    }

    private EHRDto.PatientConditionDto toConditionDto(PatientCondition cond) {
        return EHRDto.PatientConditionDto.builder()
                .id(cond.getId())
                .conditionName(cond.getConditionName())
                .severity(cond.getSeverity().name())
                .status(cond.getStatus().name())
                .diagnosedDate(cond.getDiagnosedDate() != null ? cond.getDiagnosedDate().toString() : null)
                .build();
    }

    private EHRDto.PatientSymptomDto toSymptomDto(PatientSymptom sym) {
        return EHRDto.PatientSymptomDto.builder()
                .id(sym.getId())
                .symptomName(sym.getSymptomName())
                .severity(sym.getSeverity().name())
                .onsetDate(sym.getOnsetDate() != null ? sym.getOnsetDate().toString() : null)
                .build();
    }

    // ─── Utility Helpers ──────────────────────────────────────────────────────

    private ClinicalNote.NoteType parseNoteType(String noteType) {
        if (noteType == null || noteType.isBlank()) return ClinicalNote.NoteType.PROGRESS;
        try {
            return ClinicalNote.NoteType.valueOf(noteType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid note type: '" + noteType + "'. Valid values are: ADMISSION, PROGRESS, DISCHARGE, CONSULTATION, PRESCRIPTION.");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "UNKNOWN";
        return filename.substring(filename.lastIndexOf(".") + 1).toUpperCase();
    }

    private LocalDate parseLocalDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) return null;
        try {
            return LocalDate.parse(dateStr);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("Invalid date format: '" + dateStr + "'. Expected format: YYYY-MM-DD.");
        }
    }
}


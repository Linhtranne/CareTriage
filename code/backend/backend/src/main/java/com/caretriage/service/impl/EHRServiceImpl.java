package com.caretriage.service.impl;

import com.caretriage.dto.EHRDto;
import com.caretriage.entity.*;
import com.caretriage.repository.*;
import com.caretriage.repository.specification.EHRSpecification;
import com.caretriage.service.EHRService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
@RequiredArgsConstructor
@Slf4j
public class EHRServiceImpl implements EHRService {

    private final ClinicalNoteRepository clinicalNoteRepository;
    private final ExtractedEntityRepository extractedEntityRepository;
    private final PatientMedicationRepository patientMedicationRepository;
    private final PatientConditionRepository patientConditionRepository;
    private final PatientSymptomRepository patientSymptomRepository;
    private final UserRepository userRepository;
    private final WebClient aiServiceWebClient;

    // ─── Public API ───────────────────────────────────────────────────────────

    /**
     * Extract medical entities from plain text.
     * AI call is intentionally outside @Transactional to prevent connection pool exhaustion.
     */
    @Override
    public EHRDto.ExtractionResultDto extractFromText(String text, Long patientId, Long doctorId, String noteType) {
        log.info("Starting EHR extraction from text for patient {} by doctor {}", patientId, doctorId);

        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        ClinicalNote note = createInitialNote(patient, doctor, parseNoteType(noteType), text, "TEXT", null);

        try {
            Map<String, Object> aiResponse = callAiExtractText(text);
            return saveAndProcessResult(note.getId(), aiResponse, patientId, doctorId);
        } catch (Exception e) {
            handleExtractionFailure(note.getId(), e);
            throw new RuntimeException("EHR extraction failed: " + e.getMessage());
        }
    }

    /**
     * Extract medical entities from an uploaded file.
     * AI call is intentionally outside @Transactional.
     */
    @Override
    public EHRDto.ExtractionResultDto extractFromFile(MultipartFile file, Long patientId, Long doctorId, String noteType) {
        log.info("Starting EHR extraction from file {} for patient {}", file.getOriginalFilename(), patientId);

        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new RuntimeException("Patient not found"));
        User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        ClinicalNote note = createInitialNote(
                patient, doctor, parseNoteType(noteType), null, getFileExtension(file.getOriginalFilename()), null);

        try {
            Map<String, Object> aiResponse = callAiExtractFile(file);

            if (aiResponse.containsKey("result")) {
                Map<String, Object> result = asStringObjectMap(aiResponse.get("result"));
                String extractedText = (String) result.get("raw_text");
                updateNoteRawText(note.getId(), extractedText);
            }

            return saveAndProcessResult(note.getId(), aiResponse, patientId, doctorId);
        } catch (Exception e) {
            handleExtractionFailure(note.getId(), e);
            throw new RuntimeException("EHR file extraction failed: " + e.getMessage());
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
            throw new RuntimeException("Unauthorized to delete this note");
        }

        note.setExtractionStatus(ClinicalNote.ExtractionStatus.ARCHIVED);
        clinicalNoteRepository.save(note);
        log.info("Note {} archived by user {}", noteId, userId);
    }

    @Override
    public List<EHRDto.PatientSearchResultDto> searchPatients(EHRDto.SearchCriteria criteria, int page, int size) {
        if (criteria.isEmpty()) {
            return Collections.emptyList();
        }

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

        Specification<User> spec = EHRSpecification.searchPatients(
                criteria.getSymptom(),
                criteria.getMedication(),
                criteria.getCondition(),
                criteria.getSeverity(),
                dateFrom,
                dateTo
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

    // ─── Private Transactional Helpers ────────────────────────────────────────

    @Transactional
    private ClinicalNote createInitialNote(
            User patient, User doctor, ClinicalNote.NoteType type,
            String text, String fileType, String filePath) {
        ClinicalNote note = ClinicalNote.builder()
                .patient(patient)
                .doctor(doctor)
                .noteType(type)
                .rawText(text)
                .fileType(fileType)
                .filePath(filePath)
                .extractionStatus(ClinicalNote.ExtractionStatus.PROCESSING)
                .build();
        return clinicalNoteRepository.save(note);
    }

    @Transactional
    private void updateNoteRawText(Long noteId, String text) {
        clinicalNoteRepository.findById(noteId).ifPresent(note -> {
            note.setRawText(text);
            clinicalNoteRepository.save(note);
        });
    }

    @Transactional
    private void handleExtractionFailure(Long noteId, Exception e) {
        clinicalNoteRepository.findById(noteId).ifPresent(note -> {
            note.setExtractionStatus(ClinicalNote.ExtractionStatus.FAILED);
            clinicalNoteRepository.save(note);
            log.error("EHR extraction failed for note {}: {}", noteId, e.getMessage());
        });
    }

    @Transactional
    private EHRDto.ExtractionResultDto saveAndProcessResult(
            Long noteId, Map<String, Object> aiResponse, Long patientId, Long doctorId) {

        ClinicalNote note = clinicalNoteRepository.findById(noteId).orElseThrow();
        User patient = userRepository.findById(patientId).orElseThrow();
        User doctor = userRepository.findById(doctorId).orElseThrow();

        Map<String, Object> result = asStringObjectMap(aiResponse.get("result"));
        List<Map<String, Object>> entitiesData = asListOfStringObjectMap(result.get("entities"));

        List<ExtractedEntity> savedEntities = new ArrayList<>();
        ObjectMapper mapper = new ObjectMapper();

        if (entitiesData != null) {
            for (Map<String, Object> ed : entitiesData) {
                try {
                    String entityTypeStr = (String) ed.get("entity_type");
                    if (entityTypeStr == null) {
                        log.warn("Missing entity_type in AI response entity data");
                        continue;
                    }
                    ExtractedEntity.EntityType entityType;
                    try {
                        entityType = ExtractedEntity.EntityType.valueOf(entityTypeStr.toUpperCase());
                    } catch (IllegalArgumentException e) {
                        log.warn("Invalid entity_type '{}' in AI response entity data, skipping", entityTypeStr);
                        continue;
                    }

                    String entityValue = (String) ed.get("entity_value");
                    if (entityValue == null || entityValue.isBlank()) {
                        log.warn("Missing or empty entity_value in AI response entity data");
                        continue;
                    }

                    String metadataJson = null;
                    Object metadataObj = ed.get("metadata");
                    if (metadataObj instanceof Map<?, ?> metadataMap) {
                        try {
                            metadataJson = mapper.writeValueAsString(metadataMap);
                        } catch (Exception ex) {
                            log.warn("Failed to serialize metadata map to JSON string", ex);
                        }
                    }

                    ExtractedEntity entity = ExtractedEntity.builder()
                            .clinicalNote(note)
                            .entityType(entityType)
                            .entityValue(entityValue)
                            .normalizedValue((String) ed.get("normalized_value"))
                            .confidenceScore(ed.get("confidence_score") != null
                                    ? ((Number) ed.get("confidence_score")).doubleValue()
                                    : 0.8)
                            .startPosition(ed.get("start_position") != null
                                    ? ((Number) ed.get("start_position")).intValue() : null)
                            .endPosition(ed.get("end_position") != null
                                    ? ((Number) ed.get("end_position")).intValue() : null)
                            .metadata(metadataJson)
                            .build();

                    ExtractedEntity saved = extractedEntityRepository.save(entity);
                    savedEntities.add(saved);
                    saveToStructuredTable(saved, patient, note, doctor, asStringObjectMap(metadataObj));
                } catch (Exception e) {
                    log.error("Failed to parse and save single AI extracted entity safely (PII redacted): {}", e.getMessage());
                }
            }
        }

        note.setExtractionStatus(ClinicalNote.ExtractionStatus.COMPLETED);
        clinicalNoteRepository.save(note);

        return EHRDto.ExtractionResultDto.builder()
                .clinicalNoteId(note.getId())
                .rawText(note.getRawText())
                .noteType(note.getNoteType().name())
                .extractionStatus("COMPLETED")
                .createdAt(note.getCreatedAt())
                .entities(savedEntities.stream().map(this::toEntityDto).collect(Collectors.toList()))
                .medications(filterByType(savedEntities, ExtractedEntity.EntityType.MEDICATION))
                .symptoms(filterByType(savedEntities, ExtractedEntity.EntityType.SYMPTOM))
                .conditions(filterByType(savedEntities, ExtractedEntity.EntityType.CONDITION))
                .dosages(filterByType(savedEntities, ExtractedEntity.EntityType.DOSAGE))
                .labTests(filterByType(savedEntities, ExtractedEntity.EntityType.LAB_TEST))
                .procedures(filterByType(savedEntities, ExtractedEntity.EntityType.PROCEDURE))
                .build();
    }

    private void saveToStructuredTable(ExtractedEntity entity, User patient, ClinicalNote note, User doctor, Map<String, Object> metadata) {
        String name = entity.getNormalizedValue() != null
                ? entity.getNormalizedValue() : entity.getEntityValue();
        switch (entity.getEntityType()) {
            case MEDICATION -> {
                String dosage = null;
                String frequency = null;
                String route = null;
                LocalDate startDate = LocalDate.now();
                LocalDate endDate = null;
                PatientMedication.MedicationStatus status = PatientMedication.MedicationStatus.ACTIVE;

                if (metadata != null) {
                    dosage = getMetadataString(metadata, "dosage", "linked_dosage", "dose");
                    frequency = getMetadataString(metadata, "frequency");
                    route = getMetadataString(metadata, "route");
                    
                    LocalDate parsedStart = getMetadataDate(metadata, "start_date", "startDate", "start");
                    if (parsedStart != null) {
                        startDate = parsedStart;
                    }
                    endDate = getMetadataDate(metadata, "end_date", "endDate", "end");
                    
                    String statusStr = getMetadataString(metadata, "status");
                    if (statusStr != null) {
                        try {
                            status = PatientMedication.MedicationStatus.valueOf(statusStr.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            // fallback
                        }
                    }
                }

                patientMedicationRepository.save(PatientMedication.builder()
                        .patient(patient)
                        .clinicalNote(note)
                        .medicationName(name)
                        .prescribingDoctorId(doctor.getId())
                        .dosage(dosage)
                        .frequency(frequency)
                        .route(route)
                        .startDate(startDate)
                        .endDate(endDate)
                        .status(status)
                        .build());
            }
            case CONDITION -> {
                String icdCode = null;
                PatientCondition.Severity severity = PatientCondition.Severity.MODERATE;
                PatientCondition.ConditionStatus status = PatientCondition.ConditionStatus.ACTIVE;
                LocalDate diagnosedDate = LocalDate.now();
                LocalDate resolvedDate = null;
                String notes = null;

                if (metadata != null) {
                    icdCode = getMetadataString(metadata, "icd_code", "icdCode", "icd");
                    notes = getMetadataString(metadata, "notes", "note");
                    
                    LocalDate parsedDiag = getMetadataDate(metadata, "diagnosed_date", "diagnosedDate", "date");
                    if (parsedDiag != null) {
                        diagnosedDate = parsedDiag;
                    }
                    resolvedDate = getMetadataDate(metadata, "resolved_date", "resolvedDate");
                    
                    String severityStr = getMetadataString(metadata, "severity");
                    if (severityStr != null) {
                        try {
                            severity = PatientCondition.Severity.valueOf(severityStr.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            // fallback
                        }
                    }
                    
                    String statusStr = getMetadataString(metadata, "status");
                    if (statusStr != null) {
                        try {
                            status = PatientCondition.ConditionStatus.valueOf(statusStr.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            // fallback
                        }
                    }
                }

                patientConditionRepository.save(PatientCondition.builder()
                        .patient(patient)
                        .clinicalNote(note)
                        .conditionName(name)
                        .icdCode(icdCode)
                        .diagnosedDate(diagnosedDate)
                        .resolvedDate(resolvedDate)
                        .status(status)
                        .severity(severity)
                        .notes(notes)
                        .build());
            }
            case SYMPTOM -> {
                PatientSymptom.Severity severity = PatientSymptom.Severity.MODERATE;
                LocalDate onsetDate = null;
                String duration = null;
                String bodyLocation = null;

                if (metadata != null) {
                    duration = getMetadataString(metadata, "duration");
                    bodyLocation = getMetadataString(metadata, "body_location", "bodyLocation");
                    onsetDate = getMetadataDate(metadata, "onset_date", "onsetDate", "onset");
                    
                    String severityStr = getMetadataString(metadata, "severity");
                    if (severityStr != null) {
                        try {
                            severity = PatientSymptom.Severity.valueOf(severityStr.toUpperCase());
                        } catch (IllegalArgumentException e) {
                            // fallback
                        }
                    }
                }

                patientSymptomRepository.save(PatientSymptom.builder()
                        .patient(patient)
                        .clinicalNote(note)
                        .symptomName(name)
                        .severity(severity)
                        .onsetDate(onsetDate)
                        .duration(duration)
                        .bodyLocation(bodyLocation)
                        .build());
            }
            default -> { /* DOSAGE, LAB_TEST, PROCEDURE stored in extracted_entities only */ }
        }
    }

    private String getMetadataString(Map<String, Object> metadata, String... keys) {
        if (metadata == null) return null;
        for (String key : keys) {
            Object val = metadata.get(key);
            if (val instanceof String s && !s.isBlank()) {
                return s;
            }
        }
        return null;
    }

    private LocalDate getMetadataDate(Map<String, Object> metadata, String... keys) {
        if (metadata == null) return null;
        for (String key : keys) {
            Object val = metadata.get(key);
            if (val instanceof String s && !s.isBlank()) {
                try {
                    return LocalDate.parse(s);
                } catch (DateTimeParseException e) {
                    log.warn("Invalid date format in metadata key '{}': {}", key, s);
                }
            }
        }
        return null;
    }

    // ─── AI Client Helpers ────────────────────────────────────────────────────

    private Map<String, Object> callAiExtractText(String text) {
        Object response = aiServiceWebClient
                .post()
                .uri("/api/ehr/extract-text")
                .bodyValue(Map.of("text", text))
                .retrieve()
                .bodyToMono(Object.class)
                .block(Duration.ofSeconds(30));
        return asStringObjectMap(response);
    }

    private Map<String, Object> callAiExtractFile(MultipartFile file) {
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            }).contentType(MediaType.parseMediaType(
                    file.getContentType() != null ? file.getContentType() : "application/octet-stream"));

            Object response = aiServiceWebClient
                    .post()
                    .uri("/api/ehr/extract-file")
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Object.class)
                    .block(Duration.ofSeconds(30));
            return asStringObjectMap(response);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send file to AI service: " + e.getMessage());
        }
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

    @SuppressWarnings("unchecked")
    private Map<String, Object> asStringObjectMap(Object value) {
        if (!(value instanceof Map<?, ?> rawMap)) return Collections.emptyMap();
        Map<String, Object> result = new HashMap<>();
        for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
            if (entry.getKey() instanceof String key) result.put(key, entry.getValue());
        }
        return result;
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> asListOfStringObjectMap(Object value) {
        if (!(value instanceof List<?> rawList)) return Collections.emptyList();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object item : rawList) {
            Map<String, Object> itemMap = asStringObjectMap(item);
            if (!itemMap.isEmpty()) result.add(itemMap);
        }
        return result;
    }
}

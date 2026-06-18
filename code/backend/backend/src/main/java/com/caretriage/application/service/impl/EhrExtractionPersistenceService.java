package com.caretriage.application.service.impl;

import com.caretriage.application.ai.service.DocumentExtractionService;
import com.caretriage.application.dto.EHRDto;
import com.caretriage.domain.entity.*;
import com.caretriage.domain.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class EhrExtractionPersistenceService {

    private final ClinicalNoteRepository clinicalNoteRepository;
    private final ExtractedEntityRepository extractedEntityRepository;
    private final PatientMedicationRepository patientMedicationRepository;
    private final PatientConditionRepository patientConditionRepository;
    private final PatientSymptomRepository patientSymptomRepository;
    private final ObjectMapper objectMapper;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ClinicalNote createInitialNote(
            User patient, User doctor, ClinicalNote.NoteType type,
            String text, String fileType, String filePath) {
        ClinicalNote note = ClinicalNote.builder()
                .patient(com.caretriage.infrastructure.persistence.mapper.UserMapper.INSTANCE.toEntity(patient))
                .doctor(com.caretriage.infrastructure.persistence.mapper.UserMapper.INSTANCE.toEntity(doctor))
                .noteType(type)
                .rawText(text)
                .fileType(fileType)
                .filePath(filePath)
                .extractionStatus(ClinicalNote.ExtractionStatus.PROCESSING)
                .build();
        return clinicalNoteRepository.save(note);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateNoteRawText(Long noteId, String text) {
        clinicalNoteRepository.findById(noteId).ifPresent(note -> {
            note.setRawText(text);
            clinicalNoteRepository.save(note);
        });
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markNoteFailed(Long noteId, String errorCode) {
        clinicalNoteRepository.findById(noteId).ifPresent(note -> {
            note.setExtractionStatus(ClinicalNote.ExtractionStatus.FAILED);
            clinicalNoteRepository.save(note);
            log.error("EHR extraction failed for noteId={} code={}", noteId, errorCode);
        });
    }

    @Transactional
    public EHRDto.ExtractionResultDto saveAndProcessResult(
            Long noteId, DocumentExtractionService.ExtractionOutput output,
            User patient, User doctor) {

        ClinicalNote note = clinicalNoteRepository.findById(noteId).orElseThrow();

        List<ExtractedEntity> savedEntities = new ArrayList<>();

        if (output.entities() != null) {
            for (DocumentExtractionService.EntityOutput entityOutput : output.entities()) {
                String entityTypeStr = entityOutput.entityType();
                if (entityTypeStr == null) continue;

                ExtractedEntity.EntityType entityType;
                try {
                    entityType = ExtractedEntity.EntityType.valueOf(entityTypeStr.toUpperCase());
                } catch (IllegalArgumentException e) {
                    continue;
                }

                String entityValue = entityOutput.entityValue();
                if (entityValue == null || entityValue.isBlank()) continue;

                String metadataJson = null;
                if (entityOutput.metadata() != null && !entityOutput.metadata().isEmpty()) {
                    try {
                        metadataJson = objectMapper.writeValueAsString(entityOutput.metadata());
                    } catch (Exception ex) {
                        log.error("Entity metadata serialization failed for noteId={}", noteId);
                        throw new com.caretriage.shared.exception.EHRPersistenceException("Failed to serialize entity metadata", ex);
                    }
                }

                ExtractedEntity entity = ExtractedEntity.builder()
                        .clinicalNote(note)
                        .entityType(entityType)
                        .entityValue(entityValue)
                        .normalizedValue(entityOutput.normalizedValue())
                        .confidenceScore(entityOutput.confidenceScore() != null
                                ? entityOutput.confidenceScore() : 0.8)
                        .startPosition(entityOutput.startPosition())
                        .endPosition(entityOutput.endPosition())
                        .metadata(metadataJson)
                        .build();

                ExtractedEntity saved = extractedEntityRepository.save(entity);
                savedEntities.add(saved);
                saveToStructuredTable(saved, patient, note, doctor, entityOutput.metadata());
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
                .processingTimeMs(output.processingTimeMs())
                .build();
    }

    private void saveToStructuredTable(ExtractedEntity entity, User patient, ClinicalNote note, User doctor, Map<String, Object> metadata) {
        String name = entity.getNormalizedValue() != null
                ? entity.getNormalizedValue() : entity.getEntityValue();
        if (metadata == null) metadata = Map.of();

        switch (entity.getEntityType()) {
            case MEDICATION -> {
                patientMedicationRepository.save(PatientMedication.builder()
                        .patient(com.caretriage.infrastructure.persistence.mapper.UserMapper.INSTANCE.toEntity(patient))
                        .clinicalNote(note)
                        .medicationName(name)
                        .prescribingDoctorId(doctor.getId())
                        .startDate(parseDateSafe(metadata.get("start_date"), LocalDate.now()))
                        .endDate(parseDateSafe(metadata.get("end_date"), null))
                        .dosage(safeString(metadata.get("dosage")))
                        .frequency(safeString(metadata.get("frequency")))
                        .route(safeString(metadata.get("route")))
                        .status(parseMedicationStatus(metadata.get("status")))
                        .build());
            }
            case CONDITION -> {
                patientConditionRepository.save(PatientCondition.builder()
                        .patient(com.caretriage.infrastructure.persistence.mapper.UserMapper.INSTANCE.toEntity(patient))
                        .clinicalNote(note)
                        .conditionName(name)
                        .diagnosedDate(parseDateSafe(metadata.get("diagnosed_date"), LocalDate.now()))
                        .status(parseConditionStatus(metadata.get("status")))
                        .severity(parseConditionSeverity(metadata.get("severity")))
                        .icdCode(safeString(metadata.get("icd_code")))
                        .notes(safeString(metadata.get("notes")))
                        .build());
            }
            case SYMPTOM -> {
                patientSymptomRepository.save(PatientSymptom.builder()
                        .patient(com.caretriage.infrastructure.persistence.mapper.UserMapper.INSTANCE.toEntity(patient))
                        .clinicalNote(note)
                        .symptomName(name)
                        .severity(parseSymptomSeverity(metadata.get("severity")))
                        .onsetDate(parseDateSafe(metadata.get("onset_date"), LocalDate.now()))
                        .duration(safeString(metadata.get("duration")))
                        .bodyLocation(safeString(metadata.get("body_location")))
                        .build());
            }
            default -> { /* DOSAGE, LAB_TEST, PROCEDURE stored in extracted_entities only */ }
        }
    }

    private LocalDate parseDateSafe(Object dateObj, LocalDate fallback) {
        if (dateObj == null || dateObj.toString().isBlank()) return fallback;
        try {
            return LocalDate.parse(dateObj.toString());
        } catch (DateTimeParseException e) {
            return fallback;
        }
    }

    private String safeString(Object obj) {
        return obj == null ? null : obj.toString();
    }

    private PatientMedication.MedicationStatus parseMedicationStatus(Object statusObj) {
        if (statusObj == null) return PatientMedication.MedicationStatus.ACTIVE;
        try {
            return PatientMedication.MedicationStatus.valueOf(statusObj.toString().toUpperCase());
        } catch (IllegalArgumentException e) {
            return PatientMedication.MedicationStatus.ACTIVE;
        }
    }

    private PatientCondition.ConditionStatus parseConditionStatus(Object statusObj) {
        if (statusObj == null) return PatientCondition.ConditionStatus.ACTIVE;
        try {
            return PatientCondition.ConditionStatus.valueOf(statusObj.toString().toUpperCase());
        } catch (IllegalArgumentException e) {
            return PatientCondition.ConditionStatus.ACTIVE;
        }
    }

    private PatientCondition.Severity parseConditionSeverity(Object severityObj) {
        if (severityObj == null) return PatientCondition.Severity.MODERATE;
        try {
            return PatientCondition.Severity.valueOf(severityObj.toString().toUpperCase());
        } catch (IllegalArgumentException e) {
            return PatientCondition.Severity.MODERATE;
        }
    }

    private PatientSymptom.Severity parseSymptomSeverity(Object severityObj) {
        if (severityObj == null) return PatientSymptom.Severity.MODERATE;
        try {
            return PatientSymptom.Severity.valueOf(severityObj.toString().toUpperCase());
        } catch (IllegalArgumentException e) {
            return PatientSymptom.Severity.MODERATE;
        }
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
}


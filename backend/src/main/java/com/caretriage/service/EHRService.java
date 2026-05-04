package com.caretriage.service;

import com.caretriage.dto.EHRDto;
import com.caretriage.entity.*;
import com.caretriage.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class EHRService {

    private final ClinicalNoteRepository clinicalNoteRepository;
    private final ExtractedEntityRepository extractedEntityRepository;
    private final PatientMedicationRepository patientMedicationRepository;
    private final PatientConditionRepository patientConditionRepository;
    private final PatientSymptomRepository patientSymptomRepository;
    private final UserRepository userRepository;
    private final WebClient.Builder webClientBuilder;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Transactional
    public EHRDto.ExtractionResultDto extractFromText(String text, Long patientId, Long doctorId, String noteType) {
        User patient = userRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));

        // Save clinical note
        ClinicalNote note = ClinicalNote.builder()
                .patient(patient)
                .doctor(doctor)
                .noteType(parseNoteType(noteType))
                .rawText(text)
                .fileType("TEXT")
                .extractionStatus(ClinicalNote.ExtractionStatus.PROCESSING)
                .build();
        note = clinicalNoteRepository.save(note);

        try {
            // Call AI service
            Map<String, Object> aiResponse = callAiExtractText(text);
            return processExtractionResult(note, aiResponse, patient, doctor);
        } catch (Exception e) {
            note.setExtractionStatus(ClinicalNote.ExtractionStatus.FAILED);
            clinicalNoteRepository.save(note);
            log.error("EHR extraction failed for note {}: {}", note.getId(), e.getMessage());
            throw new RuntimeException("EHR extraction failed: " + e.getMessage());
        }
    }

    @Transactional
    public EHRDto.ExtractionResultDto extractFromFile(MultipartFile file, Long patientId, Long doctorId, String noteType) {
        User patient = userRepository.findById(patientId).orElseThrow(() -> new RuntimeException("Patient not found"));
        User doctor = userRepository.findById(doctorId).orElseThrow(() -> new RuntimeException("Doctor not found"));

        // Save clinical note
        ClinicalNote note = ClinicalNote.builder()
                .patient(patient)
                .doctor(doctor)
                .noteType(parseNoteType(noteType))
                .fileType(getFileExtension(file.getOriginalFilename()))
                .extractionStatus(ClinicalNote.ExtractionStatus.PROCESSING)
                .build();
        note = clinicalNoteRepository.save(note);

        try {
            // Call AI service with file
            Map<String, Object> aiResponse = callAiExtractFile(file);

            // Update raw text from AI response
            if (aiResponse.containsKey("result")) {
                Map<String, Object> result = (Map<String, Object>) aiResponse.get("result");
                note.setRawText((String) result.get("raw_text"));
                clinicalNoteRepository.save(note);
            }

            return processExtractionResult(note, aiResponse, patient, doctor);
        } catch (Exception e) {
            note.setExtractionStatus(ClinicalNote.ExtractionStatus.FAILED);
            clinicalNoteRepository.save(note);
            log.error("EHR file extraction failed for note {}: {}", note.getId(), e.getMessage());
            throw new RuntimeException("EHR file extraction failed: " + e.getMessage());
        }
    }

    public List<EHRDto.ClinicalNoteDto> getNotesByPatient(Long patientId) {
        return clinicalNoteRepository.findByPatientIdOrderByCreatedAtDesc(patientId)
                .stream()
                .map(this::toNoteDto)
                .collect(Collectors.toList());
    }

    public EHRDto.ExtractionResultDto getEntitiesByNoteId(Long noteId) {
        ClinicalNote note = clinicalNoteRepository.findById(noteId)
                .orElseThrow(() -> new RuntimeException("Clinical note not found: " + noteId));

        List<ExtractedEntity> entities = extractedEntityRepository.findByClinicalNoteId(noteId);

        return EHRDto.ExtractionResultDto.builder()
                .clinicalNoteId(noteId)
                .rawText(note.getRawText())
                .extractionStatus(note.getExtractionStatus().name())
                .entities(entities.stream().map(this::toEntityDto).collect(Collectors.toList()))
                .medications(filterByType(entities, ExtractedEntity.EntityType.MEDICATION))
                .symptoms(filterByType(entities, ExtractedEntity.EntityType.SYMPTOM))
                .conditions(filterByType(entities, ExtractedEntity.EntityType.CONDITION))
                .dosages(filterByType(entities, ExtractedEntity.EntityType.DOSAGE))
                .labTests(filterByType(entities, ExtractedEntity.EntityType.LAB_TEST))
                .procedures(filterByType(entities, ExtractedEntity.EntityType.PROCEDURE))
                .build();
    }

    public List<Long> searchPatients(EHRDto.SearchCriteria criteria) {
        Set<Long> resultSet = null;

        if (criteria.getSymptom() != null && !criteria.getSymptom().isBlank()) {
            Set<Long> symptomPatients = new HashSet<>(
                    patientSymptomRepository.findPatientIdsBySymptomName(criteria.getSymptom()));
            resultSet = intersect(resultSet, symptomPatients);
        }

        if (criteria.getMedication() != null && !criteria.getMedication().isBlank()) {
            Set<Long> medPatients = new HashSet<>(
                    patientMedicationRepository.findPatientIdsByMedicationName(criteria.getMedication()));
            resultSet = intersect(resultSet, medPatients);
        }

        if (criteria.getCondition() != null && !criteria.getCondition().isBlank()) {
            Set<Long> condPatients = new HashSet<>(
                    patientConditionRepository.findPatientIdsByConditionName(criteria.getCondition()));
            resultSet = intersect(resultSet, condPatients);
        }

        return resultSet == null ? Collections.emptyList() : new ArrayList<>(resultSet);
    }

    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("topMedications", patientMedicationRepository.findTopMedications().stream()
                .limit(10)
                .map(row -> Map.of("name", row[0], "count", row[1]))
                .collect(Collectors.toList()));
        stats.put("topConditions", patientConditionRepository.findTopConditions().stream()
                .limit(10)
                .map(row -> Map.of("name", row[0], "count", row[1]))
                .collect(Collectors.toList()));
        stats.put("topSymptoms", patientSymptomRepository.findTopSymptoms().stream()
                .limit(10)
                .map(row -> Map.of("name", row[0], "count", row[1]))
                .collect(Collectors.toList()));
        stats.put("totalNotes", clinicalNoteRepository.count());
        return stats;
    }

    // --- Private helpers ---

    @SuppressWarnings("unchecked")
    private EHRDto.ExtractionResultDto processExtractionResult(
            ClinicalNote note, Map<String, Object> aiResponse, User patient, User doctor) {

        Map<String, Object> result = (Map<String, Object>) aiResponse.get("result");
        List<Map<String, Object>> entitiesData = (List<Map<String, Object>>) result.get("entities");

        List<ExtractedEntity> savedEntities = new ArrayList<>();

        if (entitiesData != null) {
            for (Map<String, Object> ed : entitiesData) {
                ExtractedEntity entity = ExtractedEntity.builder()
                        .clinicalNote(note)
                        .entityType(ExtractedEntity.EntityType.valueOf((String) ed.get("entity_type")))
                        .entityValue((String) ed.get("entity_value"))
                        .normalizedValue((String) ed.get("normalized_value"))
                        .confidenceScore(((Number) ed.getOrDefault("confidence_score", 0.8)).doubleValue())
                        .startPosition(ed.get("start_position") != null ? ((Number) ed.get("start_position")).intValue() : null)
                        .endPosition(ed.get("end_position") != null ? ((Number) ed.get("end_position")).intValue() : null)
                        .build();
                savedEntities.add(extractedEntityRepository.save(entity));

                // Save to structured tables
                saveToStructuredTable(entity, patient, note, doctor);
            }
        }

        note.setExtractionStatus(ClinicalNote.ExtractionStatus.COMPLETED);
        clinicalNoteRepository.save(note);

        return EHRDto.ExtractionResultDto.builder()
                .clinicalNoteId(note.getId())
                .rawText(note.getRawText())
                .extractionStatus("COMPLETED")
                .entities(savedEntities.stream().map(this::toEntityDto).collect(Collectors.toList()))
                .medications(filterByType(savedEntities, ExtractedEntity.EntityType.MEDICATION))
                .symptoms(filterByType(savedEntities, ExtractedEntity.EntityType.SYMPTOM))
                .conditions(filterByType(savedEntities, ExtractedEntity.EntityType.CONDITION))
                .dosages(filterByType(savedEntities, ExtractedEntity.EntityType.DOSAGE))
                .labTests(filterByType(savedEntities, ExtractedEntity.EntityType.LAB_TEST))
                .procedures(filterByType(savedEntities, ExtractedEntity.EntityType.PROCEDURE))
                .build();
    }

    private void saveToStructuredTable(ExtractedEntity entity, User patient, ClinicalNote note, User doctor) {
        switch (entity.getEntityType()) {
            case MEDICATION -> patientMedicationRepository.save(PatientMedication.builder()
                    .patient(patient)
                    .clinicalNote(note)
                    .medicationName(entity.getNormalizedValue() != null ? entity.getNormalizedValue() : entity.getEntityValue())
                    .prescribingDoctorId(doctor.getId())
                    .startDate(LocalDate.now())
                    .build());
            case CONDITION -> patientConditionRepository.save(PatientCondition.builder()
                    .patient(patient)
                    .clinicalNote(note)
                    .conditionName(entity.getNormalizedValue() != null ? entity.getNormalizedValue() : entity.getEntityValue())
                    .diagnosedDate(LocalDate.now())
                    .build());
            case SYMPTOM -> patientSymptomRepository.save(PatientSymptom.builder()
                    .patient(patient)
                    .clinicalNote(note)
                    .symptomName(entity.getNormalizedValue() != null ? entity.getNormalizedValue() : entity.getEntityValue())
                    .build());
            default -> { /* DOSAGE, LAB_TEST, PROCEDURE stored in extracted_entities only */ }
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callAiExtractText(String text) {
        return webClientBuilder.build()
                .post()
                .uri(aiServiceUrl + "/api/ehr/extract-text")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("text", text))
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callAiExtractFile(MultipartFile file) {
        try {
            MultipartBodyBuilder builder = new MultipartBodyBuilder();
            builder.part("file", new ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            }).contentType(MediaType.parseMediaType(file.getContentType() != null ? file.getContentType() : "application/octet-stream"));

            return webClientBuilder.build()
                    .post()
                    .uri(aiServiceUrl + "/api/ehr/extract-file")
                    .body(BodyInserters.fromMultipartData(builder.build()))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            throw new RuntimeException("Failed to send file to AI service: " + e.getMessage());
        }
    }

    private Set<Long> intersect(Set<Long> current, Set<Long> newSet) {
        if (current == null) return newSet;
        current.retainAll(newSet);
        return current;
    }

    private List<EHRDto.ExtractedEntityDto> filterByType(List<ExtractedEntity> entities, ExtractedEntity.EntityType type) {
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
                        ? note.getRawText().substring(0, 200) + "..." : note.getRawText())
                .fileType(note.getFileType())
                .extractionStatus(note.getExtractionStatus().name())
                .createdAt(note.getCreatedAt() != null ? note.getCreatedAt().toString() : null)
                .entityCount(note.getExtractedEntities() != null ? note.getExtractedEntities().size() : 0)
                .build();
    }

    private ClinicalNote.NoteType parseNoteType(String noteType) {
        if (noteType == null || noteType.isBlank()) return ClinicalNote.NoteType.PROGRESS;
        try {
            return ClinicalNote.NoteType.valueOf(noteType.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ClinicalNote.NoteType.PROGRESS;
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "UNKNOWN";
        return filename.substring(filename.lastIndexOf(".") + 1).toUpperCase();
    }
}

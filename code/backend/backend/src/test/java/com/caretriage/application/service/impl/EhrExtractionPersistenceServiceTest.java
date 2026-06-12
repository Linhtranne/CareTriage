package com.caretriage.application.service.impl;

import com.caretriage.application.ai.service.DocumentExtractionService;
import com.caretriage.application.dto.EHRDto;
import com.caretriage.domain.entity.*;
import com.caretriage.domain.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EhrExtractionPersistenceServiceTest {

    @Mock
    private ClinicalNoteRepository clinicalNoteRepository;
    @Mock
    private ExtractedEntityRepository extractedEntityRepository;
    @Mock
    private PatientMedicationRepository patientMedicationRepository;
    @Mock
    private PatientConditionRepository patientConditionRepository;
    @Mock
    private PatientSymptomRepository patientSymptomRepository;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private EhrExtractionPersistenceService ehrExtractionPersistenceService;

    @Test
    void saveAndProcessResult_malformedEntityEnum_skipsAndSavesRest() throws Exception {
        ClinicalNote note = new ClinicalNote();
        note.setId(10L);
        note.setRawText("Patient takes Aspirin 81mg daily.");
        note.setNoteType(ClinicalNote.NoteType.PROGRESS);

        User patient = new User();
        patient.setId(1L);
        User doctor = new User();
        doctor.setId(2L);

        when(clinicalNoteRepository.findById(10L)).thenReturn(Optional.of(note));

        List<DocumentExtractionService.EntityOutput> entityOutputs = new ArrayList<>();

        // Malformed
        entityOutputs.add(new DocumentExtractionService.EntityOutput(
                "BAD_TYPE", "some value", null, 0.0, 0, 0, null));

        // Valid
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("dosage", "81mg");
        metadata.put("frequency", "daily");
        metadata.put("route", "oral");
        metadata.put("status", "ACTIVE");
        
        entityOutputs.add(new DocumentExtractionService.EntityOutput(
                "MEDICATION", "Aspirin", "Aspirin 81mg", 0.95, 14, 21, metadata));

        DocumentExtractionService.ExtractionOutput output = new DocumentExtractionService.ExtractionOutput(
                note.getRawText(), entityOutputs, entityOutputs, List.of(), List.of(), List.of(), List.of(), List.of(), 100.0, List.of());

        when(extractedEntityRepository.save(any(ExtractedEntity.class))).thenAnswer(i -> i.getArguments()[0]);

        EHRDto.ExtractionResultDto resDto = ehrExtractionPersistenceService.saveAndProcessResult(10L, output, patient, doctor);

        assertNotNull(resDto);
        assertEquals(1, resDto.getEntities().size());
        assertEquals("Aspirin 81mg", resDto.getEntities().get(0).getNormalizedValue());

        ArgumentCaptor<PatientMedication> medCaptor = ArgumentCaptor.forClass(PatientMedication.class);
        verify(patientMedicationRepository, times(1)).save(medCaptor.capture());
        
        PatientMedication savedMed = medCaptor.getValue();
        assertEquals("Aspirin 81mg", savedMed.getMedicationName());
        assertEquals("81mg", savedMed.getDosage());
        assertEquals("daily", savedMed.getFrequency());
        assertEquals("oral", savedMed.getRoute());
        assertEquals(PatientMedication.MedicationStatus.ACTIVE, savedMed.getStatus());
    }

    @Test
    void saveAndProcessResult_mapsRichMetadataToStructuredTables() throws Exception {
        ClinicalNote note = new ClinicalNote();
        note.setId(10L);
        note.setNoteType(ClinicalNote.NoteType.CONSULTATION);

        User patient = new User();
        patient.setId(1L);
        User doctor = new User();
        doctor.setId(2L);

        when(clinicalNoteRepository.findById(10L)).thenReturn(Optional.of(note));

        List<DocumentExtractionService.EntityOutput> entityOutputs = new ArrayList<>();

        Map<String, Object> medMeta = new HashMap<>();
        medMeta.put("dosage", "500mg");
        medMeta.put("frequency", "twice daily");
        medMeta.put("route", "oral");
        medMeta.put("start_date", "2026-01-01");
        medMeta.put("end_date", "2026-06-01");
        medMeta.put("status", "ACTIVE");
        entityOutputs.add(new DocumentExtractionService.EntityOutput(
                "MEDICATION", "Metformin", null, 0.9, 0, 0, medMeta));

        Map<String, Object> condMeta = new HashMap<>();
        condMeta.put("icd_code", "E11.9");
        condMeta.put("diagnosed_date", "2025-10-15");
        condMeta.put("severity", "SEVERE");
        condMeta.put("status", "ACTIVE");
        condMeta.put("notes", "Uncontrolled glycemic levels");
        entityOutputs.add(new DocumentExtractionService.EntityOutput(
                "CONDITION", "Diabetes", null, 0.9, 0, 0, condMeta));

        Map<String, Object> symMeta = new HashMap<>();
        symMeta.put("severity", "MILD");
        symMeta.put("duration", "3 weeks");
        symMeta.put("body_location", "Generalized");
        symMeta.put("onset_date", "2026-04-20");
        entityOutputs.add(new DocumentExtractionService.EntityOutput(
                "SYMPTOM", "Fatigue", null, 0.9, 0, 0, symMeta));

        DocumentExtractionService.ExtractionOutput output = new DocumentExtractionService.ExtractionOutput(
                note.getRawText(), entityOutputs, entityOutputs, entityOutputs, entityOutputs, List.of(), List.of(), List.of(), 100.0, List.of());

        when(extractedEntityRepository.save(any(ExtractedEntity.class))).thenAnswer(i -> i.getArguments()[0]);

        ehrExtractionPersistenceService.saveAndProcessResult(10L, output, patient, doctor);

        ArgumentCaptor<PatientMedication> medCaptor = ArgumentCaptor.forClass(PatientMedication.class);
        verify(patientMedicationRepository, times(1)).save(medCaptor.capture());
        PatientMedication savedMed = medCaptor.getValue();
        assertEquals("Metformin", savedMed.getMedicationName());
        assertEquals("500mg", savedMed.getDosage());
        assertEquals("twice daily", savedMed.getFrequency());
        assertEquals("oral", savedMed.getRoute());
        assertEquals(LocalDate.parse("2026-01-01"), savedMed.getStartDate());
        assertEquals(LocalDate.parse("2026-06-01"), savedMed.getEndDate());
        assertEquals(PatientMedication.MedicationStatus.ACTIVE, savedMed.getStatus());

        ArgumentCaptor<PatientCondition> condCaptor = ArgumentCaptor.forClass(PatientCondition.class);
        verify(patientConditionRepository, times(1)).save(condCaptor.capture());
        PatientCondition savedCond = condCaptor.getValue();
        assertEquals("Diabetes", savedCond.getConditionName());
        assertEquals("E11.9", savedCond.getIcdCode());
        assertEquals(LocalDate.parse("2025-10-15"), savedCond.getDiagnosedDate());
        assertEquals(PatientCondition.Severity.SEVERE, savedCond.getSeverity());
        assertEquals(PatientCondition.ConditionStatus.ACTIVE, savedCond.getStatus());
        assertEquals("Uncontrolled glycemic levels", savedCond.getNotes());

        ArgumentCaptor<PatientSymptom> symCaptor = ArgumentCaptor.forClass(PatientSymptom.class);
        verify(patientSymptomRepository, times(1)).save(symCaptor.capture());
        PatientSymptom savedSym = symCaptor.getValue();
        assertEquals("Fatigue", savedSym.getSymptomName());
        assertEquals(PatientSymptom.Severity.MILD, savedSym.getSeverity());
        assertEquals("3 weeks", savedSym.getDuration());
        assertEquals("Generalized", savedSym.getBodyLocation());
        assertEquals(LocalDate.parse("2026-04-20"), savedSym.getOnsetDate());
    }

    @Test
    void saveAndProcessResult_serializationError_throwsException() throws Exception {
        ClinicalNote note = new ClinicalNote();
        note.setId(10L);
        note.setRawText("Patient has something.");
        note.setNoteType(ClinicalNote.NoteType.PROGRESS);

        User patient = new User();
        patient.setId(1L);
        User doctor = new User();
        doctor.setId(2L);

        when(clinicalNoteRepository.findById(10L)).thenReturn(Optional.of(note));

        List<DocumentExtractionService.EntityOutput> entityOutputs = new ArrayList<>();
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("key", "value");

        entityOutputs.add(new DocumentExtractionService.EntityOutput(
                "CONDITION", "Some condition", null, 0.9, 0, 0, metadata));

        DocumentExtractionService.ExtractionOutput output = new DocumentExtractionService.ExtractionOutput(
                note.getRawText(), entityOutputs, List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), 100.0, List.of());

        when(objectMapper.writeValueAsString(any())).thenThrow(new com.fasterxml.jackson.core.JsonProcessingException("Serialization failed") {});

        com.caretriage.shared.exception.EHRPersistenceException ex = assertThrows(com.caretriage.shared.exception.EHRPersistenceException.class, () -> {
            ehrExtractionPersistenceService.saveAndProcessResult(10L, output, patient, doctor);
        });

        assertEquals("Failed to serialize entity metadata", ex.getMessage());
        verify(extractedEntityRepository, never()).save(any());
    }
}

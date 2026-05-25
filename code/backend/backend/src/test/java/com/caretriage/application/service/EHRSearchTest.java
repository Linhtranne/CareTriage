package com.caretriage.application.service;

import com.caretriage.application.dto.EHRDto;
import com.caretriage.domain.entity.*;
import com.caretriage.domain.repository.*;
import com.caretriage.application.service.impl.EHRServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EHRSearchTest {

    @Mock
    private UserRepository userRepository;
    
    @Mock
    private ClinicalNoteRepository clinicalNoteRepository;
    
    @Mock
    private PatientMedicationRepository patientMedicationRepository;
    
    @Mock
    private PatientConditionRepository patientConditionRepository;
    
    @Mock
    private PatientSymptomRepository patientSymptomRepository;

    @Mock
    private ExtractedEntityRepository extractedEntityRepository;

    @InjectMocks
    private EHRServiceImpl ehrService;

    @Test
    void searchPatients_emptyCriteria_returnsEmpty() {
        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder().build();
        assertTrue(criteria.isEmpty());
        
        List<EHRDto.PatientSearchResultDto> results = ehrService.searchPatients(criteria, 0, 20);
        
        assertTrue(results.isEmpty());
        verify(userRepository, never()).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void searchPatients_invalidDateRange_throwsException() {
        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder()
                .dateFrom("2025-12-31")
                .dateTo("2025-01-01")
                .build();
        
        assertThrows(IllegalArgumentException.class, () -> ehrService.searchPatients(criteria, 0, 20));
    }

    @Test
    void searchPatients_invalidSeverity_throwsException() {
        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder()
                .symptom("đau đầu")
                .severity("CRITICAL") // invalid severity enum
                .build();
        
        assertThrows(IllegalArgumentException.class, () -> ehrService.searchPatients(criteria, 0, 20));
    }

    @Test
    void searchPatients_invalidDateFormat_throwsException() {
        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder()
                .dateFrom("2026/05/19") // invalid date format
                .build();
        
        assertThrows(IllegalArgumentException.class, () -> ehrService.searchPatients(criteria, 0, 20));
    }

    @Test
    @SuppressWarnings("unchecked")
    void searchPatients_validSymptom_callsRepository() {
        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder()
                .symptom("đau đầu")
                .build();
        
        User patient = new User();
        patient.setId(1L);
        patient.setFullName("Test Patient");
        patient.setEmail("test@example.com");
        
        Page<User> page = mock(Page.class);
        when(page.getContent()).thenReturn(List.of(patient));
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(clinicalNoteRepository.countByPatientId(1L)).thenReturn(5L);
        
        List<EHRDto.PatientSearchResultDto> results = ehrService.searchPatients(criteria, 0, 20);
        
        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        assertEquals("Test Patient", results.get(0).getPatientName());
        assertEquals(5, results.get(0).getTotalNotes());
    }

    @Test
    void getStatistics_returnsTypedDto() {
        when(clinicalNoteRepository.count()).thenReturn(100L);
        when(clinicalNoteRepository.countByExtractionStatus(ClinicalNote.ExtractionStatus.COMPLETED)).thenReturn(90L);
        when(clinicalNoteRepository.countByExtractionStatus(ClinicalNote.ExtractionStatus.FAILED)).thenReturn(10L);
        
        when(patientMedicationRepository.findTopMedications()).thenReturn(Collections.emptyList());
        when(patientConditionRepository.findTopConditions()).thenReturn(Collections.emptyList());
        when(patientSymptomRepository.findTopSymptoms()).thenReturn(Collections.emptyList());
        
        EHRDto.EHRStatisticsDto stats = ehrService.getStatistics();
        
        assertNotNull(stats);
        assertEquals(100, stats.getTotalNotes());
        assertEquals(90, stats.getCompletedNotes());
        assertEquals(10, stats.getFailedNotes());
        assertTrue(stats.getTopMedications().isEmpty());
    }

    @Test
    @SuppressWarnings("unchecked")
    void toPatientSearchResult_filtersPHIMatchingCriteria() {
        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder()
                .symptom("đau đầu")
                .medication("aspirin")
                .condition("tiểu đường")
                .build();

        User patient = new User();
        patient.setId(1L);
        patient.setFullName("Test Patient");
        patient.setEmail("test@example.com");

        Page<User> page = mock(Page.class);
        when(page.getContent()).thenReturn(List.of(patient));
        when(userRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);
        when(clinicalNoteRepository.countByPatientId(1L)).thenReturn(5L);

        // Mock repositories
        PatientMedication activeMed = new PatientMedication();
        activeMed.setMedicationName("Aspirin 81mg");
        PatientMedication inactiveMed = new PatientMedication();
        inactiveMed.setMedicationName("Metformin");

        when(patientMedicationRepository.findByPatientIdAndStatus(1L, PatientMedication.MedicationStatus.ACTIVE))
                .thenReturn(List.of(activeMed, inactiveMed));

        PatientCondition activeCond = new PatientCondition();
        activeCond.setConditionName("Tiểu đường Type 2");
        PatientCondition inactiveCond = new PatientCondition();
        inactiveCond.setConditionName("Tăng huyết áp");

        when(patientConditionRepository.findByPatientIdAndStatus(1L, PatientCondition.ConditionStatus.ACTIVE))
                .thenReturn(List.of(activeCond, inactiveCond));

        PatientSymptom symptom1 = new PatientSymptom();
        symptom1.setSymptomName("Đau đầu dữ dội");
        PatientSymptom symptom2 = new PatientSymptom();
        symptom2.setSymptomName("Buồn nôn");

        when(patientSymptomRepository.findByPatientIdOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(symptom1, symptom2));

        List<EHRDto.PatientSearchResultDto> results = ehrService.searchPatients(criteria, 0, 20);

        assertFalse(results.isEmpty());
        EHRDto.PatientSearchResultDto dto = results.get(0);
        
        // Assert only searched clinical entities are returned in the response (preventing PII/PHI leakage)
        assertEquals(1, dto.getMatchedMedications().size());
        assertEquals("Aspirin 81mg", dto.getMatchedMedications().get(0));

        assertEquals(1, dto.getMatchedConditions().size());
        assertEquals("Tiểu đường Type 2", dto.getMatchedConditions().get(0));

        assertEquals(1, dto.getMatchedSymptoms().size());
        assertEquals("Đau đầu dữ dội", dto.getMatchedSymptoms().get(0));
    }

    @Test
    void saveAndProcessResult_malformedEntityEnum_skipsAndSavesRest() throws Exception {
        // Setup database entities
        ClinicalNote note = new ClinicalNote();
        note.setId(10L);
        note.setRawText("Patient takes Aspirin 81mg daily.");
        note.setNoteType(ClinicalNote.NoteType.PROGRESS);

        User patient = new User();
        patient.setId(1L);
        User doctor = new User();
        doctor.setId(2L);

        when(clinicalNoteRepository.findById(10L)).thenReturn(Optional.of(note));
        when(userRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctor));

        // Setup AI Response with a malformed entity and a valid entity
        Map<String, Object> aiResponse = new HashMap<>();
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> entities = new ArrayList<>();

        // Malformed entity (invalid type)
        Map<String, Object> malformedEntity = new HashMap<>();
        malformedEntity.put("entity_type", "BAD_TYPE");
        malformedEntity.put("entity_value", "some value");
        entities.add(malformedEntity);

        // Valid entity
        Map<String, Object> validEntity = new HashMap<>();
        validEntity.put("entity_type", "MEDICATION");
        validEntity.put("entity_value", "Aspirin");
        validEntity.put("normalized_value", "Aspirin 81mg");
        validEntity.put("confidence_score", 0.95);
        validEntity.put("start_position", 14);
        validEntity.put("end_position", 21);
        
        Map<String, Object> metadata = new HashMap<>();
        metadata.put("dosage", "81mg");
        metadata.put("frequency", "daily");
        metadata.put("route", "oral");
        metadata.put("status", "ACTIVE");
        validEntity.put("metadata", metadata);
        
        entities.add(validEntity);

        result.put("entities", entities);
        result.put("raw_text", note.getRawText());
        aiResponse.put("result", result);

        when(extractedEntityRepository.save(any(ExtractedEntity.class))).thenAnswer(i -> i.getArguments()[0]);

        // Invoke private saveAndProcessResult via Reflection
        Method method = EHRServiceImpl.class.getDeclaredMethod(
                "saveAndProcessResult", Long.class, Map.class, Long.class, Long.class);
        method.setAccessible(true);

        EHRDto.ExtractionResultDto resDto = (EHRDto.ExtractionResultDto) method.invoke(
                ehrService, 10L, aiResponse, 1L, 2L);

        assertNotNull(resDto);
        assertEquals(1, resDto.getEntities().size());
        assertEquals("Aspirin 81mg", resDto.getEntities().get(0).getNormalizedValue());

        // Verify medication repository saved the medication with mapped metadata
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
        // Setup database entities
        ClinicalNote note = new ClinicalNote();
        note.setId(10L);
        note.setNoteType(ClinicalNote.NoteType.CONSULTATION);

        User patient = new User();
        patient.setId(1L);
        User doctor = new User();
        doctor.setId(2L);

        when(clinicalNoteRepository.findById(10L)).thenReturn(Optional.of(note));
        when(userRepository.findById(1L)).thenReturn(Optional.of(patient));
        when(userRepository.findById(2L)).thenReturn(Optional.of(doctor));

        // Setup AI Response with MEDICATION, CONDITION, and SYMPTOM containing rich metadata
        Map<String, Object> aiResponse = new HashMap<>();
        Map<String, Object> result = new HashMap<>();
        List<Map<String, Object>> entities = new ArrayList<>();

        // 1. Medication
        Map<String, Object> med = new HashMap<>();
        med.put("entity_type", "MEDICATION");
        med.put("entity_value", "Metformin");
        Map<String, Object> medMeta = new HashMap<>();
        medMeta.put("dosage", "500mg");
        medMeta.put("frequency", "twice daily");
        medMeta.put("route", "oral");
        medMeta.put("start_date", "2026-01-01");
        medMeta.put("end_date", "2026-06-01");
        medMeta.put("status", "ACTIVE");
        med.put("metadata", medMeta);
        entities.add(med);

        // 2. Condition
        Map<String, Object> cond = new HashMap<>();
        cond.put("entity_type", "CONDITION");
        cond.put("entity_value", "Diabetes");
        Map<String, Object> condMeta = new HashMap<>();
        condMeta.put("icd_code", "E11.9");
        condMeta.put("diagnosed_date", "2025-10-15");
        condMeta.put("severity", "SEVERE");
        condMeta.put("status", "ACTIVE");
        condMeta.put("notes", "Uncontrolled glycemic levels");
        cond.put("metadata", condMeta);
        entities.add(cond);

        // 3. Symptom
        Map<String, Object> sym = new HashMap<>();
        sym.put("entity_type", "SYMPTOM");
        sym.put("entity_value", "Fatigue");
        Map<String, Object> symMeta = new HashMap<>();
        symMeta.put("severity", "MILD");
        symMeta.put("duration", "3 weeks");
        symMeta.put("body_location", "Generalized");
        symMeta.put("onset_date", "2026-04-20");
        sym.put("metadata", symMeta);
        entities.add(sym);

        result.put("entities", entities);
        aiResponse.put("result", result);

        when(extractedEntityRepository.save(any(ExtractedEntity.class))).thenAnswer(i -> i.getArguments()[0]);

        // Invoke private saveAndProcessResult via Reflection
        Method method = EHRServiceImpl.class.getDeclaredMethod(
                "saveAndProcessResult", Long.class, Map.class, Long.class, Long.class);
        method.setAccessible(true);

        method.invoke(ehrService, 10L, aiResponse, 1L, 2L);

        // Verify medication saving details
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

        // Verify condition saving details
        ArgumentCaptor<PatientCondition> condCaptor = ArgumentCaptor.forClass(PatientCondition.class);
        verify(patientConditionRepository, times(1)).save(condCaptor.capture());
        PatientCondition savedCond = condCaptor.getValue();
        assertEquals("Diabetes", savedCond.getConditionName());
        assertEquals("E11.9", savedCond.getIcdCode());
        assertEquals(LocalDate.parse("2025-10-15"), savedCond.getDiagnosedDate());
        assertEquals(PatientCondition.Severity.SEVERE, savedCond.getSeverity());
        assertEquals(PatientCondition.ConditionStatus.ACTIVE, savedCond.getStatus());
        assertEquals("Uncontrolled glycemic levels", savedCond.getNotes());

        // Verify symptom saving details
        ArgumentCaptor<PatientSymptom> symCaptor = ArgumentCaptor.forClass(PatientSymptom.class);
        verify(patientSymptomRepository, times(1)).save(symCaptor.capture());
        PatientSymptom savedSym = symCaptor.getValue();
        assertEquals("Fatigue", savedSym.getSymptomName());
        assertEquals(PatientSymptom.Severity.MILD, savedSym.getSeverity());
        assertEquals("3 weeks", savedSym.getDuration());
        assertEquals("Generalized", savedSym.getBodyLocation());
        assertEquals(LocalDate.parse("2026-04-20"), savedSym.getOnsetDate());
    }
}

package com.caretriage.application.service;

import com.caretriage.application.dto.EHRDto;
import com.caretriage.domain.entity.*;
import com.caretriage.domain.repository.*;
import com.caretriage.application.service.impl.EHRServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
// import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

// import java.lang.reflect.Method;
// import java.time.LocalDate;
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
    @SuppressWarnings("unchecked")
    void searchPatients_emptyCriteria_returnsAllPatientsWithNotes() {
        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder().build();
        assertTrue(criteria.isEmpty());

        User patient = new User();
        patient.setId(1L);
        patient.setFullName("Test Patient");
        patient.setEmail("test@example.com");

        Page<User> page = mock(Page.class);
        when(page.getContent()).thenReturn(List.of(patient));
        when(userRepository.findAll(org.mockito.Mockito.<org.springframework.data.jpa.domain.Specification<com.caretriage.infrastructure.persistence.entity.UserJpaEntity>>any(), any(Pageable.class))).thenReturn(page);
        when(clinicalNoteRepository.countByPatientId(1L)).thenReturn(2L);

        List<EHRDto.PatientSearchResultDto> results = ehrService.searchPatients(criteria, 0, 20);

        assertFalse(results.isEmpty());
        assertEquals(1, results.size());
        assertEquals("Test Patient", results.get(0).getPatientName());
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
        when(userRepository.findAll(org.mockito.Mockito.<org.springframework.data.jpa.domain.Specification<com.caretriage.infrastructure.persistence.entity.UserJpaEntity>>any(), any(Pageable.class))).thenReturn(page);
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
        when(userRepository.findAll(org.mockito.Mockito.<org.springframework.data.jpa.domain.Specification<com.caretriage.infrastructure.persistence.entity.UserJpaEntity>>any(), any(Pageable.class))).thenReturn(page);
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
}

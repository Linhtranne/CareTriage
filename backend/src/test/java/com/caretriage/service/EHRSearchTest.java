package com.caretriage.service;

import com.caretriage.dto.EHRDto;
import com.caretriage.entity.ClinicalNote;
import com.caretriage.entity.User;
import com.caretriage.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collections;
import java.util.List;

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

    @InjectMocks
    private EHRService ehrService;

    @Test
    void searchPatients_emptyCriteria_returnsEmpty() {
        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder().build();
        assertTrue(criteria.isEmpty());
        
        List<EHRDto.PatientSearchResultDto> results = ehrService.searchPatients(criteria);
        
        assertTrue(results.isEmpty());
        verify(userRepository, never()).findAll(any(Specification.class));
    }

    @Test
    void searchPatients_invalidDateRange_throwsException() {
        EHRDto.SearchCriteria criteria = EHRDto.SearchCriteria.builder()
                .dateFrom("2025-12-31")
                .dateTo("2025-01-01")
                .build();
        
        assertThrows(IllegalArgumentException.class, () -> ehrService.searchPatients(criteria));
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
        
        when(userRepository.findAll(any(Specification.class))).thenReturn(List.of(patient));
        when(clinicalNoteRepository.countByPatientId(1L)).thenReturn(5L);
        
        List<EHRDto.PatientSearchResultDto> results = ehrService.searchPatients(criteria);
        
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
}

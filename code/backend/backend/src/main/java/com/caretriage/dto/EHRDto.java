package com.caretriage.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

public class EHRDto {

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ExtractTextRequest {
        @NotBlank(message = "Text is required")
        private String text;
        
        @NotNull(message = "Patient ID is required")
        private Long patientId;
        
        @NotBlank(message = "Note type is required")
        private String noteType;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ExtractedEntityDto {
        private String entityType;
        private String entityValue;
        private String normalizedValue;
        private Double confidenceScore;
        private Integer startPosition;
        private Integer endPosition;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ExtractionResultDto {
        private Long clinicalNoteId;
        private String rawText;
        private String noteType;
        private String extractionStatus;
        private LocalDateTime createdAt;
        private List<ExtractedEntityDto> entities;
        private List<ExtractedEntityDto> medications;
        private List<ExtractedEntityDto> symptoms;
        private List<ExtractedEntityDto> conditions;
        private List<ExtractedEntityDto> dosages;
        private List<ExtractedEntityDto> labTests;
        private List<ExtractedEntityDto> procedures;
        private Double processingTimeMs;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class SearchCriteria {
        /** Search by symptom name (partial match) */
        private String symptom;
        /** Search by medication name (partial match) */
        private String medication;
        /** Search by condition name (partial match) */
        private String condition;
        /** Filter by note creation date from (ISO format: yyyy-MM-dd) */
        private String dateFrom;
        /** Filter by note creation date to (ISO format: yyyy-MM-dd) */
        private String dateTo;
        /** Filter by severity (MODERATE, SEVERE, etc.) */
        private String severity;

        /**
         * Checks if the search criteria is empty.
         * A search must have at least one clinical criterion or a date range.
         */
        public boolean isEmpty() {
            return (symptom == null || symptom.isBlank())
                    && (medication == null || medication.isBlank())
                    && (condition == null || condition.isBlank())
                    && (dateFrom == null || dateFrom.isBlank())
                    && (dateTo == null || dateTo.isBlank());
        }
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class PatientSearchResultDto {
        private Long patientId;
        private String patientName;
        private String email;
        private long totalNotes;
        private List<String> matchedSymptoms;
        private List<String> matchedMedications;
        private List<String> matchedConditions;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class EHRStatisticsDto {
        private long totalNotes;
        private long completedNotes;
        private long failedNotes;
        private List<EntityFrequencyDto> topMedications;
        private List<EntityFrequencyDto> topConditions;
        private List<EntityFrequencyDto> topSymptoms;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class EntityFrequencyDto {
        private String name;
        private long count;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class PatientEHRSummaryDto {
        private Long patientId;
        private String patientName;
        private long totalNotes;
        private List<PatientMedicationDto> activeMedications;
        private List<PatientConditionDto> activeConditions;
        private List<PatientSymptomDto> recentSymptoms;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class PatientMedicationDto {
        private Long id;
        private String medicationName;
        private String dosage;
        private String frequency;
        private String status;
        private String startDate;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class PatientConditionDto {
        private Long id;
        private String conditionName;
        private String severity;
        private String status;
        private String diagnosedDate;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class PatientSymptomDto {
        private Long id;
        private String symptomName;
        private String severity;
        private String onsetDate;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ClinicalNoteDto {
        private Long id;
        private Long patientId;
        private Long doctorId;
        private String noteType;
        private String rawText;
        private String fileType;
        private String extractionStatus;
        private String createdAt;
        private int entityCount;
    }
}

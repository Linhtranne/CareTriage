package com.caretriage.dto;

import com.caretriage.entity.ClinicalNote;
import lombok.*;

import java.util.List;

public class EHRDto {

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ExtractTextRequest {
        private String text;
        private Long patientId;
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
        private String extractionStatus;
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
        private String symptom;
        private String medication;
        private String condition;
        private String dateFrom;
        private String dateTo;
        private String severity;
    }

    @Data
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class PatientEHRSummary {
        private Long patientId;
        private String patientName;
        private int totalNotes;
        private List<String> activeMedications;
        private List<String> activeConditions;
        private List<String> recentSymptoms;
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

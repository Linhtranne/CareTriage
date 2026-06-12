package com.caretriage.application.ai.model;

import java.util.List;

/**
 * Structured output schema for LangChain4j medical entity extraction.
 * Compatible with Python ExtractionResult contract.
 */
public record MedicalExtractionResult(
    List<MedicalEntity> entities
) {
    public MedicalExtractionResult {
        if (entities == null) entities = List.of();
    }

    public record MedicalEntity(
        String entity_type,
        String entity_value,
        String normalized_value,
        Double confidence_score,
        Integer start_position,
        Integer end_position,
        java.util.Map<String, Object> metadata
    ) {
        public MedicalEntity {
            if (confidence_score == null) confidence_score = 0.8;
            if (confidence_score < 0.0) confidence_score = 0.0;
            if (confidence_score > 1.0) confidence_score = 1.0;
            if (metadata == null) metadata = java.util.Map.of();
        }
    }
}

package com.caretriage.application.ai.port;

import com.caretriage.application.ai.model.MedicalExtractionResult;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;

/**
 * LangChain4j AiService interface for structured medical entity extraction.
 * Extracts clinical entities from normalized text using LLM structured output.
 */
public interface StructuredMedicalEntityExtractor {

    @SystemMessage("""
        You are a Medical Named Entity Recognition (NER) expert.
        Your task is to analyze medical text, prescriptions, and lab reports to extract clinical entities.

        MANDATORY REQUIREMENTS:
        1. RETURN ONLY structured data matching the output schema.
        2. If no information is found for a field, leave it as an empty array.
        3. Translate common clinical terms into English.
        4. If a medication is a local Vietnamese traditional medicine or unclear, KEEP its original Vietnamese name.
        5. confidence_score must be between 0.0 and 1.0.
        6. entity_type must be one of: MEDICATION, SYMPTOM, CONDITION, DOSAGE, LAB_TEST, PROCEDURE.
        """)
    MedicalExtractionResult extract(@UserMessage String clinicalText);
}

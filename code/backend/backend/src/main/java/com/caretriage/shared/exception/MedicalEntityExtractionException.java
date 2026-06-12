package com.caretriage.shared.exception;

/**
 * Exception thrown when the AI provider fails to extract medical entities
 * or returns an invalid/unparseable response.
 * This is specific to Document Intelligence (Capability 5).
 */
public class MedicalEntityExtractionException extends RuntimeException {
    public MedicalEntityExtractionException(String message) {
        super(message);
    }

    public MedicalEntityExtractionException(String message, Throwable cause) {
        super(message, cause);
    }
}

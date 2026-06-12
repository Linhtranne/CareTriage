package com.caretriage.shared.exception;

/**
 * Thrown when document parsing fails (corrupt PDF, invalid DOCX, etc.).
 * Maps to HTTP 422 or 500 depending on context.
 */
public class DocumentParsingException extends RuntimeException {
    public DocumentParsingException(String message) {
        super(message);
    }

    public DocumentParsingException(String message, Throwable cause) {
        super(message, cause);
    }
}

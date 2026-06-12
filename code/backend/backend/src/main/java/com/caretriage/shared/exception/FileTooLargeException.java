package com.caretriage.shared.exception;

/**
 * Thrown when an uploaded file exceeds the configured size limit.
 * Maps to HTTP 413 Payload Too Large.
 */
public class FileTooLargeException extends RuntimeException {
    public FileTooLargeException(String message) {
        super(message);
    }
}

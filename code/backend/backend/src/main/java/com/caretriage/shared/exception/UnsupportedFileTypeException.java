package com.caretriage.shared.exception;

/**
 * Thrown when an uploaded file has an unsupported extension or MIME type.
 * Maps to HTTP 415 Unsupported Media Type.
 */
public class UnsupportedFileTypeException extends RuntimeException {
    public UnsupportedFileTypeException(String message) {
        super(message);
    }
}

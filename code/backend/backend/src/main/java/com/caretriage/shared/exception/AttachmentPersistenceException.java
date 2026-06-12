package com.caretriage.shared.exception;

public class AttachmentPersistenceException extends RuntimeException {
    public AttachmentPersistenceException(String message) {
        super(message);
    }
    
    public AttachmentPersistenceException(String message, Throwable cause) {
        super(message, cause);
    }
}

package com.caretriage.shared.exception;

public class EHRPersistenceException extends RuntimeException {
    public EHRPersistenceException(String message) {
        super(message);
    }
    
    public EHRPersistenceException(String message, Throwable cause) {
        super(message, cause);
    }
}

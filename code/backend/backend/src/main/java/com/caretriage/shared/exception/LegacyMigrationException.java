package com.caretriage.shared.exception;

public class LegacyMigrationException extends RuntimeException {

    public LegacyMigrationException(String message, Throwable cause) {
        super(message, cause);
    }
}

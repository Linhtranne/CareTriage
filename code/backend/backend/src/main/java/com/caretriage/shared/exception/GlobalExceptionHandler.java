package com.caretriage.shared.exception;

import com.caretriage.application.dto.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import lombok.extern.slf4j.Slf4j;

import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(BusinessException ex) {
        return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntime(RuntimeException ex) {
        log.error("Unhandled runtime error", ex);
        return ResponseEntity.badRequest().body(ApiResponse.error("\u0110\u00e3 x\u1ea3y ra l\u1ed7i nghi\u1ec7p v\u1ee5. Vui l\u00f2ng th\u1eed l\u1ea1i."));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(ConflictException.class)
    public ResponseEntity<ApiResponse<Void>> handleConflict(ConflictException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n truy c\u1eadp v\u00e0o t\u00e0i nguy\u00ean n\u00e0y."));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Email ho\u1eb7c m\u1eadt kh\u1ea9u kh\u00f4ng \u0111\u00fang"));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<ApiResponse<Void>> handleDisabled(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("T\u00e0i kho\u1ea3n \u0111\u00e3 b\u1ecb kh\u00f3a"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidation(MethodArgumentNotValidException ex) {
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(ApiResponse.error(errors));
    }

    @ExceptionHandler(com.caretriage.shared.exception.DocumentParsingException.class)
    public ResponseEntity<ApiResponse<Void>> handleDocumentParsing(com.caretriage.shared.exception.DocumentParsingException ex) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(com.caretriage.shared.exception.FileTooLargeException.class)
    public ResponseEntity<ApiResponse<Void>> handleFileTooLarge(com.caretriage.shared.exception.FileTooLargeException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(com.caretriage.shared.exception.MedicalEntityExtractionException.class)
    public ResponseEntity<ApiResponse<Void>> handleMedicalEntityExtraction(com.caretriage.shared.exception.MedicalEntityExtractionException ex) {
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(ApiResponse.error("H\u1ec7 th\u1ed1ng ph\u00e2n t\u00edch AI \u0111ang g\u1eb7p s\u1ef1 c\u1ed1. Vui l\u00f2ng th\u1eed l\u1ea1i sau."));
    }

    @ExceptionHandler(com.caretriage.shared.exception.UnsupportedFileTypeException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnsupportedFileType(com.caretriage.shared.exception.UnsupportedFileTypeException ex) {
        return ResponseEntity.status(HttpStatus.UNSUPPORTED_MEDIA_TYPE)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(com.caretriage.shared.exception.EHRPersistenceException.class)
    public ResponseEntity<ApiResponse<Void>> handleEHRPersistence(com.caretriage.shared.exception.EHRPersistenceException ex) {
        log.error("EHR persistence error: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("L\u1ed7i khi l\u01b0u tr\u1eef h\u1ed3 s\u01a1 y t\u1ebf. Vui l\u00f2ng th\u1eed l\u1ea1i sau."));
    }

    @ExceptionHandler(com.caretriage.shared.exception.AttachmentPersistenceException.class)
    public ResponseEntity<ApiResponse<Void>> handleAttachmentPersistence(com.caretriage.shared.exception.AttachmentPersistenceException ex) {
        log.error("Attachment persistence error: ", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("L\u1ed7i khi l\u01b0u tr\u1eef t\u1ec7p \u0111\u00ednh k\u00e8m. Vui l\u00f2ng th\u1eed l\u1ea1i sau."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex) {
        log.error("Unhandled system error", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("\u0110\u00e3 x\u1ea3y ra l\u1ed7i h\u1ec7 th\u1ed1ng. Vui l\u00f2ng th\u1eed l\u1ea1i sau."));
    }
}

package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.MedicalExtractionResult;
import com.caretriage.application.ai.port.FileTextExtractor;
import com.caretriage.application.ai.port.StructuredMedicalEntityExtractor;
import com.caretriage.shared.exception.DocumentParsingException;
import com.caretriage.shared.exception.FileTooLargeException;
import com.caretriage.shared.exception.UnsupportedFileTypeException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Orchestrates document text extraction and structured entity extraction.
 * This is the single entry point for the Java EHR extraction pipeline.
 * Does NOT call Python AI service.
 */
@Service
@Slf4j
public class DocumentExtractionService {

    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "docx", "txt");

    private final List<FileTextExtractor> extractors;
    private final StructuredMedicalEntityExtractor entityExtractor;
    private final long maxFileSizeBytes;

    public DocumentExtractionService(
            List<FileTextExtractor> extractors,
            StructuredMedicalEntityExtractor entityExtractor,
            @Value("${app.ehr.max-file-size-mb:10}") int maxFileSizeMb) {
        this.extractors = extractors;
        this.entityExtractor = entityExtractor;
        this.maxFileSizeBytes = (long) maxFileSizeMb * 1024 * 1024;
    }

    /**
     * Extract structured medical entities from plain text.
     */
    public ExtractionOutput extractFromText(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("Clinical note text cannot be empty");
        }

        long startTime = System.currentTimeMillis();
        MedicalExtractionResult structured = safeExtractEntities(text);
        long processingTimeMs = System.currentTimeMillis() - startTime;

        return buildOutput(text, structured, processingTimeMs, List.of());
    }

    /**
     * Extract raw text from file bytes, then extract structured entities.
     */
    public ExtractionOutput extractFromFile(byte[] fileBytes, String filename, String contentType) {
        validateFile(fileBytes, filename);

        String rawText = extractText(fileBytes, filename, contentType);

        if (rawText == null || rawText.isBlank()) {
            throw new DocumentParsingException("No readable text found in file: " + filename);
        }

        long startTime = System.currentTimeMillis();
        List<String> warnings = new ArrayList<>();
        MedicalExtractionResult structured = safeExtractEntities(rawText);
        long processingTimeMs = System.currentTimeMillis() - startTime;

        return buildOutput(rawText, structured, processingTimeMs, warnings);
    }

    /**
     * Extract only raw text from file (no entity extraction).
     */
    public String extractText(byte[] fileBytes, String filename, String contentType) {
        validateFile(fileBytes, filename);

        FileTextExtractor extractor = findExtractor(filename, contentType);
        return extractor.extract(fileBytes);
    }

    // ─── Validation ──────────────────────────────────────────────────────────

    private void validateFile(byte[] fileBytes, String filename) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new IllegalArgumentException("File is empty");
        }

        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("Filename is required");
        }

        // Reject path traversal
        String normalized = Paths.get(filename).getFileName().toString();
        if (!normalized.equals(filename) || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            throw new IllegalArgumentException("Invalid filename: path traversal detected");
        }

        if (fileBytes.length > maxFileSizeBytes) {
            throw new FileTooLargeException(
                    "File too large. Maximum allowed: " + (maxFileSizeBytes / (1024 * 1024)) + "MB");
        }

        String ext = getExtension(filename);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            throw new UnsupportedFileTypeException(
                    "File type '." + ext + "' not supported. Supported types: " + ALLOWED_EXTENSIONS);
        }
    }

    private FileTextExtractor findExtractor(String filename, String contentType) {
        for (FileTextExtractor extractor : extractors) {
            if (extractor.supports(filename, contentType)) {
                return extractor;
            }
        }
        throw new UnsupportedFileTypeException("No extractor available for file: " + getExtension(filename));
    }

    // ─── Entity Extraction ───────────────────────────────────────────────────

    private MedicalExtractionResult safeExtractEntities(String text) {
        try {
            MedicalExtractionResult result = entityExtractor.extract(text);
            if (result == null) {
                log.warn("Entity extraction returned null, treating as empty result");
                return new MedicalExtractionResult(List.of());
            }
            return result;
        } catch (Exception e) {
            log.error("AI entity extraction failed for provider.");
            throw new com.caretriage.shared.exception.MedicalEntityExtractionException("AI entity extraction failed", e);
        }
    }

    // ─── Output Building ─────────────────────────────────────────────────────

    private ExtractionOutput buildOutput(
            String rawText,
            MedicalExtractionResult structured,
            long processingTimeMs,
            List<String> warnings) {

        List<EntityOutput> entities = structured.entities().stream()
                .filter(e -> e.entity_type() != null && e.entity_value() != null && !e.entity_value().isBlank())
                .filter(e -> isValidEntityType(e.entity_type()))
                .map(e -> new EntityOutput(
                        e.entity_type().toUpperCase(),
                        e.entity_value(),
                        e.normalized_value(),
                        clampConfidence(e.confidence_score()),
                        e.start_position(),
                        e.end_position(),
                        e.metadata()))
                .collect(Collectors.toList());

        Map<String, List<EntityOutput>> categorized = entities.stream()
                .collect(Collectors.groupingBy(EntityOutput::entityType));

        return new ExtractionOutput(
                rawText,
                entities,
                categorized.getOrDefault("MEDICATION", Collections.emptyList()),
                categorized.getOrDefault("SYMPTOM", Collections.emptyList()),
                categorized.getOrDefault("CONDITION", Collections.emptyList()),
                categorized.getOrDefault("DOSAGE", Collections.emptyList()),
                categorized.getOrDefault("LAB_TEST", Collections.emptyList()),
                categorized.getOrDefault("PROCEDURE", Collections.emptyList()),
                (double) processingTimeMs,
                warnings);
    }

    private boolean isValidEntityType(String type) {
        if (type == null) return false;
        return switch (type.toUpperCase()) {
            case "MEDICATION", "SYMPTOM", "CONDITION", "DOSAGE", "LAB_TEST", "PROCEDURE" -> true;
            default -> {
                log.warn("Skipping unknown entity type: {}", type);
                yield false;
            }
        };
    }

    private double clampConfidence(Double score) {
        if (score == null) return 0.8;
        return Math.max(0.0, Math.min(1.0, score));
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    // ─── Output Records ──────────────────────────────────────────────────────

    public record ExtractionOutput(
            String rawText,
            List<EntityOutput> entities,
            List<EntityOutput> medications,
            List<EntityOutput> symptoms,
            List<EntityOutput> conditions,
            List<EntityOutput> dosages,
            List<EntityOutput> labTests,
            List<EntityOutput> procedures,
            Double processingTimeMs,
            List<String> warnings
    ) {
        static ExtractionOutput emptyText(String filename) {
            return new ExtractionOutput(
                    "", List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(),
                    0.0, List.of("No readable text found in file: " + filename));
        }
    }

    public record EntityOutput(
            String entityType,
            String entityValue,
            String normalizedValue,
            Double confidenceScore,
            Integer startPosition,
            Integer endPosition,
            Map<String, Object> metadata
    ) {}
}

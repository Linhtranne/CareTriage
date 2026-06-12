package com.caretriage.application.ai.port;

/**
 * Port interface for extracting raw text from uploaded file bytes.
 * Each implementation handles one file type (TXT, PDF, DOCX).
 */
public interface FileTextExtractor {

    /**
     * Returns true if this extractor supports the given file.
     */
    boolean supports(String filename, String contentType);

    /**
     * Extracts raw text from file bytes.
     *
     * @param content raw file bytes
     * @return extracted plain text
     * @throws com.caretriage.shared.exception.DocumentParsingException if parsing fails
     */
    String extract(byte[] content);
}

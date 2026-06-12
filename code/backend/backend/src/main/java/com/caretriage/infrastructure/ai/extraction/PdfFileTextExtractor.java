package com.caretriage.infrastructure.ai.extraction;

import com.caretriage.application.ai.port.FileTextExtractor;
import com.caretriage.shared.exception.DocumentParsingException;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.encryption.InvalidPasswordException;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Extracts text from .pdf files using Apache PDFBox.
 * Handles encrypted PDFs, corrupt files, and empty pages.
 * Limits page count to prevent resource exhaustion.
 */
@Component
@Order(2)
@Slf4j
public class PdfFileTextExtractor implements FileTextExtractor {

    private static final int MAX_PAGES = 200;
    private static final int MAX_EXTRACTED_CHARS = 500_000;

    @Override
    public boolean supports(String filename, String contentType) {
        if (filename == null) return false;
        return filename.toLowerCase().endsWith(".pdf");
    }

    @Override
    public String extract(byte[] content) {
        if (content == null || content.length == 0) {
            throw new DocumentParsingException("PDF file is empty");
        }

        try (PDDocument document = Loader.loadPDF(content)) {
            if (document.isEncrypted()) {
                throw new DocumentParsingException("PDF is encrypted and cannot be processed");
            }

            int totalPages = document.getNumberOfPages();
            if (totalPages == 0) {
                throw new DocumentParsingException("PDF contains no pages");
            }

            int pagesToProcess = Math.min(totalPages, MAX_PAGES);
            if (totalPages > MAX_PAGES) {
                log.warn("PDF has {} pages, limiting extraction to first {} pages", totalPages, MAX_PAGES);
            }

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setStartPage(1);
            stripper.setEndPage(pagesToProcess);

            String text = stripper.getText(document);

            if (text != null && text.length() > MAX_EXTRACTED_CHARS) {
                text = text.substring(0, MAX_EXTRACTED_CHARS);
                log.warn("PDF text truncated to {} characters", MAX_EXTRACTED_CHARS);
            }

            if (text == null || text.isBlank()) {
                throw new DocumentParsingException("PDF extracted text is empty");
            }
            return text;
        } catch (InvalidPasswordException e) {
            throw new DocumentParsingException("PDF is password-protected and cannot be processed");
        } catch (DocumentParsingException e) {
            throw e;
        } catch (IOException e) {
            throw new DocumentParsingException("Failed to parse PDF file: corrupt or invalid format", e);
        } catch (Exception e) {
            throw new DocumentParsingException("Unexpected error parsing PDF file", e);
        }
    }
}

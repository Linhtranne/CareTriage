package com.caretriage.infrastructure.ai.extraction;

import com.caretriage.application.ai.port.FileTextExtractor;
import com.caretriage.shared.exception.DocumentParsingException;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableCell;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

/**
 * Extracts text from .docx files using Apache POI.
 * Parses both paragraphs and table content.
 * Guards against ZIP bombs via input size limit.
 */
@Component
@Order(3)
@Slf4j
public class DocxFileTextExtractor implements FileTextExtractor {

    private static final int MAX_DOCX_BYTES = 10 * 1024 * 1024; // 10 MB

    @Override
    public boolean supports(String filename, String contentType) {
        if (filename == null) return false;
        String lower = filename.toLowerCase();
        return lower.endsWith(".docx");
    }

    @Override
    public String extract(byte[] content) {
        if (content == null || content.length == 0) {
            throw new DocumentParsingException("DOCX file is empty");
        }

        if (content.length > MAX_DOCX_BYTES) {
            throw new DocumentParsingException("DOCX file exceeds maximum allowed size for parsing");
        }

        try (XWPFDocument document = new XWPFDocument(new ByteArrayInputStream(content))) {
            List<String> textParts = new ArrayList<>();

            // Extract paragraphs
            for (XWPFParagraph paragraph : document.getParagraphs()) {
                String text = paragraph.getText();
                if (text != null && !text.isBlank()) {
                    textParts.add(text.strip());
                }
            }

            // Extract table text
            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    List<String> cellTexts = new ArrayList<>();
                    for (XWPFTableCell cell : row.getTableCells()) {
                        String cellText = cell.getText();
                        if (cellText != null && !cellText.isBlank()) {
                            cellTexts.add(cellText.strip());
                        }
                    }
                    if (!cellTexts.isEmpty()) {
                        textParts.add(String.join(" | ", cellTexts));
                    }
                }
            }

            String finalDocText = String.join("\n", textParts);
            if (finalDocText.isBlank()) {
                throw new DocumentParsingException("DOCX extracted text is empty");
            }
            return finalDocText;
        } catch (DocumentParsingException e) {
            throw e;
        } catch (IOException e) {
            throw new DocumentParsingException("Failed to parse DOCX file: corrupt or invalid format", e);
        } catch (Exception e) {
            throw new DocumentParsingException("Unexpected error parsing DOCX file", e);
        }
    }
}

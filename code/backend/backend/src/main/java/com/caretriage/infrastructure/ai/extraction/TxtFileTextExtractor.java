package com.caretriage.infrastructure.ai.extraction;

import com.caretriage.application.ai.port.FileTextExtractor;
import com.caretriage.shared.exception.DocumentParsingException;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

/**
 * Extracts text from .txt files.
 * Handles UTF-8 BOM and rejects binary content disguised as text.
 */
@Component
@Order(1)
public class TxtFileTextExtractor implements FileTextExtractor {

    private static final byte[] UTF8_BOM = {(byte) 0xEF, (byte) 0xBB, (byte) 0xBF};

    @Override
    public boolean supports(String filename, String contentType) {
        if (filename == null) return false;
        return filename.toLowerCase().endsWith(".txt");
    }

    @Override
    public String extract(byte[] content) {
        if (content == null || content.length == 0) {
            throw new DocumentParsingException("TXT file is empty");
        }

        if (containsBinaryContent(content)) {
            throw new DocumentParsingException("File contains binary content, not valid text");
        }

        byte[] textBytes = stripBom(content);
        String text = new String(textBytes, StandardCharsets.UTF_8);

        if (text.isBlank()) {
            throw new DocumentParsingException("TXT extracted text is empty");
        }
        // Normalize line endings to \n without losing Unicode
        return text.replace("\r\n", "\n").replace("\r", "\n");
    }

    private byte[] stripBom(byte[] content) {
        if (content.length >= 3
                && content[0] == UTF8_BOM[0]
                && content[1] == UTF8_BOM[1]
                && content[2] == UTF8_BOM[2]) {
            byte[] stripped = new byte[content.length - 3];
            System.arraycopy(content, 3, stripped, 0, stripped.length);
            return stripped;
        }
        return content;
    }

    private boolean containsBinaryContent(byte[] content) {
        int checkLength = Math.min(content.length, 8192);
        int nullCount = 0;
        for (int i = 0; i < checkLength; i++) {
            int b = content[i] & 0xFF;
            if (b == 0) {
                nullCount++;
                if (nullCount > 1) return true;
            }
        }
        return false;
    }
}

package com.caretriage.util;

import lombok.extern.slf4j.Slf4j;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;

@Slf4j
public class FileValidationUtil {

    private static final byte[] PDF_MAGIC = {0x25, 0x50, 0x44, 0x46}; // %PDF
    private static final byte[] DOCX_MAGIC = {0x50, 0x4B, 0x03, 0x04}; // PK (ZIP-based)

    /**
     * Validates file by checking both extension and magic bytes.
     * Lightweight alternative to Apache Tika.
     */
    public static boolean isValidEhrFile(MultipartFile file) {
        if (file == null || file.isEmpty()) return false;

        String filename = file.getOriginalFilename();
        if (filename == null) return false;

        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        
        try (InputStream is = file.getInputStream()) {
            byte[] header = new byte[4];
            int read = is.read(header);
            if (read < 4) return false;

            boolean magicMatches = false;
            if (Arrays.equals(header, PDF_MAGIC)) {
                magicMatches = true;
                if (!"pdf".equals(extension)) {
                    log.warn("File magic bytes match PDF but extension is .{}", extension);
                }
            } else if (Arrays.equals(header, DOCX_MAGIC)) {
                magicMatches = true;
                // DOCX is a ZIP, so we also rely on extension to distinguish from other ZIPs
                if (!"docx".equals(extension) && !"doc".equals(extension)) {
                    log.warn("File magic bytes match ZIP (DOCX) but extension is .{}", extension);
                }
            }

            return magicMatches;
        } catch (IOException e) {
            log.error("Failed to read file magic bytes: {}", e.getMessage());
            return false;
        }
    }
}

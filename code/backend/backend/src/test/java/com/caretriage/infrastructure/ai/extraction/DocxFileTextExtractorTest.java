package com.caretriage.infrastructure.ai.extraction;

import com.caretriage.shared.exception.DocumentParsingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class DocxFileTextExtractorTest {

    private DocxFileTextExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new DocxFileTextExtractor();
    }

    @Test
    void supports_ReturnsTrueForDocxFiles() {
        assertThat(extractor.supports("test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).isTrue();
        assertThat(extractor.supports("test.DOCX", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).isTrue();
    }

    @Test
    void supports_ReturnsFalseForNonDocxFiles() {
        assertThat(extractor.supports("test.pdf", "application/pdf")).isFalse();
        assertThat(extractor.supports("test.txt", "text/plain")).isFalse();
        assertThat(extractor.supports("test.doc", "application/msword")).isFalse(); // doc is not supported, only docx
    }

    @Test
    void extractText_InvalidDocx_ThrowsDocumentParsingException() {
        byte[] invalidDocxBytes = "Not a real docx file".getBytes();

        assertThatThrownBy(() -> extractor.extract(invalidDocxBytes))
                .isInstanceOf(DocumentParsingException.class)
                .hasMessageContaining("Unexpected error parsing DOCX file");
    }

    @Test
    void extractText_ValidDocx_ExtractsTextParagraphsAndTables() throws Exception {
        try (org.apache.poi.xwpf.usermodel.XWPFDocument document = new org.apache.poi.xwpf.usermodel.XWPFDocument();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
             
            org.apache.poi.xwpf.usermodel.XWPFParagraph paragraph = document.createParagraph();
            org.apache.poi.xwpf.usermodel.XWPFRun run = paragraph.createRun();
            run.setText("\u0110\u00e2y l\u00e0 \u0111o\u1ea1n v\u0103n b\u1ea3n ti\u1ebfng Vi\u1ec7t Unicode.");

            org.apache.poi.xwpf.usermodel.XWPFTable table = document.createTable();
            org.apache.poi.xwpf.usermodel.XWPFTableRow row = table.getRow(0);
            row.getCell(0).setText("C\u1ed9t 1");
            row.addNewTableCell().setText("C\u1ed9t 2");

            document.write(out);
            byte[] validDocxBytes = out.toByteArray();

            String extractedText = extractor.extract(validDocxBytes);
            assertThat(extractedText).contains("\u0110\u00e2y l\u00e0 \u0111o\u1ea1n v\u0103n b\u1ea3n ti\u1ebfng Vi\u1ec7t Unicode.");
            assertThat(extractedText).contains("C\u1ed9t 1");
            assertThat(extractedText).contains("C\u1ed9t 2");
        }
    }
}

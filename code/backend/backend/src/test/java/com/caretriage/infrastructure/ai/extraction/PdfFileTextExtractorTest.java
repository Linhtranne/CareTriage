package com.caretriage.infrastructure.ai.extraction;

import com.caretriage.shared.exception.DocumentParsingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PdfFileTextExtractorTest {

    private PdfFileTextExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new PdfFileTextExtractor();
    }

    @Test
    void supports_ReturnsTrueForPdfFiles() {
        assertThat(extractor.supports("test.pdf", "application/pdf")).isTrue();
        assertThat(extractor.supports("test.PDF", "application/pdf")).isTrue();
        assertThat(extractor.supports("test.pdf", "application/octet-stream")).isTrue();
    }

    @Test
    void supports_ReturnsFalseForNonPdfFiles() {
        assertThat(extractor.supports("test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).isFalse();
        assertThat(extractor.supports("test.txt", "text/plain")).isFalse();
    }

    @Test
    void extractText_InvalidPdf_ThrowsDocumentParsingException() {
        byte[] invalidPdfBytes = "Not a real pdf file".getBytes();

        assertThatThrownBy(() -> extractor.extract(invalidPdfBytes))
                .isInstanceOf(DocumentParsingException.class)
                .hasMessageContaining("Failed to parse PDF file: corrupt or invalid format");
    }

    @Test
    void extractText_ValidPdf_ExtractsText() throws Exception {
        try (org.apache.pdfbox.pdmodel.PDDocument document = new org.apache.pdfbox.pdmodel.PDDocument();
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
             
            org.apache.pdfbox.pdmodel.PDPage page = new org.apache.pdfbox.pdmodel.PDPage();
            document.addPage(page);
            
            try (org.apache.pdfbox.pdmodel.PDPageContentStream contentStream = new org.apache.pdfbox.pdmodel.PDPageContentStream(document, page)) {
                contentStream.beginText();
                contentStream.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(org.apache.pdfbox.pdmodel.font.Standard14Fonts.FontName.HELVETICA), 12);
                contentStream.newLineAtOffset(100, 700);
                contentStream.showText("Patient Name: Nguyen Van A");
                contentStream.endText();
            }

            document.save(out);
            byte[] validPdfBytes = out.toByteArray();

            String extractedText = extractor.extract(validPdfBytes);
            assertThat(extractedText).contains("Patient Name: Nguyen Van A");
        }
    }
}

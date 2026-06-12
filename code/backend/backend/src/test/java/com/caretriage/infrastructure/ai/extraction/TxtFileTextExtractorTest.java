package com.caretriage.infrastructure.ai.extraction;

import com.caretriage.shared.exception.DocumentParsingException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class TxtFileTextExtractorTest {

    private TxtFileTextExtractor extractor;

    @BeforeEach
    void setUp() {
        extractor = new TxtFileTextExtractor();
    }

    @Test
    void supports_ReturnsTrueForTxtFiles() {
        assertThat(extractor.supports("test.txt", "text/plain")).isTrue();
        assertThat(extractor.supports("test.TXT", "text/plain")).isTrue();
        assertThat(extractor.supports("test.txt", "application/octet-stream")).isTrue();
    }

    @Test
    void supports_ReturnsFalseForNonTxtFiles() {
        assertThat(extractor.supports("test.pdf", "application/pdf")).isFalse();
        assertThat(extractor.supports("test.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")).isFalse();
    }

    @Test
    void extractText_ExtractsContentSuccessfully() {
        String content = "Patient presents with headache.\nBlood pressure is 120/80.";
        byte[] fileBytes = content.getBytes(StandardCharsets.UTF_8);

        String extractedText = extractor.extract(fileBytes);

        assertThat(extractedText).isEqualTo(content);
    }

    @Test
    void extractText_EmptyFile_ThrowsDocumentParsingException() {
        byte[] fileBytes = new byte[0];

        assertThatThrownBy(() -> extractor.extract(fileBytes))
                .isInstanceOf(DocumentParsingException.class)
                .hasMessageContaining("TXT file is empty");
    }

    @Test
    void extractText_WithUtf8Bom_StripsBom() {
        String content = "Hello BOM";
        byte[] contentBytes = content.getBytes(StandardCharsets.UTF_8);
        byte[] fileBytes = new byte[contentBytes.length + 3];
        fileBytes[0] = (byte) 0xEF;
        fileBytes[1] = (byte) 0xBB;
        fileBytes[2] = (byte) 0xBF;
        System.arraycopy(contentBytes, 0, fileBytes, 3, contentBytes.length);

        String extractedText = extractor.extract(fileBytes);
        assertThat(extractedText).isEqualTo(content);
    }

    @Test
    void extractText_WithVietnameseCharacters_ExtractsCorrectly() {
        String content = "B\u1ec7nh nh\u00e2n b\u1ecb nh\u1ee9c \u0111\u1ea7u v\u00e0 s\u1ed5 m\u0169i.";
        byte[] fileBytes = content.getBytes(StandardCharsets.UTF_8);

        String extractedText = extractor.extract(fileBytes);
        assertThat(extractedText).isEqualTo(content);
    }

    @Test
    void extractText_WithCrLf_NormalizesToLf() {
        String contentCrLf = "Line 1\r\nLine 2\rLine 3";
        byte[] fileBytes = contentCrLf.getBytes(StandardCharsets.UTF_8);

        String extractedText = extractor.extract(fileBytes);
        assertThat(extractedText).isEqualTo("Line 1\nLine 2\nLine 3");
    }

    @Test
    void extractText_WithBinaryBytes_ThrowsDocumentParsingException() {
        byte[] fileBytes = {(byte) 0x00, (byte) 0x00, (byte) 0x01, (byte) 0x02};

        assertThatThrownBy(() -> extractor.extract(fileBytes))
                .isInstanceOf(DocumentParsingException.class)
                .hasMessageContaining("File contains binary content, not valid text");
    }
}

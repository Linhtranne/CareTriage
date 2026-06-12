package com.caretriage.application.ai.service;

import com.caretriage.application.ai.model.MedicalExtractionResult;
import com.caretriage.application.ai.port.FileTextExtractor;
import com.caretriage.application.ai.port.StructuredMedicalEntityExtractor;
import com.caretriage.shared.exception.DocumentParsingException;
import com.caretriage.shared.exception.FileTooLargeException;
import com.caretriage.shared.exception.MedicalEntityExtractionException;
import com.caretriage.shared.exception.UnsupportedFileTypeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

class DocumentExtractionServiceTest {

    @Mock
    private FileTextExtractor mockExtractor;

    @Mock
    private StructuredMedicalEntityExtractor entityExtractor;

    private DocumentExtractionService service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        when(mockExtractor.supports("test.pdf", "application/pdf")).thenReturn(true);
        when(mockExtractor.extract(new byte[]{1, 2, 3})).thenReturn("Sample text");
        
        service = new DocumentExtractionService(List.of(mockExtractor), entityExtractor, 10);
    }

    @Test
    void extractFromFile_Success() {
        when(entityExtractor.extract("Sample text")).thenReturn(new MedicalExtractionResult(List.of()));
        
        DocumentExtractionService.ExtractionOutput output = service.extractFromFile(new byte[]{1, 2, 3}, "test.pdf", "application/pdf");
        
        assertNotNull(output);
        assertEquals("Sample text", output.rawText());
        assertTrue(output.entities().isEmpty());
    }

    @Test
    void extractFromFile_FileTooLarge() {
        DocumentExtractionService smallLimitService = new DocumentExtractionService(List.of(mockExtractor), entityExtractor, 0); // 0 MB
        
        assertThrows(FileTooLargeException.class, () -> 
            smallLimitService.extractFromFile(new byte[]{1, 2, 3}, "test.pdf", "application/pdf")
        );
    }

    @Test
    void extractFromFile_UnsupportedFileType() {
        assertThrows(UnsupportedFileTypeException.class, () -> 
            service.extractFromFile(new byte[]{1, 2, 3}, "test.exe", "application/x-msdownload")
        );
    }

    @Test
    void extractFromFile_PathTraversalDetected() {
        assertThrows(IllegalArgumentException.class, () -> 
            service.extractFromFile(new byte[]{1, 2, 3}, "../etc/passwd", "application/pdf")
        );
    }

    @Test
    void safeExtractEntities_ProviderFailure_ThrowsMedicalEntityExtractionException() {
        when(entityExtractor.extract(anyString())).thenThrow(new RuntimeException("Provider timeout"));
        
        MedicalEntityExtractionException ex = assertThrows(MedicalEntityExtractionException.class, () -> 
            service.extractFromText("Some clinical note")
        );
        assertEquals("AI entity extraction failed", ex.getMessage());
    }

    @Test
    void extractFromFile_NoReadableText_ThrowsDocumentParsingException() {
        when(mockExtractor.extract(new byte[]{1, 2, 3})).thenReturn("   ");
        
        assertThrows(DocumentParsingException.class, () -> 
            service.extractFromFile(new byte[]{1, 2, 3}, "test.pdf", "application/pdf")
        );
    }
}

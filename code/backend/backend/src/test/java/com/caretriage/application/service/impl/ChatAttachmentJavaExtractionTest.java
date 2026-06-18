package com.caretriage.application.service.impl;

// import com.caretriage.application.ai.model.MedicalExtractionResult;
import com.caretriage.application.ai.service.DocumentExtractionService;
import com.caretriage.application.dto.ChatAttachmentDTO;
import com.caretriage.domain.entity.ChatAttachment;
import com.caretriage.domain.entity.ChatMessage;
import com.caretriage.domain.entity.ChatSession;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import com.caretriage.domain.repository.ChatAttachmentRepository;
import com.caretriage.domain.repository.ChatMessageRepository;
import com.caretriage.domain.repository.ChatSessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
// import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.mock.web.MockMultipartFile;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;
import org.springframework.transaction.support.TransactionSynchronizationManager;

class ChatAttachmentJavaExtractionTest {

    @Mock
    private ChatSessionRepository chatSessionRepository;

    @Mock
    private ChatAttachmentRepository chatAttachmentRepository;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private DocumentExtractionService documentExtractionService;

    @Mock
    private ChatAttachmentPersistenceService chatAttachmentPersistenceService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private ChatServiceImpl chatService;

    private ChatSession session;
    private UserJpaEntity user;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        user = new UserJpaEntity();
        user.setId(1L);

        session = new ChatSession();
        session.setId(10L);
        session.setUser(user);
        session.setStatus(ChatSession.SessionStatus.ACTIVE);

        when(chatSessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(chatAttachmentRepository.findByChatSessionIdOrderByCreatedAtAsc(10L)).thenReturn(List.of());
    }

    @Test
    void uploadAttachment_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "dummy content".getBytes());

        ChatAttachment processingAttachment = new ChatAttachment();
        processingAttachment.setId(100L);
        processingAttachment.setChatSession(session);
        processingAttachment.setOriginalFilename("test.pdf");

        when(chatAttachmentPersistenceService.createProcessingAttachment(anyLong(), any(), any(), anyLong())).thenReturn(processingAttachment);

        DocumentExtractionService.ExtractionOutput output = new DocumentExtractionService.ExtractionOutput(
                "Extracted text", List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), 100.0, List.of()
        );
        when(documentExtractionService.extractFromFile(any(), any(), any())).thenAnswer(invocation -> {
            assertFalse(TransactionSynchronizationManager.isActualTransactionActive(), "Extraction MUST run outside transaction");
            return output;
        });

        ChatMessage systemMsg = new ChatMessage();
        systemMsg.setId(200L);
        systemMsg.setContent("System msg");
        systemMsg.setChatSession(session);
        when(chatAttachmentPersistenceService.completeAttachment(anyLong(), anyLong(), anyString(), any())).thenReturn(systemMsg);
        when(chatAttachmentRepository.findById(100L)).thenReturn(Optional.of(processingAttachment));

        ChatAttachmentDTO result = chatService.uploadAttachment(1L, 10L, file);

        assertNotNull(result);
        assertEquals(100L, result.getId());
        verify(documentExtractionService).extractFromFile(any(), eq("test.pdf"), eq("application/pdf"));
        verify(chatAttachmentPersistenceService).completeAttachment(100L, 10L, "Extracted text", null);
        verify(messagingTemplate).convertAndSend(eq("/topic/chat/10"), any(Object.class));
    }

    @Test
    void uploadAttachment_RejectsImages() {
        MockMultipartFile file = new MockMultipartFile("file", "test.png", "image/png", "dummy".getBytes());

        assertThrows(com.caretriage.shared.exception.UnsupportedFileTypeException.class, () ->
                chatService.uploadAttachment(1L, 10L, file)
        );
    }

    @Test
    void uploadAttachment_Failure_RethrowsException() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "dummy content".getBytes());

        ChatAttachment processingAttachment = new ChatAttachment();
        processingAttachment.setId(100L);
        processingAttachment.setChatSession(session);
        processingAttachment.setOriginalFilename("test.pdf");

        when(chatAttachmentPersistenceService.createProcessingAttachment(anyLong(), anyString(), anyString(), anyLong())).thenReturn(processingAttachment);

        when(documentExtractionService.extractFromFile(any(), anyString(), anyString())).thenThrow(new com.caretriage.shared.exception.MedicalEntityExtractionException("AI Provider error"));

        when(chatAttachmentPersistenceService.failAttachment(anyLong(), anyLong(), anyString())).thenReturn(new ChatMessage());

        assertThrows(com.caretriage.shared.exception.MedicalEntityExtractionException.class, () ->
                chatService.uploadAttachment(1L, 10L, file)
        );

        verify(chatAttachmentPersistenceService).failAttachment(100L, 10L, "ENTITY_EXTRACTION_FAILED");
    }

    @Test
    void uploadAttachment_Failure_DocumentParsingException() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "dummy content".getBytes());
        ChatAttachment processingAttachment = new ChatAttachment();
        processingAttachment.setId(101L);
        when(chatAttachmentPersistenceService.createProcessingAttachment(anyLong(), anyString(), anyString(), anyLong())).thenReturn(processingAttachment);
        
        when(documentExtractionService.extractFromFile(any(), anyString(), anyString())).thenThrow(new com.caretriage.shared.exception.DocumentParsingException("Cannot read"));
        
        assertThrows(com.caretriage.shared.exception.DocumentParsingException.class, () ->
                chatService.uploadAttachment(1L, 10L, file)
        );
        verify(chatAttachmentPersistenceService).failAttachment(101L, 10L, "DOCUMENT_PARSE_FAILED");
    }

    @Test
    void uploadAttachment_Failure_AttachmentPersistenceException() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "dummy content".getBytes());
        ChatAttachment processingAttachment = new ChatAttachment();
        processingAttachment.setId(102L);
        when(chatAttachmentPersistenceService.createProcessingAttachment(anyLong(), anyString(), anyString(), anyLong())).thenReturn(processingAttachment);
        
        DocumentExtractionService.ExtractionOutput output = new DocumentExtractionService.ExtractionOutput(
                "Extracted text", List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), List.of(), 100.0, List.of()
        );
        when(documentExtractionService.extractFromFile(any(), any(), any())).thenReturn(output);
        when(chatAttachmentPersistenceService.completeAttachment(anyLong(), anyLong(), anyString(), any())).thenThrow(new com.caretriage.shared.exception.AttachmentPersistenceException("Db down"));
        
        assertThrows(com.caretriage.shared.exception.AttachmentPersistenceException.class, () ->
                chatService.uploadAttachment(1L, 10L, file)
        );
        verify(chatAttachmentPersistenceService).failAttachment(102L, 10L, "ATTACHMENT_SERIALIZATION_FAILED");
    }

    @Test
    void uploadAttachment_Failure_SystemError() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "dummy content".getBytes());
        ChatAttachment processingAttachment = new ChatAttachment();
        processingAttachment.setId(103L);
        when(chatAttachmentPersistenceService.createProcessingAttachment(anyLong(), anyString(), anyString(), anyLong())).thenReturn(processingAttachment);
        
        when(documentExtractionService.extractFromFile(any(), anyString(), anyString())).thenThrow(new RuntimeException("Unknown error"));
        
        assertThrows(RuntimeException.class, () ->
                chatService.uploadAttachment(1L, 10L, file)
        );
        verify(chatAttachmentPersistenceService).failAttachment(103L, 10L, "SYSTEM_ERROR");
    }
}

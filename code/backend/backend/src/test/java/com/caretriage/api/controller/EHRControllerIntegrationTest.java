package com.caretriage.api.controller;

import com.caretriage.application.ai.service.DocumentExtractionService;
import com.caretriage.application.service.EHRService;
import com.caretriage.domain.entity.User;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.shared.exception.DocumentParsingException;
import com.caretriage.shared.exception.FileTooLargeException;
import com.caretriage.shared.exception.MedicalEntityExtractionException;
import com.caretriage.shared.exception.UnsupportedFileTypeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@org.springframework.test.context.ActiveProfiles("test")
class EHRControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EHRService ehrService;

    @MockBean
    private UserRepository userRepository;

    @BeforeEach
    void setUp() {
        User doctor = new User();
        doctor.setId(10L);
        doctor.setEmail("doctor@test.com");
        when(userRepository.findByEmail("doctor@test.com")).thenReturn(Optional.of(doctor));
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    void extractFromFile_FileTooLarge_Returns413() throws Exception {
        byte[] pdfMagic = {0x25, 0x50, 0x44, 0x46, 0x20};
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", pdfMagic);

        when(ehrService.extractFromFile(any(), anyLong(), anyLong(), anyString())).thenThrow(
                new FileTooLargeException("Dung l\u01b0\u1ee3ng t\u00e0i li\u1ec7u v\u01b0\u1ee3t qu\u00e1 gi\u1edbi h\u1ea1n cho ph\u00e9p (t\u1ed1i \u0111a 10MB).")
        );

        mockMvc.perform(multipart("/api/ehr/upload")
                        .file(file)
                        .param("patientId", "1")
                        .param("noteType", "PROGRESS"))
                .andExpect(status().isPayloadTooLarge())
                .andExpect(jsonPath("$.message").value("Dung l\u01b0\u1ee3ng t\u00e0i li\u1ec7u v\u01b0\u1ee3t qu\u00e1 gi\u1edbi h\u1ea1n cho ph\u00e9p (t\u1ed1i \u0111a 10MB)."));
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    void extractFromFile_UnsupportedFileType_Returns415() throws Exception {
        byte[] pdfMagic = {0x25, 0x50, 0x44, 0x46, 0x20};
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", pdfMagic);

        when(ehrService.extractFromFile(any(), anyLong(), anyLong(), anyString())).thenThrow(
                new UnsupportedFileTypeException("\u0110\u1ecbnh d\u1ea1ng t\u00e0i li\u1ec7u kh\u00f4ng \u0111\u01b0\u1ee3c h\u1ed7 tr\u1ee3. Ch\u1ec9 h\u1ed7 tr\u1ee3 t\u1ea3i c\u00e1c t\u1ec7p PDF, DOCX, TXT.")
        );

        mockMvc.perform(multipart("/api/ehr/upload")
                        .file(file)
                        .param("patientId", "1")
                        .param("noteType", "PROGRESS"))
                .andExpect(status().isUnsupportedMediaType())
                .andExpect(jsonPath("$.message").value("\u0110\u1ecbnh d\u1ea1ng t\u00e0i li\u1ec7u kh\u00f4ng \u0111\u01b0\u1ee3c h\u1ed7 tr\u1ee3. Ch\u1ec9 h\u1ed7 tr\u1ee3 t\u1ea3i c\u00e1c t\u1ec7p PDF, DOCX, TXT."));
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    void extractFromFile_DocumentParsingException_Returns422() throws Exception {
        byte[] pdfMagic = {0x25, 0x50, 0x44, 0x46, 0x20};
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", pdfMagic);

        when(ehrService.extractFromFile(any(), anyLong(), anyLong(), anyString())).thenThrow(
                new DocumentParsingException("Kh\u00f4ng th\u1ec3 \u0111\u1ecdc \u0111\u01b0\u1ee3c n\u1ed9i dung t\u1eeb file.")
        );

        mockMvc.perform(multipart("/api/ehr/upload")
                        .file(file)
                        .param("patientId", "1")
                        .param("noteType", "PROGRESS"))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("Kh\u00f4ng th\u1ec3 \u0111\u1ecdc \u0111\u01b0\u1ee3c n\u1ed9i dung t\u1eeb file."));
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    void extractFromFile_MedicalEntityExtractionException_Returns502() throws Exception {
        byte[] pdfMagic = {0x25, 0x50, 0x44, 0x46, 0x20};
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", pdfMagic);

        when(ehrService.extractFromFile(any(), anyLong(), anyLong(), anyString())).thenThrow(
                new MedicalEntityExtractionException("AI Provider Timeout")
        );

        mockMvc.perform(multipart("/api/ehr/upload")
                        .file(file)
                        .param("patientId", "1")
                        .param("noteType", "PROGRESS"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message").value("H\u1ec7 th\u1ed1ng ph\u00e2n t\u00edch AI \u0111ang g\u1eb7p s\u1ef1 c\u1ed1. Vui l\u00f2ng th\u1eed l\u1ea1i sau."));
    }

    @Test
    @WithMockUser(username = "doctor@test.com", roles = {"DOCTOR"})
    void extractFromFile_EHRPersistenceException_Returns500() throws Exception {
        byte[] pdfMagic = {0x25, 0x50, 0x44, 0x46, 0x20};
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", pdfMagic);

        when(ehrService.extractFromFile(any(), anyLong(), anyLong(), anyString())).thenThrow(
                new com.caretriage.shared.exception.EHRPersistenceException("Database error")
        );

        mockMvc.perform(multipart("/api/ehr/upload")
                        .file(file)
                        .param("patientId", "1")
                        .param("noteType", "PROGRESS"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("L\u1ed7i khi l\u01b0u tr\u1eef h\u1ed3 s\u01a1 y t\u1ebf. Vui l\u00f2ng th\u1eed l\u1ea1i sau."));
    }
}

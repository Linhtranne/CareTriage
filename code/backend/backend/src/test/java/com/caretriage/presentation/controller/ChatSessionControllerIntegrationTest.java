package com.caretriage.presentation.controller;

import com.caretriage.application.dto.ChatSessionDTO;
import com.caretriage.application.service.ChatService;
import com.caretriage.domain.entity.ChatSession;
import com.caretriage.domain.entity.User;
import com.caretriage.infrastructure.persistence.entity.UserJpaEntity;
import com.caretriage.domain.repository.UserRepository;
import com.caretriage.domain.repository.ChatSessionRepository;
import com.caretriage.domain.repository.ChatTurnRepository;
import com.caretriage.application.service.impl.ChatTurnReconciliationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
// import java.util.List;
import java.util.Map;
import java.util.Optional;

// import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ChatSessionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ChatService chatService;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private ChatSessionRepository chatSessionRepository;


    @MockBean
    private ChatTurnRepository chatTurnRepository;

    @MockBean
    private ChatTurnReconciliationService chatTurnReconciliationService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(username = "patient@example.com", roles = "PATIENT")
    void renameSession_Owner_Success() throws Exception {
        User mockUser = User.builder().id(1L).email("patient@example.com").build();
        UserJpaEntity mockUserJpa = UserJpaEntity.builder().id(1L).email("patient@example.com").build();
        ChatSession mockSession = ChatSession.builder()
                .id(10L)
                .user(mockUserJpa)
                .title("New Title")
                .sessionType(ChatSession.SessionType.TRIAGE)
                .status(ChatSession.SessionStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(mockUser));
        when(chatSessionRepository.existsById(10L)).thenReturn(true);
        when(chatSessionRepository.existsByIdAndUserId(10L, 1L)).thenReturn(true);
        when(chatService.updateSessionTitle(10L, "New Title")).thenReturn(mockSession);

        mockMvc.perform(patch("/api/v1/chat/sessions/10/title")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("title", "New Title"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.title").value("New Title"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = "PATIENT")
    void renameSession_NonOwner_Forbidden() throws Exception {
        User mockUser = User.builder().id(1L).email("patient@example.com").build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(mockUser));
        when(chatSessionRepository.existsById(10L)).thenReturn(true);
        when(chatSessionRepository.existsByIdAndUserId(10L, 1L)).thenReturn(false);

        mockMvc.perform(patch("/api/v1/chat/sessions/10/title")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("title", "New Title"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = "PATIENT")
    void renameSession_NonExistent_NotFound() throws Exception {
        User mockUser = User.builder().id(1L).email("patient@example.com").build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(mockUser));
        when(chatSessionRepository.existsById(10L)).thenReturn(false);

        mockMvc.perform(patch("/api/v1/chat/sessions/10/title")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("title", "New Title"))))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = "PATIENT")
    void renameSession_BlankTitle_BadRequest() throws Exception {
        User mockUser = User.builder().id(1L).email("patient@example.com").build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(mockUser));
        when(chatSessionRepository.existsById(10L)).thenReturn(true);
        when(chatSessionRepository.existsByIdAndUserId(10L, 1L)).thenReturn(true);

        mockMvc.perform(patch("/api/v1/chat/sessions/10/title")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("title", "   "))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = "PATIENT")
    void renameSession_TitleTooLong_BadRequest() throws Exception {
        User mockUser = User.builder().id(1L).email("patient@example.com").build();
        String longTitle = "a".repeat(201);

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(mockUser));
        when(chatSessionRepository.existsById(10L)).thenReturn(true);
        when(chatSessionRepository.existsByIdAndUserId(10L, 1L)).thenReturn(true);

        mockMvc.perform(patch("/api/v1/chat/sessions/10/title")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(Map.of("title", longTitle))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "patient@example.com", roles = "PATIENT")
    void getUserSessions_ReturnsUpdatedTitle() throws Exception {
        User mockUser = User.builder().id(1L).email("patient@example.com").build();
        ChatSessionDTO sessionDTO = ChatSessionDTO.builder()
                .id(10L)
                .userId(1L)
                .title("Updated Title")
                .sessionType(ChatSession.SessionType.TRIAGE)
                .status(ChatSession.SessionStatus.ACTIVE)
                .build();

        when(userRepository.findByEmail("patient@example.com")).thenReturn(Optional.of(mockUser));
        when(chatService.getUserSessions(1L)).thenReturn(Collections.singletonList(sessionDTO));

        mockMvc.perform(get("/api/v1/chat/sessions")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(10))
                .andExpect(jsonPath("$[0].title").value("Updated Title"));
    }
}

package com.caretriage.controller;

import com.caretriage.dto.response.UserProfileResponse;
import com.caretriage.service.AvatarStorageService;
import com.caretriage.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService;

    @MockBean
    private AvatarStorageService avatarStorageService;

    @Test
    @WithMockUser(username = "test@example.com")
    public void uploadAvatar_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "avatar.jpg", "image/jpeg", "test image content".getBytes());

        when(userService.getCurrentUserProfile(anyString()))
                .thenReturn(UserProfileResponse.builder().id(1L).email("test@example.com").build());
        when(avatarStorageService.uploadAvatar(anyLong(), any()))
                .thenReturn("https://firebase.com/avatar.jpg");

        mockMvc.perform(multipart("/api/users/profile/avatar")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("https://firebase.com/avatar.jpg"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void uploadAvatar_InvalidType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.txt", "text/plain", "test content".getBytes());

        mockMvc.perform(multipart("/api/users/profile/avatar")
                        .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Chỉ chấp nhận định dạng ảnh (JPG, PNG, GIF)"));
    }

    @Test
    @WithMockUser(username = "test@example.com")
    public void uploadAvatar_EmptyFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "", "image/jpeg", new byte[0]);

        mockMvc.perform(multipart("/api/users/profile/avatar")
                        .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Vui lòng chọn file để upload"));
    }
}

package com.caretriage.controller;

import com.caretriage.service.DepartmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class DepartmentControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DepartmentService departmentService;

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    public void uploadImage_Success() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "dept.jpg", "image/jpeg", "test content".getBytes());

        when(departmentService.uploadImage(any())).thenReturn("https://firebase.com/dept.jpg");

        mockMvc.perform(multipart("/api/v1/departments/upload-image")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value("https://firebase.com/dept.jpg"));
    }

    @Test
    @WithMockUser(username = "user@example.com", roles = "USER")
    public void uploadImage_Forbidden_NotAdmin() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "dept.jpg", "image/jpeg", "test content".getBytes());

        mockMvc.perform(multipart("/api/v1/departments/upload-image")
                        .file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    public void uploadImage_Unauthorized() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "dept.jpg", "image/jpeg", "test content".getBytes());

        mockMvc.perform(multipart("/api/v1/departments/upload-image")
                        .file(file))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    public void uploadImage_InvalidMimeType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "test.pdf", "application/pdf", "test content".getBytes());

        when(departmentService.uploadImage(any())).thenThrow(new RuntimeException("Chỉ chấp nhận định dạng ảnh (JPG, PNG, GIF)"));

        mockMvc.perform(multipart("/api/v1/departments/upload-image")
                        .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Chỉ chấp nhận định dạng ảnh (JPG, PNG, GIF)"));
    }

    @Test
    @WithMockUser(username = "admin@example.com", roles = "ADMIN")
    public void uploadImage_OversizedFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file", "large.jpg", "image/jpeg", new byte[6 * 1024 * 1024]); // 6MB

        when(departmentService.uploadImage(any())).thenThrow(new RuntimeException("Dung lượng ảnh tối đa là 5MB"));

        mockMvc.perform(multipart("/api/v1/departments/upload-image")
                        .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Dung lượng ảnh tối đa là 5MB"));
    }
}

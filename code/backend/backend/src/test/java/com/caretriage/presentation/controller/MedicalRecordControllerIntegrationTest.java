package com.caretriage.presentation.controller;

import com.caretriage.application.dto.request.LoginRequest;
import com.caretriage.application.dto.request.MedicalRecordRequest;
import com.caretriage.application.dto.response.ApiResponse;
import com.caretriage.application.dto.response.AuthResponse;
import com.caretriage.domain.entity.*;
import com.caretriage.domain.repository.*;
import com.caretriage.infrastructure.persistence.mapper.UserMapper;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MedicalRecordControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AppointmentRepository appointmentRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private DepartmentRepository departmentRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String doctorToken;
    private String patientToken;
    private Appointment testAppointment;
    private User doctor;
    private User patient;

    @BeforeEach
    void setUp() throws Exception {
        // Clear test data from shared MySQL test schema.
        jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 0");
        try {
            jdbcTemplate.update("DELETE FROM extracted_entities");
            jdbcTemplate.update("DELETE FROM patient_medications");
            jdbcTemplate.update("DELETE FROM patient_conditions");
            jdbcTemplate.update("DELETE FROM patient_symptoms");
            jdbcTemplate.update("DELETE FROM clinical_notes");
            jdbcTemplate.update("DELETE FROM triage_tickets");
            jdbcTemplate.update("DELETE FROM chat_attachments");
            jdbcTemplate.update("DELETE FROM chat_messages");
            jdbcTemplate.update("DELETE FROM chat_sessions");
            jdbcTemplate.update("DELETE FROM doctor_schedules");
            jdbcTemplate.update("DELETE FROM medical_records");
            jdbcTemplate.update("DELETE FROM appointments");
            jdbcTemplate.update("DELETE FROM user_roles");
            jdbcTemplate.update("DELETE FROM doctor_profiles");
            jdbcTemplate.update("DELETE FROM patient_profiles");
            jdbcTemplate.update("DELETE FROM users");
            jdbcTemplate.update("DELETE FROM roles");
            jdbcTemplate.update("DELETE FROM departments");
        } finally {
            jdbcTemplate.execute("SET FOREIGN_KEY_CHECKS = 1");
        }

        // Create Roles
        Role doctorRole = roleRepository.save(Role.builder().name("DOCTOR").build());
        Role patientRole = roleRepository.save(Role.builder().name("PATIENT").build());

        // Create Department
        Department dept = departmentRepository.save(Department.builder()
                .name("Nội tổng quát")
                .code("NTQ")
                .slug("noi-tong-quat")
                .description("General Internal Medicine")
                .build());

        // Create Users
        doctor = userRepository.save(User.builder()
                .username("doctor_test")
                .email("doctor@test.com")
                .password(passwordEncoder.encode("Password123@"))
                .fullName("Doctor Test")
                .roles(Set.of(doctorRole))
                .isActive(true)
                .build());

        patient = userRepository.save(User.builder()
                .username("patient_test")
                .email("patient@test.com")
                .password(passwordEncoder.encode("Password123@"))
                .fullName("Patient Test")
                .roles(Set.of(patientRole))
                .isActive(true)
                .build());

        // Create Appointment
        testAppointment = appointmentRepository.save(Appointment.builder()
                .patient(UserMapper.INSTANCE.toEntity(patient))
                .doctor(UserMapper.INSTANCE.toEntity(doctor))
                .department(dept)
                .appointmentDate(java.time.LocalDate.now().plusDays(1))
                .appointmentTime(java.time.LocalTime.of(9, 0))
                .status(Appointment.AppointmentStatus.CONFIRMED)
                .reason("Đau bụng")
                .build());

        // Login to get tokens
        doctorToken = loginAndGetToken("doctor@test.com", "Password123@");
        patientToken = loginAndGetToken("patient@test.com", "Password123@");
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setEmail(email);
        loginRequest.setPassword(password);
        
        String response = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        
        com.fasterxml.jackson.core.type.TypeReference<ApiResponse<AuthResponse>> typeRef =
            new com.fasterxml.jackson.core.type.TypeReference<>() {};
        ApiResponse<AuthResponse> apiResponse = objectMapper.readValue(response, typeRef);
        return apiResponse.getData().getToken();
    }

    @Test
    void testCreateMedicalRecord_Success() throws Exception {
        MedicalRecordRequest request = MedicalRecordRequest.builder()
                .appointmentId(testAppointment.getId())
                .symptoms("Đau đầu, chóng mặt")
                .diagnosis("Thiếu máu não")
                .treatmentPlan("Nghỉ ngơi, uống nhiều nước")
                .prescription("Paracetamol 500mg x 10 viên")
                .vitalSigns("{\"bp\": \"120/80\", \"temp\": 37}")
                .build();

        mockMvc.perform(post("/api/v1/medical-records")
                .header("Authorization", "Bearer " + doctorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.diagnosis").exists())
                .andExpect(jsonPath("$.data.patientName").value("Patient Test"));
    }

    @Test
    void testGetMedicalRecord_Success() throws Exception {
        // First create a record
        MedicalRecordRequest request = MedicalRecordRequest.builder()
                .appointmentId(testAppointment.getId())
                .symptoms("Đau đầu")
                .diagnosis("Cảm cúm")
                .build();

        String createResponse = mockMvc.perform(post("/api/v1/medical-records")
                .header("Authorization", "Bearer " + doctorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andReturn().getResponse().getContentAsString();
        
        Long recordId = ((Number) objectMapper.readTree(createResponse).get("data").get("id").numberValue()).longValue();

        // Then get it
        mockMvc.perform(get("/api/v1/medical-records/" + recordId)
                .header("Authorization", "Bearer " + doctorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(recordId))
                .andExpect(jsonPath("$.data.diagnosis").exists());
    }

    @Test
    void testCreateMedicalRecord_Forbidden_For_Patient() throws Exception {
        MedicalRecordRequest request = MedicalRecordRequest.builder()
                .appointmentId(testAppointment.getId())
                .symptoms("Test")
                .diagnosis("Test")
                .build();

        mockMvc.perform(post("/api/v1/medical-records")
                .header("Authorization", "Bearer " + patientToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}

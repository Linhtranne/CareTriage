package com.caretriage.config;

import com.caretriage.entity.Role;
import com.caretriage.entity.User;
import com.caretriage.entity.LandingContent;
import com.caretriage.repository.LandingContentRepository;
import com.caretriage.repository.RoleRepository;
import com.caretriage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Slf4j
@Component
@Profile("!test")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final LandingContentRepository landingContentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("Starting data initialization...");
        // 1. Initialize Roles if not present
        Role patientRole = getOrCreateRole("PATIENT", "Default Patient role");
        Role doctorRole = getOrCreateRole("DOCTOR", "Default Doctor role");
        Role adminRole = getOrCreateRole("ADMIN", "Default Admin role");

        // 2. Initialize Users if not present
        getOrCreateUser("admin@caretriage.com", "admin", "Admin User", "Password123@", new HashSet<>(Set.of(adminRole)));
        getOrCreateUser("doctor@caretriage.com", "doctor", "Doctor User", "Password123@", new HashSet<>(Set.of(doctorRole)));
        getOrCreateUser("patient@caretriage.com", "patient", "Patient User", "Password123@", new HashSet<>(Set.of(patientRole)));

        // 3. Initialize CMS Content
        seedCMSContent();

        log.info("Data initialization completed.");
    }

    private Role getOrCreateRole(String name, String description) {
        return roleRepository.findByName(name)
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name(name)
                        .description(description)
                        .deleted(false)
                        .build()));
    }

    private void getOrCreateUser(String email, String username, String fullName, String plainPassword, Set<Role> roles) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            user = User.builder()
                    .email(email)
                    .username(username)
                    .fullName(fullName)
                    .password(passwordEncoder.encode(plainPassword))
                    .roles(roles)
                    .isActive(true)
                    .deleted(false)
                    .build();
            userRepository.save(user);
            log.info("Created seed user: {}", email);
        } else {
            // Force update roles for seed users to ensure they have correct permissions
            user.getRoles().clear();
            user.getRoles().addAll(roles);
            userRepository.save(user);
            log.info("Updated roles for seed user: {}", email);
        }
    }

    private void seedCMSContent() {
        long count = landingContentRepository.count();
        log.info("Current CMS content count: {}", count);
        // Seed if missing core content
        if (count < 20) {
            log.info("Checking and seeding missing CMS content...");
            
            // --- TIẾNG VIỆT ---
            saveContentIfAbsent("hero", "title", "Nền Tảng Y Tế Thông Minh", "vi");
            saveContentIfAbsent("hero", "subtitle", "Chuẩn Hóa Quy Trình", "vi");
            saveContentIfAbsent("hero", "description", "Tối ưu hóa quá trình phân luồng bệnh nhân và trích xuất bệnh án bằng trí tuệ nhân tạo.", "vi");
            saveContentIfAbsent("hero", "action", "Thử nghiệm ngay", "vi");

            saveContentIfAbsent("problems", "title", "Vấn Đề Quá Tải Trong Y Tế", "vi");
            saveContentIfAbsent("problems", "subtitle", "Hệ thống chăm sóc sức khỏe truyền thống đang đứng trước áp lực cực kỳ to lớn.", "vi");
            saveContentIfAbsent("problems", "wait", "Thời gian chờ đợi kéo dài", "vi");
            saveContentIfAbsent("problems", "wait_desc", "Bệnh nhân trung bình mất 2-4 tiếng xếp hàng tại quầy tiếp đón chỉ để hỏi thông tin phân luồng ban đầu.", "vi");
            saveContentIfAbsent("problems", "specialty", "Sai sót định hướng chuyên khoa", "vi");
            saveContentIfAbsent("problems", "specialty_desc", "Hơn 30% người bệnh chọn sai chuyên khoa trong lần khám đầu tiên, làm chậm trễ quy trình.", "vi");
            saveContentIfAbsent("problems", "records", "Hồ sơ cồng kềnh", "vi");
            saveContentIfAbsent("problems", "records_desc", "Ghi chép phi cấu trúc trên giấy gây khó khăn cực độ cho việc phân tích tổng quan bệnh sử bệnh nhân.", "vi");
            saveContentIfAbsent("problems", "triage247", "Sơ chẩn Tự Động 24/7", "vi");
            saveContentIfAbsent("problems", "triage247_desc", "AI tiếp nhận & đánh giá rủi ro tức thì thông qua mô tả triệu chứng thông minh.", "vi");
            saveContentIfAbsent("problems", "ehr_sync", "Số hóa EHR Tự Động", "vi");
            saveContentIfAbsent("problems", "ehr_sync_desc", "Quy đổi toàn bộ ghi chép lâm sàng sang bảng mã HL7 tiêu chuẩn chỉ sau 1 giây.", "vi");

            saveContentIfAbsent("solutions", "title", "Giải Pháp Tối Ưu Từ CareTriage", "vi");
            saveContentIfAbsent("solutions", "subtitle", "Chúng tôi tái định nghĩa trải nghiệm chăm sóc sức khỏe bằng công nghệ.", "vi");
            saveContentIfAbsent("solutions", "triage", "Sơ chẩn Tự Động 24/7", "vi");
            saveContentIfAbsent("solutions", "triage_desc", "AI tiếp nhận & đánh giá rủi ro tức thì thông qua mô tả triệu chứng thông minh.", "vi");
            saveContentIfAbsent("solutions", "routing", "Điều hướng Thông Minh", "vi");
            saveContentIfAbsent("solutions", "routing_desc", "Phân luồng hồ sơ bệnh chính xác đến từng phòng khám chuyên môn sâu phù hợp.", "vi");
            saveContentIfAbsent("solutions", "ehr", "Số hóa EHR Tự Động", "vi");
            saveContentIfAbsent("solutions", "ehr_desc", "Quy đổi toàn bộ ghi chép lâm sàng sang bảng mã HL7 tiêu chuẩn chỉ sau 1 giây.", "vi");

            saveContentIfAbsent("departments", "title", "Chuyên Khoa Của Chúng Tôi", "vi");
            saveContentIfAbsent("departments", "subtitle", "Đội ngũ bác sĩ chuyên môn cao cùng trang thiết bị hiện đại.", "vi");

            // --- ENGLISH ---
            saveContentIfAbsent("hero", "title", "Smart Medical Platform", "en");
            saveContentIfAbsent("hero", "subtitle", "Standardize Workflows", "en");
            saveContentIfAbsent("hero", "description", "Optimize patient triage and clinical note extraction powered by advanced AI models.", "en");
            saveContentIfAbsent("hero", "action", "Try It Now", "en");

            saveContentIfAbsent("problems", "title", "Healthcare Overload Issues", "en");
            saveContentIfAbsent("problems", "subtitle", "Traditional healthcare systems are facing immense pressure.", "en");
            saveContentIfAbsent("problems", "wait", "Prolonged Waiting Hours", "en");
            saveContentIfAbsent("problems", "wait_desc", "Average patients spend 2-4 hours queueing up just for initial department navigation.", "en");
            saveContentIfAbsent("problems", "specialty", "Specialty Misdirection", "en");
            saveContentIfAbsent("problems", "specialty_desc", "Over 30% of initial patient check-ins select invalid clinical paths.", "en");
            saveContentIfAbsent("problems", "records", "Paper-based Records", "en");
            saveContentIfAbsent("problems", "records_desc", "Unstructured paper records make it difficult for medical history overview.", "en");
            saveContentIfAbsent("problems", "triage247", "24/7 Automated Triage", "en");
            saveContentIfAbsent("problems", "triage247_desc", "Immediate risk scoring based on symptom inputs.", "en");
            saveContentIfAbsent("problems", "ehr_sync", "Automated EHR Sync", "en");
            saveContentIfAbsent("problems", "ehr_sync_desc", "Convert diagnostic notes to HL7 structures in one second.", "en");

            saveContentIfAbsent("solutions", "title", "Optimal Solutions from CareTriage", "en");
            saveContentIfAbsent("solutions", "subtitle", "We redefine the healthcare experience with technology.", "en");
            saveContentIfAbsent("solutions", "triage", "24/7 Auto Consultation", "en");
            saveContentIfAbsent("solutions", "triage_desc", "AI receives & evaluates risks instantly through smart symptom descriptions.", "en");
            saveContentIfAbsent("solutions", "routing", "Intelligent Routing", "en");
            saveContentIfAbsent("solutions", "routing_desc", "Accurate record distribution to the most appropriate specialized clinics.", "en");
            saveContentIfAbsent("solutions", "ehr", "Auto EHR Digitization", "en");
            saveContentIfAbsent("solutions", "ehr_desc", "Convert all clinical notes to standard HL7 format in just 1 second.", "en");

            saveContentIfAbsent("departments", "title", "Our Specialties", "en");
            saveContentIfAbsent("departments", "subtitle", "Professional medical departments equipped with advanced technology.", "en");
            
            log.info("CMS seeding check completed.");
        }
    }

    private void saveContentIfAbsent(String section, String key, String val, String lang) {
        if (!landingContentRepository.existsBySectionAndContentKeyAndLanguage(section, key, lang)) {
            landingContentRepository.save(LandingContent.builder()
                .section(section).contentKey(key).contentValue(val).language(lang).build());
        }
    }
}

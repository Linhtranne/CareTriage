-- Realistic Clinical Data for CareTriage
-- Purpose: Mocking a production-ready medical environment

-- 1. SEED DEPARTMENTS
INSERT INTO departments (code, name, slug, description, status, is_active, deleted, created_at, updated_at) VALUES
('GEN', 'Nội Tổng quát', 'noi-tong-quat', 'Khám và tư vấn các bệnh lý nội khoa chung cho người lớn.', 'ACTIVE', 1, 0, NOW(), NOW()),
('PED', 'Nhi khoa', 'nhi-khoa', 'Chăm sóc sức khỏe toàn diện cho trẻ em từ sơ sinh đến vị thành niên.', 'ACTIVE', 1, 0, NOW(), NOW()),
('CARD', 'Tim mạch', 'tim-mach', 'Chẩn đoán và điều trị các bệnh lý về tim và mạch máu.', 'ACTIVE', 1, 0, NOW(), NOW()),
('DERM', 'Da liễu', 'da-lieu', 'Điều trị các bệnh về da, lông, tóc, móng và thẩm mỹ da.', 'ACTIVE', 1, 0, NOW(), NOW()),
('ORTHO', 'Chấn thương chỉnh hình', 'chan-thuong-chinh-hinh', 'Điều trị các bệnh lý cơ xương khớp và chấn thương thể thao.', 'ACTIVE', 1, 0, NOW(), NOW()),
('PSY', 'Sức khỏe tâm thần', 'suc-khoe-tam-than', 'Tư vấn và điều trị các rối loạn tâm lý, trầm cảm, lo âu.', 'ACTIVE', 1, 0, NOW(), NOW());

-- 2. SEED DOCTOR PROFILES
INSERT INTO doctor_profiles (user_id, bio, specialization, experience_years, degrees, hospital_name, created_at, updated_at) VALUES
(2, 'Chuyên gia hàng đầu về can thiệp tim mạch với hơn 15 năm kinh nghiệm.', 'Tim mạch học', 15, 'Tiến sĩ Y khoa, Đại học Y Dược', 'Bệnh viện Chợ Rẫy', NOW(), NOW()),
(3, 'Bác sĩ tận tâm với trẻ nhỏ, chuyên điều trị các bệnh lý hô hấp.', 'Nhi khoa', 10, 'Thạc sĩ Nhi khoa', 'Bệnh viện Nhi Đồng 1', NOW(), NOW()),
(4, 'Chuyên điều trị các bệnh lý da liễu phức tạp và thẩm mỹ.', 'Da liễu', 12, 'Bác sĩ Chuyên khoa II', 'Bệnh viện Da Liễu', NOW(), NOW()),
(5, 'Kinh nghiệm dày dặn trong chẩn đoán và điều trị bệnh nội khoa.', 'Nội tổng quát', 8, 'Bác sĩ Đa khoa', 'Bệnh viện Đại học Y Dược', NOW(), NOW());

-- 2. LINK DOCTORS TO DEPARTMENTS
INSERT INTO doctor_departments (doctor_profile_id, department_id) VALUES
(1, 3), -- Dr. 1 -> Card
(2, 2), -- Dr. 2 -> Ped
(3, 4), -- Dr. 3 -> Derm
(4, 1); -- Dr. 4 -> Gen

-- 3. SEED TICKET CATEGORIES
INSERT INTO ticket_categories (code, name, description, is_active, created_at, updated_at) VALUES
('CARD', 'Tim mạch', 'Các vấn đề liên quan đến tim và mạch máu', 1, NOW(), NOW()),
('PED', 'Nhi khoa', 'Sức khỏe trẻ em', 1, NOW(), NOW()),
('DERM', 'Da liễu', 'Bệnh lý da liễu', 1, NOW(), NOW()),
('GEN', 'Nội tổng quát', 'Khám nội khoa chung', 1, NOW(), NOW());

-- 4. SEED CHAT SESSIONS
INSERT INTO chat_sessions (id, user_id, session_type, status, title, created_at, updated_at) VALUES
(1, 6, 'TRIAGE', 'COMPLETED', 'Tư vấn đau ngực', NOW(), NOW()),
(2, 7, 'TRIAGE', 'COMPLETED', 'Tư vấn nhi khoa', NOW(), NOW());

-- 5. SEED Triage Tickets
INSERT INTO triage_tickets (id, ticket_number, title, description, status, priority, severity, requester_id, patient_id, category_id, chat_session_id, metadata, created_at, updated_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'TICKET-2024-001', 'Đau ngực trái và khó thở', 'Bệnh nhân nam, 45 tuổi, đau thắt ngực lan ra cánh tay trái.', 'NEW', 'URGENT', 'CRITICAL', 6, 6, 1, 1, '{"ai_confidence": 0.95}', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440001', 'TICKET-2024-002', 'Trẻ sốt cao co giật', 'Trẻ 3 tuổi, sốt 39.5 độ C, có biểu hiện co giật.', 'NEW', 'URGENT', 'CRITICAL', 7, 7, 2, 2, '{"ai_confidence": 0.92}', NOW(), NOW());





-- 6. SEED DOCTOR SCHEDULES
INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_active, created_at) VALUES
(2, 'MONDAY', '08:00:00', '12:00:00', 1, NOW()),
(2, 'MONDAY', '13:30:00', '17:00:00', 1, NOW()),
(3, 'TUESDAY', '08:00:00', '12:00:00', 1, NOW()),
(3, 'WEDNESDAY', '08:00:00', '12:00:00', 1, NOW()),
(4, 'THURSDAY', '09:00:00', '16:00:00', 1, NOW());

-- 7. SEED PATIENT PROFILES
INSERT INTO patient_profiles (user_id, date_of_birth, gender, blood_type, created_at, updated_at) VALUES
(6, '1985-05-20', 'MALE', 'O+', NOW(), NOW()),
(7, '2021-03-10', 'FEMALE', 'A-', NOW(), NOW());

-- 8. SEED APPOINTMENTS
INSERT INTO appointments (patient_id, doctor_id, department_id, appointment_date, appointment_time, status, reason, created_at, updated_at) VALUES
(6, 2, 3, CURDATE(), '09:00:00', 'CONFIRMED', 'Kiểm tra định kỳ tim mạch', NOW(), NOW()),
(7, 3, 2, CURDATE(), '10:30:00', 'PENDING', 'Bé bị sốt nhẹ', NOW(), NOW());

-- 9. SEED MEDICAL RECORDS
INSERT INTO medical_records (patient_id, doctor_id, appointment_id, diagnosis, symptoms, treatment_plan, created_at, updated_at) VALUES
(6, 2, 1, 'Rối loạn nhịp tim nhẹ', 'Hồi hộp, đánh trống ngực', 'Nghỉ ngơi, theo dõi thêm, tái khám sau 1 tháng', NOW(), NOW());






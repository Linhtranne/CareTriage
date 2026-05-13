-- Large Vietnamese seed dataset for local and end-to-end testing
-- Base auth records are aligned with DataInitializer

INSERT INTO roles (id, name, description, deleted) VALUES
(1, 'ADMIN', 'Quyen quan tri toan he thong', 0),
(2, 'DOCTOR', 'Quyen bac si kham va xu ly ho so', 0),
(3, 'PATIENT', 'Quyen benh nhan su dung dich vu', 0);

INSERT INTO users (id, username, email, password, full_name, phone, avatar_url, refresh_token, two_factor_email, two_factor_sms, is_active, deleted, created_at, updated_at) VALUES
(4, 'bs.lan', 'bs.lan@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'BS Tran Thi Lan', '0901000004', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(5, 'bs.huy', 'bs.huy@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'BS Le Hoang Huy', '0901000005', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(6, 'bs.khanh', 'bs.khanh@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'BS Pham Thu Khanh', '0901000006', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(7, 'bs.tuan', 'bs.tuan@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'BS Do Quoc Tuan', '0901000007', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(8, 'bs.thao', 'bs.thao@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'BS Vu Minh Thao', '0901000008', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(9, 'bs.mai', 'bs.mai@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'BS Nguyen Thi Mai', '0901000009', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(10, 'bs.hoang', 'bs.hoang@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'BS Trinh Hoang', '0901000010', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(11, 'hoa', 'benhnhan.hoa@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'Tran Thi Hoa', '0901000011', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(12, 'hung', 'benhnhan.hung@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'Nguyen Hoang Hung', '0901000012', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(13, 'linh', 'benhnhan.linh@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'Le Thi Linh', '0901000013', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(14, 'quan', 'benhnhan.quan@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'Pham Quoc Quan', '0901000014', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(15, 'thuy', 'benhnhan.thuy@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'Tran Thi Thuy', '0901000015', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(16, 'anh', 'benhnhan.anh@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'Nguyen Thi Anh', '0901000016', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(17, 'van', 'benhnhan.van@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'Do Minh Van', '0901000017', NULL, NULL, 0, 0, 1, 0, NOW(), NOW()),
(18, 'son', 'benhnhan.son@caretriage.com', '$2b$12$Z.XLqQl8Wevw8ZUYWLWhM.e/2LWIVKdFjiEpxisjJzc/89GQr6cxO', 'Bui Duc Son', '0901000018', NULL, NULL, 0, 0, 1, 0, NOW(), NOW());

INSERT INTO user_roles (user_id, role_id) VALUES
(4, 2),
(5, 2),
(6, 2),
(7, 2),
(8, 2),
(9, 2),
(10, 2),
(11, 3),
(12, 3),
(13, 3),
(14, 3),
(15, 3),
(16, 3),
(17, 3),
(18, 3);

INSERT INTO departments (id, code, name, slug, description, status, created_at, updated_at) VALUES
(1, 'TIM', 'Tim mach', 'tim-mach', 'Kham va dieu tri benh ly tim, huyet ap va roi loan nhip.', 'ACTIVE', NOW(), NOW()),
(2, 'NHI', 'Nhi khoa', 'nhi-khoa', 'Cham soc suc khoe tre em, sot, ho, tiem chung va phat trien.', 'ACTIVE', NOW(), NOW()),
(3, 'DERM', 'Da lieu', 'da-lieu', 'Dieu tri mun, viem da, di ung, nam da va cac van de ve da.', 'ACTIVE', NOW(), NOW()),
(4, 'GEN', 'Noi tong quat', 'noi-tong-quat', 'Kham noi tong quat va tu van suc khoe dinh ky.', 'ACTIVE', NOW(), NOW()),
(5, 'ORTHO', 'Co xuong khop', 'co-xuong-khop', 'Chan doan, dieu tri va phuc hoi benh ly xuong khop, chan thuong.', 'ACTIVE', NOW(), NOW()),
(6, 'ENT', 'Tai Mui Hong', 'tai-mui-hong', 'Kham viem xoang, viem hong, viem tai va roi loan ve mui hong.', 'ACTIVE', NOW(), NOW()),
(7, 'OB', 'San phu khoa', 'san-phu-khoa', 'Theo doi thai ky, phu khoa va ke hoach hoa gia dinh.', 'ACTIVE', NOW(), NOW()),
(8, 'PSY', 'Tam than', 'tam-than', 'Ho tro roi loan lo au, mat ngu, tram cam va stress keo dai.', 'ACTIVE', NOW(), NOW()),
(9, 'GI', 'Tieu hoa', 'tieu-hoa', 'Kham dau bung, trao nguoc, roi loan tieu hoa va gan mat.', 'ACTIVE', NOW(), NOW()),
(10, 'RESP', 'Ho hap', 'ho-hap', 'Kham ho, hen, viem phoi va cac benh ly duong ho hap.', 'ACTIVE', NOW(), NOW());

INSERT INTO ticket_categories (id, code, name, description, is_active, created_at, updated_at) VALUES
(1, 'TIM', 'Tim mach', 'Cac truong hop lien quan den tim va mach mau', 1, NOW(), NOW()),
(2, 'NHI', 'Nhi khoa', 'Cac van de suc khoe tre em', 1, NOW(), NOW()),
(3, 'DERM', 'Da lieu', 'Cac benh ly ve da va di ung da', 1, NOW(), NOW()),
(4, 'GEN', 'Noi tong quat', 'Kham noi khoa tong quat', 1, NOW(), NOW()),
(5, 'ORTHO', 'Co xuong khop', 'Chan thuong va benh ly xuong khop', 1, NOW(), NOW()),
(6, 'ENT', 'Tai Mui Hong', 'Viem hong, viem xoang va van de tai mui hong', 1, NOW(), NOW()),
(7, 'OB', 'San phu khoa', 'Theo doi thai ky va phu khoa', 1, NOW(), NOW()),
(8, 'PSY', 'Tam than', 'Suc khoe tam than va giac ngu', 1, NOW(), NOW()),
(9, 'GI', 'Tieu hoa', 'Van de dau bung va tieu hoa', 1, NOW(), NOW()),
(10, 'RESP', 'Ho hap', 'Benh ly duong ho hap', 1, NOW(), NOW());

INSERT INTO doctor_profiles (id, user_id, bio, specialization, experience_years, degrees, hospital_name, created_at, updated_at) VALUES
(1, 2, 'Chuyen ve tim mach can thiep va tam soat nguy co tim mach cho nguoi truong thanh.', 'Tim mach can thiep', 15, 'Bac si chuyen khoa II, Thac si Tim mach', 'Benh vien Cho Ray', NOW(), NOW()),
(2, 4, 'Tiep nhan kham nhi, sot, ho, tieu hoa va tu van phat trien cho tre em.', 'Nhi khoa', 11, 'Thac si Nhi khoa', 'Benh vien Nhi Dong 1', NOW(), NOW()),
(3, 5, 'Dieu tri mun, viem da, di ung da va cac benh ly da lieu pho bien.', 'Da lieu', 12, 'Bac si chuyen khoa I', 'Benh vien Da lieu TP.HCM', NOW(), NOW()),
(4, 6, 'Kham noi tong quat, danh gia tong the va tu van phat hien som benh ly noi khoa.', 'Noi tong quat', 9, 'Bac si da khoa', 'Benh vien Dai hoc Y Duoc', NOW(), NOW()),
(5, 7, 'Chan doan va phuc hoi benh ly xuong khop, bong gan va chan thuong the thao.', 'Co xuong khop', 14, 'Bac si chuyen khoa I', 'Benh vien Chan thuong Chinh hinh', NOW(), NOW()),
(6, 8, 'Kham viem xoang, viem tai, viem hong va cac roi loan ve mui hong.', 'Tai Mui Hong', 10, 'Bac si chuyen khoa I', 'Benh vien Tai Mui Hong', NOW(), NOW()),
(7, 9, 'Theo doi thai ky, phu khoa va tu van ke hoach hoa gia dinh.', 'San phu khoa', 13, 'Thac si San phu khoa', 'Benh vien Tu Du', NOW(), NOW()),
(8, 10, 'Ho tro dieu tri roi loan lo au, mat ngu, tram cam va cac van de tam ly.', 'Tam than', 8, 'Bac si chuyen khoa I', 'Benh vien Tam than Trung uong 2', NOW(), NOW());

INSERT INTO doctor_departments (doctor_profile_id, department_id) VALUES
(1, 1),
(1, 4),
(2, 2),
(3, 3),
(4, 4),
(4, 9),
(5, 5),
(6, 6),
(6, 10),
(7, 7),
(8, 8);

INSERT INTO patient_profiles (id, user_id, date_of_birth, gender, address, blood_type, allergies, insurance_number, emergency_contact_name, emergency_contact_phone, chronic_conditions, created_at, updated_at) VALUES
(1, 3, '1988-04-12', 'MALE', 'Phuong Tan Phu, Quan 7, TP. Ho Chi Minh', 'O+', 'Di ung hai san', 'BT-2026-0001', 'Tran Thi Mai', '0902000001', 'Tang huyet ap nhe', NOW(), NOW()),
(2, 11, '2019-09-05', 'FEMALE', 'Phuong 10, Quan 3, TP. Ho Chi Minh', 'A+', 'Di ung penicillin', 'BT-2026-0002', 'Nguyen Van Hoa', '0902000002', 'Tien su viem phe quan tai phat', NOW(), NOW()),
(3, 12, '1995-02-18', 'MALE', 'TP. Thu Duc, TP. Ho Chi Minh', 'B+', NULL, 'BT-2026-0003', 'Le Thi Hanh', '0902000003', NULL, NOW(), NOW()),
(4, 13, '2001-11-21', 'FEMALE', 'Quan Binh Thanh, TP. Ho Chi Minh', 'O-', 'Di ung phan hoa', 'BT-2026-0004', 'Le Minh Tam', '0902000004', 'Viem mui di ung', NOW(), NOW()),
(5, 14, '1983-07-09', 'MALE', 'TP. Ha Noi', 'A-', NULL, 'BT-2026-0005', 'Pham Thi Lan', '0902000005', 'Dau lung man tinh', NOW(), NOW()),
(6, 15, '1990-03-30', 'FEMALE', 'Quan Ninh Kieu, Can Tho', 'O+', 'Di ung thuoc giam dau NSAID', 'BT-2026-0006', 'Tran Van Binh', '0902000006', 'Hen nhe', NOW(), NOW()),
(7, 16, '1992-12-14', 'FEMALE', 'Quan Hai Chau, Da Nang', 'B-', NULL, 'BT-2026-0007', 'Nguyen Hoang Son', '0902000007', 'Thai ky 24 tuan', NOW(), NOW()),
(8, 17, '1978-10-02', 'MALE', 'TP. Bien Hoa, Dong Nai', 'AB+', NULL, 'BT-2026-0008', 'Tran Thi Hong', '0902000008', 'Mat ngu keo dai', NOW(), NOW()),
(9, 18, '1969-01-16', 'MALE', 'TP. Hai Phong', 'O-', 'Di ung aspirin', 'BT-2026-0009', 'Do Thi Mai', '0902000009', 'Tien su viem phoi', NOW(), NOW());

INSERT INTO doctor_schedules (id, doctor_id, day_of_week, start_time, end_time, is_active, created_at, updated_at) VALUES
(1, 2, 'MONDAY', '08:00:00', '11:30:00', 1, NOW(), NOW()),
(2, 2, 'THURSDAY', '13:00:00', '17:00:00', 1, NOW(), NOW()),
(3, 4, 'TUESDAY', '08:00:00', '12:00:00', 1, NOW(), NOW()),
(4, 4, 'FRIDAY', '13:30:00', '17:30:00', 1, NOW(), NOW()),
(5, 5, 'MONDAY', '13:00:00', '17:00:00', 1, NOW(), NOW()),
(6, 5, 'WEDNESDAY', '08:00:00', '12:00:00', 1, NOW(), NOW()),
(7, 6, 'TUESDAY', '13:00:00', '17:00:00', 1, NOW(), NOW()),
(8, 6, 'SATURDAY', '08:00:00', '12:00:00', 1, NOW(), NOW()),
(9, 7, 'WEDNESDAY', '13:00:00', '17:00:00', 1, NOW(), NOW()),
(10, 7, 'FRIDAY', '08:00:00', '12:00:00', 1, NOW(), NOW()),
(11, 8, 'THURSDAY', '08:00:00', '12:00:00', 1, NOW(), NOW()),
(12, 8, 'SATURDAY', '13:00:00', '17:00:00', 1, NOW(), NOW()),
(13, 9, 'MONDAY', '09:00:00', '12:00:00', 1, NOW(), NOW()),
(14, 9, 'THURSDAY', '13:00:00', '16:30:00', 1, NOW(), NOW()),
(15, 10, 'TUESDAY', '09:00:00', '12:00:00', 1, NOW(), NOW()),
(16, 10, 'FRIDAY', '13:00:00', '16:30:00', 1, NOW(), NOW());

INSERT INTO chat_sessions (id, user_id, session_type, status, ai_summary, suggested_department, urgency_level, title, last_message_content, last_message_time, created_at, updated_at) VALUES
(1, 3, 'TRIAGE', 'COMPLETED', 'Dau hieu phu hop voi van de tim mach va can uu tien kham som.', 'Tim mach', 'HIGH', 'Tu van dau nguc', 'Phiên được phân luồng tạm thời sang Tim mạch để ưu tiên khám.', '2026-05-12 08:03:00', NOW(), NOW()),
(2, 11, 'TRIAGE', 'COMPLETED', 'Tre co dau hieu sot cao va can duoc danh gia tai Nhi khoa.', 'Nhi khoa', 'HIGH', 'Tre sot cao', 'Đã đề xuất Nhi khoa cho hồ sơ này.', '2026-05-12 08:13:00', NOW(), NOW()),
(3, 12, 'CONSULTATION', 'ACTIVE', 'Hinh anh va mo ta phu hop voi viem da tiep xuc di ung.', 'Da lieu', 'MEDIUM', 'Man do ngua da', 'Đã lưu phiên để bác sĩ Da liễu theo dõi.', '2026-05-12 08:23:00', NOW(), NOW()),
(4, 14, 'TRIAGE', 'COMPLETED', 'Chuyen sang Co xuong khop de danh gia chan thuong goi.', 'Co xuong khop', 'MEDIUM', 'Dau goi sau khi choi bong', 'Khuyến nghị Cơ xương khớp để đánh giá chấn thương.', '2026-05-12 08:33:00', NOW(), NOW()),
(5, 15, 'FOLLOW_UP', 'ACTIVE', 'Trieu chung keo dai phu hop voi danh gia Tai Mui Hong.', 'Tai Mui Hong', 'MEDIUM', 'Dau hong keo dai', 'Phiên follow-up đã được ghi nhận.', '2026-05-12 08:43:00', NOW(), NOW()),
(6, 17, 'TRIAGE', 'COMPLETED', 'Mau than, mat ngu va lo au can duoc danh gia chuyen sau.', 'Tam than', 'HIGH', 'Mat ngu va lo au', 'Đề xuất Tâm thần để đánh giá chuyên sâu.', '2026-05-12 08:53:00', NOW(), NOW());

INSERT INTO chat_messages (id, session_id, sender_type, content, metadata, created_at) VALUES
(1, 1, 'USER', 'Tôi bị đau tức ngực trái khi leo cầu thang, có lúc lan ra vai.', NULL, '2026-05-12 08:01:00'),
(2, 1, 'AI', 'Tôi đã ghi nhận triệu chứng. Bạn có khó thở, chóng mặt hoặc buồn nôn không?', '{"confidence":0.93,"intent":"triage","department":"Tim mach"}', '2026-05-12 08:02:00'),
(3, 1, 'SYSTEM', 'Phiên được phân luồng tạm thời sang Tim mạch để ưu tiên khám.', '{"action":"route","department":"Tim mach"}', '2026-05-12 08:03:00'),
(4, 2, 'USER', 'Con tôi sốt 39 độ, ho nhẹ và bỏ bú.', NULL, '2026-05-12 08:11:00'),
(5, 2, 'AI', 'Tôi cần biết bé có khó thở, co giật hay li bì không?', '{"confidence":0.95,"intent":"triage","department":"Nhi khoa"}', '2026-05-12 08:12:00'),
(6, 2, 'SYSTEM', 'Đã đề xuất Nhi khoa cho hồ sơ này.', '{"action":"route","department":"Nhi khoa"}', '2026-05-12 08:13:00'),
(7, 3, 'USER', 'Da tôi nổi mẩn đỏ ngứa sau khi đổi sữa rửa mặt.', NULL, '2026-05-12 08:21:00'),
(8, 3, 'AI', 'Bạn có sưng môi, khó thở hoặc tổn thương lan nhanh không?', '{"confidence":0.89,"intent":"consultation","department":"Da lieu"}', '2026-05-12 08:22:00'),
(9, 3, 'SYSTEM', 'Đã lưu phiên để bác sĩ Da liễu theo dõi.', '{"action":"route","department":"Da lieu"}', '2026-05-12 08:23:00'),
(10, 4, 'USER', 'Tôi đau gối phải sau khi đá bóng, đi lại hơi khó.', NULL, '2026-05-12 08:31:00'),
(11, 4, 'AI', 'Bạn có sưng khớp, bầm tím hoặc không chịu lực được không?', '{"confidence":0.87,"intent":"triage","department":"Co xuong khop"}', '2026-05-12 08:32:00'),
(12, 4, 'SYSTEM', 'Khuyến nghị Cơ xương khớp để đánh giá chấn thương.', '{"action":"route","department":"Co xuong khop"}', '2026-05-12 08:33:00'),
(13, 5, 'USER', 'Tôi ho khan và đau họng gần 2 tuần, nói chuyện bị khàn.', NULL, '2026-05-12 08:41:00'),
(14, 5, 'AI', 'Bạn có sốt, nghẹt mũi hay khó nuốt không?', '{"confidence":0.86,"intent":"follow_up","department":"Tai Mui Hong"}', '2026-05-12 08:42:00'),
(15, 5, 'SYSTEM', 'Phiên follow-up đã được ghi nhận.', '{"action":"follow_up","department":"Tai Mui Hong"}', '2026-05-12 08:43:00'),
(16, 6, 'USER', 'Gần đây tôi mất ngủ, tim đập nhanh và rất lo lắng.', NULL, '2026-05-12 08:51:00'),
(17, 6, 'AI', 'Tình trạng này xuất hiện bao lâu và có ảnh hưởng công việc không?', '{"confidence":0.91,"intent":"triage","department":"Tam than"}', '2026-05-12 08:52:00'),
(18, 6, 'SYSTEM', 'Đề xuất Tâm thần để đánh giá chuyên sâu.', '{"action":"route","department":"Tam than"}', '2026-05-12 08:53:00');

INSERT INTO chat_attachments (id, session_id, original_filename, mime_type, file_size, file_content, extracted_text, extraction_status, created_at, updated_at) VALUES
(1, 1, 'dien-tim-va-xquang-nguc.pdf', 'application/pdf', 245760, NULL, 'Điện tim nhịp xoang, X-quang ngực chưa ghi nhận tổn thương cấp tính.', 'COMPLETED', NOW(), NOW()),
(2, 2, 'ket-qua-xet-nghiem-mau.jpg', 'image/jpeg', 512000, NULL, 'Bạch cầu tăng nhẹ, CRP dương tính mức nhẹ, phù hợp nhiễm siêu vi.', 'COMPLETED', NOW(), NOW()),
(3, 3, 'anh-ton-thuong-da.png', 'image/png', 380000, NULL, 'Mảng đỏ rải rác vùng cẳng tay, không thấy mủ hay phù nề.', 'COMPLETED', NOW(), NOW()),
(4, 4, 'phim-xquang-goi.jpg', 'image/jpeg', 402000, NULL, 'Không thấy gãy xương, khe khớp còn bảo tồn.', 'COMPLETED', NOW(), NOW()),
(5, 5, 'don-thuoc-cu.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 85000, NULL, 'Đơn thuốc viêm họng trước đây, có ghi amoxicillin.', 'COMPLETED', NOW(), NOW()),
(6, 6, 'phieu-giac-ngu.pdf', 'application/pdf', 120000, NULL, 'Điểm giấc ngủ thấp, tần suất thức giấc cao, lo âu tăng.', 'COMPLETED', NOW(), NOW());

INSERT INTO triage_tickets (id, ticket_number, title, description, status, priority, severity, requester_id, triage_officer_id, category_id, chat_session_id, metadata, triaged_at, deleted_at, created_at, updated_at) VALUES
('446655440001', 'TICKET-2026-0001', 'Đau ngực trái, khó thở nhẹ', 'Bệnh nhân nam 37 tuổi đau tức ngực trái khi vận động, kèm hồi hộp.', 'TRIAGED', 'URGENT', 'CRITICAL', 3, 2, 1, 1, '{"ai_confidence":0.96,"department":"Tim mach"}', '2026-05-12 08:10:00', NULL, NOW(), NOW()),
('446655440002', 'TICKET-2026-0002', 'Sốt cao ở trẻ 4 tuổi', 'Trẻ sốt 39 độ, ho nhẹ, bỏ bú và cần đánh giá Nhi khoa.', 'TRIAGED', 'URGENT', 'MAJOR', 11, 4, 2, 2, '{"ai_confidence":0.95,"department":"Nhi khoa"}', '2026-05-12 08:40:00', NULL, NOW(), NOW()),
('446655440003', 'TICKET-2026-0003', 'Phát ban ngứa kéo dài', 'Mảng đỏ ngứa xuất hiện sau khi đổi sữa rửa mặt, cần bác sĩ da liễu.', 'IN_TRIAGE', 'HIGH', 'MAJOR', 12, 5, 3, 3, '{"ai_confidence":0.89,"department":"Da lieu"}', NULL, NULL, NOW(), NOW()),
('446655440004', 'TICKET-2026-0004', 'Đau gối phải sau khi chơi bóng', 'Đau khớp gối phải, đi lại khó khăn sau chấn thương thể thao.', 'NEW', 'MEDIUM', 'MINOR', 14, 7, 5, 4, '{"ai_confidence":0.87,"department":"Co xuong khop"}', NULL, NULL, NOW(), NOW()),
('446655440005', 'TICKET-2026-0005', 'Mất ngủ, lo âu và tim đập nhanh', 'Người bệnh mất ngủ kéo dài, tim đập nhanh và căng thẳng thường xuyên.', 'TRIAGED', 'HIGH', 'MAJOR', 17, 10, 8, 6, '{"ai_confidence":0.91,"department":"Tam than"}', '2026-05-12 10:35:00', NULL, NOW(), NOW()),
('446655440006', 'TICKET-2026-0006', 'Đau họng, khàn tiếng kéo dài', 'Ho khan và đau họng gần 2 tuần, cần đánh giá Tai Mũi Họng.', 'CLOSED', 'MEDIUM', 'MINOR', 15, 8, 6, 5, '{"ai_confidence":0.86,"department":"Tai Mui Hong"}', '2026-05-12 10:10:00', NULL, NOW(), NOW());

INSERT INTO appointments (id, patient_id, doctor_id, department_id, appointment_date, appointment_time, end_time, status, reason, notes, cancellation_reason, triage_ticket_id, created_at, updated_at) VALUES
(1, 3, 2, 1, '2026-05-07', '09:00:00', '09:35:00', 'COMPLETED', 'Đau tức ngực trái, hồi hộp khi vận động.', 'ECG ổn định, theo dõi huyết áp.', NULL, '446655440001', NOW(), NOW()),
(2, 11, 4, 2, '2026-05-08', '10:15:00', '10:45:00', 'COMPLETED', 'Sốt cao, ho nhẹ, bỏ bú.', 'Theo dõi tại nhà.', NULL, '446655440002', NOW(), NOW()),
(3, 12, 5, 3, '2026-05-09', '14:00:00', '14:30:00', 'COMPLETED', 'Nổi mẩn đỏ ngứa sau khi đổi mỹ phẩm.', 'Ngưng sản phẩm mới.', NULL, '446655440003', NOW(), NOW()),
(4, 14, 7, 5, '2026-05-10', '15:30:00', NULL, 'CANCELLED', 'Đau gối phải sau khi đá bóng.', NULL, 'Bệnh nhân đổi lịch do bận công tác.', '446655440004', NOW(), NOW()),
(5, 15, 8, 6, '2026-05-11', '08:30:00', '09:05:00', 'COMPLETED', 'Đau họng, khàn tiếng, ho khan.', 'Dùng nước ấm, súc họng.', NULL, '446655440006', NOW(), NOW()),
(6, 17, 10, 8, '2026-05-12', '16:00:00', NULL, 'IN_PROGRESS', 'Mất ngủ, tim đập nhanh, lo âu.', 'Đã khai thác triệu chứng ban đầu.', NULL, '446655440005', NOW(), NOW()),
(7, 16, 9, 7, '2026-05-13', '11:00:00', NULL, 'PENDING', 'Khám thai định kỳ 24 tuần.', NULL, NULL, NULL, NOW(), NOW()),
(8, 18, 6, 10, '2026-05-14', '13:30:00', NULL, 'NO_SHOW', 'Ho kéo dài, đau ngực khi ho.', 'Không đến khám đúng giờ.', 'Bệnh nhân vắng mặt không báo trước.', NULL, NOW(), NOW()),
(9, 3, 2, 1, '2026-05-15', '09:45:00', NULL, 'CONFIRMED', 'Tái khám sau thay đổi thuốc huyết áp.', 'Chờ kết quả xét nghiệm mỡ máu.', NULL, NULL, NOW(), NOW()),
(10, 13, 6, 4, '2026-05-16', '10:30:00', '11:00:00', 'COMPLETED', 'Sốt nhẹ, ho khan 3 ngày.', 'Nghỉ ngơi, uống đủ nước.', NULL, NULL, NOW(), NOW());

INSERT INTO medical_records (id, appointment_id, patient_id, doctor_id, diagnosis, symptoms, treatment_plan, prescription, notes, vital_signs, follow_up_date, created_at, updated_at) VALUES
(1, 1, 3, 2, 'Cơn đau thắt ngực mức độ nhẹ, chưa ghi nhận dấu hiệu thiếu máu cơ tim cấp.', 'Đau tức ngực trái, hồi hộp, khó chịu khi leo cầu thang.', 'Nghỉ ngơi, theo dõi huyết áp tại nhà, tái khám chuyên khoa tim mạch sau 2 tuần.', 'Amlodipine 5mg nếu huyết áp tăng; nitroglycerin ngậm khi có chỉ định.', 'Khuyến cáo giảm muối và hạn chế cà phê.', '{"bp":"138/84","hr":84,"temp":36.8,"spo2":98}', '2026-05-21', NOW(), NOW()),
(2, 2, 11, 4, 'Nhiễm siêu vi đường hô hấp trên kèm sốt.', 'Sốt 39 độ, ho khan, mệt.', 'Hạ sốt khi cần, uống nhiều nước, theo dõi 48 giờ.', 'Paracetamol 250mg khi sốt trên 38.5 độ.', 'Phụ huynh cần theo dõi dấu hiệu thở nhanh.', '{"bp":"100/65","hr":112,"temp":39.1,"spo2":99}', '2026-05-12', NOW(), NOW()),
(3, 3, 12, 5, 'Viêm da tiếp xúc dị ứng.', 'Mẩn đỏ, ngứa, khô rát ở cẳng tay.', 'Ngưng sản phẩm nghi ngờ, bôi dưỡng ẩm, tránh gãi.', 'Kem hydrocortisone bôi mỏng 2 lần/ngày trong 5 ngày.', 'Nếu lan rộng cần tái khám.', '{"bp":"118/76","hr":76,"temp":36.7,"spo2":99}', '2026-05-16', NOW(), NOW()),
(4, 5, 15, 8, 'Viêm họng cấp, nghi do virus.', 'Đau họng, ho khan, khàn tiếng.', 'Nghỉ ngơi, súc họng nước muối, uống ấm.', 'Siro ho thảo dược, acetaminophen khi sốt.', 'Không kháng sinh nếu không có bằng chứng nhiễm khuẩn.', '{"bp":"110/70","hr":88,"temp":37.6,"spo2":98}', '2026-05-18', NOW(), NOW()),
(5, 10, 13, 6, 'Nhiễm siêu vi hô hấp trên nhẹ.', 'Sốt nhẹ, ho khan 3 ngày.', 'Nghỉ ngơi tại nhà, theo dõi triệu chứng.', 'Paracetamol khi cần, dung dịch súc họng.', 'Tái khám nếu sốt kéo dài quá 5 ngày.', '{"bp":"112/74","hr":90,"temp":37.8,"spo2":98}', '2026-05-20', NOW(), NOW());

INSERT INTO clinical_notes (id, patient_id, doctor_id, appointment_id, note_type, raw_text, file_path, file_type, extraction_status, created_at, updated_at) VALUES
(1, 3, 2, 1, 'CONSULTATION', 'Bệnh nhân trình bày đau tức ngực trái khi gắng sức. Đã tư vấn nghỉ ngơi và theo dõi dấu hiệu cảnh báo.', '/seed/notes/consult-001.pdf', 'pdf', 'COMPLETED', NOW(), NOW()),
(2, 11, 4, 2, 'PRESCRIPTION', 'Trẻ có sốt cao, ho nhẹ, chưa thấy dấu hiệu khó thở. Hướng dẫn hạ sốt và theo dõi sát.', '/seed/notes/prescription-002.docx', 'docx', 'COMPLETED', NOW(), NOW()),
(3, 12, 5, 3, 'DISCHARGE', 'Tổn thương da phù hợp viêm da tiếp xúc dị ứng. Dặn ngưng sản phẩm mới và tái khám khi lan rộng.', '/seed/notes/discharge-003.txt', 'txt', 'COMPLETED', NOW(), NOW()),
(4, 15, 8, 5, 'CONSULTATION', 'Viêm họng cấp mức độ nhẹ, ưu tiên chăm sóc triệu chứng và theo dõi sốt.', '/seed/notes/consult-005.pdf', 'pdf', 'COMPLETED', NOW(), NOW()),
(5, 17, 10, 6, 'PROGRESS', 'Đánh giá ban đầu mất ngủ, tim đập nhanh và lo âu kéo dài. Đang chờ đánh giá chuyên sâu.', '/seed/notes/progress-006.pdf', 'pdf', 'PROCESSING', NOW(), NOW()),
(6, 13, 6, 10, 'PROGRESS', 'Nhiễm siêu vi hô hấp trên nhẹ, triệu chứng ổn định, hẹn tái khám nếu kéo dài.', '/seed/notes/progress-010.pdf', 'pdf', 'COMPLETED', NOW(), NOW());

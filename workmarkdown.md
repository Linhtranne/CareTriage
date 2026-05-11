# CareTriage - Detailed Task Specifications (Merged from Backlog)

Tài liệu này chứa đặc tả chi tiết cho các Task từ Sprint 8 trở đi, được tổng hợp từ Backlog và yêu cầu nghiệp vụ.

---

## [EPIC 3] AI Triage & Ticket Management

### US-012: Triage ticket gửi đến bác sĩ
**As a** system, **I want** to convert triage chat into a ticket, **so that** doctors can review and follow up.

#### [T-052] TriageTicket entity (session, patient, dept, urgency, summary, status) [DONE]
- **Mục tiêu:** Tạo cấu trúc dữ liệu trung tâm để chuyển kết quả tư vấn AI thành ticket cho bác sĩ.
- **Triển khai:** (Đã hoàn thành - Xem chi tiết tại Task Report).

#### [T-053] Auto-generate ticket when triage completes
- **Mô tả:** Hệ thống tự động tạo phiếu ngay khi quá trình phân luồng hoàn tất để đảm bảo tính chính xác và kịp thời.
- **User Flow:**
  1. Quá trình phân luồng (Triage) hoàn tất.
  2. Hệ thống xác định đích đến (Bộ phận xử lý).
  3. Hệ thống tự động kích hoạt lệnh tạo phiếu.
  4. Điền tự động thông tin: Mã phiếu (Auto-gen), Tiêu đề, Bộ phận, Ưu tiên, Trạng thái (Mới).
  5. Ghi nhận người tạo là "Hệ thống tự động".
- **Acceptance Criteria (AC):**
  - **Scenario 1:** Tạo phiếu thành công khi xác định được đích đến. Xuất hiện trong danh sách "Cần xử lý" của bộ phận.
  - **Scenario 2:** Không tạo phiếu nếu phân luồng thất bại. Chuyển vào hàng đợi "Chờ phân loại thủ công".
  - **Scenario 3:** Đảm bảo Transaction (Rollback nếu lỗi DB) để không tạo dữ liệu rác.
- **Business Rules:**
  - Thời gian tạo phiếu < 3 giây sau khi kết thúc chat.
  - Phải có nhãn "Auto-generated".

#### [T-055] TriageTicketController: list, assign, review
- **Mục tiêu:** Cung cấp API quản lý quy trình phân loại ticket dành cho nhân viên điều phối và quản lý.
- **Implementation Steps:**
  1. **API List:** `GET /api/v1/triage/tickets` - Lấy danh sách ticket `PENDING_TRIAGE` (Hỗ trợ phân trang, lọc priority).
  2. **API Assign:** `POST /api/v1/triage/assign` - Gán `ticket_id` cho `assignee_id`. Chuyển trạng thái sang `IN_REVIEW`.
  3. **API Review:** `POST /api/v1/triage/review` - Ghi nhận kết quả Approve/Reject, Category, Severity. Chuyển trạng thái `RESOLVED` hoặc `ESCALATED`.
- **Technical Constraints:**
  - Hiệu năng: List API < 300ms với 10,000 records.
  - Bảo mật: Chỉ người được gán hoặc Manager mới có quyền Review.

#### [T-056] Doctor: Ticket inbox + detail page (with chat history)
- **Mô tả:** Giao diện dành cho bác sĩ để quản lý danh sách bệnh nhân chờ và xem nội dung tư vấn trước đó.
- **User Flow:**
  1. Bác sĩ vào "Danh sách chờ".
  2. Xem danh sách phiếu trạng thái "Chờ xử lý" (Sắp xếp theo thời gian chờ).
  3. Nhấn vào phiếu để xem chi tiết bệnh nhân + Lịch sử Chat (Read-only).
- **Data Fields:** 
  - **Inbox:** Tên BN, Mã phiếu, Thời gian chờ, Triệu chứng sơ bộ, Độ ưu tiên.
  - **Detail:** Nội dung chat, Hình ảnh/File đính kèm, Giờ gửi.
- **AC:**
  - **Scenario 1:** Hiển thị phiếu chờ xử lý của đúng khoa/phòng.
  - **Scenario 2:** Xem đầy đủ lịch sử hội thoại trước khi nhấn tiếp nhận.
  - **Scenario 3:** Cảnh báo màu sắc cho phiếu chờ quá 15 phút.

#### [T-057] Patient: Ticket tracking UI
- **Mô tả:** Bệnh nhân theo dõi trạng thái phân luồng và vị trí trong hàng đợi.
- **User Flow:**
  1. Truy cập qua Mobile App hoặc QR Code trên phiếu giấy.
  2. Xem kết quả: Khoa/Phòng, Số phòng, Mức độ ưu tiên.
  3. Theo dõi tiến trình qua thanh Status (Đang chờ -> Đang khám -> Hoàn thành).
- **Business Rules:**
  - Chỉ xem được phiếu của chính mình (theo SĐT/PID).
  - Màu sắc phân loại: Đỏ (Cấp cứu), Vàng (Khẩn cấp), Xanh (Thường).
  - Cập nhật trạng thái Real-time qua WebSocket (độ trễ < 2s).

---

## [EPIC 4] Appointment & Integrated Workflow

### US-013: Liên kết Ticket với Lịch hẹn
**As a** doctor, **I want** to create appointments directly from triage tickets, **so that** data is synchronized.

#### [T-058] Doctor: Create appointment from ticket
- **Mô tả:** Tạo lịch hẹn khám trực tiếp từ thông tin phiếu phân luồng để tiết kiệm thời gian nhập liệu.
- **User Flow:**
  1. Từ màn hình chi tiết Phiếu phân luồng, nhấn "Tạo lịch hẹn".
  2. Hệ thống tự động điền: Họ tên, Ngày sinh, SĐT, Triệu chứng từ phiếu gốc.
  3. Bác sĩ chọn: Ngày hẹn, Khung giờ, Chuyên khoa.
  4. Hệ thống lưu và gắn liên kết (Link) giữa Phiếu và Lịch hẹn.
- **AC:**
  - **Scenario 1:** Tự động điền dữ liệu chính xác (Read-only cho thông tin hành chính).
  - **Scenario 2:** Chặn tạo lịch hẹn vào ngày trong quá khứ.
  - **Scenario 3:** Cảnh báo nếu phiếu đã có lịch hẹn trước đó.

#### [T-060] Sync status between ticket and appointment
- **Mục tiêu:** Tự động đồng bộ trạng thái giữa hai thực thể để đảm bảo tính nhất quán dữ liệu.
- **Logic ánh xạ (Mapping):**
  - Phiếu 'Mới tạo' -> Lịch hẹn 'Đã đến' (Arrived).
  - Phiếu 'Đang khám' -> Lịch hẹn 'Đang thực hiện' (In Progress).
  - Phiếu 'Hoàn thành' -> Lịch hẹn 'Đã hoàn thành' (Finished).
- **Implementation:** Sử dụng Event Listener/Observer, xử lý bất đồng bộ qua Message Queue.

---

## [EPIC 5] Branding & Content Management

### US-014: Trang chủ & Thông tin giới thiệu
**As a** visitor, **I want** to see hospital branding and introduction, **so that** I trust the services.

#### [T-061] Landing page components (Hero, Services, CTA) [DONE]
- **Thành phần:** Hero section, Lưới dịch vụ, Nút kêu gọi hành động.
- **AC:** Hiển thị tốt trên Mobile, nội dung cấu hình qua CMS.

#### [T-062] Vision & Mission page [DONE]
- **Mô tả:** Hiển thị sứ mệnh và tầm nhìn để người dùng hiểu giá trị cốt lõi của bệnh viện.
- **Dữ liệu:** Tiêu đề, Banner, Sứ mệnh (Rich Text), Tầm nhìn (Rich Text), Danh sách Giá trị cốt lõi (Icons).
- **AC:** 
  - Truy cập qua Menu Giới thiệu.
  - Hiển thị đúng định dạng Rich Text & Alt-text cho ảnh.
  - Tải trang < 2 giây.

#### [T-063] Department detail page [DONE]
- **Mô tả:** Thông tin chi tiết về phạm vi điều trị, bác sĩ và trang thiết bị của từng khoa.
- **Dữ liệu:** Tên khoa, Ảnh bìa, Mô tả chi tiết, Danh sách bác sĩ (Ảnh, Tên, Học hàm), Trang thiết bị.
- **AC:**
  - Hiển thị đầy đủ thông tin khi khoa ở trạng thái "Công khai".
  - Xử lý thông báo "Chưa có bác sĩ" nếu dữ liệu trống.
  - Lỗi 404 nếu URL không tồn tại.
- **Business Rules:** Sắp xếp bác sĩ theo học hàm hoặc thủ công. Ghi nhận lượt xem (view count).

---

## [EPIC 6] Emergency & Patient Support

### US-015: Hỗ trợ khẩn cấp & Liên hệ
**As a** user, **I want** quick access to emergency info and contact forms.

#### [T-064] Emergency Info page (Hotlines, First-aid, GPS) [DONE]
- **Mô tả:** Trang liên hệ và hướng dẫn cấp cứu khẩn cấp.
- **Dữ liệu:** Hotline (tel: links), Khoảng cách (tính theo GPS), Địa chỉ, Trạng thái (Mở cửa 24/7), Hướng dẫn sơ cứu.
- **AC:**
  - Truy cập nhanh từ nút "Cấp cứu" nổi bật.
  - Gọi điện ngay khi nhấn Hotline.
  - Ưu tiên cơ sở gần nhất nếu có GPS.
  - Hoạt động offline (dữ liệu cache) cho hướng dẫn sơ cứu.
- **Business Rules:** Số 115 luôn đứng đầu. Thiết kế tối giản, font lớn.

#### [T-065] Contact Form with Spam Protection [DONE]
- **Mô tả:** Biểu mẫu gửi yêu cầu hỗ trợ hoặc tư vấn.
- **Dữ liệu:** Họ tên, Email (Validation), SĐT, Chủ đề, Nội dung.
- **AC:**
  - Gửi thành công: Lưu DB + Thông báo xác nhận + Reset form.
  - Validation: Cảnh báo đỏ cho trường thiếu hoặc sai định dạng email.
- **Business Rules:** 
  - Tích hợp reCAPTCHA chống spam.
  - Gửi Email tự động cho khách và Admin.
  - Giới hạn IP: Tối đa 3 yêu cầu/5 phút.

---

## [EPIC 7] Design System

#### [T-059] UI/UX Design for Ticket Inbox & Detail
- **Mục tiêu:** Thiết kế giao diện Inbox và Detail chuyên sâu cho Bác sĩ (Figma).
- **Yêu cầu:** 
  - Tuân thủ WCAG 2.1 (Độ tương phản cho môi trường làm việc cường độ cao).
  - Hỗ trợ Responsive (Web & Tablet).
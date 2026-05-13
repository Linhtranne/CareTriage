---# CareTriage — SRS (Software Requirements Specification)

> **Version:** 2.0 | **Date:** 2026-04-30 | **Author:** Solo Developer

---

## 1. Giới thiệu

### 1.1 Mục đích
Hệ thống CareTriage kết hợp quản lý bệnh viện cốt lõi (HMS Core) với module AI sơ chẩn và phân luồng bệnh nhân. Bệnh nhân mô tả triệu chứng qua chatbot AI, hệ thống hỏi thêm câu hỏi phụ, dự đoán tình trạng sức khỏe và đề xuất chuyên khoa phù hợp.

### 1.2 Phạm vi
| Trong phạm vi | Ngoài phạm vi |
|---------------|---------------|
| Auth & User Management (Patient, Doctor, Admin) | Pharmacy/Drug inventory |
| Department & Doctor Management | Complex billing/insurance |
| Appointment Booking & Management | Lab test management |
| Basic Medical Records | Nurse-specific features |
| AI Symptom Checker & Triage Chatbot | Advanced reporting |
| Triage Ticket System | Payment gateway integration |
| **EHR Data Extraction (NER) ⭐** | Mobile native app |
| **Advanced Medical Search ⭐** | |
| Public Pages (landing, doctors, departments) | |
| Role-based Dashboards | |
| **In-app Notification System** | |
| **Doctor Schedule/Availability Management** | |
| **Two-Factor Authentication (2FA)** | |
| **Internationalization (i18n - VN/EN)** | |
| **Password Change & Account Security** | |

### 1.3 Kiến trúc tổng quan
- **Frontend:** React 18 + Vite + MUI v6 + Zustand + i18next + React Router v6
- **Backend:** Java 17 + Spring Boot 3.x (REST API + WebSocket + Spring Security 6)
- **AI Service:** Python 3.11 + FastAPI + Google Gemini 2.0 + LangChain
- **Database:** MySQL 8.0
- **Deploy:** Docker + GitHub Actions CI/CD

---

## 2. Yêu cầu chức năng

### 2.1 Không cần xác thực (Public)
| ID | Chức năng | Mô tả |
|----|-----------|-------|
| F-PUB-01 | Trang chủ | Hero, services, CTA "Kiểm tra triệu chứng" |
| F-PUB-02 | Danh sách chuyên khoa | Xem danh mục khoa/phòng |
| F-PUB-03 | Danh sách bác sĩ | Tìm bác sĩ theo chuyên khoa |
| F-PUB-04 | Thông tin khẩn cấp | Số cấp cứu, sơ cứu cơ bản |
| F-PUB-05 | Chuyển đổi ngôn ngữ | Hỗ trợ VN/EN trên toàn bộ giao diện |

### 2.2 Bệnh nhân (Patient)
| ID | Chức năng | Mô tả |
|----|-----------|-------|
| F-PAT-01 | Đăng ký / Đăng nhập | Email + password, JWT |
| F-PAT-02 | Quản lý profile | Cập nhật thông tin cá nhân, BHYT, liên hệ khẩn cấp, bệnh nền |
| F-PAT-03 | Đặt lịch hẹn | Chọn khoa → bác sĩ → ngày giờ |
| F-PAT-04 | Xem lịch hẹn | Danh sách lịch hẹn + trạng thái |
| F-PAT-05 | Chat AI Triage | Nhập triệu chứng, nhận tư vấn AI |
| F-PAT-06 | Xem kết quả triage | Xem ticket, khuyến nghị khoa |
| F-PAT-07 | Xem hồ sơ bệnh án | Lịch sử khám, chẩn đoán, đơn thuốc |
| F-PAT-08 | Dashboard | Tổng quan lịch hẹn, bệnh án, triage |
| F-PAT-09 | Quản lý bảo mật tài khoản | Đổi mật khẩu, bật/tắt 2FA (Email/SMS) |
| F-PAT-10 | Nhận thông báo | Thông báo lịch hẹn, kết quả triage, cập nhật bệnh án |

### 2.3 Bác sĩ (Doctor)
| ID | Chức năng | Mô tả |
|----|-----------|-------|
| F-DOC-01 | Xem lịch hẹn | Lịch khám hôm nay, sắp tới |
| F-DOC-02 | Cập nhật trạng thái hẹn | Confirm → In Progress → Complete |
| F-DOC-03 | Tạo bệnh án | Chẩn đoán, triệu chứng, đơn thuốc, vital signs |
| F-DOC-04 | Xem Triage Tickets | Inbox ticket từ AI, xem chat history |
| F-DOC-05 | Review Triage → Tạo hẹn | Chuyển ticket thành appointment |
| F-DOC-06 | Dashboard | Lịch hôm nay, ticket pending, thống kê |
| F-DOC-07 | Upload ghi chú lâm sàng | Upload PDF/Word hoặc nhập text |
| F-DOC-08 | Xem kết quả EHR extraction | Entities trích xuất: thuốc, triệu chứng, bệnh lý |
| F-DOC-09 | Tìm kiếm nâng cao EHR | Tìm bệnh nhân theo triệu chứng/thuốc/bệnh lý |
| F-DOC-10 | Quản lý lịch làm việc | Cài đặt giờ khám theo ngày trong tuần |
| F-DOC-11 | Quản lý bảo mật | Đổi mật khẩu, 2FA |

### 2.4 Admin
| ID | Chức năng | Mô tả |
|----|-----------|-------|
| F-ADM-01 | Quản lý users | CRUD users, đổi role, khoá/mở |
| F-ADM-02 | Quản lý khoa/phòng | CRUD departments |
| F-ADM-03 | Quản lý bác sĩ | Assign doctor ↔ department |
| F-ADM-04 | Xem tất cả lịch hẹn | Overview appointments |
| F-ADM-05 | Dashboard | Users, appointments, tickets stats |
| F-ADM-06 | Gán bác sĩ vào lịch trực | Quản lý lịch làm việc bác sĩ |
| F-ADM-07 | Quản lý thông báo hệ thống | Gửi thông báo toàn hệ thống |

---

## 3. Yêu cầu phi chức năng

| ID | Yêu cầu | Tiêu chí |
|----|----------|----------|
| NF-01 | Performance | Page load < 3s, API response < 500ms |
| NF-02 | WebSocket latency | Chat message < 500ms round-trip |
| NF-03 | Security | JWT auth, bcrypt password, CORS, SQL injection prevention, 2FA |
| NF-04 | Responsive | Mobile-first, hoạt động trên Chrome, Firefox, Safari |
| NF-05 | Availability | Docker containerized, health check endpoints |
| NF-06 | Data Privacy | Role-based access, patient data chỉ patient+doctor xem |
| NF-07 | Scalability | Docker compose, stateless backend, horizontal scale ready |
| NF-08 | Internationalization | Hỗ trợ VN/EN, chuyển đổi tức thì không cần reload |
| NF-09 | Audit Trail | Ghi lại lịch sử thay đổi dữ liệu nhạy cảm (compliance y tế) |
| NF-10 | File Upload | Avatar (JPG/PNG ≤ 5MB), PDF/DOCX clinical notes (≤ 20MB) |
| NF-11 | Session Management | Quản lý phiên đăng nhập, hiển thị thiết bị đang active |

---

## 4. Database Schema

### 4.1 Sơ đồ quan hệ (ER Overview)

```
                          ┌─────────────┐
                          │    roles     │
                          └──────┬──────┘
                                 │ M:N (user_roles)
┌──────────────┐          ┌──────┴──────┐          ┌──────────────────┐
│patient_       ├──1:1───┤    users     ├──1:1────┤ doctor_profiles  │
│profiles       │         └──────┬──────┘          └────────┬─────────┘
└──────────────┘                 │                          │ M:1
                    ┌────────────┼────────────┐      ┌──────┴──────┐
                    │            │            │      │ departments │
             ┌──────┴──────┐ ┌───┴───┐ ┌──────┴──┐  └─────────────┘
             │appointments │ │chat_  │ │notifs   │
             └──────┬──────┘ │session│ └─────────┘
                    │        └───┬───┘
             ┌──────┴──────┐ ┌───┴────┐  ┌──────────────┐
             │medical_     │ │chat_   │  │triage_       │
             │records      │ │messages│  │tickets       │
             └─────────────┘ └────────┘  └──────────────┘

doctor_schedules ──M:1── users (doctor)

EHR Module:
clinical_notes ──1:N── extracted_entities
      │
      ├── patient_medications
      ├── patient_conditions
      └── patient_symptoms
```

### 4.2 Chi tiết Entity (17 bảng)

| # | Table | Columns chính | Relationships |
|---|-------|---------------|---------------|
| 1 | `users` | id, username, email, password, fullName, phone, avatarUrl, refreshToken, twoFactorEmail, twoFactorSms, isActive, deleted | M:N roles, 1:1 profiles |
| 2 | `roles` | id, name, description, deleted | M:N users |
| 3 | `patient_profiles` | id, user_id, dateOfBirth, gender, address, bloodType, allergies, insuranceNumber, emergencyContactName, emergencyContactPhone, chronicConditions | 1:1 users |
| 4 | `doctor_profiles` | id, user_id, bio, specialization, experienceYears, degrees, hospitalName, department_id | 1:1 users, M:1 departments |
| 5 | `departments` | id, name, description, imageUrl, isActive, deleted | 1:M doctorProfiles |
| 6 | `doctor_schedules` | id, doctor_id, dayOfWeek, startTime, endTime, isActive | M:1 users |
| 7 | `appointments` | id, patient_id, doctor_id, department_id, appointmentDate, appointmentTime, endTime, status, reason, notes, cancellationReason, triageTicketId | M:1 users(×2), M:1 departments |
| 8 | `medical_records` | id, appointment_id, patient_id, doctor_id, diagnosis, symptoms, prescription, notes, vitalSigns(JSON), followUpDate | M:1 appointments, M:1 users(×2) |
| 9 | `chat_sessions` | id, user_id, sessionType, status, aiSummary, suggestedDepartment, urgencyLevel | M:1 users, 1:N messages |
| 10 | `chat_messages` | id, session_id, senderType, content, metadata(JSON) | M:1 chatSessions |
| 11 | `triage_tickets` | id, chatSession_id, patient_id, assignedDoctor_id, department_id, urgencyLevel, aiSummary, suggestedDepartment, symptoms, doctorNotes, status | 1:1 chatSessions, M:1 users(×2) |
| 12 | `notifications` | id, user_id, title, message, type, isRead, referenceId, referenceType | M:1 users |
| 13 | `clinical_notes` | id, patient_id, doctor_id, noteType, rawText, filePath, fileType, extractionStatus | M:1 users(×2), 1:N entities |
| 14 | `extracted_entities` | id, clinicalNote_id, entityType, entityValue, normalizedValue, confidenceScore, startPosition, endPosition, metadata(JSON) | M:1 clinicalNotes |
| 15 | `patient_medications` | id, patient_id, clinicalNote_id, medicationName, dosage, frequency, route, startDate, endDate, prescribingDoctorId, status | M:1 users, M:1 clinicalNotes |
| 16 | `patient_conditions` | id, patient_id, clinicalNote_id, conditionName, icdCode, severity, status, diagnosedDate, resolvedDate, notes | M:1 users, M:1 clinicalNotes |
| 17 | `patient_symptoms` | id, patient_id, clinicalNote_id, symptomName, severity, onsetDate, duration, bodyLocation | M:1 users, M:1 clinicalNotes |

---

## 5. API Endpoints Summary

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/refresh | Authenticated |
| POST | /api/auth/logout | Authenticated |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/users/profile | Self |
| PUT | /api/users/profile | Self |
| POST | /api/users/change-password | Self |
| PUT | /api/users/security | Self |
| GET | /api/admin/users | Admin |
| PUT | /api/admin/users/{id}/role | Admin |

### Departments
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/departments | Public |
| POST | /api/admin/departments | Admin |
| PUT | /api/admin/departments/{id} | Admin |
| DELETE | /api/admin/departments/{id} | Admin |

### Doctors
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/doctors | Public |
| GET | /api/doctors/{id} | Public |
| GET | /api/doctors?departmentId={id} | Public |

### Doctor Schedules
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/doctors/{id}/schedules | Public |
| POST | /api/doctors/schedules | Doctor |
| DELETE | /api/doctors/schedules/{id} | Doctor |

### Appointments
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/appointments | Patient |
| GET | /api/appointments/my | Patient/Doctor |
| PUT | /api/appointments/{id}/status | Doctor |
| GET | /api/admin/appointments | Admin |

### Medical Records
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/medical-records | Doctor |
| GET | /api/medical-records/patient/{id} | Patient(self)/Doctor |

### AI Triage (WebSocket)
| Protocol | Endpoint | Access |
|----------|----------|--------|
| WS | /ws/chat | Patient |
| STOMP | /app/chat.send | Patient |
| STOMP | /topic/chat.{sessionId} | Patient |

### Triage Tickets
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/triage-tickets | Doctor |
| GET | /api/triage-tickets/{id} | Doctor/Patient(own) |
| PUT | /api/triage-tickets/{id}/assign | Doctor |

### Notifications
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/notifications | Self |
| GET | /api/notifications/unread-count | Self |
| PUT | /api/notifications/{id}/read | Self |
| PUT | /api/notifications/read-all | Self |

### EHR Data Extraction
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/ehr/upload | Doctor/Admin |
| POST | /api/ehr/extract | Doctor/Admin |
| GET | /api/ehr/notes/{patientId} | Doctor/Patient(own) |
| GET | /api/ehr/entities/{noteId} | Doctor/Patient(own) |
| GET | /api/ehr/search | Doctor/Admin |
| GET | /api/ehr/stats | Doctor/Admin |

---

## 6. User Flows

### Flow 1: AI Triage (Core Flow)
```
Patient login → Click "Kiểm tra triệu chứng"
→ Chat window opens (WebSocket)
→ Patient types symptoms
→ AI asks follow-up questions (2-4 rounds)
→ AI provides triage recommendation
→ System creates TriageTicket
→ Patient sees result + suggested department
→ Doctor receives ticket in inbox
→ Doctor reviews → creates Appointment
```

### Flow 2: Appointment Booking
```
Patient login → "Đặt lịch khám"
→ Select department → Select doctor → Check doctor schedule
→ Select available date/time → Confirm booking → Status: PENDING
→ Doctor confirms → Status: CONFIRMED
→ Day of appointment → Doctor starts → Status: IN_PROGRESS
→ Exam complete → Doctor creates Medical Record → Status: COMPLETED
→ Notification sent to patient
```

### Flow 3: Doctor Schedule Management
```
Doctor login → "Cài đặt lịch làm việc"
→ Chọn ngày trong tuần → Set giờ bắt đầu/kết thúc
→ Lưu → Lịch khả dụng hiển thị cho bệnh nhân khi đặt hẹn
```

### Flow 4: Notification Flow
```
Event xảy ra (đặt lịch, triage hoàn thành, bệnh án mới)
→ System tạo Notification → WebSocket push đến user
→ User thấy badge đỏ trên chuông → Click xem → Đánh dấu đã đọc
```

### Flow 5: Account Security Management
```
User → Profile → Tab "Bảo mật"
→ Đổi mật khẩu: nhập cũ → nhập mới → xác nhận → API validate → cập nhật
→ 2FA: toggle Email/SMS → API cập nhật → hiển thị trạng thái
```

---

## 7. Data Validation Rules

| Entity | Field | Rule |
|--------|-------|------|
| User | email | Unique, valid email format, max 100 chars |
| User | username | Unique, max 50 chars |
| User | password | Min 6 chars, bcrypt hashed |
| PatientProfile | bloodType | Enum: A+, A-, B+, B-, AB+, AB-, O+, O- |
| PatientProfile | gender | Enum: Male, Female, Other |
| PatientProfile | insuranceNumber | Max 50 chars |
| Appointment | status | State machine (see Section 9) |
| Appointment | time slot | No overlap per doctor per day |
| TriageTicket | urgencyLevel | Enum: LOW, MEDIUM, HIGH, CRITICAL |
| ClinicalNote | fileType | Allowed: PDF, DOCX |

---

## 8. Error Handling Strategy

| HTTP Code | Khi nào | Response Format |
|-----------|---------|-----------------|
| 400 | Validation error | `{ success: false, message: "...", errors: [...] }` |
| 401 | Token expired/invalid | `{ success: false, message: "Unauthorized" }` |
| 403 | Không đủ quyền | `{ success: false, message: "Forbidden" }` |
| 404 | Resource not found | `{ success: false, message: "Not found" }` |
| 409 | Duplicate/conflict | `{ success: false, message: "Conflict" }` |
| 500 | Server error | `{ success: false, message: "Internal error" }` |

---

## 9. State Machines

### Appointment Status
```
PENDING ──→ CONFIRMED ──→ IN_PROGRESS ──→ COMPLETED
   │              │
   └──→ CANCELLED ←──┘
   │
   └──→ NO_SHOW (auto after 24h)
```

### Triage Ticket Status
```
OPEN ──→ ASSIGNED ──→ IN_REVIEW ──→ RESOLVED ──→ CLOSED
```

### EHR Extraction Status
```
PENDING ──→ PROCESSING ──→ COMPLETED
                │
                └──→ FAILED
```

### Chat Session Status
```
ACTIVE ──→ COMPLETED
   │
   ├──→ EXPIRED (auto timeout)
   └──→ CANCELLED (user abort)
```

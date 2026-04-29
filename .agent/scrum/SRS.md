# CareTriage — SRS (Software Requirements Specification)

> **Version:** 1.0 | **Date:** 2026-04-27 | **Author:** Solo Developer

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
| **Advanced Medical Search ⭐** | Multi-language (only Vietnamese) |
| Public Pages (landing, doctors, departments) | |
| Role-based Dashboards | |

### 1.3 Kiến trúc tổng quan
- **Frontend:** React 18 + Vite + MUI v6 + TailwindCSS
- **Backend:** Java 17 + Spring Boot 3.x (REST API + WebSocket)
- **AI Service:** Python 3.11 + FastAPI + Google Gemini + LangChain
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

### 2.2 Bệnh nhân (Patient)
| ID | Chức năng | Mô tả |
|----|-----------|-------|
| F-PAT-01 | Đăng ký / Đăng nhập | Email + password, JWT |
| F-PAT-02 | Quản lý profile | Cập nhật thông tin cá nhân |
| F-PAT-03 | Đặt lịch hẹn | Chọn khoa → bác sĩ → ngày giờ |
| F-PAT-04 | Xem lịch hẹn | Danh sách lịch hẹn + trạng thái |
| F-PAT-05 | Chat AI Triage | Nhập triệu chứng, nhận tư vấn AI |
| F-PAT-06 | Xem kết quả triage | Xem ticket, khuyến nghị khoa |
| F-PAT-07 | Xem hồ sơ bệnh án | Lịch sử khám, chẩn đoán, đơn thuốc |
| F-PAT-08 | Dashboard | Tổng quan lịch hẹn, bệnh án, triage |

### 2.3 Bác sĩ (Doctor)
| ID | Chức năng | Mô tả |
|----|-----------|-------|
| F-DOC-01 | Xem lịch hẹn | Lịch khám hôm nay, sắp tới |
| F-DOC-02 | Cập nhật trạng thái hẹn | Confirm → In Progress → Complete |
| F-DOC-03 | Tạo bệnh án | Chẩn đoán, triệu chứng, đơn thuốc |
| F-DOC-04 | Xem Triage Tickets | Inbox ticket từ AI, xem chat history |
| F-DOC-05 | Review Triage → Tạo hẹn | Chuyển ticket thành appointment |
| F-DOC-06 | Dashboard | Lịch hôm nay, ticket pending, thống kê |
| F-DOC-07 | Upload ghi chú lâm sàng | Upload PDF/Word hoặc nhập text |
| F-DOC-08 | Xem kết quả EHR extraction | Entities trích xuất: thuốc, triệu chứng, bệnh lý |
| F-DOC-09 | Tìm kiếm nâng cao EHR | Tìm bệnh nhân theo triệu chứng/thuốc/bệnh lý |

### 2.4 Admin
| ID | Chức năng | Mô tả |
|----|-----------|-------|
| F-ADM-01 | Quản lý users | CRUD users, đổi role, khoá/mở |
| F-ADM-02 | Quản lý khoa/phòng | CRUD departments |
| F-ADM-03 | Quản lý bác sĩ | Assign doctor ↔ department |
| F-ADM-04 | Xem tất cả lịch hẹn | Overview appointments |
| F-ADM-05 | Dashboard | Users, appointments, tickets stats |

---

## 3. Yêu cầu phi chức năng

| ID | Yêu cầu | Tiêu chí |
|----|----------|----------|
| NF-01 | Performance | Page load < 3s, API response < 500ms |
| NF-02 | WebSocket latency | Chat message < 500ms round-trip |
| NF-03 | Security | JWT auth, bcrypt password, CORS, SQL injection prevention |
| NF-04 | Responsive | Mobile-first, hoạt động trên Chrome, Firefox, Safari |
| NF-05 | Availability | Docker containerized, health check endpoints |
| NF-06 | Data Privacy | Role-based access, patient data chỉ patient+doctor xem |
| NF-07 | Scalability | Docker compose, stateless backend, horizontal scale ready |

---

## 4. Database Schema (Core)

```
users ──┬── patient_profiles
        ├── doctor_profiles ── departments
        │
appointments ── medical_records
        │
chat_sessions ── chat_messages
        │
triage_tickets

EHR Tables:
clinical_notes ── extracted_entities
     │
     ├── patient_medications
     ├── patient_conditions
     └── patient_symptoms
```

**Chi tiết:** Xem implementation_plan.md > Database Schema section

---

## 5. API Endpoints Summary

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | /api/auth/register | Public |
| POST | /api/auth/login | Public |
| POST | /api/auth/refresh | Authenticated |

### Users
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | /api/users/profile | Self |
| PUT | /api/users/profile | Self |
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
→ Select department → Select doctor → Select date/time
→ Confirm booking → Status: PENDING
→ Doctor confirms → Status: CONFIRMED
→ Day of appointment → Doctor starts → Status: IN_PROGRESS
→ Exam complete → Doctor creates Medical Record → Status: COMPLETED
```

# CareTriage — Product Backlog

> **Last Updated:** 2026-04-27  
> **Product Owner:** Solo Developer  
> **Sprint Duration:** 1 week

---

## 📋 How to Use This Backlog

Import vào tool quản lý (Jira, Trello, Notion, Linear) theo format:
- **Epic** = Nhóm chức năng lớn
- **User Story** = Chức năng từ góc nhìn user (format: "As a [role], I want [action], so that [benefit]")
- **Task** = Công việc cụ thể để hoàn thành User Story
- **Priority:** P0 (Critical) > P1 (High) > P2 (Medium) > P3 (Low)
- **Story Points:** 1 (trivial) → 2 (simple) → 3 (medium) → 5 (complex) → 8 (very complex)

---

## EPIC 1: Authentication & User Management

### US-001: Đăng ký tài khoản
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-001-Register.md)** |   **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US001-Register.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-001 | Create User, Role entities + migration | Backend | P0 | 3 | Sprint 1 |
| T-002 | Implement AuthService (register, login, JWT) | Backend | P0 | 5 | Sprint 1 |
| T-003 | Create AuthController (register, login, refresh endpoints) | Backend | P0 | 3 | Sprint 1 |
| T-004 | Configure Spring Security + JWT filter chain | Backend | P0 | 5 | Sprint 1 |
| T-005 | Build Register page (form validation, MUI) | Frontend | P0 | 3 | Sprint 1 |
| T-006 | Build Login page | Frontend | P0 | 2 | Sprint 1 |
| T-007 | Implement Axios interceptor (JWT auto-attach, 401 refresh) | Frontend | P0 | 3 | Sprint 1 |
| T-008 | Create AuthStore (Zustand) | Frontend | P0 | 2 | Sprint 1 |

---

### US-002: Đăng nhập / Đăng xuất
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-002-Login.md)** |   **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US002-Login.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-009 | Implement protected route wrapper | Frontend | P0 | 2 | Sprint 1 |
| T-010 | Role-based redirect after login | Frontend | P0 | 2 | Sprint 1 |
| T-011 | Logout + token cleanup | Frontend | P1 | 1 | Sprint 1 |

---

### US-003: Quản lý profile cá nhân
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-003-Profile.md)** |   **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US003-Profile.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-012 | Create PatientProfile, DoctorProfile entities | Backend | P1 | 3 | Sprint 2 |
| T-013 | UserController: GET/PUT profile endpoints | Backend | P1 | 3 | Sprint 2 |
| T-014 | Profile page UI (view mode + edit mode) | Frontend | P1 | 3 | Sprint 2 |
| T-015 | Avatar upload (optional) | Frontend | P3 | 2 | Sprint 2 |

---

### US-004: Admin quản lý user
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-004-Admin-User-Management.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US004-Admin-User-Management.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-016 | Admin UserController: list all, change role, toggle active | Backend | P1 | 3 | Sprint 2 |
| T-017 | Admin User Management page (MUI DataGrid) | Frontend | P1 | 5 | Sprint 2 |
| T-018 | Role change dialog + confirmation | Frontend | P2 | 2 | Sprint 2 |

---

## EPIC 2: Department & Doctor Management

### US-005: Admin quản lý khoa/phòng
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-005-Admin-Department-Management.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US005-Admin-Department-Management.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-019 | Create Department entity + DepartmentRepository | Backend | P1 | 2 | Sprint 3 | [x] |
| T-020 | DepartmentController: CRUD endpoints | Backend | P1 | 3 | Sprint 3 | [x] |
| T-021 | Admin Department management page | Frontend | P1 | 3 | Sprint 3 | [x] |
| T-022 | Department form (create/edit dialog) | Frontend | P1 | 2 | Sprint 3 | [x] |

---

### US-006: Xem danh sách bác sĩ
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-006-Browse-Doctors.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US006-Browse-Doctors.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-023 | DoctorController: public list, filter by department | Backend | P1 | 3 | Sprint 3 | [x] |
| T-024 | Doctor-Department relationship (assign/unassign) | Backend | P1 | 2 | Sprint 3 | [x] |
| T-025 | Public Doctor listing page (cards, filter, search) | Frontend | P1 | 5 | Sprint 3 | [x] |
| T-026 | Doctor detail page (profile, schedule) | Frontend | P2 | 3 | Sprint 3 | [x] |

---

## EPIC 3: Appointment System

### US-007: Bệnh nhân đặt lịch khám
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-007-Patient-Booking.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US007-Patient-Booking.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-027 | Create Appointment entity (patient, doctor, dept, datetime, status) | Backend | P0 | 3 | Sprint 4 |
| T-028 | AppointmentController: book, cancel, list endpoints | Backend | P0 | 5 | Sprint 4 |
| T-029 | Time slot conflict detection | Backend | P1 | 3 | Sprint 4 |
| T-030 | Booking form UI (select dept → doctor → date → time) | Frontend | P0 | 5 | Sprint 4 |
| T-031 | My Appointments page (patient view) | Frontend | P0 | 3 | Sprint 4 |

---

### US-008: Bác sĩ quản lý lịch hẹn
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-008-Doctor-Appointments.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US008-Doctor-Appointments.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-032 | Doctor appointments endpoint (filter by date, status) | Backend | P1 | 2 | Sprint 4 |
| T-033 | Doctor: Today's appointments view | Frontend | P1 | 3 | Sprint 4 |
| T-034 | Status update buttons (confirm, start, complete) | Frontend | P1 | 2 | Sprint 4 |

---

## EPIC 4: Medical Records

### US-009: Bác sĩ tạo bệnh án
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-009-Create-Medical-Record.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US009-Create-Medical-Record.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-035 | Create MedicalRecord entity | Backend | P1 | 3 | Sprint 5 |
| T-036 | MedicalRecordController: create, get by patient | Backend | P1 | 3 | Sprint 5 |
| T-037 | Doctor: Create record form (diagnosis, symptoms, prescription) | Frontend | P1 | 5 | Sprint 5 |
| T-038 | Patient: Medical history timeline | Frontend | P1 | 3 | Sprint 5 |
| T-039 | Record detail page (full info) | Frontend | P2 | 2 | Sprint 5 |

---

## EPIC 5: AI Symptom Checker & Triage

### US-010: AI phân tích triệu chứng
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-010-AI-Symptom-Analyzer.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US010-AI-Symptom-Analyzer.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-040 | Setup Gemini API client + medical system prompt | AI | P0 | 5 | Sprint 6 |
| T-041 | Implement conversation chain (context memory) | AI | P0 | 5 | Sprint 6 |
| T-042 | Create triage analysis endpoint (POST /api/triage/analyze) | AI | P0 | 3 | Sprint 6 |
| T-043 | Prompt engineering: symptom analysis + follow-up questions | AI | P0 | 5 | Sprint 6 |
| T-044 | Triage recommendation endpoint (POST /api/triage/recommend) | AI | P0 | 3 | Sprint 6 |
| T-045 | Spring Boot AiClientService (HTTP call to Python) | Backend | P0 | 3 | Sprint 6 |

---

### US-011: Chat real-time với AI
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-011-Realtime-AI-Chat.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US011-Realtime-AI-Chat.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-046 | Setup WebSocket server (Spring Boot or FastAPI) | Backend | P0 | 5 | Sprint 7 |
| T-047 | React Chat UI (message bubbles, typing indicator) | Frontend | P0 | 5 | Sprint 7 |
| T-048 | Connect React WebSocket client to backend | Frontend | P0 | 3 | Sprint 7 |
| T-049 | Save chat history to database | Backend | P1 | 3 | Sprint 7 |
| T-050 | Error handling (reconnect, timeout) | Both | P1 | 3 | Sprint 7 |


---

### US-012: Triage ticket gửi đến bác sĩ
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-012-Triage-Ticket.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US012-Triage-Ticket.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-052 | TriageTicket entity (session, patient, dept, urgency, summary, status) | Backend | P0 | 3 | Sprint 8 | [x] |
| T-053 | Ticket generation logic (trigger when AI recommends) | Backend | P0 | 3 | Sprint 8 | [x] |
| T-054 | Doctor: Triage Inbox page (list tickets by dept/urgency) | Frontend | P0 | 5 | Sprint 8 | [x] |
| T-055 | Doctor: Accept ticket -> Create Appointment | Frontend | P1 | 3 | Sprint 8 | [x] |



---

## EPIC 6: Public Pages

### US-013: Trang chủ bệnh viện
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-013-Landing-Page.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US013-Landing-Page.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-059 | Landing page: hero, services, CTA | Frontend | P1 | 5 | Sprint 9 |
| T-061 | Department detail page | Frontend | P2 | 2 | Sprint 9 |
| T-062 | Emergency info page | Frontend | P2 | 2 | Sprint 9 |
| T-063 | Contact form | Frontend | P3 | 2 | Sprint 9 |
| T-064 | Responsive design pass (all public pages) | Frontend | P1 | 3 | Sprint 9 |


---

## EPIC 7: Dashboards

### US-014: Dashboard theo role
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-014-Role-Dashboards.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US014-Role-Dashboards.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-065 | Patient dashboard: appointments, records, triage history | Frontend | P1 | 5 | Sprint 10 |
| T-066 | Doctor dashboard: today's schedule, pending tickets, stats | Frontend | P1 | 5 | Sprint 10 |
| T-067 | Admin dashboard: user count, appointment stats, charts | Frontend | P1 | 5 | Sprint 10 |
| T-068 | Dashboard API endpoints (stats, counts) | Backend | P1 | 3 | Sprint 10 |
| T-069 | In-app notification bell (WebSocket) | Frontend + Backend | P2 | 5 | Sprint 10 |

---

## EPIC 8: Infrastructure

### US-015: Docker & CI/CD
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-015-Docker-CICD.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US015-Docker-CICD.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-070 | Multi-stage Dockerfile (frontend, backend, ai-service) | DevOps | P1 | 5 | Sprint 12 |
| T-071 | docker-compose.prod.yml + NGINX config | DevOps | P1 | 5 | Sprint 12 |
| T-072 | GitHub Actions CI (build + test on PR) | DevOps | P1 | 3 | Sprint 12 |
| T-073 | GitHub Actions CD (deploy on main merge) | DevOps | P1 | 5 | Sprint 12 |
| T-074 | Environment variables management | DevOps | P0 | 2 | Sprint 12 |

---

## EPIC 9: EHR Data Extraction System 

### US-016: Upload & Nhập ghi chú lâm sàng
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-016-Upload-Clinical-Notes.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US016-Upload-Clinical-Notes.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-075 | Create EHR Pydantic models (ClinicalNote, ExtractedEntity, ExtractionResult) | AI | P0 | 2 | Sprint 14 |
| T-076 | Create NER prompt templates (Vietnamese + English) | AI | P0 | 3 | Sprint 14 |
| T-077 | Implement EHRExtractionService (Gemini-based NER) | AI | P0 | 5 | Sprint 14 |
| T-078 | Implement PDF/Word file parsing (PyPDF2, python-docx) | AI | P0 | 3 | Sprint 14 |
| T-079 | Create EHR API routes (extract-text, extract-file) | AI | P0 | 3 | Sprint 14 |
| T-080 | Update requirements.txt + main.py | AI | P1 | 1 | Sprint 14 |

---

### US-017: Database & Backend cho EHR
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-017-EHR-Database-Backend.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US017-EHR-Database-Backend.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-081 | Create ClinicalNote entity + migration | Backend | P0 | 3 | Sprint 15 |
| T-082 | Create ExtractedEntity entity | Backend | P0 | 2 | Sprint 15 |
| T-083 | Create PatientMedication entity | Backend | P0 | 2 | Sprint 15 |
| T-084 | Create PatientCondition entity | Backend | P0 | 2 | Sprint 15 |
| T-085 | Create PatientSymptom entity | Backend | P0 | 2 | Sprint 15 |
| T-086 | Create EHR DTOs (request/response) | Backend | P1 | 2 | Sprint 15 |
| T-087 | Create EHR Repositories (with custom queries) | Backend | P0 | 3 | Sprint 15 |
| T-088 | Create EHRService (upload, extract, save flow) | Backend | P0 | 5 | Sprint 15 |
| T-089 | Create EHRController (upload, extract, search endpoints) | Backend | P0 | 3 | Sprint 15 |



---

### US-018: Tìm kiếm nâng cao EHR
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-018-EHR-Advanced-Search.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US018-EHR-Advanced-Search.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-090 | Implement JPA Specification for dynamic search | Backend | P0 | 5 | Sprint 16 |
| T-091 | Advanced search API: multi-criteria query | Backend | P0 | 3 | Sprint 16 |
| T-092 | Statistics API: top medications, common conditions | Backend | P2 | 3 | Sprint 16 |

---

### US-019: Frontend UI cho EHR
> 📄 **[Xem chi tiết User Story](file:///d:/CareTriage/.agent/scrum/user-stories/US-019-EHR-Frontend-UI.md)** | 🧪 **[Xem Test Cases](file:///d:/CareTriage/.agent/scrum/test-cases/TC-US019-EHR-Frontend-UI.md)**

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-093 | EHR Upload page (file upload + text input form) | Frontend | P0 | 5 | Sprint 16 |
| T-094 | EHR Extraction Result page (entity cards, highlight in text) | Frontend | P0 | 5 | Sprint 16 |
| T-095 | EHR Advanced Search page (multi-criteria form + results table) | Frontend | P1 | 5 | Sprint 16 |

---

##  Backlog Summary

| Epic | User Stories | Tasks | Total Points |
|------|-------------|-------|-------------|
| 1. Auth & Users | 4 | 18 | 48 |
| 2. Dept & Doctors | 2 | 8 | 23 |
| 3. Appointments | 2 | 8 | 24 |
| 4. Medical Records | 1 | 5 | 16 |
| 5. AI Triage | 3 | 19 | 69 |
| 6. Public Pages | 1 | 6 | 16 |
| 7. Dashboards | 1 | 5 | 23 |
| 8. Infrastructure | 1 | 5 | 20 |
| 9. EHR Extraction  | 4 | 21 | 67 |
| **TOTAL** | **19** | **95** | **306** |

**Velocity Estimate (Solo Dev):** ~18-22 points/sprint

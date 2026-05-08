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
**As a** visitor, **I want** to register an account, **so that** I can access the system.

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

**Acceptance Criteria:**
- [ ] User can register with email, password, full name, phone
- [ ] User can login and receive JWT token
- [ ] Token auto-refreshes before expiry
- [ ] Invalid credentials show error message

---

### US-002: Đăng nhập / Đăng xuất
**As a** registered user, **I want** to login/logout, **so that** I can access my dashboard securely.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-009 | Implement protected route wrapper | Frontend | P0 | 2 | Sprint 1 |
| T-010 | Role-based redirect after login | Frontend | P0 | 2 | Sprint 1 |
| T-011 | Logout + token cleanup | Frontend | P1 | 1 | Sprint 1 |

**Acceptance Criteria:**
- [ ] Patient → Patient Dashboard, Doctor → Doctor Dashboard, Admin → Admin Dashboard
- [ ] Logout clears token and redirects to login
- [ ] Accessing protected route without auth → redirect to login

---

### US-003: Quản lý profile cá nhân
**As a** user, **I want** to view and edit my profile, **so that** my information is up-to-date.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-012 | Create PatientProfile, DoctorProfile entities | Backend | P1 | 3 | Sprint 2 |
| T-013 | UserController: GET/PUT profile endpoints | Backend | P1 | 3 | Sprint 2 |
| T-014 | Profile page UI (view mode + edit mode) | Frontend | P1 | 3 | Sprint 2 |
| T-015 | Avatar upload (optional) | Frontend | P3 | 2 | Sprint 2 |

**Acceptance Criteria:**
- [ ] Patient can update: name, phone, DOB, gender, address, blood type, allergies
- [ ] Doctor can update: name, phone, bio, specialization
- [ ] Changes persist after page refresh

---

### US-004: Admin quản lý user
**As an** admin, **I want** to manage all users, **so that** I can control system access.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-016 | Admin UserController: list all, change role, toggle active | Backend | P1 | 3 | Sprint 2 |
| T-017 | Admin User Management page (MUI DataGrid) | Frontend | P1 | 5 | Sprint 2 |
| T-018 | Role change dialog + confirmation | Frontend | P2 | 2 | Sprint 2 |

**Acceptance Criteria:**
- [ ] Admin sees all users in table with search/filter
- [ ] Admin can activate/deactivate accounts
- [ ] Admin can change user roles

---

## EPIC 2: Department & Doctor Management

### US-005: Admin quản lý khoa/phòng
**As an** admin, **I want** to manage departments, **so that** the hospital structure is organized.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-019 | Create Department entity + DepartmentRepository | Backend | P1 | 2 | Sprint 3 | [x] |
| T-020 | DepartmentController: CRUD endpoints | Backend | P1 | 3 | Sprint 3 | [x] |
| T-021 | Admin Department management page | Frontend | P1 | 3 | Sprint 3 | [x] |
| T-022 | Department form (create/edit dialog) | Frontend | P1 | 2 | Sprint 3 | [x] |

**Acceptance Criteria:**
- [ ] Admin can create department with name, description, image
- [ ] Admin can edit/delete departments
- [ ] Departments show on public listing

---

### US-006: Xem danh sách bác sĩ
**As a** visitor/patient, **I want** to browse doctors by department, **so that** I can choose the right doctor.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-023 | DoctorController: public list, filter by department | Backend | P1 | 3 | Sprint 3 | [x] |
| T-024 | Doctor-Department relationship (assign/unassign) | Backend | P1 | 2 | Sprint 3 | [x] |
| T-025 | Public Doctor listing page (cards, filter, search) | Frontend | P1 | 5 | Sprint 3 | [x] |
| T-026 | Doctor detail page (profile, schedule) | Frontend | P2 | 3 | Sprint 3 | [x] |

**Acceptance Criteria:**
- [ ] Visitors can see doctor list without login
- [ ] Filter by department works
- [ ] Doctor card shows: name, photo, specialization, department

---

## EPIC 3: Appointment System

### US-007: Bệnh nhân đặt lịch khám
**As a** patient, **I want** to book an appointment, **so that** I can see a doctor.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-027 | Create Appointment entity (patient, doctor, dept, datetime, status) | Backend | P0 | 3 | Sprint 4 |
| T-028 | AppointmentController: book, cancel, list endpoints | Backend | P0 | 5 | Sprint 4 |
| T-029 | Time slot conflict detection | Backend | P1 | 3 | Sprint 4 |
| T-030 | Booking form UI (select dept → doctor → date → time) | Frontend | P0 | 5 | Sprint 4 |
| T-031 | My Appointments page (patient view) | Frontend | P0 | 3 | Sprint 4 |

**Acceptance Criteria:**
- [ ] Patient selects department → sees available doctors → picks date/time
- [ ] Cannot double-book same slot
- [ ] Appointment shows status: PENDING → CONFIRMED → COMPLETED

---

### US-008: Bác sĩ quản lý lịch hẹn
**As a** doctor, **I want** to view and manage my appointments, **so that** I can organize my schedule.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-032 | Doctor appointments endpoint (filter by date, status) | Backend | P1 | 2 | Sprint 4 |
| T-033 | Doctor: Today's appointments view | Frontend | P1 | 3 | Sprint 4 |
| T-034 | Status update buttons (confirm, start, complete) | Frontend | P1 | 2 | Sprint 4 |

**Acceptance Criteria:**
- [ ] Doctor sees today's appointments sorted by time
- [ ] Doctor can confirm/start/complete appointments
- [ ] Status changes reflect for patient immediately

---

## EPIC 4: Medical Records

### US-009: Bác sĩ tạo bệnh án
**As a** doctor, **I want** to create medical records after examination, **so that** patient history is documented.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-035 | Create MedicalRecord entity | Backend | P1 | 3 | Sprint 5 |
| T-036 | MedicalRecordController: create, get by patient | Backend | P1 | 3 | Sprint 5 |
| T-037 | Doctor: Create record form (diagnosis, symptoms, prescription) | Frontend | P1 | 5 | Sprint 5 |
| T-038 | Patient: Medical history timeline | Frontend | P1 | 3 | Sprint 5 |
| T-039 | Record detail page (full info) | Frontend | P2 | 2 | Sprint 5 |

**Acceptance Criteria:**
- [ ] Doctor creates record linked to appointment
- [ ] Patient views chronological medical history
- [ ] Record includes: diagnosis, symptoms, prescription, notes

---

## EPIC 5: AI Symptom Checker & Triage

### US-010: AI phân tích triệu chứng
**As a** patient, **I want** to describe my symptoms to AI, **so that** I get preliminary health advice.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-040 | Setup Gemini API client + medical system prompt | AI | P0 | 5 | Sprint 6 |
| T-041 | Implement conversation chain (context memory) | AI | P0 | 5 | Sprint 6 |
| T-042 | Create triage analysis endpoint (POST /api/triage/analyze) | AI | P0 | 3 | Sprint 6 |
| T-043 | Prompt engineering: symptom analysis + follow-up questions | AI | P0 | 5 | Sprint 6 |
| T-044 | Triage recommendation endpoint (POST /api/triage/recommend) | AI | P0 | 3 | Sprint 6 |
| T-045 | Spring Boot AiClientService (HTTP call to Python) | Backend | P0 | 3 | Sprint 6 |

**Acceptance Criteria:**
- [ ] User sends "đau đầu, buồn nôn" → AI asks clarifying questions
- [ ] AI asks 2-4 follow-up questions before recommending
- [ ] Final output: suggested department, urgency level, possible conditions
- [ ] All responses in Vietnamese

---

### US-011: Chat real-time với AI
**As a** patient, **I want** to chat with AI in real-time, **so that** the experience feels natural.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-046 | WebSocket config (STOMP over SockJS) | Backend | P0 | 3 | Sprint 7 | [x] |
| T-047 | ChatWebSocketController (send/receive) | Backend | P0 | 5 | Sprint 7 | [x] |
| T-048 | ChatSession, ChatMessage entities + persistence | Backend | P0 | 3 | Sprint 7 | [x] |
| T-049 | Chat window component (message bubbles, typing indicator) | Frontend | P0 | 5 | Sprint 7 | [x] |
| T-050 | useWebSocket hook (connect, send, receive, reconnect) | Frontend | P0 | 5 | Sprint 7 | [x] |
| T-051 | Symptom suggestion chips (quick input) | Frontend | P2 | 2 | Sprint 7 | [x] |

**Acceptance Criteria:**
- [ ] Messages appear in real-time (< 500ms latency)
- [ ] Typing indicator shows while AI is processing
- [ ] Chat history persists across page refresh
- [ ] Auto-reconnect on WebSocket drop

---

### US-012: Triage ticket gửi đến bác sĩ
**As a** system, **I want** to convert triage chat into a ticket, **so that** doctors can review and follow up.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-052 | TriageTicket entity (session, patient, dept, urgency, summary, status) | Backend | P0 | 3 | Sprint 8 | [x] |
| T-053 | Auto-generate ticket when triage completes | Backend | P0 | 5 | Sprint 8 | [x] |
| T-054 | AI summary generation (summarize chat into ticket) | AI | P0 | 3 | Sprint 8 | [x] |
| T-055 | TriageTicketController: list, assign, review | Backend | P1 | 3 | Sprint 8 | [x] |
| T-056 | Doctor: Ticket inbox + detail page (with chat history) | Frontend | P0 | 5 | Sprint 8 | [x] |
| T-057 | Patient: View triage result + ticket status | Frontend | P1 | 3 | Sprint 8 | [x] |
| T-058 | Ticket → Create Appointment action | Backend + Frontend | P1 | 3 | Sprint 8 | [x] |

**Acceptance Criteria:**
- [ ] Chat completion auto-creates ticket
- [ ] Ticket includes: AI summary, urgency, suggested department
- [ ] Doctor can view full chat history from ticket
- [ ] Doctor can create appointment from ticket

---

## EPIC 6: Public Pages

### US-013: Trang chủ bệnh viện
**As a** visitor, **I want** to see hospital information, **so that** I can learn about services.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-059 | Landing page: hero, services, CTA | Frontend | P1 | 5 | Sprint 9 |
| T-060 | Sync status between ticket and appointment | Backend | P1 | 3 | Sprint 8 | [x] |
| T-061 | Department detail page | Frontend | P2 | 2 | Sprint 9 |
| T-062 | Emergency info page | Frontend | P2 | 2 | Sprint 9 |
| T-063 | Contact form | Frontend | P3 | 2 | Sprint 9 |
| T-064 | Responsive design pass (all public pages) | Frontend | P1 | 3 | Sprint 9 |

**Acceptance Criteria:**
- [ ] Landing page loads < 3s
- [ ] All pages responsive on mobile
- [ ] CTA "Kiểm tra triệu chứng" links to chat

---

## EPIC 7: Dashboards

### US-014: Dashboard theo role
**As a** logged-in user, **I want** to see a dashboard relevant to my role, **so that** I have a quick overview.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-065 | Patient dashboard: appointments, records, triage history | Frontend | P1 | 5 | Sprint 10 |
| T-066 | Doctor dashboard: today's schedule, pending tickets, stats | Frontend | P1 | 5 | Sprint 10 |
| T-067 | Admin dashboard: user count, appointment stats, charts | Frontend | P1 | 5 | Sprint 10 |
| T-068 | Dashboard API endpoints (stats, counts) | Backend | P1 | 3 | Sprint 10 |
| T-069 | In-app notification bell (WebSocket) | Frontend + Backend | P2 | 5 | Sprint 10 |

**Acceptance Criteria:**
- [ ] Each role sees different dashboard
- [ ] Stats update in real-time
- [ ] Notification bell shows unread count

---

## EPIC 8: Infrastructure

### US-015: Docker & CI/CD
**As a** developer, **I want** automated build and deploy, **so that** releases are reliable.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-070 | Multi-stage Dockerfile (frontend, backend, ai-service) | DevOps | P1 | 5 | Sprint 12 |
| T-071 | docker-compose.prod.yml + NGINX config | DevOps | P1 | 5 | Sprint 12 |
| T-072 | GitHub Actions CI (build + test on PR) | DevOps | P1 | 3 | Sprint 12 |
| T-073 | GitHub Actions CD (deploy on main merge) | DevOps | P1 | 5 | Sprint 12 |
| T-074 | Environment variables management | DevOps | P0 | 2 | Sprint 12 |

**Acceptance Criteria:**
- [ ] `docker-compose up` runs all services
- [ ] PR triggers CI (build + test)
- [ ] Merge to main triggers deploy
- [ ] No secrets in code

---

## EPIC 9: EHR Data Extraction System 

### US-016: Upload & Nhập ghi chú lâm sàng
**As a** doctor, **I want** to upload clinical notes (PDF/Word) or type them directly, **so that** the system can process and extract medical entities.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-075 | Create EHR Pydantic models (ClinicalNote, ExtractedEntity, ExtractionResult) | AI | P0 | 2 | Sprint 14 |
| T-076 | Create NER prompt templates (Vietnamese + English) | AI | P0 | 3 | Sprint 14 |
| T-077 | Implement EHRExtractionService (Gemini-based NER) | AI | P0 | 5 | Sprint 14 |
| T-078 | Implement PDF/Word file parsing (PyPDF2, python-docx) | AI | P0 | 3 | Sprint 14 |
| T-079 | Create EHR API routes (extract-text, extract-file) | AI | P0 | 3 | Sprint 14 |
| T-080 | Update requirements.txt + main.py | AI | P1 | 1 | Sprint 14 |

**Acceptance Criteria:**
- [ ] Upload PDF → text extracted → entities returned as JSON
- [ ] Upload DOCX → text extracted → entities returned
- [ ] Direct text input → entities returned
- [ ] Entities include: medications, symptoms, conditions, dosages, lab_tests, procedures
- [ ] Each entity has confidence_score

---

### US-017: Database & Backend cho EHR
**As a** system, **I want** to store extracted medical entities in structured tables, **so that** data is searchable and analyzable.

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

**Acceptance Criteria:**
- [ ] Doctor uploads file → AI extracts → entities saved to DB
- [ ] Extracted entities linked to clinical_note and patient
- [ ] Patient medications/conditions/symptoms auto-populated
- [ ] All endpoints secured with role-based access (DOCTOR, ADMIN)

---

### US-018: Tìm kiếm nâng cao EHR
**As a** doctor, **I want** to search patients by symptoms, medications, and conditions, **so that** I can find relevant cases quickly.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-090 | Implement JPA Specification for dynamic search | Backend | P0 | 5 | Sprint 16 |
| T-091 | Advanced search API: multi-criteria query | Backend | P0 | 3 | Sprint 16 |
| T-092 | Statistics API: top medications, common conditions | Backend | P2 | 3 | Sprint 16 |

**Acceptance Criteria:**
- [ ] Search by symptom: "đau đầu" → list of matching patients
- [ ] Search by medication: "paracetamol" → matching patients
- [ ] Combined search: symptom X AND medication Y → results
- [ ] Filter by date range, severity
- [ ] Statistics endpoint returns top medications and conditions

---

### US-019: Frontend UI cho EHR
**As a** doctor, **I want** a user interface to upload notes and view extraction results, **so that** I can interact with the EHR system.

| Task ID | Task | Type | Priority | Points | Sprint |
|---------|------|------|----------|--------|--------|
| T-093 | EHR Upload page (file upload + text input form) | Frontend | P0 | 5 | Sprint 16 |
| T-094 | EHR Extraction Result page (entity cards, highlight in text) | Frontend | P0 | 5 | Sprint 16 |
| T-095 | EHR Advanced Search page (multi-criteria form + results table) | Frontend | P1 | 5 | Sprint 16 |

**Acceptance Criteria:**
- [ ] Doctor can upload PDF/Word or type clinical note
- [ ] Extraction results show entities with color-coded labels
- [ ] Entities highlighted in original text
- [ ] Search page with multi-criteria form
- [ ] Results displayed in searchable/sortable DataGrid

---

## 📊 Backlog Summary

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
| 9. EHR Extraction ⭐ | 4 | 21 | 67 |
| **TOTAL** | **19** | **95** | **306** |

**Velocity Estimate (Solo Dev):** ~18-22 points/sprint

# CareTriage — Sprint Planning Guide

> **Sprint Duration:** 1 tuần (7 ngày)  
> **Capacity:** 1 developer × ~20 story points/sprint  
> **Ceremonies:** Daily standup (tự review), Sprint Review cuối tuần

---

## Sprint Calendar

| Sprint | Tuần | Focus | Epic | Points |
|--------|------|-------|------|--------|
| Sprint 0 | Week 0 | Project Setup & Foundation | Infrastructure | 15 |
| Sprint 1 | Week 1 | Authentication & Authorization | Epic 1 | 22 |
| Sprint 2 | Week 2 | User & Profile Management | Epic 1 | 19 |
| Sprint 3 | Week 3 | Department & Doctor Management | Epic 2 | 23 |
| Sprint 4 | Week 4 | Appointment System | Epic 3 | 24 |
| Sprint 5 | Week 5 | Medical Records Core | Epic 4 | 16 |
| Sprint 6 | Week 6 | AI Triage — Python Service | Epic 5 | 24 |
| Sprint 7 | Week 7 | AI Triage — WebSocket & Chat UI | Epic 5 | 23 |
| Sprint 8 | Week 8 | Triage Ticket System | Epic 5 | 22 |
| Sprint 9 | Week 9 | Public Pages & Landing | Epic 6 | 16 |
| Sprint 10 | Week 10 | Dashboards & Notifications | Epic 7 | 23 |
| Sprint 11 | Week 11 | Testing & Polish | Testing | 20 |
| Sprint 12 | Week 12 | Docker & CI/CD Production | Epic 8 | 20 |
| Sprint 13 | Week 13 | Documentation & Final Review | Docs | 10 |
| Sprint 14 | Week 14 | EHR — AI NER Service (Python) ⭐ | Epic 9 | 17 |
| Sprint 15 | Week 15 | EHR — Backend Entities & APIs ⭐ | Epic 9 | 24 |
| Sprint 16 | Week 16 | EHR — Search & Frontend UI ⭐ | Epic 9 | 26 |

---

## Sprint 0 — Project Foundation

**Goal:** Tất cả services chạy được locally + Docker

### Tasks

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Init React + Vite + MUI + TailwindCSS + React Router | To Do | 3 |
| 2 | Init Spring Boot (Web, Security, JPA, WebSocket, Validation) | To Do | 3 |
| 3 | Init Python FastAPI + google-generativeai + langchain | To Do | 2 |
| 4 | Setup MySQL database + docker-compose.dev.yml | To Do | 3 |
| 5 | Create project folder structure (all 3 services) | To Do | 2 |
| 6 | GitHub repo + .gitignore + branch strategy | To Do | 1 |
| 7 | Basic health endpoints (all services) | To Do | 1 |

**Total: 15 points**

### Definition of Done
- [ ] `npm run dev` → React app loads on localhost:5173
- [ ] `mvn spring-boot:run` → Spring Boot on localhost:8080/api/health
- [ ] `uvicorn app.main:app` → FastAPI on localhost:8000/health
- [ ] `docker-compose up` → all services running

---

## Sprint 1 — Authentication & Authorization

**Goal:** User register/login/logout with JWT, role-based access

### Tasks

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Create User, Role entities + Flyway migration | To Do | 3 |
| 2 | Implement AuthService (register, login, JWT generation) | To Do | 5 |
| 3 | Create AuthController (POST /register, /login, /refresh) | To Do | 3 |
| 4 | Configure Spring Security + JWT filter chain | To Do | 5 |
| 5 | Build Login page (MUI form) | To Do | 2 |
| 6 | Build Register page (form validation) | To Do | 3 |
| 7 | Implement Axios interceptor (JWT, 401 handling) | To Do | 3 |
| 8 | Create AuthStore (Zustand) + Protected route | To Do | 2 |

**Total: 26 points** ⚠️ (may overflow — move T-008 to Sprint 2 if needed)

### Definition of Done
- [ ] Register → Login → JWT token received
- [ ] Protected endpoint rejects without token
- [ ] Role-based access works (PATIENT, DOCTOR, ADMIN)

---

## Sprint 2 — User & Profile Management

**Goal:** Profile CRUD, Admin user management

### Tasks (from backlog: T-012 to T-018)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | PatientProfile, DoctorProfile entities | To Do | 3 |
| 2 | UserController: GET/PUT profile | To Do | 3 |
| 3 | Profile page UI (view/edit) | To Do | 3 |
| 4 | Avatar upload (if time) | To Do | 2 |
| 5 | Admin: User list endpoint | To Do | 3 |
| 6 | Admin: User management page (DataGrid) | To Do | 5 |
| 7 | Role change dialog | To Do | 2 |

**Total: 21 points**

---

## Sprint 3 — Department & Doctor Management

**Goal:** Admin manages departments, public doctor listing

### Tasks (from backlog: T-019 to T-026)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Department entity + repository | To Do | 2 |
| 2 | DepartmentController CRUD | To Do | 3 |
| 3 | Admin department management page | To Do | 3 |
| 4 | Department form dialog | To Do | 2 |
| 5 | DoctorController: public list, filter | To Do | 3 |
| 6 | Doctor-Department relationship | To Do | 2 |
| 7 | Public doctor listing page | To Do | 5 |
| 8 | Doctor detail page | To Do | 3 |

**Total: 23 points**

---

## Sprint 4 — Appointment System

### Tasks (from backlog: T-027 to T-034)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Appointment entity + status enum | To Do | 3 |
| 2 | AppointmentController (book, cancel, list) | To Do | 5 |
| 3 | Time slot conflict detection | To Do | 3 |
| 4 | Booking form UI (dept → doctor → date → time) | To Do | 5 |
| 5 | Patient: My Appointments page | To Do | 3 |
| 6 | Doctor: appointments endpoint (filter) | To Do | 2 |
| 7 | Doctor: Today's appointments view | To Do | 3 |
| 8 | Status update buttons | To Do | 2 |

**Total: 26 points** ⚠️ (may overflow)

---

## Sprint 5 — Medical Records Core

### Tasks (from backlog: T-035 to T-039)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | MedicalRecord entity | To Do | 3 |
| 2 | MedicalRecordController (create, get) | To Do | 3 |
| 3 | Doctor: Create record form | To Do | 5 |
| 4 | Patient: Medical history timeline | To Do | 3 |
| 5 | Record detail page | To Do | 2 |

**Total: 16 points** (lighter sprint — catch-up buffer)

---

## Sprint 6 — AI Triage: Python Service

### Tasks (from backlog: T-040 to T-045)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Gemini API client + medical system prompt | To Do | 5 |
| 2 | Conversation chain (context memory) | To Do | 5 |
| 3 | POST /api/triage/analyze endpoint | To Do | 3 |
| 4 | Prompt engineering: symptom analysis + follow-up | To Do | 5 |
| 5 | POST /api/triage/recommend endpoint | To Do | 3 |
| 6 | Spring Boot AiClientService (HTTP → Python) | To Do | 3 |

**Total: 24 points**

---

## Sprint 7 — AI Triage: WebSocket & Chat UI

### Tasks (from backlog: T-046 to T-051)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | WebSocket config (STOMP over SockJS) | To Do | 3 |
| 2 | ChatWebSocketController | To Do | 5 |
| 3 | ChatSession, ChatMessage entities | To Do | 3 |
| 4 | Chat window component (MUI) | To Do | 5 |
| 5 | useWebSocket hook | To Do | 5 |
| 6 | Symptom suggestion chips | To Do | 2 |

**Total: 23 points**

---

## Sprint 8 — Triage Ticket System

### Tasks (from backlog: T-052 to T-058)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | TriageTicket entity | To Do | 3 |
| 2 | Auto-generate ticket on triage complete | To Do | 5 |
| 3 | AI summary generation | To Do | 3 |
| 4 | TriageTicketController | To Do | 3 |
| 5 | Doctor: Ticket inbox + detail | To Do | 5 |
| 6 | Patient: Triage result view | To Do | 3 |
| 7 | Ticket → Create Appointment action | To Do | 3 |

**Total: 25 points** ⚠️

---

## Sprint 9 — Public Pages & Landing

### Tasks (from backlog: T-059 to T-064)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Landing page (hero, services, CTA) | To Do | 5 |
| 2 | About page | To Do | 2 |
| 3 | Department detail page | To Do | 2 |
| 4 | Emergency info page | To Do | 2 |
| 5 | Contact form | To Do | 2 |
| 6 | Responsive design pass | To Do | 3 |

**Total: 16 points** (lighter sprint)

---

## Sprint 10 — Dashboards & Notifications

### Tasks (from backlog: T-065 to T-069)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Patient dashboard | To Do | 5 |
| 2 | Doctor dashboard | To Do | 5 |
| 3 | Admin dashboard (with charts) | To Do | 5 |
| 4 | Dashboard API endpoints | To Do | 3 |
| 5 | In-app notification (WebSocket) | To Do | 5 |

**Total: 23 points**

---

## Sprint 11 — Testing & Polish

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Backend JUnit tests (auth, appointment, triage) | To Do | 5 |
| 2 | Frontend RTL tests (critical flows) | To Do | 5 |
| 3 | AI service pytest | To Do | 3 |
| 4 | UI polish (animations, loading, error states) | To Do | 5 |
| 5 | Responsive fixes | To Do | 2 |

**Total: 20 points**

---

## Sprint 12 — Docker & CI/CD

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Multi-stage Dockerfiles (all services) | To Do | 5 |
| 2 | docker-compose.prod.yml + NGINX | To Do | 5 |
| 3 | GitHub Actions CI (build + test on PR) | To Do | 3 |
| 4 | GitHub Actions CD (deploy on main) | To Do | 5 |
| 5 | .env management | To Do | 2 |

**Total: 20 points**

---

## Sprint 13 — Documentation & Final Review

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Swagger/OpenAPI docs | To Do | 3 |
| 2 | README.md with full setup instructions | To Do | 2 |
| 3 | Architecture diagram | To Do | 1 |
| 4 | DB schema diagram | To Do | 1 |
| 5 | Final security scan | To Do | 2 |
| 6 | Demo preparation | To Do | 1 |

**Total: 10 points** (wrap-up sprint)

---

## 📝 Sprint Template (Copy for Each Sprint)

```markdown
# Sprint [N] — [Sprint Name]

**Duration:** [Start Date] → [End Date]  
**Goal:** [One sentence describing the sprint goal]  
**Velocity Target:** 20 points

## Board

### 📋 To Do
| Task ID | Task | Points | Assignee |
|---------|------|--------|----------|
| T-XXX | ... | X | Dev |

### 🔄 In Progress
| Task ID | Task | Points | Started |
|---------|------|--------|---------|

### 👀 In Review
| Task ID | Task | Points | PR Link |
|---------|------|--------|---------|

### ✅ Done
| Task ID | Task | Points | Completed |
|---------|------|--------|-----------|

## Sprint Metrics
- **Planned Points:** X
- **Completed Points:** X
- **Velocity:** X
- **Carryover:** [Tasks moved to next sprint]

## Retrospective
- **What went well:**
- **What didn't go well:**
- **Action items:**
```

---

## Sprint 14 — EHR: AI NER Service (Python) ⭐

**Goal:** AI Service có thể trích xuất entities y tế từ text và file PDF/Word

### Tasks (from backlog: T-075 to T-080)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | Create EHR Pydantic models | To Do | 2 |
| 2 | Create NER prompt templates (Vi + En) | To Do | 3 |
| 3 | Implement EHRExtractionService (Gemini NER) | To Do | 5 |
| 4 | Implement PDF/Word file parsing | To Do | 3 |
| 5 | Create EHR API routes | To Do | 3 |
| 6 | Update requirements.txt + main.py | To Do | 1 |

**Total: 17 points**

### Definition of Done
- [ ] `POST /api/ehr/extract-text` → trả về entities JSON
- [ ] `POST /api/ehr/extract-file` → upload PDF → trả về entities
- [ ] Entities gồm: medications, symptoms, conditions, dosages, lab_tests, procedures
- [ ] Mỗi entity có confidence_score
- [ ] Hỗ trợ ghi chú tiếng Việt và tiếng Anh

---

## Sprint 15 — EHR: Backend Entities & APIs ⭐

**Goal:** Database schema EHR + Spring Boot APIs hoàn chỉnh

### Tasks (from backlog: T-081 to T-089)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | ClinicalNote entity + migration | To Do | 3 |
| 2 | ExtractedEntity entity | To Do | 2 |
| 3 | PatientMedication entity | To Do | 2 |
| 4 | PatientCondition entity | To Do | 2 |
| 5 | PatientSymptom entity | To Do | 2 |
| 6 | EHR DTOs | To Do | 2 |
| 7 | EHR Repositories (custom queries) | To Do | 3 |
| 8 | EHRService (upload → extract → save) | To Do | 5 |
| 9 | EHRController (endpoints) | To Do | 3 |

**Total: 24 points** ⚠️

### Definition of Done
- [ ] Doctor upload file → AI extract → entities saved to DB
- [ ] All 5 EHR tables created with proper FK relationships
- [ ] CRUD endpoints working for clinical notes
- [ ] Role-based access: DOCTOR, ADMIN only

---

## Sprint 16 — EHR: Search & Frontend UI ⭐

**Goal:** Tìm kiếm nâng cao + UI cho upload và kết quả trích xuất

### Tasks (from backlog: T-090 to T-095)

| # | Task | Status | Points |
|---|------|--------|--------|
| 1 | JPA Specification for dynamic search | To Do | 5 |
| 2 | Advanced search API (multi-criteria) | To Do | 3 |
| 3 | Statistics API | To Do | 3 |
| 4 | EHR Upload page (frontend) | To Do | 5 |
| 5 | Extraction Result page (frontend) | To Do | 5 |
| 6 | Advanced Search page (frontend) | To Do | 5 |

**Total: 26 points** ⚠️

### Definition of Done
- [ ] Search "đau đầu" → bệnh nhân có triệu chứng đau đầu
- [ ] Combined search: symptom + medication works
- [ ] Doctor can upload + view extraction results in UI
- [ ] Entities color-coded and highlighted in original text
- [ ] Search results in sortable DataGrid


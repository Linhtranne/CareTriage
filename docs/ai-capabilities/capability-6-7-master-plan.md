# Capability 6-7 Master Plan: Java AI Cutover, Quality Gate, Doctor Recommendation, External Doctor Booking

Tài liệu này là nguồn giao việc cho AI agent triển khai Capability 6 và Capability 7 của CareTriage, đồng thời xử lý các yêu cầu còn lại sau Capability 1-5.

Ngôn ngữ tài liệu: tiếng Việt. Tên class, method, biến và code comment khi triển khai: tiếng Anh.

## 1. Quyết Định Đã Chốt

Các điểm sau đã được chốt, agent không cần hỏi lại:

1. **Doctor crawler source**
   - Crawler lấy dữ liệu bác sĩ từ **website bệnh viện cụ thể**.
   - Việc chọn website dựa trên **vị trí hiện tại của người dùng**.
   - Không crawl tự do trong luồng chat synchronous.
   - Chỉ crawl/import qua job kiểm soát, có allowlist domain và bước admin duyệt.

2. **Email provider**
   - Dùng **Gmail SMTP** cho email thật.
   - Cấu hình bằng environment variables.
   - Không hardcode tài khoản/mật khẩu SMTP trong source code.

3. **AI recommend doctor timing**
   - AI recommend bác sĩ chạy **ngay sau triage `persisted READY`**.
   - Recommendation phải lấy bác sĩ thật từ database hoặc external doctor đã được duyệt.
   - AI không được tự bịa `doctorId`.

## 2. Phạm Vi

### 2.1 In Scope

- Capability 6: Cutover Java AI runtime và xóa Python runtime/project.
- Capability 7: Quality gate, rollout, security, docs, final verification.
- Verify/harden conversation rename.
- Đưa chat AI thành first surface trên triage page.
- Thêm doctor appointment detail view.
- Chuẩn hóa table action button layout.
- Snapshot triage priority vào medical record.
- Thêm AI doctor recommendation bằng LangChain4j/service tool.
- Thêm external doctor crawler/import theo vị trí người dùng và booking qua Gmail SMTP.

### 2.2 Out of Scope

- Fine-tuning/training model.
- Crawl web tự do từ chat request.
- Xóa hoặc sửa dữ liệu production thật.
- Refactor UI toàn hệ thống ngoài các bề mặt nêu trong tài liệu.
- Thêm provider email khác ngoài Gmail SMTP trong phase này.

## 3. Nguyên Tắc Bắt Buộc

- Không tự ý revert thay đổi đang có trong worktree.
- Không format hàng loạt.
- Không claim `READY` nếu chưa có test/build evidence.
- Không log prompt, raw user message, raw model response, PHI, nội dung bệnh án, nội dung file bệnh án.
- Không gọi RAG là training. Tên đúng là **Medical RAG / Clinical Knowledge Retrieval**.
- RAG là `indexing + retrieval + citation + grounding`, không phải fine-tuning.
- External doctor chỉ được active sau khi admin approve.
- Email booking token phải one-time use và có expiry.
- AI doctor recommendation phải dùng dữ liệu thật từ DB/service.
- Nếu gặp quyết định chưa rõ ngoài tài liệu này, agent phải dừng ở đúng điểm đó và ghi `BLOCKED` với câu hỏi cụ thể.

## 4. Phase 0: Pre-Cutover Audit

### 4.1 Mục Tiêu

Lập bản đồ phụ thuộc Python trước khi xóa để tránh xóa thiếu hoặc xóa nhầm.

### 4.2 Command Bắt Buộc

```powershell
cd D:\CareTriage

rg -n "ai-service|FastAPI|uvicorn|python|AiClientService|AiClientServiceImpl|app\.ai-service|AI_SERVICE_URL|/api/triage|/api/ehr|CHROMA|TAVILY" .
```

### 4.3 Phân Loại Kết Quả

Agent phải phân loại kết quả thành:

- Runtime dependency phải xóa:
  - Java gọi Python.
  - Docker chạy `ai-service`.
  - CI build/test Python AI service.
  - Env/config bắt buộc `AI_SERVICE_URL`.
- Docs cũ phải cập nhật:
  - README, CLAUDE.md, SRS, interview guide, capability reports.
- Không xóa:
  - Script agent nội bộ trong `.agent`, `.claude` nếu không thuộc runtime app.
  - Tài liệu lịch sử nếu được giữ dưới dạng archive và được đánh dấu deprecated.

### 4.4 Exit Criteria

```text
Có dependency map trước khi xóa.
Không còn điểm mù về Python runtime.
```

## 5. Phase 1: Force Java AI Runtime

### 5.1 Files Chính

```text
code/backend/backend/src/main/resources/application.yml
code/backend/backend/src/main/resources/application-dev.yml
code/backend/backend/src/main/java/com/caretriage/application/ai/service/TriageAiRuntimeRouter.java
code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java
code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java
```

### 5.2 Yêu Cầu

1. Runtime mặc định:

```yaml
app:
  ai:
    runtime: java
```

2. Live path của chat triage chỉ dùng Java:

```text
ChatServiceImpl
  -> TriageAiRuntimeRouter hoặc TriageAiEngine
  -> LangChainTriageEngine
```

3. Không còn production/dev live path gọi:

```text
AiClientService.streamAnalyzeSymptoms()
AiClientService.triggerResearch()
AiClientService.checkHealth()
```

4. AI health endpoint nếu còn thì kiểm tra Java AI/RAG readiness, không gọi Python `/health`.

5. Nếu router vẫn tồn tại, production mode chỉ được route Java. Python/java-shadow không được là đường runtime sau Capability 6.

### 5.3 Exit Criteria

```text
Java triage live path không gọi Python trong mọi mode production/dev.
```

## 6. Phase 2: Remove Python Runtime Dependency

### 6.1 Java Files Cần Xóa Hoặc Sửa

```text
code/backend/backend/src/main/java/com/caretriage/application/service/AiClientService.java
code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java
code/backend/backend/src/main/java/com/caretriage/infrastructure/config/WebClientConfig.java
```

Chỉ xóa `WebClientConfig` nếu nó chỉ phục vụ Python. Nếu còn dùng cho external HTTP khác, đổi tên rõ:

```text
ExternalHttpClientConfig
```

### 6.2 Config Cần Xóa

Xóa khỏi `application.yml`, `application-dev.yml`, env examples:

```yaml
app:
  ai-service:
    url:
    internal-api-key:
    connect-timeout-ms:
    read-timeout-seconds:
    write-timeout-seconds:
```

Xóa env nếu chỉ dùng cho Java-Python bridge:

```text
AI_SERVICE_URL
AI_SERVICE_INTERNAL_KEY
INTERNAL_API_KEY
```

### 6.3 Docker

Sửa:

```text
docker-compose.yml
docker-compose.prod.yml
```

Xóa service:

```yaml
ai-service:
```

Xóa dependency backend tới ai-service.

### 6.4 CI/CD

Sửa:

```text
.github/workflows/ci.yml
.github/workflows/cd.yml
.github/workflows/ai-service-quality.yml
```

Xóa job Python AI service.

### 6.5 Exit Criteria

```powershell
docker compose config
# Không còn service ai-service.

rg -n "AiClientService|app\.ai-service|AI_SERVICE_URL" code/backend/backend
# Không còn runtime dependency.
```

## 7. Phase 3: Delete Python Project

Chỉ làm sau Phase 1 và Phase 2 compile pass.

Xóa:

```text
code/backend/ai-service
```

Cập nhật tài liệu:

```text
CLAUDE.md
README.md nếu có
docs/HUONG-DAN-PHONG-VAN-CARETRIAGE.md
docs/srs.md/*
docs/ai-capabilities/*
```

Không còn hướng dẫn:

```text
cd code/backend/ai-service
python -m pytest
uvicorn app.main:app
```

Exit:

```powershell
Test-Path D:\CareTriage\code\backend\ai-service
# False
```

## 8. Phase 4: Conversation Rename Final Check

Yêu cầu này thuộc Capability 1 nhưng phải harden trong Capability 7.

### 8.1 Files

```text
ChatSessionController.java
ChatServiceImpl.java
chat-history-list.tsx
agent-conversation-panel.tsx
```

### 8.2 Chuẩn Duy Nhất

```text
title length: 1-200 chars
trim trước khi gửi/lưu
optimistic UI rollback nếu API fail
```

### 8.3 Tests

- Rename success.
- Blank title reject.
- Over 200 chars reject.
- Frontend rollback khi API fail.

## 9. Phase 5: Chat AI First Surface

### 9.1 Quyết Định

- Trang `/patient/triage` phải mở vào chat AI ngay trong first viewport.
- `AgentConversationPanel` là primary triage surface.
- Global `ChatWidget` chỉ là assistant phụ, không phải trải nghiệm chính của triage.

### 9.2 Files

```text
code/front end/frontend/src/pages/patient/triage-page.tsx
code/front end/frontend/src/features/triage/components/agent-conversation-panel.tsx
code/front end/frontend/src/components/chat/chat-widget.tsx
code/front end/frontend/src/layouts/main-layout.tsx
```

### 9.3 Yêu Cầu

1. `/patient/triage` thấy chat panel ngay, không phải scroll.
2. Không tạo session khi mount.
3. First message mới tạo session.
4. Emergency banner không che input sai.
5. Widget z-index thấp hơn emergency overlay, cao hơn content thường.

## 10. Phase 6: Doctor Appointment Detail View

### 10.1 Backend

Backend đang có:

```http
GET /api/v1/appointments/{id}
```

Phải verify quyền:

```text
PATIENT xem appointment của mình.
DOCTOR xem appointment của mình.
ADMIN xem tất cả.
```

### 10.2 Frontend Files

```text
code/front end/frontend/src/pages/doctor/doctor-appointments.jsx
code/front end/frontend/src/services/appointment-service.ts
```

### 10.3 UI Yêu Cầu

Doctor appointment list phải có nút “Chi tiết” mở drawer/dialog hiển thị:

- patient info;
- doctor info;
- department;
- date/time;
- status;
- reason;
- notes;
- triage ticket id nếu có;
- action buttons theo status.

### 10.4 Tests/Manual

- Doctor mở danh sách appointments.
- Click detail.
- Detail fetch đúng API.
- Unauthorized appointment trả 403/404.

## 11. Phase 7: Fix Table Button Flex

### 11.1 Mục Tiêu

Action buttons trong DataGrid/table không bị stretch, wrap xấu hoặc lệch dòng.

### 11.2 Tạo Component Dùng Chung

```text
code/front end/frontend/src/components/common/table-action-cell.tsx
```

API đề xuất:

```tsx
<TableActionCell align="right">
  <Button />
  <IconButton />
</TableActionCell>
```

Style chuẩn:

```text
display: flex
align-items: center
justify-content: flex-end
gap: 8px
width: 100%
min-width: max-content
flex-wrap: nowrap
```

### 11.3 Áp Dụng Vào

```text
doctor-appointments.jsx
doctor-patients.jsx
ehr-search.jsx
triage-ticket-inbox.jsx
```

## 12. Phase 8: Triage Priority Into Medical Record

### 12.1 Mục Tiêu

Kết quả phân loại ưu tiên từ triage được snapshot vào hồ sơ bệnh án.

### 12.2 Nguyên Tắc An Toàn

Không ghi đè doctor note.

Flow khuyến nghị:

```text
AI triage -> TriageTicket.priority
Doctor review/confirm hoặc appointment completed
-> copy immutable snapshot vào medical_records
```

### 12.3 Files

```text
TriageTicketServiceImpl.java
MedicalRecordServiceImpl.java
AppointmentServiceImpl.java
MedicalRecord.java
MedicalRecordResponse.java
MedicalRecordRequest.java
```

### 12.4 Migration Nếu Thiếu Field

```sql
ALTER TABLE medical_records
ADD COLUMN triage_ticket_id BINARY(16) NULL,
ADD COLUMN triage_priority VARCHAR(20) NULL,
ADD COLUMN triage_severity VARCHAR(20) NULL,
ADD COLUMN ai_summary_snapshot TEXT NULL,
ADD COLUMN triage_review_snapshot TEXT NULL;
```

### 12.5 Tests

- Doctor confirms triage -> medical record has priority snapshot.
- Completed appointment from ticket -> record contains triage priority.
- No ticket -> medical record vẫn tạo bình thường.
- Không overwrite doctor note.

## 13. Phase 9: AI Doctor Recommendation Function

### 13.1 Timing

Chạy ngay sau triage `persisted READY`.

### 13.2 Backend Design

Tạo:

```text
DoctorRecommendationService
DoctorRecommendationTool
DoctorRecommendationCriteria
DoctorRecommendationResult
```

Criteria:

```text
specialtyCode
departmentId
urgency
patientLocation
preferredDate
genderPreference optional
language optional
insurance optional
```

### 13.3 Recommendation Logic Phase 1

Deterministic ranking:

1. Filter doctor by department/specialty.
2. Filter active schedule.
3. Filter available slots.
4. Rank by:
   - specialty match;
   - earliest available slot;
   - rating if exists;
   - workload balance;
   - distance from user location if available.

### 13.4 LangChain4j Tool

Nếu version LangChain4j support ổn định:

```java
@Tool("Recommend doctors for a triage result based on specialty, location and availability")
DoctorRecommendationResult recommendDoctors(DoctorRecommendationCriteria criteria)
```

Nếu tool calling chưa ổn định:

```text
LangChainTriageEngine Phase B -> persisted READY -> DoctorRecommendationService deterministic call
```

### 13.5 Frontend

Booking page nhận `recommendedDoctors` và hiển thị top 3:

- tên bác sĩ;
- chuyên khoa;
- bệnh viện/phòng khám;
- earliest slot;
- khoảng cách nếu có;
- nút chọn bác sĩ.

### 13.6 Tests

- Specialty match returns doctors.
- No available doctor returns empty + safe message.
- Urgent priority ranks earliest slot first.
- AI không được trả nonexistent `doctorId`.
- Recommendation chạy sau `persisted READY`.

##- [x] **Phase 10: External Doctor Crawler + Email Booking**
- [x] **Phase 11: Capability 6 Report & Rollout Verification**
- [x] **Phase 12: Capability 7 Quality Gate & Final Release**

## 14.1 Data Model

Tạo entity:

```text
ExternalDoctor
ExternalDoctorSource
ExternalDoctorImportJob
ExternalDoctorBookingToken
```

`ExternalDoctor` fields:

```text
id
fullName
specialty
clinicName
hospitalName
email
phone
address
latitude
longitude
sourceUrl
sourceName
sourceFetchedAt
verificationStatus: UNVERIFIED | VERIFIED | REJECTED
active
```

## 14.2 Source Selection By User Location

Yêu cầu:

1. User location lấy từ profile hoặc request booking.
2. System chọn hospital websites theo allowlist gần vị trí user.
3. Không crawl Google search tự do trong runtime.
4. Không crawl trong chat request.

`ExternalDoctorSource` fields:

```text
id
hospitalName
baseUrl
allowedDomain
city
district
latitude
longitude
active
lastCrawledAt
```

## 14.3 Import Workflow

```text
Admin creates/imports source
-> Import job crawls allowed hospital site
-> Parse doctor cards/pages
-> Store preview rows as UNVERIFIED
-> Admin reviews/approves
-> Approved doctors become recommendable/bookable
```

Tech:

- Java Jsoup cho HTML static.
- Playwright chỉ dùng offline job nếu website render JS phức tạp.
- Tôn trọng allowlist domain.
- Không scrape dữ liệu nhạy cảm.

## 14.4 External Doctor Booking Without Account

Flow:

```text
Patient chooses external doctor
-> create appointment with doctor_id = null and external_doctor_id != null
-> create one-time booking token
-> send Gmail SMTP email
-> doctor opens token link
-> accept/reject/propose new time
```

Endpoints đề xuất:

```http
POST /api/v1/external-doctor-sources
POST /api/v1/external-doctor-import-jobs
GET /api/v1/external-doctor-import-jobs/{id}/preview
POST /api/v1/external-doctors/{id}/approve

POST /api/v1/appointments/external
GET /api/v1/external-bookings/{token}
POST /api/v1/external-bookings/{token}/accept
POST /api/v1/external-bookings/{token}/reject
POST /api/v1/external-bookings/{token}/propose-time
```

## 14.5 Gmail SMTP

Config:

```yaml
spring:
  mail:
    host: smtp.gmail.com
    port: 587
    username: ${GMAIL_SMTP_USERNAME:}
    password: ${GMAIL_SMTP_APP_PASSWORD:}
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true
```

Environment:

```text
GMAIL_SMTP_USERNAME
GMAIL_SMTP_APP_PASSWORD
MAIL_FROM
APP_PUBLIC_URL
```

Không dùng password Gmail thường. Dùng Gmail App Password.

## 14.6 Tests

- Import preview không active doctor.
- Approved external doctor can be recommended.
- User location chọn đúng source gần nhất.
- External appointment sends email.
- Token accept confirms appointment.
- Token reject marks rejected.
- Expired token rejected.
- Token one-time use.
- External doctor không cần user account.

## 15. Phase 11: Capability 6 Report

Tạo:

```text
docs/ai-capabilities/reports/06-cutover-remove-python-report.md
```

Nội dung bắt buộc:

- `STATUS: READY` hoặc `STATUS: BLOCKED`.
- Python dependency search before.
- Python dependency search after.
- Files removed.
- Config removed.
- Docker/CI removed.
- Rollback strategy.
- Test evidence.
- Residual risks.

Không được claim READY nếu runtime search vẫn còn Python dependency.

## 16. Phase 12: Capability 7 Quality Gate

Tạo:

```text
docs/ai-capabilities/reports/07-quality-rollout-report.md
```

### 16.1 Commands

```powershell
cd D:\CareTriage\code\backend\backend
mvn test
mvn -q -DskipTests compile

cd "D:\CareTriage\code\front end\frontend"
npm run lint
npm run build
npm run test
```

Sau khi Python bị xóa, không chạy Python tests nữa.

### 16.2 Static Checks

```powershell
rg -n "ai-service|FastAPI|uvicorn|code/backend/ai-service|app\.ai-service|AI_SERVICE_URL|AiClientService" D:\CareTriage
rg -n "raw response|raw prompt|prompt =|user message|PHI|e\.getMessage\(\)" code/backend/backend/src/main/java
rg -n "training AI|train AI|fine-tune|finetune" docs code
```

Expected:

- Không còn runtime Python code/config.
- Không còn “training AI” sai nghĩa.
- Không log raw prompt/model/user/PHI.

## 17. Final Deliverable Format

Agent phải trả cuối task theo format:

```text
Capability 6: READY/BLOCKED
Capability 7: READY/BLOCKED

Files changed:
- ...

Tests run:
- command: ...
  result: ...

Static searches:
- query: ...
  result: ...

Remaining risks:
- ...

Questions:
- ...
```

## 18. Prompt Cho Agent

```text
Bạn đang làm việc trong repo D:\CareTriage.

Đọc trước:
- docs/ai-capabilities/capability-6-7-master-plan.md
- docs/ai-capabilities/README.md
- docs/ai-capabilities/reports/01-chat-session-lifecycle-report.md
- docs/ai-capabilities/reports/02-langchain4j-foundation-report.md
- docs/ai-capabilities/reports/03-java-triage-pipeline-report.md
- docs/ai-capabilities/reports/04-medical-rag-implementation-report.md
- docs/ai-capabilities/reports/05-document-intelligence-report.md

Mục tiêu:
Hoàn thành Capability 6 và Capability 7 theo đúng file master plan. Đồng thời xử lý:
- verify rename conversation;
- cutover Java LangChain runtime;
- xóa Python runtime/project;
- chuẩn hóa RAG là Medical RAG, không gọi training AI;
- đưa triage chat AI lên first viewport;
- thêm doctor appointment detail;
- chuẩn hóa table action buttons;
- snapshot triage priority vào medical record;
- AI recommend bác sĩ ngay sau persisted READY;
- external doctor crawler theo website bệnh viện gần vị trí user;
- external doctor nhận booking qua Gmail SMTP mà không cần tài khoản.

Quyết định đã chốt:
1. Doctor crawler lấy từ website bệnh viện cụ thể theo vị trí hiện tại của user.
2. Email thật dùng Gmail SMTP.
3. AI recommend bác sĩ chạy ngay sau triage persisted READY.

Guardrails:
- Không tự ý revert.
- Không format hàng loạt.
- Không log prompt/raw model response/raw user message/PHI.
- Không gọi RAG là training/fine-tuning.
- Không crawl web trong chat request.
- External doctor chỉ active sau admin approve.
- Email token phải expire và one-time use.
- AI không được bịa doctorId.
- Không claim READY nếu chưa có command evidence.

Làm tuần tự các phase trong docs/ai-capabilities/capability-6-7-master-plan.md.
Nếu phase nào BLOCKED, dừng và ghi rõ blocker, không chạy tiếp phase sau.

Verification bắt buộc:
cd D:\CareTriage\code\backend\backend
mvn test
mvn -q -DskipTests compile

cd "D:\CareTriage\code\front end\frontend"
npm run lint
npm run build
npm run test

Static checks bắt buộc:
rg -n "ai-service|FastAPI|uvicorn|code/backend/ai-service|app\.ai-service|AI_SERVICE_URL|AiClientService" D:\CareTriage
rg -n "training AI|train AI|fine-tune|finetune" docs code
rg -n "raw response|raw prompt|prompt =|user message|PHI|e\.getMessage\(\)" code/backend/backend/src/main/java

Reports bắt buộc:
- docs/ai-capabilities/reports/06-cutover-remove-python-report.md
- docs/ai-capabilities/reports/07-quality-rollout-report.md
```

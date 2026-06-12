# Remaining AI Capability Blockers Master Plan

Tài liệu này dùng để giao việc cho AI agent tiếp theo sửa toàn bộ blocker còn lại trong roadmap chuyển AI runtime từ Python sang Java/LangChain4j.

Ngôn ngữ tài liệu: tiếng Việt. Code comment và tên biến khi triển khai: tiếng Anh.

## 1. Bối cảnh hiện tại

Repository:

```text
D:\CareTriage
```

Tài liệu chính:

- `implementation_plan.md`
- `docs/ai-capabilities/README.md`
- `docs/ai-capabilities/00-baseline-and-target.md`
- `docs/ai-capabilities/01-chat-session-lifecycle.md`
- `docs/ai-capabilities/02-langchain4j-foundation.md`
- `docs/ai-capabilities/03-java-triage-pipeline.md`
- `docs/ai-capabilities/04-medical-rag.md`
- `docs/ai-capabilities/05-document-intelligence.md`
- `docs/ai-capabilities/06-cutover-remove-python.md`
- `docs/ai-capabilities/07-quality-rollout.md`
- `docs/ai-capabilities/reports/00-baseline-report.md`
- `docs/ai-capabilities/reports/01-chat-session-lifecycle-report.md`
- `docs/ai-capabilities/reports/04-medical-rag-design.md`
- `docs/ai-capabilities/reports/06-cutover-remove-python-design.md`

Roadmap mục tiêu:

1. Baseline kiến trúc.
2. Tạo `ChatSession` từ tin nhắn đầu tiên và đổi tên.
3. Nền tảng LangChain4j.
4. Chuyển triage pipeline sang Java.
5. Medical RAG.
6. EHR/document intelligence.
7. Cutover và xóa Python.
8. Quality gate, rollout và rollback.

## 2. Trạng thái sau các lần sửa gần nhất

Đã sửa một số blocker nền:

- Widget chat không còn bị dead-end khi chưa có `sessionId`.
- `use-chat.js` đã load history đúng shape từ `chatApi.getHistory()`.
- `ChatTurnRepository.updateTicketRetryConditional()` không còn dùng `TIMESTAMPADD` trong JPQL.
- `LangChainTriageEngine` không log raw AI response nữa.
- Backend compile đã pass.
- Frontend typecheck/build đã pass.
- Backend targeted tests đã pass: `Tests run: 10, Failures: 0, Errors: 0, Skipped: 0`.

Các lệnh đã pass trong lần sửa gần nhất:

```powershell
mvn -q -DskipTests compile -f "D:\CareTriage\code\backend\backend\pom.xml"

cd "D:\CareTriage\code\front end\frontend"
npx tsc --noEmit
npx vite build

mvn test -f "D:\CareTriage\code\backend\backend\pom.xml" "-Dtest=ChatSessionControllerIntegrationTest,ChatIdempotencyIntegrationTest,LangChainTriageEngineTest"
```

Lưu ý trạng thái git: worktree đang có nhiều thay đổi lớn từ trước. Không được tự ý revert hoặc xóa các thay đổi hiện có.

## 3. Nguyên tắc bắt buộc cho mọi agent

Agent phải tuân thủ:

- Không tự ý revert thay đổi đang có trong worktree.
- Không format hàng loạt.
- Không xóa file ngoài phạm vi task.
- Không thêm dependency nếu chưa có lý do và chưa có bước kiểm chứng.
- Không xóa Python trước Capability 6.
- Không triển khai nhiều capability cùng lúc trên cùng command path.
- Không gọi RAG là training. RAG là retrieval/indexing/citation/grounding, không fine-tuning.
- Không log prompt, raw user message, raw model response, history, PHI hoặc nội dung file bệnh án.
- Nếu command fail, ghi nguyên nhân thật và phân biệt lỗi code với lỗi môi trường.
- Không tuyên bố READY/PASSED khi chưa có test/build evidence.
- Với mỗi capability, phải có report riêng trong `docs/ai-capabilities/reports/`.

## 4. Trạng thái capability hiện tại

```text
Capability 0: PASSED theo report baseline mới.
Capability 1: PARTIAL, cần hardening + tests trước khi coi READY.
Capability 2: SKELETON/BLOCKED, LangChain4j foundation chưa có runtime selector/cutover thật.
Capability 3: BLOCKED, Java triage pipeline chưa parity với Python.
Capability 4.1: DESIGN ONLY, Medical RAG mới là design, chưa implementation READY.
Capability 5: BLOCKED, EHR/document intelligence chưa port sang Java.
Capability 6: BLOCKED, tuyệt đối chưa xóa Python.
Capability 7: PARTIAL, quality/security/rollout gates chưa hoàn chỉnh.
```

## 5. Phase A — Hoàn thiện Capability 1: Lazy ChatSession + Rename

### 5.1 Mục tiêu

Đưa Capability 1 thành READY thật:

- Không tạo `ChatSession` khi chỉ mở trang.
- Tin nhắn đầu tiên tạo session, turn và USER message đúng một lần.
- Retry cùng `turnId` không tạo duplicate session/turn/message.
- Endpoint cũ vẫn hoạt động.
- Rename conversation hoạt động và thống nhất contract.
- SSE event ordering đúng.

### 5.2 Files chính

Backend:

- `code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java`
- `code/backend/backend/src/main/java/com/caretriage/application/service/ChatService.java`
- `code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java`
- `code/backend/backend/src/main/java/com/caretriage/domain/repository/ChatTurnRepository.java`
- `code/backend/backend/src/main/java/com/caretriage/domain/repository/ChatMessageRepository.java`
- `code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatTurnFinalizer.java`
- `code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatTurnReconciliationService.java`

Frontend:

- `code/front end/frontend/src/services/chat-service.ts`
- `code/front end/frontend/src/features/triage/hooks/use-triage-session.ts`
- `code/front end/frontend/src/hooks/use-chat.js`
- `code/front end/frontend/src/components/chat/chat-widget.tsx`
- `code/front end/frontend/src/components/chat/chat-window.tsx`
- `code/front end/frontend/src/components/chat/chat-history-list.tsx`
- `code/front end/frontend/src/features/triage/components/agent-conversation-panel.tsx`

### 5.3 Backend tasks

1. Validate controller input:
   - `content` không blank.
   - `turnId` không blank.
   - `turnId` là UUID hoặc có format hợp lệ.
   - `sessionType` null thì default `TRIAGE`.

2. Giảm duplicate logic trong `ChatSessionController`:
   - Hai endpoint stream hiện có nhiều nhánh giống nhau.
   - Nên tách private helper xử lý:
     - `RUNNING_CONFLICT`
     - `TICKET_FINALIZING`
     - `STALE_PENDING`
     - `COMPLETED_REPLAY`
     - normal stream

3. Kiểm tra lại idempotency:
   - Lazy endpoint không có `sessionId`; phải dùng `userId + turnId`.
   - Không dùng `findByTurnId(turnId)` toàn cục.
   - DB unique `user_id + turn_id` phải là source of truth.

4. Retry cùng `userId + turnId` phải xử lý đúng:
   - `STARTED/STREAMING` -> `409 TURN_IN_PROGRESS`.
   - `COMPLETED + ticket_status != PENDING` -> replay `persisted`.
   - `COMPLETED + PENDING stale` -> reconcile rồi replay.
   - `COMPLETED + PENDING non-stale` -> `202 TURN_FINALIZING`.
   - `FAILED` -> retry conditional.
   - Không tạo session thứ hai.
   - Không tạo USER message thứ hai.

5. USER message luôn phải có `turnId`.

6. `streamAiResponse()` phải dùng history loại current turn:
   - Có thể dùng helper `ChatMessageRepository.findHistoryExcludingTurn(...)` thay vì filter inline.

7. Đảm bảo live stream path có finalization thật:
   - Khi nhận `final`, persist AI message.
   - Complete `ChatTurn`.
   - Nếu cần ticket, gọi reconciliation/upsert.
   - Phát `persisted` event.

Điểm cần audit kỹ: targeted tests hiện pass nhưng chưa chứng minh chắc chắn `ChatTurnFinalizer`/`ChatTurnReconciliationService` chạy trên live stream path.

### 5.4 Backend tests bắt buộc

Thêm/sửa tests:

- `ChatIdempotencyIntegrationTest.java`
- `ChatSessionControllerIntegrationTest.java`
- Có thể thêm `ChatServiceImplTurnLifecycleTest.java`

Test cases:

1. Lazy first message creates exactly 1 session, 1 turn, 1 USER message.
2. Retry same `userId + turnId` does not create duplicate session.
3. Retry same `userId + turnId` does not create duplicate USER message.
4. Concurrent lazy requests with same `turnId` create one logical turn only.
5. Existing-session endpoint still works.
6. Completed turn replay returns `persisted`.
7. Running turn returns `409 TURN_IN_PROGRESS`.
8. Bad request for blank `content`, blank `turnId`, invalid `turnId`.
9. `final.reply == concat(tokens)` remains enforced where Java validates final.

### 5.5 Frontend tasks

1. Triage page:
   - Mount không gọi `getOrCreateSession()`.
   - First message với `sessionId === null` gọi lazy endpoint.
   - Nhận `session` event thì set `sessionId`.

2. Widget:
   - Confirm đã không dead-end.
   - First message khi không có session phải gọi `/api/v1/chat/messages/stream`.
   - Subsequent message sau khi có session dùng `/sessions/{sessionId}/messages/stream`.

3. Retry:
   - Retry failed message phải reuse cùng `turnId`, không generate `turnId` mới nếu đang retry cùng message.

4. Khi chọn session cũ:
   - Reset `ticketStatus`.
   - Reset `progressState`.
   - Reset `lastTurnId`.
   - Reset temporary streaming state.
   - Tránh leak banner từ session trước.

5. Rename contract:
   - Chọn một chuẩn duy nhất.
   - Khuyến nghị dùng 200 ký tự vì backend/entity đang theo 200.
   - Sửa frontend validation từ 100 lên 200 hoặc sửa backend xuống 100.
   - Đồng bộ report/spec.

### 5.6 Frontend tests cần thêm

Nếu test infra có Vitest/RTL:

1. `chat-service.ts`:
   - `streamMessage(null, ...)` gọi `/api/v1/chat/messages/stream`.
   - `streamMessage(id, ...)` gọi `/sessions/{id}/messages/stream`.
   - SSE parser nhận event `session`.

2. `use-chat.js`:
   - `getHistory()` trả array và hook render đúng messages.
   - First send with `sessionId === null` handles `session` event.

3. `use-triage-session.ts`:
   - Mount không gọi create session.
   - First message set sessionId từ event `session`.
   - `persisted READY` điều hướng booking vẫn hoạt động.

4. Rename UI:
   - Optimistic update.
   - Rollback on API failure.
   - Max length đúng contract.

### 5.7 Capability 1 verification

```powershell
cd D:\CareTriage\code\backend\backend
mvn test
mvn -q -DskipTests compile

cd "D:\CareTriage\code\front end\frontend"
npx tsc --noEmit
npx vite build
npm test
```

Sau đó cập nhật:

- `docs/ai-capabilities/reports/01-chat-session-lifecycle-report.md`

Chỉ ghi `CAPABILITY 1 READY` khi toàn bộ tests/manual evidence đạt.

## 6. Phase B — Hoàn thiện Capability 2: LangChain4j Foundation

### 6.1 Mục tiêu

Có nền LangChain4j thật, có runtime selector, có fallback/rollback, nhưng chưa bắt buộc thay Python triage live path nếu chưa parity.

### 6.2 Runtime selector thật

Files:

- `code/backend/backend/src/main/resources/application.yml`
- `code/backend/backend/src/main/java/com/caretriage/application/ai/**`
- `code/backend/backend/src/main/java/com/caretriage/application/service/AiClientService.java`
- `code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java`

Thiết kế runtime modes:

```yaml
app:
  ai:
    runtime: python | java-shadow | java
```

Ý nghĩa:

- `python`: live path gọi Python như hiện tại.
- `java-shadow`: Python vẫn trả response live; Java chạy song song để đo parity, không ảnh hưởng user.
- `java`: live path dùng Java AI runtime.

Cần có router rõ ràng, ví dụ:

```text
ChatServiceImpl
  -> TriageAiRuntimeRouter
       -> PythonAiClient
       -> JavaLangChainTriageEngine
```

Không để config tồn tại mà không được đọc.

### 6.3 LangChain4j config hardening

1. Không hardcode model secrets.
2. Không fallback secret production nguy hiểm.
3. Timeout config rõ:
   - connect;
   - read/stream;
   - model timeout;
   - cancellation.
4. Không log prompt/PHI/raw response.
5. Provider abstraction:
   - Gemini hiện tại;
   - mở rộng Claude/OpenAI sau nếu cần.

### 6.4 Tests Capability 2

Bắt buộc:

1. Config binding.
2. App context starts with fake provider.
3. Runtime selector modes:
   - `python`;
   - `java-shadow`;
   - `java`.
4. Secret không xuất hiện trong logs.
5. Timeout/error mapping.
6. Streaming cancellation nếu support.
7. Structured output validation.

### 6.5 Capability 2 report

Tạo:

- `docs/ai-capabilities/reports/02-langchain4j-foundation-report.md`

Chỉ ghi READY nếu runtime selector + tests đạt.

## 7. Phase C — Hoàn thiện Capability 3: Java Triage Pipeline Parity

### 7.1 Mục tiêu

Java có thể thay Python cho triage stream với contract tương đương.

### 7.2 Port deterministic red-flag policy

Nguồn Python:

- `code/backend/ai-service/app/domain/policies/red_flag_policy.py`
- `code/backend/ai-service/tests/test_red_flag_policy.py`

Java target:

- `code/backend/backend/src/main/java/com/caretriage/application/ai/service/RedFlagDetector.java`
- Java tests tương ứng.

Requirements:

- Không gọi LLM khi red flag deterministic hit.
- Red flag final event đúng contract.
- Frontend nhận `red_flag_detected = true`.

### 7.3 Java Phase A streaming

Java phải phát:

```text
event: token
data: {
  "turn_id": "...",
  "sequence": 1,
  "content": "..."
}
```

Rules:

- `sequence` bắt đầu từ 1.
- Không skip.
- `content` không null.
- Stream error map thành event `error`.

### 7.4 Java Phase B classification

Sau Phase A:

- Gọi structured output.
- Không regenerate reply.
- Classification chỉ quyết định:
  - `intake_complete`;
  - `triage_result`;
  - `missing_information`;
  - `classification_status`.

Final OK:

```json
{
  "event": "final",
  "contract_version": "1",
  "turn_id": "...",
  "reply": "exact concat tokens",
  "classification_status": "OK",
  "intake_complete": true,
  "triage_result": {},
  "missing_information": [],
  "red_flag_detected": false
}
```

Final DEGRADED:

```json
{
  "event": "final",
  "contract_version": "1",
  "turn_id": "...",
  "reply": "exact concat tokens",
  "classification_status": "DEGRADED",
  "classification_error_code": "...",
  "intake_complete": false,
  "triage_result": null,
  "missing_information": [],
  "red_flag_detected": false
}
```

### 7.5 Java fallback/degraded path

Cần map lỗi:

```text
LLM_PHASE_A_FAILED
LLM_EMPTY_RESPONSE
CLASSIFICATION_FAILED
STREAM_TIMEOUT
INTERNAL_STREAM_ERROR
```

Không được mất chat reply nếu chỉ Phase B fail.

### 7.6 Persisted/ticket behavior

Java pipeline phải dùng:

- `ChatTurnFinalizer`
- `TicketUpsertService`
- `ChatTurnReconciliationService`

Invariant:

```text
final -> persist AI message -> complete turn -> ticket if needed -> persisted event
```

### 7.7 Shadow mode parity

Trước khi bật `runtime=java`, chạy `java-shadow`:

- Python trả response live.
- Java chạy song song, log metrics không PHI:
  - final contract valid;
  - red flag match;
  - classification status match;
  - suggested department match;
  - latency.
- Không log prompt/raw reply.

### 7.8 Tests Capability 3

1. Shared SSE fixtures:
   - token;
   - heartbeat;
   - final OK;
   - final DEGRADED;
   - error;
   - persisted.
2. Red flag parity tests.
3. Phase A token sequence.
4. `final.reply == concat(tokens)`.
5. Phase B OK/degraded classification.
6. Ticket statuses:
   - READY;
   - NOT_NEEDED;
   - FAILED_RETRYABLE;
   - FAILED_PERMANENT.
7. Replay completed turn returns persisted.
8. Runtime selector:
   - python;
   - java-shadow;
   - java.

### 7.9 Capability 3 report

Tạo:

- `docs/ai-capabilities/reports/03-java-triage-pipeline-report.md`

Chỉ khi `java-shadow` evidence đủ tốt mới cho phép bật `runtime=java`.

## 8. Phase D — Capability 4: Medical RAG Implementation

### 8.1 Lưu ý thuật ngữ

Không gọi RAG là training.

Tên đúng:

```text
Medical RAG / Clinical Knowledge Retrieval
```

RAG gồm:

```text
indexing + retrieval + citation + grounding
```

Không fine-tune model.

### 8.2 RAG ADR final

Files:

- `docs/ai-capabilities/reports/04-medical-rag-design.md`
- nên thêm `docs/ai-capabilities/adrs/ADR-003-rag-store.md`

Chốt vector store:

- pgvector;
- Chroma;
- local index;
- external vector DB.

Không chọn vector store theo cảm tính. Phải ghi trade-off và rollback.

### 8.3 Java RAG interfaces

Tạo abstraction:

```java
MedicalCorpusIngestionService
MedicalDocumentChunker
EmbeddingService
VectorStorePort
MedicalRetrievalService
CitationValidator
RagContextBuilder
```

Không để controller gọi thẳng vector DB.

### 8.4 Corpus metadata

Mỗi chunk cần:

```text
source_id
source_title
source_url or document_id
corpus_version
chunk_id
section
published_at if available
medical_specialty
language
```

Không lưu PHI trong vector metadata.

### 8.5 Retrieval contract

RAG context đưa vào prompt phải có:

```text
context snippets
citations
source metadata
confidence/relevance score
corpus_version
```

Nếu retrieval fail:

```text
RAG_DEGRADED
```

Nhưng chat reply vẫn tiếp tục an toàn.

### 8.6 RAG safety

Bắt buộc:

- prompt injection stripping;
- untrusted context wrapper;
- citation validation;
- no PHI logging;
- no training language.

### 8.7 RAG tests

1. Chunking deterministic.
2. Ingestion idempotent by `source_id + corpus_version`.
3. Retrieval returns citations.
4. Prompt injection in retrieved content is neutralized.
5. RAG unavailable -> degraded safe.
6. Citation invalid -> dropped or degraded.
7. No PHI in metadata/logs.

### 8.8 Capability 4 report

Tạo:

- `docs/ai-capabilities/reports/04-medical-rag-implementation-report.md`

Không dùng design report để claim implementation READY.

## 9. Phase E — Capability 5: EHR / Document Intelligence Java Port

### 9.1 Mục tiêu

Thay Python EHR endpoints bằng Java implementation.

### 9.2 Inventory Python EHR behavior

Baseline từ:

- `code/backend/ai-service/app/api/ehr_routes.py`
- `code/backend/ai-service/app/application/usecases/ehr_extraction_use_case.py`
- `code/backend/ai-service/tests/test_ehr.py`
- `code/backend/ai-service/tests/test_api_contract.py`

### 9.3 Java implementation

Java cần support:

- text extraction;
- PDF;
- DOCX;
- TXT;
- entity extraction;
- malformed entity recovery;
- exception masking;
- size/extension validation.

Likely files:

- `code/backend/backend/src/main/java/com/caretriage/application/service/impl/EHRServiceImpl.java`
- `code/backend/backend/src/main/java/com/caretriage/presentation/controller/EHRController.java`
- Java AI structured extraction service mới.

### 9.4 Tests

Port Python test cases sang Java:

- empty text;
- valid text;
- invalid extension;
- PDF success;
- empty file;
- oversized file;
- provider failure masked;
- malformed entity recovery.

### 9.5 Capability 5 report

Tạo:

- `docs/ai-capabilities/reports/05-document-intelligence-report.md`

## 10. Phase F — Capability 6: Cutover và xóa Python

Chỉ chạy khi:

```text
Capability 1 READY
Capability 2 READY
Capability 3 READY
Capability 4 READY
Capability 5 READY
```

### 10.1 Static dependency search

Chạy:

```powershell
rg -n "ai-service|AiClientService|/api/triage|/api/ehr|FastAPI|uvicorn|python|CHROMA|TAVILY|GEMINI" D:\CareTriage
```

### 10.2 Removal checklist

Xóa hoặc thay:

- Java `AiClientService` nếu chỉ còn dùng Python.
- `app.ai-service.*`.
- Docker Compose `ai-service`.
- CI Python workflows.
- Python project folder.
- Python env docs.
- Old tests/fixtures nếu đã port.

### 10.3 Rollback

Trước khi xóa:

- tag/branch cutover point;
- report dependency map;
- có feature flag quay về Python nếu chưa xóa;
- chỉ xóa Python khi rollback sang Python không còn là yêu cầu.

## 11. Phase G — Capability 7: Quality Gate, Rollout, Rollback

### 11.1 Required gates

Mỗi capability phải pass:

```powershell
# Python until removed
cd D:\CareTriage\code\backend\ai-service
.\venv\Scripts\python.exe -m pytest

# Java
cd D:\CareTriage\code\backend\backend
mvn test
mvn -q -DskipTests compile

# Frontend
cd "D:\CareTriage\code\front end\frontend"
npx tsc --noEmit
npx vite build
npm test
```

### 11.2 Security/privacy gates

Static checks:

- Không log prompt.
- Không log raw user message.
- Không log raw model response.
- Không log PHI.
- Không hardcode fallback production secrets.

### 11.3 Contract gates

- SSE fixtures shared.
- DTO contract tests.
- Replay/idempotency tests.
- RAG citation tests.
- EHR parity tests.

### 11.4 Required reports

Mỗi capability cần report riêng:

```text
00-baseline-report.md
01-chat-session-lifecycle-report.md
02-langchain4j-foundation-report.md
03-java-triage-pipeline-report.md
04-medical-rag-implementation-report.md
05-document-intelligence-report.md
06-cutover-remove-python-report.md
07-quality-rollout-report.md
```

## 12. Thứ tự triển khai khuyến nghị

### Sprint 1 — Capability 1 READY thật

1. Harden backend input/lifecycle.
2. Add idempotency/replay integration tests.
3. Fix frontend state leak/rename contract.
4. Add frontend tests.
5. Update `01-chat-session-lifecycle-report.md`.

Exit: Capability 1 READY.

### Sprint 2 — Capability 2 foundation thật

1. Runtime selector.
2. LangChain4j config hardening.
3. Fake provider tests.
4. No PHI logging tests.
5. Report Capability 2.

Exit: Capability 2 READY.

### Sprint 3 — Capability 3 Java triage parity

1. Port red flag.
2. Java Phase A streaming.
3. Java Phase B classification.
4. Final/persisted contract.
5. Shadow mode.
6. Parity tests.
7. Report Capability 3.

Exit: Java triage can run in shadow safely.

### Sprint 4 — Capability 4 Medical RAG

1. ADR store.
2. Interfaces.
3. MVP ingestion/retrieval.
4. Citation/safety.
5. Evaluation dataset.
6. Report Capability 4.

Exit: Java RAG ready for controlled use.

### Sprint 5 — Capability 5 EHR Java

1. Port EHR extraction.
2. File parsing.
3. Structured entity output.
4. Parity tests.
5. Report Capability 5.

Exit: Java replaces Python EHR.

### Sprint 6 — Capability 6 Cutover

1. Static dependency cleanup.
2. Docker/CI cleanup.
3. Remove Python.
4. Full regression.
5. Report cutover.

Exit: Python removed safely.


# Hướng Dẫn Phỏng Vấn Dự Án CareTriage

> Tài liệu này mô tả **code hiện tại trong repository**, không chỉ mô tả kiến trúc
> mong muốn. Mục tiêu là giúp bạn giải thích dự án rõ ràng, trung thực và đủ sâu
> khi phỏng vấn Backend.

## 1. Cách Giới Thiệu Dự Án Trong 60 Giây

CareTriage là hệ thống hỗ trợ sàng lọc y tế và quản lý hồ sơ sức khỏe. Hệ thống
được chia thành ba phần:

1. **React frontend** cung cấp giao diện chat triage, hồ sơ bệnh án, đặt lịch và
   màn hình bác sĩ.
2. **Java Spring Boot backend** quản lý authentication, session, message,
   transaction, ticket, lịch hẹn và dữ liệu nghiệp vụ.
3. **Python FastAPI AI service** chịu trách nhiệm xử lý AI: streaming câu trả
   lời, phát hiện dấu hiệu nguy hiểm, phân loại triage, trích xuất thực thể y
   khoa từ PDF/Word và chuẩn bị nền tảng RAG.

Luồng AI chính sử dụng một HTTP request dạng streaming:

```text
React
  -> POST SSE tới Spring Boot
  -> Spring Boot tạo turn và lưu USER message
  -> Spring WebClient gọi FastAPI
  -> FastAPI stream token từ Gemini
  -> Spring kiểm tra contract, lưu AI message, tạo triage ticket
  -> Spring phát event persisted
  -> React tiếp tục chat hoặc chuyển sang đặt lịch
```

Điểm quan trọng nhất là phân tách trách nhiệm:

- Python đưa ra kết quả AI lâm sàng.
- Java không tự suy luận y khoa; Java kiểm soát dữ liệu và transaction.
- Frontend không chuyển sang booking chỉ dựa vào câu trả lời AI; frontend chờ
  Java xác nhận ticket đã được lưu.

## 2. Cách Mô Tả Đúng Trên CV

Nên sử dụng cách diễn đạt:

> Thiết kế data pipeline giữa Spring Boot core service và Python FastAPI AI
> service qua REST/SSE. Spring Boot quản lý transaction, idempotency và
> persistence; FastAPI quản lý streaming LLM, triage classification và EHR
> extraction.

Không nên nói:

> Toàn bộ trợ lý ảo chạy bằng WebSocket.

Code hiện tại dùng:

- **SSE qua fetch + ReadableStream** cho luồng chat AI chính.
- **WebSocket/STOMP/SockJS** cho subscription, notification và system message.

Đây là quyết định phù hợp vì mỗi turn chat là request một chiều kéo dài từ
server về client. Client gửi một message, sau đó server liên tục trả token.
WebSocket vẫn hữu ích cho notification hai chiều hoặc broadcast, nhưng không
cần thiết cho command AI chính.

## 3. Kiến Trúc Tổng Thể

```text
┌─────────────────────────────────────────────────────────────────┐
│ React/Vite                                                     │
│ - Triage UI                                                    │
│ - fetch + ReadableStream SSE                                   │
│ - STOMP subscription                                           │
│ - Zustand auth state                                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ JWT
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│ Spring Boot 3 / Java 17                                        │
│ Presentation -> Application -> Domain -> Infrastructure        │
│ - Auth, authorization                                          │
│ - Chat turn state machine                                      │
│ - MySQL transaction                                            │
│ - Ticket/appointment/EHR persistence                            │
│ - WebClient proxy tới Python                                   │
└───────────────┬──────────────────────────────┬──────────────────┘
                │ REST/SSE + internal API key  │ JPA/Flyway
                ▼                              ▼
┌───────────────────────────────┐  ┌──────────────────────────────┐
│ FastAPI / Python              │  │ MySQL                       │
│ - Gemini provider             │  │ - users                     │
│ - Red flag policy             │  │ - chat_sessions/messages    │
│ - Two-phase triage            │  │ - chat_turns                │
│ - EHR extraction              │  │ - triage_tickets            │
│ - RAG foundation              │  │ - appointments/EHR tables   │
└───────────────┬───────────────┘  └──────────────────────────────┘
                │
                ▼
       Gemini / Chroma / PubMed
```

### Vì sao tách Java và Python?

Java phù hợp với:

- Transaction và tính nhất quán dữ liệu.
- Spring Security, JPA, Flyway.
- State machine của chat turn.
- Retry, idempotency và ticket reconciliation.
- Nghiệp vụ bệnh viện.

Python phù hợp với:

- SDK AI và xử lý streaming.
- Prompt engineering.
- Pydantic structured output.
- PDF/Word parsing.
- NLP, RAG, embedding và evaluation.

Nếu gộp AI vào Java, đội phát triển sẽ khó tận dụng hệ sinh thái Python. Nếu để
Python tự ghi database nghiệp vụ, transaction boundary sẽ bị phân tán và dễ tạo
ticket/message trùng.

## 4. Luồng Triage Chi Tiết

### 4.1 Khởi tạo session

1. `useTriageSession()` được mount.
2. Frontend gọi `GET /api/v1/chat/sessions/active`.
3. Nếu chưa có session TRIAGE đang hoạt động, frontend gọi
   `POST /api/v1/chat/sessions`.
4. Frontend gọi history và khôi phục messages cùng trạng thái UI.

File chính:

- `frontend/src/features/triage/hooks/use-triage-session.ts`
- `frontend/src/services/chat-service.ts`
- `ChatSessionController.java`
- `ChatServiceImpl.java`

### 4.2 Gửi một message

Frontend:

1. Sinh `turnId = crypto.randomUUID()`.
2. Thêm USER message vào local state.
3. Gọi:

```http
POST /api/v1/chat/sessions/{sessionId}/messages/stream
Accept: text/event-stream
Authorization: Bearer <JWT>

{
  "content": "Tôi bị đau ngực",
  "senderType": "USER",
  "turnId": "<uuid>"
}
```

`turnId` là idempotency key của một lượt hội thoại.

### 4.3 Java inspect hoặc tạo turn

`ChatServiceImpl.inspectOrStartTurn()`:

1. Load session và kiểm tra ownership.
2. Tìm `chat_turns` theo `(session_id, turn_id)`.
3. Turn mới:
   - Tạo `ChatTurn` trạng thái `STARTED`.
   - Lưu USER `ChatMessage` đúng một lần.
4. Turn đang `STARTED/STREAMING`: trả conflict 409.
5. Turn `FAILED`: conditional update về `STARTED`, tăng attempt count và retry
   mà không lưu USER message lần hai.
6. Turn `COMPLETED`:
   - Ticket `PENDING` còn mới: trả 202.
   - Ticket `PENDING` quá 30 giây: reconciliation.
   - Ticket đã terminal: replay `persisted_payload`, không gọi Python.

### 4.4 Chuẩn bị history

`streamAiResponse()`:

1. Conditional update `STARTED -> STREAMING`.
2. Query lịch sử loại current `turnId`.
3. Map sender:
   - USER -> `user`
   - AI/SYSTEM -> `model`
4. Ghép attachment đã extract.
5. Giới hạn số lượng/kích thước trước khi gửi Python.

Mục đích loại current turn khỏi history: current message đã được truyền riêng
trong field `message`; nếu còn trong history thì prompt bị lặp hai lần.

### 4.5 Java gọi Python

`AiClientServiceImpl.streamAnalyzeSymptoms()` dùng WebClient:

```text
POST /api/triage/analyze/stream
X-Internal-Api-Key: ...
Content-Type: application/json
```

Java dùng WebClient riêng cho SSE:

- Connect timeout: 3 giây.
- Transport timeout: 150 giây.
- Pipeline inactivity timeout: 45 giây.
- Whole-turn deadline: 120 giây.

### 4.6 Python xử lý request

`routes.py`:

1. Validate `TriageStreamRequest` bằng Pydantic.
2. Lấy RAG context nếu được bật.
3. Chuyển history/attachment/metadata thành dict.
4. Gọi `TriageUseCase.analyze_stream()`.
5. Trả `StreamingResponse(media_type="text/event-stream")`.

### 4.7 Red flag bypass

Trước khi gọi LLM, Python chạy `RedFlagDetector`.

Nếu phát hiện dấu hiệu nguy hiểm:

- Không gọi Gemini.
- Phát một token cảnh báo.
- Phát final có:
  - `red_flag_detected=true`
  - `intake_complete=true`
  - urgency `EMERGENCY`

Lợi ích:

- Giảm latency.
- Không phụ thuộc model trong tình huống khẩn cấp.
- Kết quả deterministic và dễ test.

### 4.8 Two-phase LLM

Nếu không có red flag:

#### Phase A: Streaming text

`generate_text_stream()`:

- Tạo câu trả lời hội thoại.
- Phát từng chunk:

```text
event: token
data: {"turn_id":"...","sequence":1,"content":"..."}
```

- Python ghép toàn bộ chunk thành `streamed_reply`.
- Nếu exception hoặc reply rỗng: phát `error`, không chạy Phase B.

#### Phase B: Classification

`generate_structured_data()`:

- Nhận conversation và chính `streamed_reply`.
- Schema `ClassifyOutput` không có field `reply`.
- Trả:
  - intake complete hay chưa.
  - red flag metadata.
  - missing information.
  - triage result.

Trong lúc Phase B chậm, Python phát heartbeat mỗi 15 giây để giữ connection.

Nếu Phase B lỗi:

- Vẫn phát `final`.
- `classification_status=DEGRADED`.
- Giữ nguyên reply từ Phase A.
- Không tạo ticket.

Điều kiện quan trọng:

```text
final.reply == nối tất cả token.content theo sequence
```

### 4.9 Java kiểm tra SSE contract

Java xử lý event bằng `concatMap`, nên event được xử lý tuần tự.

Đối với token:

- `turn_id` phải khớp.
- `sequence` phải liên tục.
- `content` không null.
- Java tự ghép streamed reply.

Đối với final:

- Validate required fields.
- `final.reply` phải bằng chuỗi Java đã ghép.
- Không chấp nhận event sau terminal event.

Đối với error:

- Validate `turn_id`.
- Mark turn `FAILED`.
- Không lưu AI message.

### 4.10 Persist AI message và ticket

`ChatTurnFinalizer.persistAiAndCompleteTurn()` chạy `REQUIRES_NEW`:

1. `SELECT FOR UPDATE` ChatTurn.
2. Nếu đã terminal thì return idempotently.
3. Lưu AI ChatMessage với cùng `turnId`.
4. Lưu `final_payload`.
5. Mark turn `COMPLETED`.
6. Xác định:
   - `PENDING` nếu intake hoàn tất và classification OK.
   - `NOT_NEEDED` nếu chưa đủ thông tin hoặc DEGRADED.

Nếu cần ticket, `TicketUpsertService` chạy transaction riêng:

1. Tìm ticket theo session.
2. Update ticket hiện có hoặc insert ticket mới.
3. Unique constraint chống race condition.
4. Nếu insert conflict, reload ticket do request thắng tạo ra.

Sau đó Java ghi `persisted_payload` và phát:

```text
event: persisted
data: {
  "turn_id": "...",
  "ai_message_id": "123",
  "ticket_status": "READY",
  "ticket_id": "...",
  "specialty_code": "CARDIOLOGY",
  "specialty_name": "Tim mạch",
  "red_flag_detected": false
}
```

### 4.11 Frontend nhận event

Trong `use-triage-session.ts`:

- `token`: sort theo sequence và cập nhật bubble hiện tại.
- `final`: hoàn thiện bubble, cập nhật progress và emergency state.
- `persisted READY`: chuyển sang booking.
- `persisted NOT_NEEDED`: tiếp tục chat.
- `FAILED_RETRYABLE`: hiển thị nút retry ticket.
- `error`: hiển thị lỗi và cho retry cùng `turnId`.

Emergency banner được hiển thị ngay từ `final.red_flag_detected`, không chờ
ticket.

## 5. State Machine Cần Thuộc

### Turn state

```text
STARTED
   -> STREAMING
      -> COMPLETED
      -> FAILED

FAILED
   -> STARTED khi retry cùng turnId
```

### Ticket state

```text
null
  -> PENDING
      -> READY
      -> FAILED_RETRYABLE
      -> FAILED_PERMANENT

null
  -> NOT_NEEDED
```

### Vì sao cần hai state machine?

AI message có thể đã lưu thành công nhưng ticket tạo thất bại. Nếu dùng một
status chung, hệ thống không phân biệt được:

- AI cần chạy lại.
- Chỉ ticket cần retry.

Tách hai state machine giúp retry ticket mà không tốn thêm LLM call và không
tạo AI message trùng.

## 6. Idempotency, Race Condition và Transaction

### Idempotency

- Unique `(session_id, turn_id)` trong `chat_turns`.
- Unique `(session_id, turn_id, sender_type)` trong `chat_messages`.
- Unique ticket theo `chat_session_id` bằng Flyway migration.
- Completed turn replay từ persisted payload.

### Conditional update

Ví dụ:

```sql
UPDATE chat_turns
SET status = 'STREAMING'
WHERE id = ? AND status = 'STARTED';
```

Nếu affected rows bằng 0, request khác đã thắng race. Code reload state thay vì
ghi đè.

### Pessimistic lock

`findByIdForUpdate()` được dùng trong finalizer để hai request không cùng lưu AI
message cho một turn.

### REQUIRES_NEW

AI message và ticket nằm ở transaction riêng:

- Ticket lỗi không rollback AI reply đã commit.
- Hệ thống có thể retry riêng ticket.
- Transaction không bị giữ xuyên suốt lúc gọi LLM.

### Reconciliation

Nếu app crash sau khi lưu AI message nhưng trước khi hoàn thiện ticket:

1. Turn ở `COMPLETED + PENDING`.
2. Reconnect kiểm tra timestamp bằng database clock.
3. Nếu stale hơn 30 giây, chạy `ChatTurnReconciliationService`.
4. Service đọc `final_payload`, upsert ticket và xây lại persisted payload.

## 7. Luồng EHR Extraction

### Từ text

```text
Doctor UI
 -> POST /api/ehr/extract
 -> EHRController
 -> EHRServiceImpl tạo ClinicalNote PENDING
 -> POST /api/ehr/extract-text tới FastAPI
 -> EhrExtractionUseCase gọi Gemini structured output
 -> Python trả entities JSON
 -> Java validate/map/save
 -> ClinicalNote COMPLETED
```

### Từ file PDF/Word

```text
Multipart upload
 -> Java kiểm tra loại và kích thước file
 -> Java chuyển multipart sang Python
 -> Python đọc PDF bằng pdfplumber, fallback PyPDF2
 -> DOCX bằng python-docx
 -> Gemini trích xuất entity
 -> Java lưu entity và các bảng có cấu trúc
```

Các entity:

- MEDICATION
- SYMPTOM
- CONDITION
- DOSAGE
- LAB_TEST
- PROCEDURE

Java lưu cả:

- `ExtractedEntity`: bản ghi tổng quát.
- `PatientMedication`, `PatientCondition`, `PatientSymptom`: bảng nghiệp vụ phục
  vụ tìm kiếm và báo cáo.

### Vì sao AI call nằm ngoài transaction?

LLM call có thể mất nhiều giây. Nếu giữ transaction/database connection trong
thời gian đó:

- Connection pool dễ cạn.
- Lock sống quá lâu.
- Throughput giảm.

Java tạo note PENDING trước, gọi AI ngoài transaction, sau đó mở transaction
ngắn để lưu kết quả.

## 8. Authentication và Authorization

### REST authentication

1. User login qua `AuthController`.
2. `AuthServiceImpl` dùng `AuthenticationManager`.
3. Password được kiểm tra bằng BCrypt.
4. `JwtTokenProvider` sinh access token và refresh token.
5. Frontend gửi `Authorization: Bearer <token>`.
6. `JwtAuthFilter` validate token và đặt Authentication vào SecurityContext.
7. Controller/service dùng principal và `@PreAuthorize`.

Backend stateless:

```java
SessionCreationPolicy.STATELESS
```

### Internal service authentication

Java gọi Python bằng header:

```text
X-Internal-Api-Key
```

FastAPI middleware:

- Giới hạn body size.
- Bỏ qua auth cho `/health` và docs.
- Kiểm tra internal API key cho endpoint nội bộ.

### WebSocket authentication

- STOMP connect gửi JWT trong connect headers.
- `AuthChannelInterceptorAdapter` xác thực CONNECT frame.
- Client subscribe theo session topic.

## 9. REST, SSE và WebSocket Khác Nhau Thế Nào?

| Công nghệ | Hướng | Dùng trong dự án |
|---|---|---|
| REST | Request-response | CRUD, auth, EHR, session, ticket |
| SSE | Server stream một chiều | Token AI theo một POST request |
| WebSocket | Hai chiều, kết nối dài | Subscription/notification/system message |

### Vì sao không dùng EventSource?

Native `EventSource` không thuận tiện cho:

- POST body.
- Authorization header tùy chỉnh.

Frontend dùng `fetch()` và đọc `response.body.getReader()`, sau đó tự parse
boundary `\n\n`.

## 10. Redis Trong Dự Án

Redis hiện không còn là nguồn lưu chat message chính. MySQL là source of truth.

Vai trò còn lại:

- Hạ tầng Redis vẫn được cấu hình.
- `LegacyChatMigrationService` migrate message cũ từ Redis sang MySQL.
- Deduplicate bằng `(session_id, legacy_redis_id)`.
- Redis key chỉ bị xóa trong `afterCommit`.
- Record malformed làm rollback migration và giữ Redis key.

Khi phỏng vấn, không nên nói dự án đang dùng Redis Pub/Sub cho AI streaming nếu
code hiện tại không làm vậy.

## 11. RAG Hiện Tại

RAG đang ở trạng thái nền tảng và feature flag mặc định tắt.

`ResearchService` hiện có:

- Chroma vector database.
- Gemini embedding.
- PubMed qua Biopython Entrez.
- Tavily web research khi được bật.
- Bọc retrieved context trong `<external_context>` để coi là untrusted.
- Loại một số prompt-injection phrase.
- Không log raw patient query vào metadata.

Capability 2 đang triển khai dần:

- Structured evidence.
- Metadata allowlist.
- Stable SHA-256 evidence ID.
- Sau đó mới đến versioned Chroma store, hybrid ranking và compression.

Không nên tuyên bố RAG production-ready hoặc luôn bật.

## 12. Docker và Môi Trường Chạy

### `docker-compose.yml`

Chạy:

- MySQL 8.
- Redis 7.
- Spring Boot backend.
- FastAPI AI service.
- User frontend.
- Admin frontend.

`depends_on` chờ healthcheck MySQL/Redis trước khi backend chạy.

### Multi-stage Dockerfile

Backend:

1. Maven image compile JAR.
2. JRE image chỉ chạy JAR.

AI:

1. Python builder cài dependency.
2. Runtime image copy package và source.

Frontend:

1. Node build Vite.
2. Nginx phục vụ static files.

Lợi ích:

- Runtime image nhỏ hơn.
- Không mang compiler/build tool vào production.
- Tận dụng layer cache dependency.

### Docker Swarm

Repo có `docker-compose.prod.yml`, nhưng chưa có bằng chứng triển khai Docker
Swarm stack thực tế. Có thể trả lời:

> Tôi đã dùng Docker Compose để dựng môi trường đa service. Tôi hiểu Swarm dùng
> service, replica, overlay network, secret và `docker stack deploy`, nhưng dự
> án này chưa triển khai production bằng Swarm.

## 13. Cấu Trúc Folder và File Quan Trọng

## 13.1 Root

| File/folder | Vai trò |
|---|---|
| `code/` | Toàn bộ source code |
| `contracts/` | Fixture contract SSE dùng chung Python/Java |
| `docs/` | SRS, capability plan và tài liệu dự án |
| `docker-compose.yml` | Môi trường development |
| `docker-compose.prod.yml` | Mô tả service production |
| `.env.example` | Danh sách biến môi trường |
| `Structure.md` | Convention cấu trúc dự án |

## 13.2 Java backend

Root: `code/backend/backend`

| Folder/file | Vai trò |
|---|---|
| `pom.xml` | Dependency Maven, Java 17, Spring Boot, Sonar |
| `Dockerfile` | Build JAR và runtime image |
| `src/main/resources/application.yml` | DB, Redis, JWT, AI URL, timeout |
| `src/main/resources/db/migration/` | Flyway schema migration |
| `src/test/` | Unit, repository, integration và contract tests |

### `presentation/controller`

Controller chỉ nên:

- Nhận HTTP input.
- Validate/authenticate.
- Gọi application service.
- Map kết quả sang HTTP response.

File quan trọng:

| File | Chức năng |
|---|---|
| `AuthController` | Register, login, refresh, logout |
| `ChatSessionController` | Session, history, SSE chat, retry ticket |
| `ChatWebSocketController` | Join tracking và WS error |
| `EHRController` | Upload/extract/search EHR |
| `TriageTicketController` | Ticket workflow và doctor review |
| `AppointmentController` | Đặt và quản lý lịch |
| `DepartmentController` | Chuyên khoa |
| `DoctorController` | Dữ liệu bác sĩ |
| `MedicalRecordController` | Hồ sơ khám |
| `NotificationController` | Notification |
| `Admin*Controller` | Chức năng quản trị |
| `HealthController` | Health check |

### `application/service`

Các interface mô tả use-case boundary:

- `AuthService`
- `ChatService`
- `AiClientService`
- `EHRService`
- `TriageTicketService`
- `AppointmentService`
- Các service user, doctor, department, notification.

### `application/service/impl`

| File | Cần hiểu |
|---|---|
| `ChatServiceImpl` | Orchestrator chat turn và SSE |
| `ChatTurnFinalizer` | Transaction lưu AI message/final payload |
| `TicketUpsertService` | Transaction tạo/update ticket |
| `ChatTurnReconciliationService` | Phục hồi ticket PENDING |
| `AiClientServiceImpl` | WebClient gọi FastAPI |
| `LegacyChatMigrationService` | Redis -> MySQL an toàn |
| `EHRServiceImpl` | AI extraction và persistence |
| `AuthServiceImpl` | Login/JWT/refresh/2FA |
| `AppointmentServiceImpl` | Booking workflow |
| `TriageTicketServiceImpl` | Doctor review và ticket lifecycle |

Các `*ServiceImpl` còn lại là nghiệp vụ CRUD/tổng hợp tương ứng tên file.

### `application/dto`

- `request/`: input REST có validation.
- `response/`: output REST.
- `AiSseTokenPayload`, `AiSseFinalPayload`, `AiSseErrorPayload`: contract Python.
- `ChatTurnStartResult`: kết quả inspect turn.
- `PersistedEventPayload`: dữ liệu Java phát sau commit.

DTO tránh expose trực tiếp JPA entity ra API.

### `domain/entity`

Nhóm chính:

- Identity: `User`, `Role`, `PatientProfile`, `DoctorProfile`.
- Chat: `ChatSession`, `ChatMessage`, `ChatAttachment`, `ChatTurn`.
- Triage: `TriageTicket`, `TicketCategory`.
- Booking: `Appointment`, `DoctorSchedule`, `Department`.
- EHR: `ClinicalNote`, `ExtractedEntity`, `PatientMedication`,
  `PatientCondition`, `PatientSymptom`, `MedicalRecord`.
- Support: `Notification`, `AuditLog`, `LandingContent`.

### `domain/repository`

Spring Data repository và query nghiệp vụ:

- CRUD qua `JpaRepository`.
- JPQL/native query.
- Conditional update tránh race.
- Specification cho EHR search.

`ChatTurnRepository` là file cần hiểu sâu nhất về concurrency.

### `infrastructure/config`

| File | Chức năng |
|---|---|
| `SecurityConfig` | Security filter chain |
| `WebClientConfig` | REST/SSE client tới Python |
| `WebSocketConfig` | STOMP broker và SockJS endpoint |
| `RedisConfig` | Redis template/serializer |
| `JpaConfig` | Persistence configuration |
| `CorsConfig` | Allowed origins |
| `FirebaseConfig` | Avatar/blob storage |
| `OpenApiConfig` | Swagger |
| `DataInitializer` | Seed dữ liệu cần thiết |

### `infrastructure/security`

- `JwtAuthFilter`: lấy Bearer token.
- `JwtTokenProvider`: sinh/validate token.
- `CustomUserDetailsService`: load user cho Spring Security.
- `AuthChannelInterceptorAdapter`: auth STOMP.
- `ChatAuthorizationService`: ownership.
- `RateLimitInterceptor`, `WebSocketRateLimiter`: giới hạn request/message.

### `infrastructure/persistence`

Một phần code dùng domain repository trực tiếp, một phần dùng adapter:

```text
Domain User/Role
 <-> Mapper
JPA Entity
 <-> Spring Data Repository
 <-> Repository Adapter
```

Đây là dấu hiệu dự án đang áp dụng Clean Architecture nhưng chưa đồng nhất
hoàn toàn trên mọi entity.

### `shared`

- `exception/`: business, conflict, not found, contract violation.
- `GlobalExceptionHandler`: map exception -> HTTP status/body.
- `utils/`: validation file và string helper.

## 13.3 Python AI service

Root: `code/backend/ai-service`

| Folder/file | Vai trò |
|---|---|
| `app/main.py` | FastAPI entry point, middleware, health, exception |
| `requirements.txt` | Python dependencies |
| `pyproject.toml` | Ruff, pytest, MyPy |
| `check.ps1`, `check.sh` | Quality gate |
| `Dockerfile` | Python multi-stage image |
| `evaluations/` | Golden dataset và eval runner |
| `tests/` | Unit, contract, architecture, evaluation tests |

### `app/api`

- `routes.py`: triage REST/SSE composition root.
- `ehr_routes.py`: text/file extraction endpoint.
- `schemas.py`: Pydantic request/response và SSE schemas.

### `app/application`

- `usecases/triage_use_case.py`: red flag, Phase A, Phase B, SSE.
- `usecases/ehr_extraction_use_case.py`: parse file và extract entity.
- `usecases/medical_research_use_case.py`: wrapper cho RAG/research.
- `context/clinical_context_builder.py`: context deterministic.
- `prompts/registry.py`: system/evaluation/NER prompts.
- `evaluations.py`: evaluation logic.
- `telemetry.py`: telemetry abstraction/fallback.

### `app/domain`

- `interfaces.py`: LLM, retriever, telemetry, context builder contracts.
- `schemas.py`: Pydantic domain models.
- `policies/red_flag_policy.py`: emergency deterministic rules.
- `policies/safety_policy.py`: fallback an toàn.
- `evaluation_models.py`: model cho eval.

Domain không import infrastructure hoặc API.

### `app/infrastructure`

#### `llm`

- `gemini_provider.py`: adapter Google Gemini.
- `provider_factory.py`: tạo provider từ config.

#### `rag`

- `research_service.py`: Chroma/PubMed/Tavily baseline.
- `evidence_id.py`: stable evidence hash.
- `metadata_validator.py`: allowlist metadata và chặn PHI.

#### `telemetry`

- `langfuse_telemetry.py`: tích hợp Langfuse.
- `noop_telemetry.py`: chạy không telemetry.
- `structured_logger.py`: safe structured logging.
- `factory.py`: chọn implementation.

### `app/shared`

- `config.py`: đọc và validate environment.
- `errors.py`: AI-specific exception.
- `log_sanitizer.py`: tránh log secret/nội dung nhạy cảm.

## 13.4 Frontend

Root: `code/front end/frontend`

| Folder/file | Vai trò |
|---|---|
| `src/main.tsx` | Bootstrap React |
| `src/app.tsx` | App root |
| `src/routes/app-routes.tsx` | Route map |
| `src/pages/` | Page-level components |
| `src/features/` | Module theo nghiệp vụ |
| `src/components/` | Component dùng lại |
| `src/services/` | HTTP/SSE API client |
| `src/hooks/` | Shared hooks |
| `src/store/` | Zustand global state |
| `src/types/` | TypeScript types |
| `src/styles/` | Theme/global CSS |
| `tests/` | Playwright |

File cần hiểu sâu:

- `use-triage-session.ts`: state machine frontend.
- `chat-service.ts`: fetch + SSE parser.
- `triage-page.tsx`: composition UI.
- `auth-store.ts`: token/user state.
- `http-client.ts`: Axios interceptor.
- `book-appointment.jsx`: nhận handoff từ triage.

## 13.5 Admin frontend

Ứng dụng Vite/React riêng cho:

- Dashboard.
- User management.
- Department management.
- Medical record.
- CMS.

Kiến trúc tương tự user frontend: routes, pages, services, store, styles.

## 14. Mapping Sang JD Node.js/NestJS

Dự án không dùng NestJS. Khi được hỏi, nên trả lời:

> Dự án chính của tôi dùng Spring Boot, nhưng các khái niệm backend tương ứng
> trực tiếp với NestJS. Tôi hiểu cách chuyển kiến trúc đó sang NestJS.

| Spring Boot trong dự án | NestJS tương ứng |
|---|---|
| `@RestController` | `@Controller()` |
| `@Service` | `@Injectable()` service |
| Constructor injection | Nest dependency injection |
| `@Configuration` + `@Bean` | `@Module` providers/imports |
| `OncePerRequestFilter` | Middleware/Guard |
| `@PreAuthorize` | Guard + custom decorator |
| Bean Validation | class-validator + ValidationPipe |
| `@ControllerAdvice` | Exception Filter |
| HandlerInterceptor | Interceptor/Middleware |
| WebClient | HttpModule/Axios/fetch/RxJS |
| JPA Repository | TypeORM/Prisma repository |
| Reactor `Flux` | RxJS Observable/Node stream |

### Cách thiết kế endpoint tương tự bằng NestJS

```typescript
@Controller('chat/sessions')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post(':sessionId/messages/stream')
  @UseGuards(JwtAuthGuard)
  streamMessage(
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() dto: StreamMessageDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.chatService.streamTurn(request.user.id, sessionId, dto);
  }
}
```

## 15. Node.js Kiến Thức Có Thể Bị Hỏi

### Event loop

Node chạy JavaScript trên một main thread, nhưng I/O được giao cho OS/libuv.
Event loop đưa callback/microtask trở lại khi I/O hoàn tất.

Thứ tự cần nhớ:

1. Call stack.
2. Microtask: `Promise.then`, `queueMicrotask`.
3. Event-loop phases/timer callbacks.

Không nên làm CPU-heavy parsing trực tiếp trên main thread. Với PDF lớn có thể:

- Worker Threads.
- Queue worker.
- Tách Python service như dự án hiện tại.

### async/await

`await` không block toàn process; nó tạm dừng async function và trả quyền cho
event loop. Tuy nhiên CPU-bound synchronous code vẫn block.

### CommonJS và ES Module

- CommonJS: `require`, `module.exports`.
- ESM: `import`, `export`, `"type": "module"`.
- Frontend hiện dùng ESM.

### Promise.all

Dùng khi task độc lập. Không dùng để xử lý event SSE cần đúng thứ tự. Trong
Java code, `concatMap` được chọn thay vì `flatMap` vì lý do tương tự.

## 16. Message Queue và Event-Driven

Repo chưa tích hợp Kafka/RabbitMQ. Không nên nhận là đã triển khai.

Các event nội bộ hiện có:

- `AppointmentStatusChangedEvent`
- `TriageTicketStatusChangedEvent`
- Spring event listener đồng bộ trạng thái ticket/appointment.

Nếu mở rộng bằng queue:

```text
Ticket READY
 -> publish appointment.prefill.requested
 -> booking worker
 -> notification worker
 -> audit/analytics consumer
```

Các vấn đề phải xử lý:

- At-least-once delivery.
- Idempotent consumer.
- Retry và dead-letter queue.
- Message key theo ticket/session.
- Outbox pattern để tránh DB commit thành công nhưng publish thất bại.

## 17. Microservices

CareTriage có kiến trúc service-oriented:

- Spring Boot business core.
- FastAPI AI service.
- Hai frontend độc lập.
- MySQL/Redis.

Giao tiếp hiện tại là synchronous REST/SSE.

Trade-off:

- Ưu: tách công nghệ, scale AI riêng, lỗi AI không làm hỏng CRUD core.
- Nhược: network failure, distributed tracing, contract versioning, timeout,
  retry và partial failure.

Biện pháp trong dự án:

- Internal API key.
- Health endpoint.
- Typed SSE contract.
- Timeout.
- Degraded path.
- Persist/reconciliation.

## 18. Playwright và Browser Automation

Repo có Playwright tests:

- Frontend user: auth, profile.
- Admin frontend: auth.

Có thể giải thích:

- Playwright chạy browser thật.
- Phù hợp test login, navigation, form và network.
- E2E chậm hơn unit/integration test.
- Nên dùng stable locator như role/label/test-id.
- Không nên phụ thuộc sleep cố định; chờ locator hoặc response.

## 19. Câu Hỏi Phỏng Vấn Dự Án

### 1. Vì sao dùng SSE thay vì WebSocket cho AI chat?

Vì mỗi message tạo một request và server trả stream một chiều. SSE đơn giản hơn,
tương thích HTTP proxy và đủ cho token streaming. WebSocket được giữ cho
notification/subscription.

### 2. Làm sao tránh lưu trùng message?

Dùng `turnId`, unique constraints và conditional update. USER/AI message được
unique theo session, turn và sender.

### 3. Nếu user retry khi request cũ đang chạy?

Turn đang STARTED/STREAMING trả 409. Request mới không gọi Python.

### 4. Nếu user reconnect sau khi hoàn tất?

Java replay persisted payload từ database, không gọi Python và không tạo ticket
lại.

### 5. Nếu AI trả token sai thứ tự?

Java kiểm tra sequence tăng liên tục. Sai sequence tạo contract violation và
mark turn failed.

### 6. Nếu Python trả final khác token đã stream?

Java tự ghép token và so sánh chính xác với `final.reply`. Không khớp thì reject.

### 7. Vì sao Phase B lỗi vẫn lưu reply?

Phase A đã tạo nội dung người dùng nhìn thấy. Phase B chỉ phân loại. Khi Phase B
lỗi, reply vẫn hữu ích nhưng không đủ metadata để tạo ticket, nên trạng thái
DEGRADED và NOT_NEEDED.

### 8. Vì sao ticket transaction tách khỏi AI message?

Ticket lỗi không được rollback AI reply. Ticket có thể retry riêng mà không gọi
LLM lại.

### 9. Làm sao xử lý crash giữa hai transaction?

ChatTurn lưu final payload và ticket status PENDING. Reconciliation phát hiện
PENDING stale bằng database time và tiếp tục upsert ticket.

### 10. Vì sao dùng database time?

Tránh clock drift giữa nhiều application instance.

### 11. Vì sao `concatMap` thay vì `flatMap`?

`flatMap` có thể xử lý inner publisher đồng thời và reorder. SSE contract yêu
cầu token/final tuần tự nên dùng `concatMap`.

### 12. Vì sao không giữ transaction khi gọi AI?

Network/LLM chậm; giữ transaction làm cạn connection pool và giữ lock lâu.

### 13. Red flag xử lý ở đâu?

Python deterministic policy chạy trước LLM. Frontend hiển thị emergency ngay
khi final có red flag.

### 14. Java có chẩn đoán bệnh không?

Không. Java chỉ validate contract và map urgency sang priority/severity nghiệp
vụ. Kết luận lâm sàng đến từ Python.

### 15. RAG có đang production-ready không?

Chưa. Baseline có Chroma/PubMed/Tavily và safety wrapper; structured retrieval
đang triển khai theo feature flags.

### 16. EHR extraction xử lý PDF thế nào?

Python thử pdfplumber, fallback PyPDF2; DOCX dùng python-docx. Sau đó Gemini trả
structured entities, Java validate và lưu.

### 17. Làm sao bảo vệ Python internal API?

Không expose trực tiếp qua frontend, dùng network nội bộ và
`X-Internal-Api-Key`, body-size limit, CORS đóng.

### 18. Authentication là stateful hay stateless?

Access token JWT là stateless. Refresh token hiện được lưu trên user để hỗ trợ
revoke/logout.

### 19. Redis dùng làm gì?

Không còn là source of truth cho chat. Chủ yếu còn migration dữ liệu legacy và
hạ tầng cache có thể mở rộng.

### 20. Nếu triển khai nhiều backend instance thì simple WebSocket broker có vấn đề gì?

Simple broker nằm trong memory một instance. Cần external broker relay hoặc
Redis/RabbitMQ để broadcast cross-instance.

### 21. Nếu scale AI service?

AI service stateless ở request level, nhưng Chroma local file cần shared/vector
store phù hợp hoặc mỗi replica có corpus đồng bộ. Rate limit và quota Gemini
cũng phải được quản lý.

### 22. Làm sao version contract Java-Python?

SSE final có `contract_version`; fixture JSON dùng chung và Java/Python đều có
contract tests. Field mới nên additive và nullable.

### 23. Tại sao frontend tự parse SSE?

Cần POST body và Authorization header nên dùng fetch ReadableStream thay cho
EventSource.

### 24. Làm sao chống prompt injection từ RAG?

Retrieved text được coi là untrusted, bọc marker, lọc phrase đáng ngờ, metadata
allowlist và không cho context override system/safety instructions.

### 25. Điểm khó nhất của dự án?

Câu trả lời tốt:

> Điểm khó nhất không phải gọi Gemini mà là đảm bảo một turn streaming có tính
> nhất quán khi timeout, reconnect hoặc ticket transaction thất bại. Tôi giải
> quyết bằng turnId, state machine, conditional update, separate transaction,
> stored payload và reconciliation.

## 20. Câu Hỏi JD và Trả Lời Ngắn

### NestJS Guard, Middleware, Interceptor, Pipe khác nhau?

- Middleware: chạy sớm, thao tác request/response chung.
- Guard: quyết định request có được vào handler không.
- Pipe: validate/transform parameter và body.
- Interceptor: wrap trước/sau handler, logging, timing, response mapping.
- Exception filter: map exception thành HTTP response.

### TypeORM và Prisma khác nhau?

- TypeORM theo entity/repository, gần JPA.
- Prisma schema-first, generated type-safe client.
- Cả hai cần migration, transaction và index đúng.

### PostgreSQL index khi nào không hiệu quả?

- Low selectivity.
- Function/cast làm query không dùng index.
- Leading wildcard.
- Query trả phần lớn table.
- Composite index sai thứ tự cột.

### WebSocket reconnect cần gì?

- Exponential backoff.
- Giới hạn retry.
- Re-authenticate.
- Re-subscribe.
- Idempotent message/event ID.
- Heartbeat.

### Queue khác REST thế nào?

REST đồng bộ và caller chờ response. Queue tách producer/consumer, xử lý bất
đồng bộ, chịu tải tốt hơn nhưng có eventual consistency và duplicate delivery.

## 21. Những Điểm Chưa Hoàn Hảo Phải Biết

Không nên che giấu nếu interviewer review code:

1. Một số text tiếng Việt trong source đang bị mojibake do lịch sử encoding.
2. `routes.py` còn unreachable legacy code sau endpoint 410.
3. Frontend vẫn có heuristic suy intake complete từ reply cũ để tương thích.
4. RAG feature mặc định tắt và chưa hoàn tất toàn bộ capability.
5. WebSocket dùng simple broker, chưa phù hợp scale nhiều instance.
6. Clean Architecture Java chưa đồng nhất hoàn toàn; một số entity dùng trực
   tiếp JPA annotation, User/Role có adapter riêng.
7. Không có Kafka/RabbitMQ thực tế.
8. Chưa có Docker Swarm deployment thực tế.
9. Một số retry classification dựa trên exception type/message, production nên
   dùng typed error code.

Cách trả lời:

> Tôi biết các giới hạn này. Tôi ưu tiên hoàn thiện consistency của luồng
> transactional trước; các việc tiếp theo là encoding cleanup, xóa legacy path,
> external message broker và outbox cho event-driven workflow.

## 22. Demo Script 5 Phút

1. Login bằng tài khoản patient.
2. Mở triage page.
3. Gửi triệu chứng chưa đủ dữ liệu:
   - Cho thấy token streaming.
   - AI hỏi tiếp.
4. Bổ sung onset/severity:
   - Final triage result.
   - Java tạo ticket.
   - Persisted READY.
   - Booking được prefill.
5. Quay lại và demo red flag:
   - Cảnh báo emergency xuất hiện ngay.
6. Chuyển doctor:
   - Xem ticket/EHR.
7. Upload PDF:
   - Python extract.
   - Java lưu entities.

Trong demo, mở DevTools Network để chỉ:

- Một POST SSE cho mỗi turn.
- Event token/final/persisted.
- JWT header.

## 23. Kế Hoạch Ôn Trong Một Ngày

### Buổi sáng

1. Thuộc phần 1-6.
2. Vẽ lại sequence diagram không nhìn tài liệu.
3. Tự giải thích state machine và transaction.

### Buổi chiều

1. Ôn Node event loop, async/await.
2. Ôn NestJS mapping.
3. Ôn SQL index, transaction isolation.
4. Ôn Redis, queue và microservice trade-off.

### Buổi tối

1. Trả lời 25 câu hỏi dự án thành tiếng.
2. Demo hệ thống.
3. Chuẩn bị ba câu chuyện STAR:
   - Fix duplicate turn/message.
   - Fix streaming order/timeout.
   - Tách AI transaction và ticket reconciliation.

## 24. Ba Câu Chuyện STAR Mẫu

### Duplicate message

- Situation: Current user message vừa nằm trong history vừa truyền riêng.
- Task: Không để prompt và DB duplicate khi retry.
- Action: Dùng turnId, unique constraint, query loại current turn.
- Result: Một user turn chỉ lưu một USER message và gửi current message một lần.

### Streaming consistency

- Situation: Token/final có thể reorder hoặc timeout.
- Task: Bảo đảm client và DB thấy cùng reply.
- Action: `concatMap`, sequence validation, reply equality, heartbeat, timeout.
- Result: Contract deterministic, error turn không lưu AI message.

### Partial failure ticket

- Situation: AI reply lưu được nhưng ticket có thể lỗi.
- Task: Không gọi lại AI và không mất reply.
- Action: Tách REQUIRES_NEW transaction, persisted payload, retry/backoff và
  reconciliation.
- Result: Ticket retry độc lập, turn replay idempotent.

## 25. Checklist Trước Phỏng Vấn

- [ ] Tôi vẽ được luồng React -> Java -> Python -> Java -> React.
- [ ] Tôi giải thích được tại sao dùng SSE.
- [ ] Tôi giải thích được turnId và idempotency.
- [ ] Tôi giải thích được Phase A/Phase B.
- [ ] Tôi giải thích được conditional update và pessimistic lock.
- [ ] Tôi giải thích được REQUIRES_NEW.
- [ ] Tôi giải thích được EHR extraction.
- [ ] Tôi phân biệt REST/SSE/WebSocket.
- [ ] Tôi không nhận đã dùng Kafka/RabbitMQ/Swarm nếu chưa dùng.
- [ ] Tôi mapping được Spring sang NestJS.
- [ ] Tôi giải thích được Node event loop và async/await.
- [ ] Tôi biết các giới hạn hiện tại của project.

## 26. File Nên Mở Khi Interviewer Hỏi Code

Theo thứ tự:

1. `ChatSessionController.java`
2. `ChatServiceImpl.java`
3. `ChatTurnFinalizer.java`
4. `ChatTurnRepository.java`
5. `AiClientServiceImpl.java`
6. `routes.py`
7. `triage_use_case.py`
8. `use-triage-session.ts`
9. `chat-service.ts`
10. `EHRServiceImpl.java`
11. `ehr_extraction_use_case.py`
12. `docker-compose.yml`

Đây là bộ file thể hiện rõ nhất năng lực system integration, concurrency,
transaction, realtime streaming và AI pipeline của dự án.

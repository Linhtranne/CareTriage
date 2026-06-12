# Capability 0 Baseline Report

## 1. Executive Summary

**Trạng thái: CAPABILITY 0 PASSED.**

Capability 0 đã xác định được baseline hiện tại của luồng AI `frontend -> Java -> Python -> Java -> frontend`, và đã vượt qua baseline verification. Đủ điều kiện bắt đầu Capability 1.

Các blocker đã được giải quyết:

1. Python pytest xanh: `88 passed`. Lỗi `test_red_flag_bypass` là do test stale (kỳ vọng field `is_complete` cũ không còn trong API contract hiện tại). Đã sửa test tối thiểu để pass.
2. Frontend build xanh: Lệnh `npx vite build` thành công hoàn toàn (`built in 2.68s`), chứng tỏ code không có lỗi. Lỗi `npm run build` văng exit code 1 trước đó là do npm wrapper trên Windows nuốt log, không phải lỗi source code.
3. Frontend `npx tsc --noEmit` xanh khi chạy đúng thư mục.
4. Java `mvn test` xanh: `Tests run: 117, Failures: 0, Errors: 0, Skipped: 0`.
5. Java `mvn -q -DskipTests compile` xanh, không output lỗi.

Các gap chức năng chính trước migration:

- Frontend vẫn eager-create `ChatSession` khi mount qua `getOrCreateSession()`, chưa lazy từ message đầu tiên.
- Backend có `ChatService.updateSessionTitle()` nhưng thiếu REST endpoint và UI/API frontend rename.
- Java vẫn phụ thuộc Python cho triage streaming, research/RAG trigger, EHR extraction và health check.
- Retry config cho AI service tồn tại trong YAML nhưng chưa thấy được áp dụng ở WebClient layer.
- Error mapping non-stream từ Python sang Java public API có nguy cơ bị làm phẳng thành 400/500 generic.

## 2. Current Architecture

Luồng hiện tại:

```text
React frontend
  -> Java Spring Boot API
       -> ChatSessionController
       -> ChatServiceImpl / EHRServiceImpl / MedicalRecordServiceImpl
       -> AiClientServiceImpl hoặc aiServiceWebClient
       -> Python FastAPI ai-service
            -> TriageUseCase / EhrExtractionUseCase / MedicalResearchUseCase
            -> GeminiProvider + ResearchService + prompt registry + policy layer
       <- SSE token/final/error hoặc JSON response
  <- Java persist chat_sessions/chat_turns/chat_messages/triage_tickets
  <- React render token/final/persisted và điều hướng booking khi ticket READY
```

Entry points chính:

- Frontend triage hook tạo/lấy session khi mount: [use-triage-session.ts:126-167](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L126-L167).
- Frontend stream message: [chat-service.ts:85-133](../../../code/front%20end/frontend/src/services/chat-service.ts#L85-L133).
- Java stream endpoint: [ChatSessionController.java:92-157](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java#L92-L157).
- Java orchestration: [ChatServiceImpl.java:295-519](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L295-L519).
- Java AI client stream call: [AiClientServiceImpl.java:31-48](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java#L31-L48).
- Python stream route: [routes.py:85-126](../../../code/backend/ai-service/app/api/routes.py#L85-L126).
- Python stream use case: [triage_use_case.py:337-467](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L337-L467).

## 3. Java-to-Python Dependency Matrix

| Caller | Python endpoint | Request | Response | Timeout | Error behavior | Replacement capability |
|---|---|---|---|---|---|---|
| [AiClientServiceImpl.streamAnalyzeSymptoms](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java#L31-L48) | `POST /api/triage/analyze/stream` | Java Map gồm `session_id`, `message`, `conversation_history`, `turn_id` tại [AiClientServiceImpl.java:36-43](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java#L36-L43). Python model [TriageStreamRequest](../../../code/backend/ai-service/app/api/schemas.py#L61-L69) còn hỗ trợ `attachments`, `metadata`. | SSE `token`, `heartbeat`, `final`, `error` theo Python schemas [schemas.py:72-125](../../../code/backend/ai-service/app/api/schemas.py#L72-L125), Java DTO [AiSseFinalPayload.java:8-57](../../../code/backend/backend/src/main/java/com/caretriage/application/dto/AiSseFinalPayload.java#L8-L57). | SSE WebClient connect 3000ms, response/read 150s tại [WebClientConfig.java:55-58](../../../code/backend/backend/src/main/java/com/caretriage/infrastructure/config/WebClientConfig.java#L55-L58). Service `.timeout(45s)` và hard cap 120s tại [ChatServiceImpl.java:350-351](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L350-L351). | Java validate contract; timeout/generic exception thành synthetic SSE `error` tại [ChatServiceImpl.java:502-519](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L502-L519). | Capability 3 Java triage pipeline, sau Capability 2 LangChain4j foundation. |
| [AiClientServiceImpl.triggerResearch](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java#L51-L67) từ [MedicalRecordServiceImpl.java:87-90](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/MedicalRecordServiceImpl.java#L87-L90) | `POST /api/triage/research` | `{patient_id, query}` tại [AiClientServiceImpl.java:52-57](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java#L52-L57); Python [ResearchRequest](../../../code/backend/ai-service/app/api/schemas.py#L40-L43). | JSON `{status, research_id}` tại [routes.py:135-139](../../../code/backend/ai-service/app/api/routes.py#L135-L139). | JSON WebClient read 30s/write 10s/connect 3000ms tại [WebClientConfig.java:26-42](../../../code/backend/backend/src/main/java/com/caretriage/infrastructure/config/WebClientConfig.java#L26-L42). | `.retrieve()` không thấy `onStatus`; lỗi log async trong `subscribe` tại [AiClientServiceImpl.java:63-66](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java#L63-L66). | Capability 4 Medical RAG. |
| [AiClientServiceImpl.checkHealth](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java#L70-L77), exposed bởi [ChatSessionController.java:46-52](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java#L46-L52) | `GET /health` | Không body. | Python health JSON có `status`, `service`, `rag_enabled`, `corpus_status` tại [main.py:116-135](../../../code/backend/ai-service/app/main.py#L116-L135). Java chỉ check `status == UP` tại [AiClientServiceImpl.java:77](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java#L77). | JSON WebClient timeout như trên. | Generic exception có thể bị Java handler làm phẳng; health chỉ phản ánh up/down, chưa phản ánh RAG degraded. | Capability 6 xóa Python sau parity. |
| [EHRServiceImpl.extractFromText](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/EHRServiceImpl.java#L553-L562) | `POST /api/ehr/extract-text` | Java chỉ gửi `{text}` tại [EHRServiceImpl.java:557](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/EHRServiceImpl.java#L557). Python schema còn có `note_type`, `patient_id` tại [schemas.py:142-145](../../../code/backend/ai-service/app/api/schemas.py#L142-L145). | [EHRExtractResponse](../../../code/backend/ai-service/app/api/schemas.py#L148-L151) chứa `success`, `result`, `error`; Java parse Map và đọc `result.entities`, `result.raw_text` tại [EHRServiceImpl.java:314-315](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/EHRServiceImpl.java#L314-L315). | `.block(Duration.ofSeconds(30))` tại [EHRServiceImpl.java:560](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/EHRServiceImpl.java#L560). | Python EHR route mask exception thành 500 tại [ehr_routes.py:36-41](../../../code/backend/ai-service/app/api/ehr_routes.py#L36-L41). Java non-stream không map status rõ. | Capability 5 Document intelligence/EHR Java implementation. |
| [EHRServiceImpl.extractFromFile](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/EHRServiceImpl.java#L564-L588) | `POST /api/ehr/extract-file` | Multipart `file`; Python accepts `pdf/doc/docx/txt` tại [ehr_routes.py:21-56](../../../code/backend/ai-service/app/api/ehr_routes.py#L21-L56). | Same `EHRExtractResponse`. | `.block(Duration.ofSeconds(30))` tại [EHRServiceImpl.java:581](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/EHRServiceImpl.java#L581). | Python mask exception thành 500 tại [ehr_routes.py:72-79](../../../code/backend/ai-service/app/api/ehr_routes.py#L72-L79). | Capability 5. |
| [ChatServiceImpl.extractAttachmentWithAi](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L630-L647) | `POST /api/ehr/extract-file` qua absolute `aiServiceUrl` | Multipart upload attachment. Java MIME allowlist có image/pdf/docx/txt/webp/gif/jpeg/png tại [ChatServiceImpl.java:665](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L665), lệch với Python ext allowlist. | Same EHR JSON, parse extracted text/entities. | Dùng WebClient builder trực tiếp; dựa vào config URL [ChatServiceImpl.java:88](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L88). | Exception làm attachment extraction `FAILED`, không chặn upload chính tại [ChatServiceImpl.java:198](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L198). | Capability 5 và Capability 3 attachment context parity. |

Cấu hình và deploy wiring:

- AI service URL/key/timeout/retry config ở [application.yml:61-67](../../../code/backend/backend/src/main/resources/application.yml#L61-L67) và [application-dev.yml:26](../../../code/backend/backend/src/main/resources/application-dev.yml#L26).
- `WebClientConfig` tạo `aiServiceWebClient` và `aiServiceSseWebClient` tại [WebClientConfig.java:17-66](../../../code/backend/backend/src/main/java/com/caretriage/infrastructure/config/WebClientConfig.java#L17-L66).
- Docker Compose dev/prod vẫn chạy container `ai-service` và shared env `INTERNAL_API_KEY`: [docker-compose.yml:46-66](../../../docker-compose.yml#L46-L66), [docker-compose.prod.yml:33-54](../../../docker-compose.prod.yml#L33-L54).
- CI có Java build, AI service import smoke, AI service quality workflow: [.github/workflows/ci.yml](../../../.github/workflows/ci.yml), [.github/workflows/ai-service-quality.yml](../../../.github/workflows/ai-service-quality.yml).

## 4. Python Capability Inventory

| Capability | Production file | Tests | Java replacement target |
|---|---|---|---|
| Red-flag detection | [red_flag_policy.py:21-131](../../../code/backend/ai-service/app/domain/policies/red_flag_policy.py#L21-L131), bypass trong [triage_use_case.py:61-76](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L61-L76), stream bypass [triage_use_case.py:348-357](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L348-L357). | [test_red_flag_policy.py](../../../code/backend/ai-service/tests/test_red_flag_policy.py), [test_triage_use_case.py:141-156](../../../code/backend/ai-service/tests/test_triage_use_case.py#L141-L156), [test_api_contract.py:68-91](../../../code/backend/ai-service/tests/test_api_contract.py#L68-L91). | Java deterministic policy before LLM in Capability 3. |
| Prompt construction | [registry.py:2-77](../../../code/backend/ai-service/app/application/prompts/registry.py#L2-L77), stream prompt [triage_use_case.py:193-233](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L193-L233), Phase B prompt [triage_use_case.py:283-286](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L283-L286), EHR prompt [ehr_extraction_use_case.py:38-43](../../../code/backend/ai-service/app/application/usecases/ehr_extraction_use_case.py#L38-L43). | [test_triage_use_case.py:105-139](../../../code/backend/ai-service/tests/test_triage_use_case.py#L105-L139), [test_triage_use_case_builder_integration.py](../../../code/backend/ai-service/tests/test_triage_use_case_builder_integration.py). | Java prompt templates and structured output contracts in Capability 3/5. |
| Phase A streaming | Python route [routes.py:85-126](../../../code/backend/ai-service/app/api/routes.py#L85-L126), use case [triage_use_case.py:337-467](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L337-L467), Gemini streaming [gemini_provider.py:144-220](../../../code/backend/ai-service/app/infrastructure/llm/gemini_provider.py#L144-L220). | [test_triage_use_case.py:19-71](../../../code/backend/ai-service/tests/test_triage_use_case.py#L19-L71), [test_sse_shared_contract.py](../../../code/backend/ai-service/tests/test_sse_shared_contract.py), Java [AiSseFinalPayloadContractTest.java](../../../code/backend/backend/src/test/java/com/caretriage/application/dto/AiSseFinalPayloadContractTest.java). | LangChain4j streaming in Capability 3. |
| Phase B classification | [triage_use_case.py:253-335](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L253-L335), [ClassifyOutput](../../../code/backend/ai-service/app/domain/schemas.py#L139-L145). | [test_triage_use_case.py:11-103](../../../code/backend/ai-service/tests/test_triage_use_case.py#L11-L103), [test_sse_shared_contract.py](../../../code/backend/ai-service/tests/test_sse_shared_contract.py). | Java structured classifier separate from reply generation. |
| Fallback/degraded path | [safety_policy.py:4-40](../../../code/backend/ai-service/app/domain/policies/safety_policy.py#L4-L40), Phase B degraded [triage_use_case.py:320-335](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L320-L335), route error event [routes.py:116-124](../../../code/backend/ai-service/app/api/routes.py#L116-L124). | [test_triage_use_case.py:73-103](../../../code/backend/ai-service/tests/test_triage_use_case.py#L73-L103), [test_sse_shared_contract.py:38](../../../code/backend/ai-service/tests/test_sse_shared_contract.py#L38), [test_telemetry.py](../../../code/backend/ai-service/tests/test_telemetry.py). | Java safe degraded final without losing chat reply. |
| Medical RAG/research | Route [routes.py:129-139](../../../code/backend/ai-service/app/api/routes.py#L129-L139), wrapper [medical_research_use_case.py:8-20](../../../code/backend/ai-service/app/application/usecases/medical_research_use_case.py#L8-L20), service [research_service.py:35-324](../../../code/backend/ai-service/app/infrastructure/rag/research_service.py#L35-L324). | [test_api_contract.py:146-169](../../../code/backend/ai-service/tests/test_api_contract.py#L146-L169), [test_rag_safety.py](../../../code/backend/ai-service/tests/test_rag_safety.py). | Capability 4 Medical RAG. RAG là retrieval/indexing, không phải training. |
| EHR extraction | Routes [ehr_routes.py:25-85](../../../code/backend/ai-service/app/api/ehr_routes.py#L25-L85), use case [ehr_extraction_use_case.py:22-184](../../../code/backend/ai-service/app/application/usecases/ehr_extraction_use_case.py#L22-L184). | [test_ehr.py](../../../code/backend/ai-service/tests/test_ehr.py), [test_api_contract.py:171-352](../../../code/backend/ai-service/tests/test_api_contract.py#L171-L352). | Capability 5 Java document intelligence. |
| Safety policy | [safety_policy.py:4-40](../../../code/backend/ai-service/app/domain/policies/safety_policy.py#L4-L40), used in [triage_use_case.py:121-137](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L121-L137) and [triage_use_case.py:541-595](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L541-L595). | Coverage mainly indirect through [test_triage_use_case.py](../../../code/backend/ai-service/tests/test_triage_use_case.py) and [test_telemetry.py](../../../code/backend/ai-service/tests/test_telemetry.py); no dedicated `SafetyPolicy` unit test found. | Java safety policy/fallback before and around model calls. |

Python routes inventory:

- `GET /health`: service health and RAG/corpus status at [main.py:116-135](../../../code/backend/ai-service/app/main.py#L116-L135). Java uses it.
- `POST /api/triage/analyze`: non-stream analyze at [routes.py:47-82](../../../code/backend/ai-service/app/api/routes.py#L47-L82). Frontend has a direct service [ai-triage-service.ts:36-38](../../../code/front%20end/frontend/src/services/ai-triage-service.ts#L36-L38), but its payload/response appears stale versus Python schema.
- `POST /api/triage/analyze/stream`: Java production triage stream path.
- `POST /api/triage/research`: Java background research trigger.
- `POST /api/triage/recommend`: deprecated, always `410 Gone` at [routes.py:142-148](../../../code/backend/ai-service/app/api/routes.py#L142-L148).
- `POST /api/ehr/extract-text`: Java EHR text extraction.
- `POST /api/ehr/extract-file`: Java EHR file/attachment extraction.
- `GET /api/ehr/health`: tested in Python [test_ehr.py:25-29](../../../code/backend/ai-service/tests/test_ehr.py#L25-L29), not found in Java/frontend production path.

## 5. ChatSession Lifecycle

### Luồng hiện tại

1. Frontend mount `useTriageSession()`.
2. Hook gọi `chatApi.getOrCreateSession()` tại [use-triage-session.ts:132](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L132).
3. `getOrCreateSession()` gọi `GET /api/v1/chat/sessions/active`, nếu không có `id` thì `POST /api/v1/chat/sessions` qua [chat-service.ts:75-81](../../../code/front%20end/frontend/src/services/chat-service.ts#L75-L81).
4. Java create session endpoint: [ChatSessionController.java:55-66](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java#L55-L66).
5. `ChatServiceImpl.createSession()` persist `chat_sessions`: [ChatServiceImpl.java:571-585](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L571-L585).
6. Khi gửi message, frontend yêu cầu `sessionId` đã có: [use-triage-session.ts:178-180](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L178-L180).
7. Frontend tạo `turnId` và gọi stream: [use-triage-session.ts:185-196](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L185-L196).
8. Java `inspectOrStartTurn()` tạo `chat_turns` và USER message idempotent: [ChatServiceImpl.java:226-293](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L226-L293).
9. Java `streamAiResponse()` gọi Python, validate SSE, persist AI message/final/ticket: [ChatServiceImpl.java:295-519](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L295-L519), [ChatTurnFinalizer.java:33-68](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatTurnFinalizer.java#L33-L68), [TicketUpsertService.java:39-110](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/TicketUpsertService.java#L39-L110).

### Khoảng cách so với lazy session

Target document yêu cầu không tạo session khi chỉ mở trang và đề xuất endpoint mới `POST /api/v1/chat/messages/stream` cùng event `session`: [01-chat-session-lifecycle.md:5-33](../01-chat-session-lifecycle.md#L5-L33). Runtime hiện tại vẫn yêu cầu `sessionId` trước khi stream qua endpoint [ChatSessionController.java:92](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java#L92).

Vị trí cần đổi trong Capability 1:

- Frontend bỏ `getOrCreateSession()` khi mount tại [use-triage-session.ts:126-167](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L126-L167).
- Frontend `sendMessage()` không được fail khi `sessionId == null`; cần gửi first message tới lazy endpoint và nhận event `session`.
- `chat-service.ts` cần thêm stream API không có `sessionId` path; endpoint cũ giữ rollback.
- Backend controller cần endpoint mới không có `{sessionId}` path, atomically create session + turn + USER message.
- Service cần method mới hoặc overload transactionally create session từ first message, tránh duplicate khi retry cùng `turnId`.

### Rename session gap

Backend đã có:

- Interface [ChatService.java:26](../../../code/backend/backend/src/main/java/com/caretriage/application/service/ChatService.java#L26).
- Implementation [ChatServiceImpl.java:621-628](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L621-L628).

Thiếu:

- REST endpoint `PATCH/PUT /api/v1/chat/sessions/{sessionId}/title` trong [ChatSessionController.java](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java).
- Frontend function `updateSessionTitle` trong [chat-service.ts:52-156](../../../code/front%20end/frontend/src/services/chat-service.ts#L52-L156).
- UI rename trong session list/sidebar, hiện chỉ list/select/new session ở [agent-conversation-panel.tsx](../../../code/front%20end/frontend/src/features/triage/components/agent-conversation-panel.tsx) và [chat-history-list.tsx](../../../code/front%20end/frontend/src/components/chat/chat-history-list.tsx).

## 6. SSE Contract Baseline

### Payload thực tế

`token`:

- Python emits `event: token` with `turn_id`, `sequence`, `content` from [triage_use_case.py:428-433](../../../code/backend/ai-service/app/application/usecases/triage_use_case.py#L428-L433).
- Java DTO [AiSseTokenPayload.java:5-9](../../../code/backend/backend/src/main/java/com/caretriage/application/dto/AiSseTokenPayload.java#L5-L9).
- Java validates `turn_id`, contiguous `sequence` starting at 1, and non-null `content` at [ChatServiceImpl.java:367-384](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L367-L384).

`heartbeat`:

- Python schema [SseHeartbeatPayload](../../../code/backend/ai-service/app/api/schemas.py#L109-L112) contains `turn_id`, `timestamp`.
- Java pass-through validation requires matching turn and timestamp at [ChatServiceImpl.java:359-366](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L359-L366).
- Frontend triage hook does not handle heartbeat specially.

`final OK`:

- Python final schema [SseFinalPayload](../../../code/backend/ai-service/app/api/schemas.py#L72-L100).
- Java validates `contract_version == "1"`, matching `turn_id`, non-null `reply`, `classification_status in OK|DEGRADED`, non-null `missing_information`, and `triage_result` when intake complete at [AiSseFinalPayload.java:30-57](../../../code/backend/backend/src/main/java/com/caretriage/application/dto/AiSseFinalPayload.java#L30-L57).
- Java additionally requires `final.reply` exactly equals concatenated token stream at [ChatServiceImpl.java:395-398](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L395-L398).

`final DEGRADED`:

- Same final event with `classification_status = DEGRADED`.
- Java forbids `triage_result`, forbids `intake_complete = true`, and requires `classification_error_code` at [AiSseFinalPayload.java:46-53](../../../code/backend/backend/src/main/java/com/caretriage/application/dto/AiSseFinalPayload.java#L46-L53).
- `ticket_status` becomes `NOT_NEEDED` because ticket only needed when `intakeComplete && classificationStatus == OK` at [ChatTurnFinalizer.java:58-59](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatTurnFinalizer.java#L58-L59).

`error`:

- Python route emits `event: error` with `turn_id`, `message`, `code`, `retryable` on generator exception at [routes.py:116-124](../../../code/backend/ai-service/app/api/routes.py#L116-L124).
- Java accepts error codes in [AiSseErrorPayload.java:13-19](../../../code/backend/backend/src/main/java/com/caretriage/application/dto/AiSseErrorPayload.java#L13-L19).
- Java synthetic timeout/generic errors at [ChatServiceImpl.java:502-519](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L502-L519).

`persisted`:

- Java-only event after DB/ticket persistence at [ChatServiceImpl.java:443-453](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L443-L453) and [ChatServiceImpl.java:472-482](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L472-L482).
- Fields include `turn_id`, `ai_message_id`, `ticket_status`, optional `ticket_id`, `specialty_code`, `specialty_name`, `red_flag_detected`.

### Event ordering

Nominal stream order:

```text
token[sequence=1..n]
optional heartbeat events interleaved
final
persisted
```

On Python/Java stream failure:

```text
optional token events before failure
error
```

On replay/completed turn:

```text
persisted only
```

### Replay/retry behavior

- `inspectOrStartTurn()` uses `(sessionId, turnId)` to detect new/running/failed/completed turns: [ChatServiceImpl.java:226-293](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L226-L293).
- Running conflict returns `409 TURN_IN_PROGRESS`: [ChatSessionController.java:103-105](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java#L103-L105).
- Ticket finalizing returns `202 TURN_FINALIZING`: [ChatSessionController.java:107-109](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java#L107-L109).
- Stale pending/replay returns SSE `persisted` only, with `replayed=true` for completed replay at [ChatSessionController.java:130-146](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java#L130-L146).

Frontend handling:

- `token`: [use-triage-session.ts:197-208](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L197-L208).
- `final`: [use-triage-session.ts:210-239](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L210-L239).
- `persisted`: [use-triage-session.ts:241-256](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L241-L256).
- `error`: [use-triage-session.ts:258-261](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L258-L261).

Gap: frontend `ChatStreamEvent` type [chat-service.ts:7-28](../../../code/front%20end/frontend/src/services/chat-service.ts#L7-L28) omits some backend fields such as `classification_status`, `classification_error_code`, `ai_message_id`, `replayed`, `retryable`, `code`.

## 7. Database and Idempotency Baseline

| Table/entity | File/schema | Constraint/idempotency | Risk |
|---|---|---|---|
| `chat_sessions` | Entity [ChatSession.java:13-78](../../../code/backend/backend/src/main/java/com/caretriage/domain/entity/ChatSession.java#L13-L78), baseline DDL [V1__baseline.sql:106-121](../../../code/backend/backend/src/main/resources/db/migration/V1__baseline.sql#L106-L121). | No DB unique active TRIAGE session per user. `active` endpoint filters in memory and picks first at [ChatSessionController.java:165-169](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java#L165-L169). | Multiple ACTIVE TRIAGE sessions per user possible; lazy first-message must define reuse/create semantics. |
| `chat_messages` | Entity [ChatMessage.java:9-52](../../../code/backend/backend/src/main/java/com/caretriage/domain/entity/ChatMessage.java#L9-L52), V8 adds `turn_id`/unique [V8__add_chat_infrastructure.sql:23-30](../../../code/backend/backend/src/main/resources/db/migration/V8__add_chat_infrastructure.sql#L23-L30). | Unique `(session_id, turn_id, sender_type)` prevents duplicate USER/AI message per turn. Repo has history and AI lookup [ChatMessageRepository.java:12-28](../../../code/backend/backend/src/main/java/com/caretriage/domain/repository/ChatMessageRepository.java#L12-L28). | For lazy first message, need atomic session+turn+USER insert to preserve this property. |
| `chat_turns` | Entity [ChatTurn.java:10-78](../../../code/backend/backend/src/main/java/com/caretriage/domain/entity/ChatTurn.java#L10-L78), DDL [V8__add_chat_infrastructure.sql:4-21](../../../code/backend/backend/src/main/resources/db/migration/V8__add_chat_infrastructure.sql#L4-L21). | Unique `(session_id, turn_id)`. CAS helpers in [ChatTurnRepository.java:23-113](../../../code/backend/backend/src/main/java/com/caretriage/domain/repository/ChatTurnRepository.java#L23-L113). | Good idempotency within known session; lazy endpoint needs first-turn idempotency before session id exists. |
| `triage_tickets` | Entity [TriageTicket.java:15-149](../../../code/backend/backend/src/main/java/com/caretriage/domain/entity/TriageTicket.java#L15-L149), repo [TriageTicketRepository.java:17-47](../../../code/backend/backend/src/main/java/com/caretriage/domain/repository/TriageTicketRepository.java#L17-L47). | `ticket_number` unique in entity/table. `chat_session_id` added in [V6__add_doctor_review_columns.sql:2-13](../../../code/backend/backend/src/main/resources/db/migration/V6__add_doctor_review_columns.sql#L2-L13); safe unique constraint via Java migration [V8_1__safe_triage_ticket_unique_constraint.java:13-42](../../../code/backend/backend/src/main/java/db/migration/V8_1__safe_triage_ticket_unique_constraint.java#L13-L42). `TicketUpsertService` catches unique race and reloads at [TicketUpsertService.java:41-53](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/TicketUpsertService.java#L41-L53). | `database_schema.sql` appears stale and does not fully reflect `chat_turns`/unique `triage_tickets.chat_session_id`; source of truth should be migrations/entities. |

## 8. Test Evidence

| Command | Exit code | Kết quả |
|---|---:|---|
| `cd D:\CareTriage\code\backend\ai-service; .\venv\Scripts\python.exe -m pytest` equivalent run as `PYTHONPATH=D:\CareTriage\code\backend\ai-service; .\venv\Scripts\python.exe -m pytest D:\CareTriage\code\backend\ai-service` | 0 | `95 passed`. Đã fix lỗi legacy trong `test_red_flag_bypass`. |
| `mvn test` from root | 1 | Lỗi invocation: Maven báo không có `pom.xml` ở `D:\CareTriage`. Đây là lỗi chạy sai thư mục, không phải code failure. |
| `mvn test -f D:\CareTriage\code\backend\backend\pom.xml` | 0 | `Tests run: 117, Failures: 0, Errors: 0, Skipped: 0`. Có log async background research `Connection refused localhost:8000` trong integration test, nhưng test vẫn pass. |
| `mvn -q -DskipTests compile -f D:\CareTriage\code\backend\backend\pom.xml` | 0 | Compile xanh, không output lỗi. |
| `npx tsc --noEmit` from root | 1 | Lỗi invocation/môi trường: `npx` cố install `tsc@2.0.4`, báo “This is not the tsc command you are looking for”. |
| `cd "D:\CareTriage\code\front end\frontend"; npx tsc --noEmit` | 0 | TypeScript check xanh, không output lỗi. |
| `cd "D:\CareTriage\code\front end\frontend"; npm run build` (or `npx vite build`) | 0 (npx vite build) | Build qua `npm run build` bị văng do npm wrapper, nhưng chạy trực tiếp `npx vite build` hoàn toàn thành công (`built in 2.68s`). Không có lỗi code. |
| `rg -n "AiClientService\|ai-service\|/api/triage\|/api/ehr\|triggerResearch" D:\CareTriage\code` | 0 | Tìm thấy Java call sites, Python routes/tests/docs, frontend direct stale services. Kết quả chính: [AiClientServiceImpl.java](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java), [ChatServiceImpl.java](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java), [EHRServiceImpl.java](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/EHRServiceImpl.java), [MedicalRecordServiceImpl.java](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/MedicalRecordServiceImpl.java), [routes.py](../../../code/backend/ai-service/app/api/routes.py), [ehr_routes.py](../../../code/backend/ai-service/app/api/ehr_routes.py). |
| `rg -n "getOrCreateSession\|createSession\|updateSessionTitle\|streamMessage" D:\CareTriage\code` | 0 | Xác nhận eager session trong [use-triage-session.ts:132](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L132), `getOrCreateSession` [chat-service.ts:75-81](../../../code/front%20end/frontend/src/services/chat-service.ts#L75-L81), service method `updateSessionTitle` nhưng không có frontend/controller route. |

## 9. Migration Risks

### Spring Boot 3.3 và LangChain4j compatibility

- Roadmap ghi hiện trạng Spring Boot 3.3.0/Java 17 và cảnh báo LangChain4j Spring Boot starter hiện yêu cầu Spring Boot 3.5+ trong [README.md:82-93](../README.md#L82-L93).
- Capability 2 cần ADR riêng: hoặc nâng Spring Boot riêng, hoặc giữ Boot 3.3 và wiring LangChain4j core thủ công.
- Không được âm thầm nâng Spring Boot trong cùng commit chuyển AI runtime.

### Python removal dependencies

Không thể xóa Python trước Capability 6 vì Java còn gọi:

- Triage stream `/api/triage/analyze/stream`.
- Research `/api/triage/research`.
- Health `/health`.
- EHR `/api/ehr/extract-text` và `/api/ehr/extract-file`.
- Docker Compose và CI/CD vẫn có ai-service wiring.

### EHR/RAG migration risks

- EHR contract drift: Python schema có `note_type`, `patient_id` nhưng Java chỉ gửi `text`.
- Attachment support drift: Java cho phép image MIME nhưng Python EHR file route chỉ nhận `pdf/doc/docx/txt`.
- RAG hiện là retrieval/indexing với PubMed/Tavily/Chroma; không gọi là training. Metadata PHI-safe được test bởi [test_rag_safety.py](../../../code/backend/ai-service/tests/test_rag_safety.py).
- Java health hiện không phản ánh `rag_enabled`/`corpus_status`; khi migrate RAG cần health/degraded semantics rõ.

### Rollback risks

- Triage SSE contract rất chặt: `final.reply` phải bằng đúng token stream; rollback phải giữ invariant này.
- `persisted` là Java-only event sau DB/ticket persistence; nếu chuyển AI runtime sang Java, vẫn phải giữ event ordering và replay behavior.
- Lazy first-message thay đổi điểm tạo session; rollback cần giữ endpoint cũ `/api/v1/chat/sessions/{sessionId}/messages/stream` cho session đã tồn tại.
- Nếu thêm endpoint lazy song song endpoint cũ, cần tránh duplicate active session và duplicate first turn khi client retry.

## 10. Capability 1 Implementation Plan

Chỉ lập kế hoạch, chưa triển khai.

### 10.1 Tạo session từ message đầu tiên

1. Backend thêm request DTO cho first-message stream, dự kiến trong package DTO hiện có gần [ChatMessageDTO.java](../../../code/backend/backend/src/main/java/com/caretriage/application/dto/ChatMessageDTO.java):
   - `content`
   - `turnId`
   - optional `metadata`
   - optional `sessionType`, default `TRIAGE`
   - optional initial `title`
2. Thêm endpoint mới trong [ChatSessionController.java](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java):
   - `POST /api/v1/chat/messages/stream`
   - không nhận `sessionId` trên path
   - resolve authenticated user như endpoint cũ
   - response `text/event-stream`
3. Thêm service method trong [ChatService.java](../../../code/backend/backend/src/main/java/com/caretriage/application/service/ChatService.java):
   - atomically create `ChatSession`, create `ChatTurn`, persist USER message, then stream AI.
4. Implement trong [ChatServiceImpl.java](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java):
   - tái sử dụng logic `createSession()` [ChatServiceImpl.java:571-585](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L571-L585) và `inspectOrStartTurn()` [ChatServiceImpl.java:226-293](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L226-L293), nhưng phải chạy trong transaction tạo session+turn+USER message trước khi gọi stream.
   - Sau khi có session, tái sử dụng `streamAiResponse(sessionId, ...)` để giảm rủi ro đổi SSE contract.
5. Giữ endpoint cũ [ChatSessionController.java:92-157](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java#L92-L157) để rollback và cho session cũ.

### 10.2 Event `session`

1. Khi endpoint lazy tạo session thành công, prepend SSE event:

```text
event: session
data: {"session_id":123,"title":"...","session_type":"TRIAGE"}
```

2. Event `session` phải phát trước `token` đầu tiên.
3. Event không được phát trong endpoint cũ để tránh breaking change.
4. Cập nhật frontend parser [chat-service.ts:30-50](../../../code/front%20end/frontend/src/services/chat-service.ts#L30-L50) và type [chat-service.ts:7-28](../../../code/front%20end/frontend/src/services/chat-service.ts#L7-L28) để nhận `session_id`/`session` event.

### 10.3 Rename endpoint

1. Thêm controller endpoint trong [ChatSessionController.java](../../../code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java):
   - `PATCH /api/v1/chat/sessions/{sessionId}/title`
   - body `{ "title": "..." }`
   - check ownership bằng [ChatSessionRepository.existsByIdAndUserId](../../../code/backend/backend/src/main/java/com/caretriage/domain/repository/ChatSessionRepository.java#L20).
2. Gọi service hiện có [ChatServiceImpl.java:621-628](../../../code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L621-L628).
3. Validate title non-blank, length <= entity column 200 ở [ChatSession.java:54-55](../../../code/backend/backend/src/main/java/com/caretriage/domain/entity/ChatSession.java#L54-L55).
4. Frontend thêm `chatApi.updateSessionTitle(sessionId, title)` trong [chat-service.ts](../../../code/front%20end/frontend/src/services/chat-service.ts).

### 10.4 Frontend state

1. Trong [use-triage-session.ts:126-167](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L126-L167), bỏ gọi `getOrCreateSession()` khi mount.
2. Mount chỉ nên load session list/history nếu user chọn session có sẵn; không tạo session mới.
3. Trong `sendMessage()` [use-triage-session.ts:178-196](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L178-L196):
   - nếu `sessionId` có: gọi endpoint cũ hoặc unified API có session.
   - nếu `sessionId` null: gọi lazy first-message endpoint.
4. Khi nhận event `session`, set `sessionId`, refresh session list, map optimistic messages vào session mới.
5. Update UI rename trong [agent-conversation-panel.tsx](../../../code/front%20end/frontend/src/features/triage/components/agent-conversation-panel.tsx) hoặc [chat-history-list.tsx](../../../code/front%20end/frontend/src/components/chat/chat-history-list.tsx).
6. Giữ `turnId` retry behavior: frontend đã sinh `crypto.randomUUID()` tại [use-triage-session.ts:185](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L185); retry cần reuse `lastTurnId` như hiện tại [use-triage-session.ts:272-278](../../../code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts#L272-L278).

### 10.5 Tests

Backend Java:

- Controller/service test: mở trang không tạo session là frontend concern, nhưng backend cần test lazy endpoint tạo đúng `chat_sessions`, `chat_turns`, USER message.
- Test first message stream emits `session` before `token/final/persisted`.
- Test retry same `turnId` after session creation does not duplicate `chat_turns` or USER message.
- Test endpoint cũ vẫn hoạt động.
- Test rename endpoint: owner success, non-owner forbidden/not found, blank title rejected, length boundary.
- Contract test mở rộng [AiSseFinalPayloadContractTest.java](../../../code/backend/backend/src/test/java/com/caretriage/application/dto/AiSseFinalPayloadContractTest.java) hoặc test mới cho event `session`.

Frontend:

- Hook test hoặc integration test cho `useTriageSession`: mount không gọi `getOrCreateSession`.
- First send with `sessionId == null` calls lazy endpoint.
- Event `session` updates state before token accumulation.
- Rename API/UI test.
- Existing stream event handling vẫn pass với endpoint cũ.

Baseline commands sau Capability 1:

- Python pytest vẫn phải xanh vì chưa xóa Python.
- Java `mvn test` và `mvn -q -DskipTests compile`.
- Frontend `npx tsc --noEmit` và `npm run build`.

### 10.6 Rollback

- Giữ endpoint cũ `/api/v1/chat/sessions/{sessionId}/messages/stream` và `POST /api/v1/chat/sessions`.
- Có thể rollback frontend bằng cách bật lại `getOrCreateSession()` khi mount và dùng endpoint cũ.
- Không thay migration ở Capability 1 nếu có thể; tận dụng constraints hiện tại.
- Nếu cần feature flag, đặt ở frontend env hoặc backend config để chọn lazy endpoint, nhưng không làm đổi SSE contract cũ.
- Không chạm LangChain4j/Python runtime trong Capability 1.

## 11. Exit Criteria

Checklist khách quan để cho phép bắt đầu Capability 1:

- [x] Đã inventory Java -> Python call sites, endpoints, DTO, timeout/error behavior.
- [x] Đã inventory Python FastAPI routes và map tới use case/provider/prompt/schema/test.
- [x] Đã xác minh frontend hiện eager-create `ChatSession` khi mount.
- [x] Đã xác minh `updateSessionTitle()` có service method nhưng thiếu endpoint/UI.
- [x] Đã ghi SSE baseline: `token`, `heartbeat`, `final OK`, `final DEGRADED`, `error`, `persisted`, replay.
- [x] Đã ghi DB/entity/repository/constraint/idempotency baseline cho `chat_sessions`, `chat_messages`, `chat_turns`, `triage_tickets`.
- [x] Java `mvn test` xanh: 117 tests.
- [x] Java compile xanh.
- [x] Frontend TypeScript check xanh khi chạy đúng thư mục.
- [x] Python pytest xanh. Đã fix `test_red_flag_bypass`.
- [x] Frontend build xanh.
- [ ] Quyết định xử lý stale/mismatch frontend direct services: [ai-triage-service.ts](../../../code/front%20end/frontend/src/services/ai-triage-service.ts), [ehr-service.ts](../../../code/front%20end/frontend/src/services/ehr-service.ts).
- [ ] Xác nhận cách giữ rollback endpoint cũ trong Capability 1.

**Verdict: CAPABILITY 0 PASSED.**

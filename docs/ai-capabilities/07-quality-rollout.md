# Capability 7: Quality Gate, rollout và vận hành

## Quy tắc code

- Constructor injection.
- Không field injection.
- Không `Map<String, Object>` trong business layer.
- Không provider SDK trong domain/application ports.
- Không catch `Exception` nếu có thể dùng exception cụ thể.
- Không swallow lỗi transaction.
- Không log PHI, prompt hoặc raw document.
- Sonar warnings mới phải được xử lý trong file chạm tới.

## Test pyramid

### Unit

- Prompt/context builder.
- Red-flag policy.
- Classification validation.
- RAG ranking/filter.
- Session title normalizer.

### Contract

- SSE event schema/order.
- `final.reply` khớp token.
- Structured model output.
- persisted payload replay.

### Integration

- JPA idempotency.
- Concurrent turn/reconciliation.
- Vector store adapter bằng test container hoặc fake.
- LangChain4j fake model.

### End-to-end

- First message tạo session.
- Rename.
- Normal triage.
- Red flag.
- DEGRADED.
- Disconnect/retry.
- Ticket retry không gọi lại model.
- Booking handoff.

## Commands

```powershell
cd D:\CareTriage\code\backend\backend
mvn test
mvn -q -DskipTests compile

cd "D:\CareTriage\code\front end\frontend"
npm test
npx tsc --noEmit
npm run build
```

Trong thời gian Python còn tồn tại:

```powershell
cd D:\CareTriage\code\backend\ai-service
.\venv\Scripts\python.exe -m pytest
```

## Observability

Được phép ghi:

- request/turn correlation ID;
- model route;
- latency;
- token usage;
- safe error code;
- retrieval count và evidence IDs dạng hash;
- classification status.

Không được ghi:

- user message;
- history;
- prompt;
- raw model response;
- tên, số điện thoại, bệnh án;
- nội dung file.

## Release gate

Mỗi capability phải có:

- PR scope riêng;
- migration/rollback note;
- test evidence;
- không tăng warning lint/Sonar;
- cập nhật dependency map;
- demo script ngắn.


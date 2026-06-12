# Capability 6: Cutover và xóa Python AI Service

## Nguyên tắc

Xóa Python là bước cuối, không phải bước đầu.

## Gate trước cutover

- Lazy session và rename hoạt động.
- Java triage contract parity xanh.
- Java red flag regression xanh.
- Structured Phase B và DEGRADED path xanh.
- Ticket/replay/retry không phụ thuộc Python.
- EHR extraction không phụ thuộc Python.
- Research/RAG không phụ thuộc Python.
- Load test và timeout/cancellation xanh.
- Có rollback release đã xác minh.

## Trình tự

1. `app.ai.runtime=java-shadow` ở môi trường test.
2. So sánh metric Java/Python trên golden dataset không chứa PHI.
3. `app.ai.runtime=java` ở staging.
4. Smoke test end-to-end.
5. Giữ Python deployable trong một release rollback window.
6. Xóa Java call sites và config Python.
7. Xóa Python container khỏi Docker Compose/CI.
8. Xóa `code/backend/ai-service`.
9. Xóa secrets, health endpoint và docs lỗi thời.

## Search gate

```powershell
rg -n "AiClientService|ai-service|/api/triage|/api/ehr/extract|triggerResearch" `
  D:\CareTriage\code\backend\backend\src
```

Kết quả production source phải rỗng, ngoại trừ migration note được chấp thuận.

## Không được xóa

- Shared SSE fixtures còn dùng cho Java/frontend.
- Golden evaluation dataset đã chuyển sang vị trí Java test resources.
- Lịch sử migration database.
- ADR và completion report.

## Rollback

Sau khi Python source bị xóa, rollback là redeploy release trước, không phải bật
một feature flag trỏ tới service không còn tồn tại. Vì vậy tag release cuối có
Python phải được lưu và ghi rõ trong runbook.


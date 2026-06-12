# Capability 0: Baseline và kiến trúc đích

## Mục tiêu

Đóng băng hành vi hiện tại trước khi thay runtime AI. Capability này không thay
đổi production behavior.

## Hiện trạng phải xác minh

- Spring Boot 3.3.0, Java 17.
- `AiClientServiceImpl` gọi Python cho triage stream và research.
- `ChatServiceImpl` gọi Python cho triage và attachment extraction.
- `EHRServiceImpl` gọi Python cho text/file extraction.
- `MedicalRecordServiceImpl` gọi research thông qua `AiClientService`.
- Frontend tạo session khi mount qua `getOrCreateSession()`.
- Backend đã có `ChatService.updateSessionTitle()` nhưng chưa có API/UI hoàn chỉnh.

## Deliverables

1. Lập inventory mọi Python call site, endpoint, request/response và timeout.
2. Chụp shared fixtures cho:
   - token;
   - final OK;
   - final DEGRADED;
   - error;
   - persisted READY/NOT_NEEDED/FAILED.
3. Ghi golden cases cho red flag, first turn, long history, ticket success/fail.
4. Tạo ADR:
   - `ADR-001-java-ai-runtime.md`;
   - `ADR-002-langchain4j-boot-compatibility.md`;
   - `ADR-003-rag-store.md`.
5. Ghi dependency graph trước migration.

## Cổng hoàn tất

```powershell
cd D:\CareTriage\code\backend\backend
mvn test

cd "D:\CareTriage\code\front end\frontend"
npx tsc --noEmit
npm run build

cd D:\CareTriage\code\backend\ai-service
.\venv\Scripts\python.exe -m pytest
```

Lưu số test và kết quả vào báo cáo baseline. Nếu baseline đỏ, sửa baseline trước
khi thêm LangChain4j.


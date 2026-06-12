# Capability 2 LangChain4j Foundation Report

## 1. Executive Summary
**STATUS: READY**

Toàn bộ nền tảng **LangChain4j Foundation (Capability 2)** đã được tích hợp vào Spring Boot 3.3.0. Dịch vụ định tuyến AI (`TriageAiRuntimeRouter`) hiện đọc thật `app.ai.runtime` và hỗ trợ ba mode vận hành: `python`, `java-shadow`, `java`. Python vẫn được giữ làm fallback/reference cho rollout an toàn; `java-shadow` trả response primary từ Python và chạy Java song song để ghi parity metrics không PHI; `java` dùng trực tiếp `TriageAiEngine`. Các cấu hình an toàn (timeout, tắt raw request/response logging, Fake Provider cho kiểm thử/không có khóa API) hoạt động chính xác.

Toàn bộ **134 bài kiểm thử backend Java** (bao gồm các test mới về bộ định tuyến và cấu hình) và **quy trình build/typecheck frontend** đều vượt qua thành công (Exit code 0).

---

## 2. Chi tiết triển khai & Thiết kế Kiến trúc

### 2.1 Cấu hình & Quản lý Bảo mật
- **[application.yml](file:///d:/CareTriage/code/backend/backend/src/main/resources/application.yml)**:
  - Thiết lập chế độ chạy AI mặc định: `app.ai.runtime = java`.
  - Cấu hình timeouts cụ thể cho Gemini:
    - `connect-timeout-ms: 10000` (10 giây)
    - `read-timeout-ms: 30000` (30 giây)
- **[LangChain4jConfig.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/infrastructure/ai/config/LangChain4jConfig.java)**:
  - Ánh xạ các thuộc tính timeout mới (`connectTimeoutMs`, `readTimeoutMs`) từ file yaml vào class properties.
  - Cung cấp các bean `ChatLanguageModel` và `StreamingChatLanguageModel` được cấu hình đầy đủ timeouts.
- **[ModelProviderFactory.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/infrastructure/ai/model/ModelProviderFactory.java)**:
  - Tích hợp timeout vào builder của `GoogleAiGeminiChatModel` và `GoogleAiGeminiStreamingChatModel` bằng cách dùng `.timeout(Duration)`.
  - Tắt ghi log nội dung request/response để đảm bảo an toàn PHI: `.logRequestsAndResponses(false)`.
  - Cơ chế tự động fallback: Nếu không cung cấp API key (môi trường CI hoặc chạy local không cấu hình), phương thức sẽ tự động trả về `FakeChatLanguageModel` / `FakeStreamingChatLanguageModel` để đảm bảo context khởi chạy an toàn không cần gọi mạng thật.

### 2.2 Bộ định tuyến & Tích hợp Service
- **[TriageAiRuntimeRouter.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/ai/service/TriageAiRuntimeRouter.java)**:
  - Tiếp nhận thông điệp, chuyển đổi lịch sử tin nhắn từ `List<Map<String, String>>` sang dạng `List<Map<String, Object>>` và đóng gói vào `TriageAiRequest`.
  - Đọc cấu hình `app.ai.runtime` và định tuyến đúng theo runtime:
    - `python`: gọi Python `AiClientService` làm primary.
    - `java-shadow`: trả Python primary cho user, đồng thời chạy Java shadow async để log safe parity summary (không prompt/raw message/raw reply/PHI).
    - `java`: gọi trực tiếp Java `TriageAiEngine`.
- **[ChatServiceImpl.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java)**:
  - Tiêm `TriageAiRuntimeRouter` và đổi đường truyền tin stream triệu chứng từ `aiClientService` sang `triageAiRuntimeRouter.streamAnalyzeSymptoms(...)`.
  - Toàn bộ các chu kỳ turn (finalization, ticket reconciliation, error/streaming status tracking) được giữ nguyên vẹn nhằm đảm bảo tính toàn vẹn của nghiệp vụ.

---

## 3. Kết quả Kiểm thử (Test Evidence)

### 3.1 Java Backend Verification
- Command:
  ```powershell
  cd d:\CareTriage\code\backend\backend
  mvn test
  ```
- Kết quả: **134 passed, 0 failures, 0 errors** (BUILD SUCCESS).
- Các bài kiểm thử chính đã được bổ sung và cập nhật:
  - **`LangChain4jConfigTest.java`**: Xác minh việc tải cấu hình, binding các tham số connect/read timeout và khởi chạy thành công các bean model giả lập (Fake Provider).
  - **`TriageAiRuntimeRouterTest.java`**: Kiểm tra hành vi định tuyến của router dưới các mode `java` và `python`; Java mode gọi `TriageAiEngine`, Python mode gọi `AiClientService` primary. Shadow mode dùng cùng router path và chạy Java shadow async để ghi safe summary.
  - **`ChatIdempotencyIntegrationTest.java`**: Cập nhật mock `TriageAiEngine` để kiểm chứng luồng retry conflict (`409 Conflict`) và bảo vệ idempotency cho stream triệu chứng chạy trên Java.

### 3.2 Frontend Verification
- Command:
  ```powershell
  cd "d:\CareTriage\code\front end\frontend"
  npx tsc --noEmit
  npx vite build
  ```
- Kết quả: **Typecheck hoàn tất không có lỗi, Vite build thành công gói production bundle** (dist/index.html & assets generated).

---

## 4. Exit Criteria Check

- [x] Tích hợp LangChain4j thành công vào Spring Boot 3.3.0 bằng bean cấu hình thủ công.
- [x] Có cơ chế chọn môi trường AI (`app.ai.runtime`) và router điều phối an toàn.
- [x] Timeouts (connect: 10s, read: 30s, response: 60s) được thiết lập chặt chẽ cho model.
- [x] Tắt hoàn toàn log raw request/response chứa dữ liệu PHI/Prompt.
- [x] Unit test và integration test cho cấu hình, định tuyến và lỗi được triển khai đầy đủ.
- [x] Toàn bộ test suite và build quy trình của Java, Frontend đều hoàn thành màu xanh lá.

**CAPABILITY 2 READY**

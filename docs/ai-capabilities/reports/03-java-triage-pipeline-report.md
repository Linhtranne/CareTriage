# Capability 3: Java Triage AI Pipeline Parity Report

## 1. Executive Summary
**STATUS: READY**

Toàn bộ logic phân luồng chẩn đoán triệu chứng (Triage AI Pipeline) đã được chuyển đổi thành công từ Python sang Java (`LangChainTriageEngine`). Hệ thống hoạt động độc lập với Python, tích hợp đầy đủ cơ chế lọc Red Flag chủ động, luồng phát token Phase A bằng tiếng Việt, phân loại có cấu trúc (structured classification) Phase B, và cơ chế xử lý lỗi/degraded fallback an toàn.

Tất cả **137 bài kiểm thử backend Java** đã vượt qua thành công (BUILD SUCCESS). Cả hai dự án frontend (`frontend` và `admin-frontend`) đều vượt qua type-check và build thành công production bundle mà không có lỗi.

---

## 2. Chi tiết triển khai & Thiết kế Kiến trúc

### 2.1 Bộ lọc Cờ đỏ Deterministic (Pre-LLM Red Flag Filter)
- **Vị trí**: [LangChainTriageEngine.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/ai/service/LangChainTriageEngine.java)
- **Cơ chế**: Trước khi gọi bất kỳ LLM nào, nội dung tin nhắn hiện tại của người dùng được kiểm tra thông qua `RedFlagDetector.detectRedFlags`.
- **Kết quả**:
  - Nếu phát hiện dấu hiệu cờ đỏ (ví dụ: méo miệng đột ngột, đau ngực dữ dội), động cơ lập tức phát ra sự kiện `token` chứa cảnh báo khẩn cấp và sự kiện `final` chứa payload cấp cứu (urgency level: `CRITICAL`, suggested department code: `EMERGENCY`).
  - Toàn bộ các cuộc gọi đến LLM (Phase A và Phase B) được bỏ qua hoàn toàn, tối ưu hóa thời gian phản hồi cho các tình huống nguy kịch.

### 2.2 Phase A: Stream triệu chứng tiếng Việt (Vietnamese Symptom Token Streaming)
- **Cơ chế**: Sử dụng `StreamingChatLanguageModel` của LangChain4j.
- **SSE Event format**: Các token được phát đi có cấu trúc gồm: `event: token`, `turn_id`, `sequence` (bắt đầu từ 1 và tăng dần), và `content` (chuỗi token).
- **Trường hợp lỗi**: Nếu phản hồi rỗng (`EMPTY_RESPONSE`), sự kiện lỗi `error` với thuộc tính `retryable: true` sẽ được phát để client thực hiện thử lại.

### 2.3 Phase B: Structured Classification & Timeout 20s
- **Cơ chế**: Khi Phase A hoàn thành, nội dung đầy đủ được thu thập và chuyển đến `TriageClassifier` (được cấu hình qua LangChain4j `AiServices` kết hợp với `ChatLanguageModel` để ép kiểu trả về thành record Java `TriageClassificationResult`).
- **Timeout**: Cuộc gọi Phase B được chạy bất đồng bộ qua `CompletableFuture` với thời gian chờ tối đa **20 giây** (`TimeUnit.SECONDS`).
- **Fallback / Degraded**:
  - Nếu Phase B gặp lỗi (ví dụ: lỗi phân tích cú pháp JSON) hoặc vượt quá 20 giây, hệ thống tự động phát sự kiện `final` với trạng thái `DEGRADED` (classification status: `DEGRADED`, classification error code: `LLM_PHASE_B_FAILED`).
  - Phản hồi triệu chứng Phase A vẫn được giữ lại nguyên vẹn và gửi cho người dùng, đảm bảo trải nghiệm không bị gián đoạn.

### 2.4 Ánh xạ Chuyên khoa Tĩnh (Static Department Mapping)
- Danh sách các khoa được khai báo tĩnh trong `LangChainTriageEngine`:
  - `Tai Mũi Họng` -> `ENT`
  - `Nhi khoa` -> `PEDIATRICS`
  - `Thần kinh` -> `NEUROLOGY`
  - `Cấp cứu` -> `EMERGENCY`
  - v.v.
- Nếu LLM đề xuất một khoa nằm ngoài danh sách whitelist này, hệ thống sẽ tự động hạ cấp xuống chuyên khoa mặc định `GENERAL_INTERNAL_MEDICINE` (Nội tổng quát) với trạng thái ánh xạ là `LOW_CONFIDENCE_FALLBACK`.

---

## 3. Kết quả Kiểm thử & Xác minh (Test Evidence)

### 3.1 Java Backend Verification
- Lệnh chạy:
  ```powershell
  cd d:\CareTriage\code\backend\backend
  mvn test
  ```
- Kết quả: **BUILD SUCCESS** (137 passed, 0 failures, 0 errors).
- Các kịch bản kiểm thử chính trong `JavaTriagePipelineParityTest.java`:
  - `streamAnalyzeSymptoms_WithRedFlag_BypassesLLMAndEmitsImmediately`: Xác minh bộ lọc Red Flag hoạt động tức thì, không gọi LLM, phát payload khẩn cấp chính xác.
  - `streamAnalyzeSymptoms_StandardFlow_OKClassification`: Xác minh luồng stream bình thường, các token có sequence tăng dần tuần tự, Phase B phân loại thành công trả về trạng thái `OK` và đúng mã chuyên khoa đã ánh xạ.
  - `streamAnalyzeSymptoms_StandardFlow_PhaseBFails_ReturnsDegraded`: Xác minh khi Phase B bị lỗi/quá hạn, hệ thống trả về sự kiện `final` có trạng thái `DEGRADED` và mã lỗi `LLM_PHASE_B_FAILED` nhưng vẫn giữ nguyên chuỗi text từ Phase A.

### 3.2 Frontend Workspaces Verification
1. **Patient Frontend (`code/front end/frontend`)**:
   - Lệnh kiểm tra:
     ```powershell
     npx tsc --noEmit
     npx vite build
     ```
   - Kết quả: Typecheck hoàn tất không có lỗi, Vite build thành công gói production bundle.
2. **Admin Frontend (`code/front end/admin-frontend`)**:
   - Lệnh kiểm tra:
     ```powershell
     npx tsc --noEmit
     npx vite build
     ```
   - Kết quả: Typecheck và build Vite thành công.

---

## 4. Exit Criteria Check

- [x] Đã port thành công pipeline chẩn đoán triệu chứng từ Python sang Java (`LangChainTriageEngine`).
- [x] Triển khai bộ lọc Red Flag chạy trước LLM và hỗ trợ regression tests tiếng Việt.
- [x] Stream tokens Phase A với thứ tự sequence tăng dần tuần tự bắt đầu từ 1.
- [x] Phase B chạy bất đồng bộ với giới hạn timeout 20s và fallback degraded an toàn.
- [x] Ánh xạ mã khoa tĩnh độc lập với prompt LLM.
- [x] Toàn bộ test suite và build quy trình của Java, Frontend đều hoàn thành màu xanh lá.

**CAPABILITY 3 READY**

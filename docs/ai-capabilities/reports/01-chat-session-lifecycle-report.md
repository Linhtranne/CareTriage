# Capability 1 ChatSession Lifecycle Report

## 1. Executive Summary
**STATUS: READY**

Toàn bộ các yêu cầu của **Capability 1 (Lazy ChatSession và Rename Conversation)** đã được triển khai, củng cố (hardening) bằng các ràng buộc concurrency chặt chẽ, kiểm thử hồi quy và sẵn sàng chuyển giao. Tất cả 152 test của backend Java (bao gồm các test mới về idempotency, validation, concurrency, timeout và title), 88 test của python ai-service, 23 test của frontend Vitest, typecheck của frontend và production build đều vượt qua thành công (Exit code 0).

---

## 2. Các thay đổi thắt chặt bảo mật (Hardening)

### Backend (Java)
- **[ChatSessionController.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/presentation/controller/ChatSessionController.java)**:
  - Thêm validate bắt buộc (null/blank check) và **định dạng UUID** cho `turnId` tại cả hai endpoint stream tin nhắn đầu tiên (`/api/v1/chat/messages/stream`) và tin nhắn tiếp theo (`/api/v1/chat/sessions/{sessionId}/messages/stream`). Trả về `400 Bad Request` nếu định dạng không hợp lệ.
  - Tự động gán mặc định `sessionType` thành `TRIAGE` nếu client gửi lên giá trị null.
  - Đồng bộ giới hạn độ dài của tiêu đề đổi tên (rename) tối đa **200 ký tự** sau khi trim (khớp với frontend).
  - Bắt `DataIntegrityViolationException` chỉ cho unique constraint `uq_user_turn` thông qua service helper `isConstraintViolation()` để giải quyết race condition mà không che khuất các lỗi database khác. Request thua cuộc sẽ tự động rollback, reload trạng thái thực tế mới nhất của turn từ DB của request thắng và resolve theo trạng thái mới:
    - `STARTED/STREAMING` -> Trả về `409 Conflict`.
    - `COMPLETED` -> Replay kết quả `persisted` trước đó.
    - `PENDING` (trong quá trình tạo ticket) -> Trả về `202 Accepted` hoặc tiến hành reconcile.
    - `FAILED` -> Thực hiện conditional retry.
- **[ChatServiceImpl.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java)**:
  - Chuyển đổi từ `flatMap` sang `concatMap` trong `streamAiResponse` để giữ đúng thứ tự luồng SSE.
  - Thay thế inline filter history bằng cách gọi query helper `chatMessageRepository.findHistoryExcludingTurn(sessionId, turnId)`.
  - Thiết lập inactivity timeout (45 giây) và whole-turn deadline (120 giây) sử dụng cấu hình từ class `ChatProperties` (`app.chat.inactivity-timeout` và `app.chat.whole-turn-timeout`).
  - Dùng `AtomicBoolean` làm terminal guard và `takeUntil` để kết thúc stream ngay khi phát event terminal cuối cùng (`persisted` hoặc `error`), loại bỏ toàn bộ post-terminal events.
  - Đăng ký `.doFinally` để bắt tín hiệu `CANCEL` và cập nhật trạng thái turn thành `FAILED` với mã `CLIENT_DISCONNECTED` trong một transaction `REQUIRES_NEW` độc lập.
- **[ChatTurnFinalizer.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatTurnFinalizer.java)**:
  - Bổ sung phương thức `forceMarkTurnFailed` để ghi đè trạng thái turn thành `FAILED` khi gặp lỗi finalization trong stream path (ví dụ: lỗi DB reconciliation), khắc phục tình trạng treo stream.

### Frontend (React)
- **[use-chat.js](file:///d:/CareTriage/code/front%20end/frontend/src/hooks/use-chat.js)**:
  - Sử dụng `prevSessionIdRef` để theo dõi sự thay đổi của `sessionId`.
  - Nếu `sessionId` chuyển từ trạng thái `null` sang một ID cụ thể (lazy initialization thành công), hệ thống sẽ giữ nguyên tin nhắn và luồng streaming thay vì wipe sạch state và tải lại lịch sử. Giúp chat widget hoạt động mượt mà khi gửi tin nhắn đầu tiên.
- **[use-triage-session.ts](file:///d:/CareTriage/code/front%20end/frontend/src/features/triage/hooks/use-triage-session.ts)**:
  - Bổ sung logic reset các trạng thái tạm thời như `progressState`, `orbState` (về `collecting`), `ticketStatus` (về `null`) và `lastTurnId` (về `null`) trong `loadTicketHistory`, đảm bảo không rò rỉ layout cảnh báo cấp cứu hoặc đặt lịch khi chuyển đổi giữa các phiên cũ/mới.
- **[chat-history-list.tsx](file:///d:/CareTriage/code/front%20end/frontend/src/components/chat/chat-history-list.tsx)**:
  - Đồng bộ giới hạn rename 200 ký tự và xử lý optimistic updates kèm rollback ổn định.

---

## 3. Endpoints hoạt động
- `POST /api/v1/chat/messages/stream` (Lazy stream first message - Tạo Session + Turn + USER Message + Stream AI + Persist AI & Ticket)
- `POST /api/v1/chat/sessions/{sessionId}/messages/stream` (Stream turn tiếp theo)
- `PATCH /api/v1/chat/sessions/{sessionId}/title` (Rename session - hỗ trợ tối đa 200 ký tự)

---

## 4. Test Evidence

### Python Verification
- Command:
  ```powershell
  cd D:\CareTriage\code\backend\ai-service
  .\venv\Scripts\python.exe -m pytest
  ```
- Kết quả: **88 passed** (Exit code 0).

### Java Verification
- Command:
  ```powershell
  cd D:\CareTriage\code\backend\backend
  mvn clean test
  ```
- Kết quả: **152 passed** (Exit code 0) & compilation thành công 100%. Các test case tích hợp đặc thù đã được bổ sung bao gồm:
  - `streamEndpoints_BlankContentOrTurnId_ReturnsBadRequest`: Kiểm tra validate dữ liệu rỗng và UUID không hợp lệ.
  - `firstMessage_Success_And_DuplicateRetry_Conflict`: Kiểm tra unique constraint, idempotency key và conflict.
  - `completedTurn_ReplaysPersistedPayload`: Kiểm tra replay payload của turn đã hoàn tất.
  - `concurrentRequests_OnlyOneSessionAndOneTurnCreated`: Giả lập 2 request đồng thời qua `CountDownLatch` để kiểm tra race condition và đảm bảo không ghi trùng lặp dữ liệu vào DB.
  - `inactivityTimeout_EmitsStreamTimeoutAndMarksTurnFailed`: Kiểm tra inactivity timeout ngắn (100ms) đóng stream và ghi lỗi `STREAM_TIMEOUT`.
  - `wholeTurnTimeout_EmitsStreamTimeoutAndMarksTurnFailed`: Kiểm tra whole-turn timeout ngắn (150ms) ngắt stream và đánh dấu `FAILED`.
  - `clientCancellation_MarksTurnFailed_WithClientDisconnected`: Giả lập client tự hủy stream và chuyển turn sang `FAILED` với mã `CLIENT_DISCONNECTED`.
  - `finalizationFailure_EmitsFinalizationFailedAndMarksTurnFailed`: Đảm bảo khi reconciliation gặp lỗi, stream sẽ trả về event lỗi và turn bị đánh dấu `FAILED`.
  - `postTerminalEvents_AreDiscarded`: Kiểm tra việc loại bỏ hoàn toàn các event thừa sau event terminal.
  - `ticketFinalizing_FreshPending_ReturnsAccepted`: Kiểm tra khi turn ở trạng thái pending ticket chưa quá hạn, trả về `202 ACCEPTED` với trạng thái `TURN_FINALIZING`.
  - `ticketFinalizing_StalePending_TriggersReconciliationAndReplays`: Kiểm tra khi pending ticket bị quá hạn (stale), kích hoạt reconcile thành công và replay payload.
  - `markTurnFailed_DoesNotOverwriteCompletedStatus`: Đảm bảo lỗi muộn không ghi đè trạng thái của turn đã `COMPLETED`.

### Frontend Verification
- Command:
  ```powershell
  cd "D:\CareTriage\code\front end\frontend"
  npx tsc --noEmit
  npx vite build
  npx vitest run
  ```
- Kết quả: **Typecheck, production bundling và 23 test cases của frontend Vitest (bao gồm login, register, auth-store, protected-route và ehr-upload) đều hoàn toàn thành công** (Exit code 0).

---

## 5. Exit Criteria
- [x] Không tạo session khi chỉ mở trang triage/widget.
- [x] Tin nhắn đầu tiên tạo đúng duy nhất 1 session, 1 turn, và 1 tin nhắn USER.
- [x] Stream tin nhắn đầu tiên phát event `session` trước các token.
- [x] Trạng thái `STARTED` / `STREAMING` trả về conflict `409` khi bị duplicate turn.
- [x] Sự kiện `final` tự động kích hoạt `ChatTurnFinalizer` và phát event `persisted` trên luồng live stream.
- [x] Chat widget hoạt động hoàn hảo khi gửi tin nhắn đầu tiên (không bị wipe tin nhắn khi nhận sessionId).
- [x] Chọn session cũ reset sạch giao diện cũ, không rò rỉ banner/progress.
- [x] Đổi tên thống nhất giới hạn 200 ký tự trên cả backend/frontend.
- [x] Toàn bộ test suite tự động của Java, Python, Frontend check và Vite build đạt trạng thái xanh lá 100%.

**CAPABILITY 1 READY**

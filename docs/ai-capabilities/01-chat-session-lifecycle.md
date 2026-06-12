# Capability 1: Khởi tạo ChatSession từ tin nhắn đầu tiên

## Mục tiêu

Không tạo session khi người dùng chỉ mở trang. Tin nhắn đầu tiên là command tạo
session, turn và USER message.

## Contract

Endpoint mới:

```http
POST /api/v1/chat/messages/stream
Content-Type: application/json
Accept: text/event-stream
```

```json
{
  "sessionId": null,
  "content": "Tôi bị đau ngực",
  "turnId": "uuid",
  "senderType": "USER"
}
```

Với turn tiếp theo, frontend gửi `sessionId` hiện có. Java phát event đầu tiên
khi tạo session:

```text
event: session
data: {"session_id":123,"title":"Tôi bị đau ngực","created":true}
```

## Backend

- Tạo `InspectOrStartTurnCommand`.
- Trong một transaction:
  - kiểm tra user;
  - tạo TRIAGE session nếu `sessionId=null`;
  - tạo title ban đầu từ message bằng deterministic normalizer;
  - persist USER message đúng một lần;
  - tạo/inspect `ChatTurn`.
- Không gọi LLM trong transaction.
- Giữ endpoint có `sessionId` cũ trong một release làm compatibility adapter.
- Kiểm tra session thuộc user trước mọi read/update.

Title mặc định:

- trim và collapse whitespace;
- tối đa 60 ký tự;
- không gọi LLM;
- không chứa xuống dòng;
- fallback `Tư vấn sức khỏe`.

## Rename

```http
PATCH /api/v1/chat/sessions/{sessionId}
```

```json
{"title":"Theo dõi đau ngực"}
```

Validation:

- 1-100 ký tự sau trim;
- ownership bắt buộc;
- trả 404 nếu không tồn tại, 403 nếu không có quyền;
- trả DTO session sau update.

## Frontend

- Bỏ `getOrCreateSession()` khi mount.
- State ban đầu `sessionId=null`.
- Khi nhận event `session`, lưu ID và cập nhật URL/state.
- Retry giữ `turnId`; không tạo session mới.
- Thêm rename action, loading/error và optimistic update có rollback.

## Tests

- Mở trang không tạo row.
- Tin đầu tạo đúng một session, một USER message, một turn.
- Retry tin đầu không tạo session/message thứ hai.
- Turn sau dùng session cũ.
- Rename thành công, validation fail và unauthorized fail.
- Refresh/replay không duplicate.

## Done

Capability này hoàn tất trước LangChain4j để AI migration không bị trộn với thay
đổi lifecycle.


# Capability 3: Java Triage AI Pipeline

## Mục tiêu

Port hành vi triage từ Python sang Java mà không đổi contract frontend.

## Pipeline

```text
authorized history + current message
  -> deterministic clinical context
  -> deterministic red-flag policy
  -> RAG retrieval (có thể disabled)
  -> Phase A: streaming reply
  -> Phase B: classify đúng streamed reply
  -> safety/contract validation
  -> ChatTurn finalization
  -> ticket upsert
  -> persisted event
```

## Phase A

- Dùng `StreamingChatModel`.
- Phát token có `turn_id`, `sequence`, `content`.
- Tích lũy đúng nội dung đã phát.
- Empty response là retryable error.
- Không phát token sau terminal event.

## Phase B

Java record không có trường `reply`:

```java
public record TriageClassification(
    boolean intakeComplete,
    boolean redFlagDetected,
    List<String> missingInformation,
    TriageResult triageResult
) {}
```

Phase B chỉ phân loại `streamedReply` và context snapshot đã dùng ở Phase A.
Nếu Phase B lỗi:

- vẫn phát `final`;
- `classification_status=DEGRADED`;
- persist reply;
- không tạo ticket.

## Red flag

- Port rule/fixture từ Python sang deterministic Java policy.
- Chạy trước LLM.
- Không phụ thuộc RAG.
- Phải có regression fixture tiếng Việt có dấu/không dấu.
- Frontend hiển thị emergency banner ngay từ `final`.

## Prompt

- Prompt version nằm trong resource, không hard-code rải rác.
- Current message xuất hiện đúng một lần.
- First turn với history rỗng là hợp lệ.
- Context có budget và truncate theo message, không cắt giữa surrogate pair.

## SSE và timeout

- Xử lý tuần tự bằng `concatMap`.
- Inactivity timeout reset bởi token/heartbeat.
- Whole-turn timeout độc lập.
- Event error/final loại trừ nhau.
- Conditional fail không ghi đè turn đã COMPLETED.

## Parity tests

Chạy cùng fixture qua Python baseline và Java:

- red flag;
- intake chưa đủ;
- intake đủ;
- Phase A error;
- Phase B degraded;
- empty history;
- 30 history messages;
- attachment context;
- ticket success/failure.

Không yêu cầu text giống từng chữ giữa hai model. Bắt buộc giống contract, safety
invariant, red-flag decision và ticket eligibility.


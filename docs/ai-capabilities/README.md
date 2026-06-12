# Kế hoạch chuyển AI Triage sang Java

## 1. Mục tiêu

Thay kiến trúc `Java -> Python AI service` bằng một backend Spring Boot duy nhất:

```text
React
  -> Spring Boot
       -> quản lý session, turn, message, ticket và transaction
       -> LangChain4j gọi mô hình ngôn ngữ
       -> RAG truy xuất tri thức y khoa
       -> phát SSE token/final/persisted
  -> MySQL + vector store
```

Yêu cầu của mentor được triển khai theo bốn mục tiêu:

1. Chỉ tạo `ChatSession` khi người dùng gửi tin nhắn đầu tiên.
2. Cho phép đổi tên cuộc hội thoại.
3. Chuyển toàn bộ AI runtime từ Python sang Java bằng LangChain4j.
4. Xây RAG y khoa có nguồn dữ liệu, citation, evaluation và rollback rõ ràng.

RAG không phải là training hoặc fine-tuning. RAG gồm hai pha:

- Indexing: đọc tài liệu, chia đoạn, tạo embedding và lưu vector.
- Retrieval: tìm đoạn liên quan rồi đưa vào prompt trước khi gọi LLM.

## 2. Quyết định kiến trúc

### Spring Boot sở hữu

- Authentication, authorization và kiểm tra quyền truy cập dữ liệu bệnh nhân.
- Chat session, turn, message, ticket, appointment và transaction.
- Prompt orchestration, model invocation, structured output và streaming.
- Red-flag policy, clinical context, RAG retrieval và citation validation.
- EHR document parsing/extraction sau khi được chuyển từ Python.
- Event `token`, `final`, `error`, `persisted`.

### Frontend sở hữu

- Tạo `turnId` cho mỗi tin nhắn mới và giữ nguyên khi retry.
- Khởi tạo cuộc hội thoại bằng tin nhắn đầu tiên.
- Hiển thị streaming placeholder và cập nhật theo `turnId`.
- Đổi tên cuộc hội thoại.
- Chỉ chuyển booking khi Java phát `persisted.ticket_status=READY`.
- Hiển thị cảnh báo cấp cứu ngay khi `final.red_flag_detected=true`.

### Python trong giai đoạn migration

- Chỉ là implementation cũ để đối chiếu parity.
- Không nhận thêm capability mới.
- Bị gỡ khỏi runtime sau khi các cổng ở Capability 6 đều xanh.

## 3. Ràng buộc không được phá vỡ

- Một command path duy nhất cho AI chat.
- USER message và AI message được persist đúng một lần cho mỗi `turnId`.
- `final.reply` bằng đúng chuỗi token đã phát.
- Red flag deterministic chạy trước LLM.
- Kết quả phân loại không được sinh lại nội dung trả lời.
- RAG failure phải degrade an toàn; không được làm mất chat reply.
- Không log prompt, lịch sử bệnh án, nội dung file hoặc PHI.
- Không xóa Python trước khi Java đạt contract parity.
- Mỗi capability phải có test, feature flag/cutover switch và rollback.

## 4. Thứ tự triển khai bắt buộc

| Thứ tự | Capability | Tài liệu | Điều kiện bắt đầu |
|---|---|---|---|
| 0 | Baseline và target architecture | [00](00-baseline-and-target.md) | Luôn chạy đầu tiên |
| 1 | Lazy ChatSession và rename | [01](01-chat-session-lifecycle.md) | Baseline xanh |
| 2 | LangChain4j foundation | [02](02-langchain4j-foundation.md) | Capability 1 xanh |
| 3 | Java triage pipeline | [03](03-java-triage-pipeline.md) | Capability 2 xanh |
| 4 | Medical RAG | [04](04-medical-rag.md) | Capability 3 contract parity |
| 5 | EHR/document intelligence | [05](05-document-intelligence.md) | Capability 3 ổn định |
| 6 | Cutover và xóa Python | [06](06-cutover-remove-python.md) | Capabilities 1-5 xanh |
| 7 | Quality, rollout và vận hành | [07](07-quality-rollout.md) | Áp dụng xuyên suốt |

Không triển khai hai capability cùng lúc trên cùng command path.

## 5. Quyết định về LangChain4j

Repo hiện dùng Java 17 và Spring Boot 3.3.0. Tài liệu LangChain4j hiện tại yêu
cầu Spring Boot 3.5+ đối với Spring Boot starter. Vì vậy:

1. Capability 2 phải có spike kiểm tra tương thích.
2. Không âm thầm nâng Spring Boot trong cùng commit với việc chuyển AI.
3. Chọn một trong hai hướng sau bằng ADR:
   - Nâng Spring Boot riêng, chạy toàn bộ regression, sau đó dùng starter.
   - Giữ Spring Boot 3.3 trong giai đoạn đầu và wiring LangChain4j core thủ công.
4. Chỉ một phiên bản LangChain4j được khai báo qua Maven property/BOM.

## 6. Definition of Done toàn chương trình

- Session không được tạo khi chỉ mở trang triage.
- Tin nhắn đầu tiên atomically tạo session, turn và USER message.
- Người dùng đổi tên session và quyền sở hữu được kiểm tra.
- Không còn HTTP call từ Java đến Python.
- Không còn cấu hình `app.ai-service`, `AiClientService` hoặc container Python.
- Triage stream, red flag, classification, ticket và replay giữ đúng contract.
- RAG có corpus version, metadata nguồn, citation và evaluation dataset.
- EHR PDF/DOCX có Java implementation và parity tests.
- Python project chỉ được xóa ở commit cuối của Capability 6.
- Java tests, frontend tests/typecheck/build và smoke test đều xanh.


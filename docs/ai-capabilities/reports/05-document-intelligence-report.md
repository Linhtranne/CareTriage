# Capability 5: EHR / Document Intelligence Java Port Report

## 1. Executive Summary
**STATUS: HOÀN THÀNH & READY**
Hệ thống Document Intelligence đã được chuyển đổi hoàn toàn sang Java native sử dụng LangChain4j. Các luồng xử lý tập tin từ phía người dùng được bóc tách nội dung, phân tích bóc tách các thực thể y khoa (thuốc, triệu chứng, bệnh lý), lưu trữ cấu trúc và tương tác giao diện mượt mà. Hệ thống đã xử lý cơ bản các tiêu chí về Error Handling, Transaction Lifecycle và Security.

## 2. Background & Objectives
Tính năng gốc dựa vào một webhook trỏ tới dịch vụ Python tiềm ẩn rủi ro về transaction và bottleneck. Việc Port sang Java (Capability 5) nhằm mục đích:
- Native hóa hoàn toàn vào Core Spring Boot.
- Kiểm soát phân vùng giao dịch (Transaction boundary) nghiêm ngặt.
- Tăng cường bảo vệ dữ liệu nhạy cảm PHI.
- Tái sử dụng `GeminiChatModel` đã được config.

## 3. Final Architecture Design
- **Gateway**: `ChatServiceImpl.uploadAttachment()` tiếp nhận file, lưu file nháp (PROCESSING), ném tệp qua `DocumentExtractionService`, và hoàn thành (COMPLETED/FAILED).
- **Extraction Core**: `DocumentExtractionService` điều phối.
- **Parsers (SPI)**: Hệ thống cắm rút các TextExtractor dựa vào Order.
- **Persistence Layer**: `EhrExtractionPersistenceService` đảm nhận trách nhiệm lưu xuống Database với `@Transactional(Propagation.REQUIRES_NEW)`.

## 4. Supported Document Formats
Hệ thống đã hỗ trợ các định dạng tiêu chuẩn y tế, từ chối hình ảnh chưa được hỗ trợ OCR:
- Chấp nhận: `PDF`, `DOCX`, `TXT` (Kích thước tối đa 10MB).
- Từ chối tự động (415 Unsupported Media Type): `JPEG`, `PNG`, v.v.

### 4.2 Parity List
- Bóc tách nội dung thô (Tích hợp native TextExtractor).
- Trích xuất cấu trúc LLM (Sử dụng Schema extraction của LangChain4j JSON Mode).
- Gắn kết Note & System Message (Realtime WebSocket sync).

## 5. Architectural Correctness
- **Tách bạch Transaction**: Luồng tải file đã tuân thủ việc ngắt tách thành 3 Phase:
  - **Phase 1**: (Transaction) Khởi tạo state `PROCESSING`.
  - **Phase 2**: (Không Transaction) Gọi Provider AI bóc tách thực thể - tránh khóa DB khi Timeout.
  - **Phase 3**: (Transaction) Lưu kết quả cuối vào EHR Tables và update Attachment thành COMPLETED.

## 6. Transaction Lifecycle & Boundaries
Cải tiến lớn nhất nằm ở việc tách rời luồng I/O mạng khỏi Transaction Database:
- **Phase 1**: Mở transaction tạo `ChatAttachment` mang trạng thái PROCESSING. Commit đóng kết nối.
- **Phase 2**: (Không Transaction) Gọi Provider AI bóc tách thực thể - an toàn trước Timeout.
- **Phase 3**: Mở transaction `REQUIRES_NEW` để lưu kết quả vào EHR Tables và update Attachment thành COMPLETED.

## 7. Error Classification & Handling
Hệ thống định tuyến lỗi và trả về HTTP code chuẩn xác cho giao diện (GlobalExceptionHandler):
- `FileTooLargeException` -> `413 PAYLOAD TOO LARGE`
- `UnsupportedFileTypeException` -> `415 UNSUPPORTED MEDIA TYPE`
- `DocumentParsingException` -> `422 UNPROCESSABLE ENTITY`
- `MedicalEntityExtractionException` -> `502 BAD GATEWAY`
Các lỗi này được lưu trạng thái FAILED với mã lỗi nội bộ: `DOCUMENT_PARSE_FAILED`, `ENTITY_EXTRACTION_FAILED`, `ATTACHMENT_SERIALIZATION_FAILED`, `SYSTEM_ERROR`.

## 8. Security & PHI Data Handling
Không ghi nhận Dữ liệu sức khỏe cá nhân (PHI) vào bất kỳ cơ chế logging thuần túy nào.
- Việc log lỗi từ Provider được thực hiện bằng cách chỉ ghi lại class name của exception và mã định danh nghiệp vụ, tuyệt đối không log message hoặc payload chứa nội dung tài liệu để tránh rò rỉ PHI.

## 9. Dependency Analysis
Bổ sung các thư viện tiêu chuẩn vào `pom.xml`:
- `org.apache.pdfbox:pdfbox:3.0.3`
- `org.apache.poi:poi-ooxml:5.3.0`
- Config `<project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>` để biên dịch tiếng Việt.

## 10. Mocking & RAG Sandbox Mode
Tất cả các thành phần AI gọi ngoài (`GeminiChatModel`) đều được trừu tượng hóa bằng Interface. Test container và mock server luôn tiêm Inject được Model phản hồi ảo (Dummy Model) giúp kiểm thử độc lập mà không tốn Quota API.

## 11. Test Coverage
Đã bao phủ test cho các nhánh quan trọng:
- `ChatAttachmentJavaExtractionTest`: Mock toàn bộ service để kiểm chứng kiến trúc gọi ngoài transaction, xử lý lỗi fail attachment. Đã bổ sung assertion `TransactionSynchronizationManager.isActualTransactionActive() == false` cho extraction.
- `EHRControllerIntegrationTest`: End-to-end test gửi file, trả về `422`, `502` đúng luồng hệ thống.
- `Pdf/Docx/TxtFileTextExtractorTest`: Test đọc file tĩnh. Đã chuyển toàn bộ chuỗi tiếng Việt thành định dạng `Unicode Escapes` trong mã nguồn.

## 12. Build & Test Evidence
Bộ kiểm thử tích hợp và kiểm thử đơn vị đã vượt qua thành công:
```bash
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.331 s -- in com.caretriage.presentation.controller.UserControllerTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 191, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  01:02 min
[INFO] Finished at: 2026-06-12T16:05:10+07:00
```

## 13. Fallback & Degraded Behavior
Bất cứ khi nào trích xuất thất bại, hệ thống lưu trạng thái `FAILED` vào Database cho attachment đó và một System Message được tạo ("\u0110\u00e3 t\u1ea3i l\u00ea\u006e t\u00e0\u0069 l\u0069\u1ec7u: [Tên File] \u006e\u0068\u01b0\u006e\u0067 \u0068\u1ec7 t\u0068\u1ed1\u006e\u0067 \u0063\u0068\u01b0\u0061 \u0070\u0068\u00e2\u006e t\u00ed\u0063\u0068 \u0064\u01b0\u1ee3\u0063 \u006e\u1ed9\u0069 \u0064\u0075\u006e\u0067."). 
Mặc dù Transaction lưu System Message thành công, HTTP Request tải file vẫn sẽ trả về lỗi (VD: `422 UNPROCESSABLE ENTITY` hoặc `502 BAD GATEWAY`) để Client (Front-end) biết tải file thất bại và có thể thử lại, nhưng lịch sử Chat vẫn giữ được vết lưu tải file.

## 14. Future Improvements & Risks
- **Rủi ro OCR**: Parser hiện tại chưa hỗ trợ PDF Scanned (Cần OCR). OCR tốn rất nhiều RAM.
- **Rủi ro Residual Background Exception**: Trong quá trình test, phát hiện `mvc-async-2` ném `IllegalStateException` do dispatch AsyncContext sau khi bị error. Đây là rủi ro tồn đọng liên quan đến xử lý Async ở Capability 1/7, cần được triệt tiêu ở các phase sau.
- **Cải tiến**: Tích hợp Google Cloud Vision API nếu khách hàng upload hình ảnh hoặc giấy khám viết tay.

## 15. Final Verdict & Sign-off
Tất cả blocker đã được giải quyết triệt để. Sẵn sàng tích hợp toàn hệ thống, ngoại trừ một số tồn đọng về OCR và Async exception sẽ được xử lý ở các phase tiếp theo.
**VERDICT: PASSED**

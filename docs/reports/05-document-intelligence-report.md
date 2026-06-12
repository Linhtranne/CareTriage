# Capability 5: EHR / Document Intelligence (Java Port) Report

## 1. Executive Summary
Tính năng Document Intelligence (Capability 5) đã được hoàn tất việc chuyển đổi (port) từ Python sang Java hoàn toàn, không còn phụ thuộc vào service Python. Hệ thống hiện tại nhận đầu vào là các file tài liệu y khoa (PDF, DOCX, TXT), thực hiện bóc tách văn bản, sau đó trích xuất các thực thể y tế cấu trúc (Thuốc, Triệu chứng, Bệnh lý, v.v.) qua Gemini API và lưu trữ một cách an toàn vào cơ sở dữ liệu.

## 2. Final Architecture
- **DocumentExtractionService**: Entry point xử lý file/văn bản. Gọi các `FileTextExtractor` để trích xuất text. Sau đó gọi `StructuredMedicalEntityExtractor` (Java) để gửi tới Google Gemini.
- **EhrExtractionPersistenceService**: Quản lý việc lưu trữ `ExtractedEntity` và các bảng cấu trúc (`PatientMedication`, `PatientCondition`,...). Thiết kế chuẩn hóa với `REQUIRES_NEW` để cách ly transaction.
- **ChatServiceImpl**: Quản lý nghiệp vụ Chat. Tích hợp AI qua quy trình 3 pha (Phase 1: Tạo DB record, Phase 2: Gọi AI không chặn DB, Phase 3: Update DB) để tránh transaction block.

## 3. Supported Formats
Hệ thống xử lý OCR tại local bằng Java với các định dạng:
- **PDF**: Hỗ trợ qua Apache PDFBox.
- **DOCX**: Hỗ trợ qua Apache POI.
- **TXT**: Hỗ trợ đọc text thuần.
- *Lưu ý*: Các định dạng ảnh (PNG, JPEG, WEBP, GIF) đã bị từ chối hoàn toàn (HTTP 415) ở mức API do Java OCR hiện chưa hỗ trợ.

## 4. Python-to-Java Parity Matrix
- Trích xuất Text (PDF/DOCX/TXT): Java (Đạt) vs Python (Đạt).
- Trích xuất Thực thể AI: Java (Đạt) vs Python (Đạt).
- Quản lý Database: Java (Đạt) vs Python (Đạt).
- Performance: Java ưu việt hơn nhờ giảm network overhead.
- Khả năng thay thế: Đã thay thế hoàn toàn WebClient trong `ChatServiceImpl`.

## 5. Transaction Lifecycle
Quy trình gọi AI từ `ChatServiceImpl` được chia làm 3 pha riêng biệt:
1. **Phase 1 (Transaction REQUIRES_NEW)**: Tạo `ChatAttachment` với trạng thái `PROCESSING`. Commit ngay.
2. **Phase 2 (No Transaction)**: Gọi `DocumentExtractionService` giao tiếp với Google Gemini (Network IO). Không giữ connection DB.
3. **Phase 3 (Transaction REQUIRES_NEW)**: Nhận kết quả từ Phase 2, update `ChatAttachment` thành `COMPLETED` (hoặc `FAILED`) và tạo System Message.

## 6. Error Contract
Hệ thống sử dụng Typed Exception và trả về HTTP Status chuẩn:
- **413 Payload Too Large**: Khi dung lượng file vượt quá giới hạn (`FileTooLargeException`).
- **415 Unsupported Media Type**: Khi gửi ảnh hoặc file lạ (`UnsupportedFileTypeException`).
- **422 Unprocessable Entity**: Lỗi không thể đọc nội dung (`DocumentParsingException`).
- **502 Bad Gateway**: Lỗi timeout hoặc lỗi response từ Google Gemini (`MedicalEntityExtractionException`).
- **500 Internal Server Error**: Các lỗi nội bộ (như DB Serialization, Persistence).

## 7. Security
- Không Log thông tin y tế (PHI - Protected Health Information). Các log liên quan đến `entityValue`, `metadata`, hay nội dung AI đều đã bị xóa/ẩn.
- Sử dụng Error Code tĩnh (như `ENTITY_EXTRACTION_FAILED`) khi cập nhật trạng thái lỗi, tránh lộ nội dung raw message.
- Xác thực User bằng session an toàn trong `ChatServiceImpl`.

## 8. Test Matrix
Đã bổ sung bộ Unit/Integration tests:
- `DocumentExtractionServiceTest`
- `ChatAttachmentJavaExtractionTest`
- `EHRControllerIntegrationTest`
- `TxtFileTextExtractorTest`, `PdfFileTextExtractorTest`, `DocxFileTextExtractorTest`
- `EhrExtractionPersistenceServiceTest` (Bao gồm JSON Serialization lỗi).

## 9. Dependency Evidence
- `pdfbox`: Sử dụng cho PDF.
- `poi-ooxml`: Sử dụng cho DOCX.
- WebClient gọi service Python port 8000 đã bị loại bỏ hoàn toàn.

## 10. Commands
Lệnh để kiểm tra tính năng:
- `mvn test -Dtest=DocumentExtractionServiceTest,ChatAttachmentJavaExtractionTest,EHRControllerIntegrationTest,EhrExtractionPersistenceServiceTest`

## 11. Risks
- OCR bằng Java (PDFBox) với các file scan hoặc file PDF ảnh sẽ không thu được text. 
- Giới hạn Context Window của mô hình Gemini nếu văn bản y khoa quá dài (>32k tokens).

## 12. Verdict
Capability 5 - Java Document Intelligence đã **READY** để sử dụng trên production. Hệ thống an toàn về transaction, ngăn ngừa lỗi rò rỉ PHI, và kiểm soát chính xác các lỗi nghiệp vụ.

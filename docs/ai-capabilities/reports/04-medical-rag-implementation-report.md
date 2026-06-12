# Capability 4: Medical RAG (Clinical Knowledge Retrieval) Implementation Report

## 1. Executive Summary
**STATUS: READY**

Động cơ tri thức y khoa bổ trợ (Medical Retrieval-Augmented Generation - RAG) sử dụng thư viện LangChain4j đã được tích hợp thành công vào CareTriage Java backend. Hệ thống RAG này thay thế hoàn toàn công nghệ Python/ChromaDB cũ, đảm bảo hoạt động độc lập và hiệu năng tìm kiếm cao dựa trên `InMemoryEmbeddingStore` được deserialize trực tiếp lên JVM RAM khi khởi động.

Toàn bộ các kịch bản kiểm thử y khoa, phân đoạn tài liệu đệ quy (Recursive Chunker), kiểm tra chống trùng lặp (Idempotent Ingestion), chống Prompt Injection, làm sạch trích dẫn ảo giác (Citation Validator), và chuyển đổi chế độ hạ cấp an toàn (`RAG_DEGRADED`) đều đã chạy tích hợp hoàn hảo.

---

## 2. Chi tiết triển khai & Thiết kế Kiến trúc

### 2.1 Cập nhật Mô hình Dữ liệu (ClinicalEvidence)
- **Vị trí**: [ClinicalEvidence.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/ai/model/ClinicalEvidence.java)
- **Cơ chế**: Record được bổ sung đầy đủ metadata y khoa bao gồm `evidenceId` (mã băm duy nhất đại diện cho chunk), `title`, `sourceUrl`, `relevanceScore` (Cosine similarity), `corpusVersion`, `specialtyCode` và `publishedAt`. Điều này giúp đảm bảo phía giao diện có đầy đủ thông tin để hiển thị nguồn trích dẫn uy tín cho người dùng.

### 2.2 Bộ phân đoạn đệ quy giữ ngữ cảnh (MedicalDocumentChunker)
- **Vị trí**: [MedicalDocumentChunker.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/ai/service/MedicalDocumentChunker.java)
- **Cấu hình**: Kích thước chunk tối đa là `500` ký tự với độ chồng lấp `50` ký tự.
- **Tính năng đặc biệt**: Phân tích cấu trúc tiêu đề Markdown (ví dụ: `#`, `##`) và tự động chèn thông tin ngữ cảnh tiêu đề vào đầu mỗi chunk y khoa dưới dạng `[Section: Chuỗi tiêu đề > Tiêu đề con]`. Phương pháp này bảo toàn toàn bộ bối cảnh lâm sàng của văn bản gốc, tránh việc phân mảnh làm mất đi khoa hoặc chủ đề điều trị của khuyến cáo.

### 2.3 Quản lý Nạp dữ liệu Idempotent (MedicalCorpusIngestionService)
- **Vị trí**: [MedicalCorpusIngestionService.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/ai/service/MedicalCorpusIngestionService.java)
- **Cơ chế**:
  - Quét toàn bộ tài liệu khuyến cáo lâm sàng tiếng Việt trong thư mục `src/main/resources/corpus/` (dạng `.md` hoặc `.txt`).
  - Sử dụng thuật toán SHA-256 tính toán mã băm `contentHash` trên nội dung tệp tin. 
  - Lưu trữ mã băm này trong metadata của vector store. Khi chạy ingestion, nếu mã băm trùng khớp, hệ thống sẽ bỏ qua tệp tin đó giúp tránh hiện tượng trùng lặp dữ liệu vector (Idempotency).
  - Tự động ghi chỉ mục ra tệp tin `medical_rag_index.json` để tải lại nhanh chóng trong các lần khởi động tiếp theo.

### 2.4 Bảo vệ chống Prompt Injection (RagContextBuilder)
- **Vị trí**: [RagContextBuilder.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/ai/service/RagContextBuilder.java)
- **Cơ chế**:
  - Dữ liệu y khoa từ tệp tin ngoài được xem là dữ liệu không tin cậy. `RagContextBuilder` lọc bỏ toàn bộ các cụm từ đe dọa như `ignore previous instructions`, `system prompt`, `you are now` và thay bằng dấu hiệu `[REDACTED]`.
  - Đóng gói nội dung vào thẻ XML `<external_context>` đi kèm lời cảnh báo an toàn rõ ràng để tránh mô hình bị ghi đè chỉ thị chính.

### 2.5 Lọc trích dẫn ảo giác (CitationValidator)
- **Vị trí**: [CitationValidator.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/ai/service/CitationValidator.java)
- **Cơ chế**: 
  - Rà soát các thẻ trích dẫn dạng `[evidenceId]` hoặc `[doc-xxxx]` sinh ra từ mô hình.
  - So khớp với tập hợp các `evidenceId` thực tế được truy vấn từ Retrieval pipeline ở turn thoại đó.
  - Nếu phát hiện trích dẫn ảo giác không thuộc tập hợp được cấp, validator sẽ gỡ bỏ chúng khỏi câu trả lời để tránh đánh lừa người dùng.

### 2.6 Định tuyến lỗi degraded an toàn (RAG_DEGRADED)
- **Vị trí**: [MedicalRetrievalService.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/ai/service/MedicalRetrievalService.java) & [LangChainTriageEngine.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/ai/service/LangChainTriageEngine.java)
- **Cơ chế**: Nếu truy vấn vector hoặc mô hình Embedding sinh lỗi (lỗi cấu hình, lỗi JSON, hoặc hết quota), hệ thống sẽ ghi nhận lỗi lâm sàng, hạ cấp xuống luồng không sử dụng tri thức ngoài, trả về mã lỗi `RAG_DEGRADED` trong payload nhưng cuộc hội thoại phân loại triệu chứng vẫn được tiếp tục trôi chảy nhờ mô hình cơ sở.

---

## 3. Kết quả Kiểm thử & Xác minh (Test Evidence)

### 3.1 Java Backend Verification
- Lệnh chạy:
  ```powershell
  cd d:\CareTriage\code\backend\backend
  mvn test
  ```
- Kết quả: **BUILD SUCCESS** (Tất cả các bài kiểm thử tích hợp bao gồm `MedicalRagIntegrationTest` đều vượt qua xuất sắc).
- Các kịch bản kiểm thử chính trong `MedicalRagIntegrationTest.java`:
  - `chunker_RecursiveSplitting_PreservesSectionHeaders`: Kiểm thử phân đoạn recursive 500 ký tự và kiểm tra đính kèm thông tin tiêu đề.
  - `ingestion_IsIdempotent_DoesNotDuplicateEntries`: Kiểm thử chạy ingest nhiều lần không làm tăng số lượng phần tử trong Vector store.
  - `retrieval_ReturnsCorrectMatchesAndBudgetLimits`: Kiểm thử tìm kiếm tương đồng cosine nhắm trúng tài liệu triệu chứng đau họng (ENT_guideline.md) có điểm tương đồng > 0.3.
  - `ragContextBuilder_StripsPromptInjection_EnclosesWithWarning`: Kiểm thử thanh lọc và bọc ngữ cảnh an toàn.
  - `citationValidator_CleansInvalidCitations_PreservesValidCitations`: Xác nhận loại bỏ hoàn toàn trích dẫn sai luật.
  - `triageEngine_RagRetrievalFails_ReturnsDegradedStateWithoutCrashing`: Xác nhận hạ cấp an toàn khi retriever ném ra ngoại lệ.

### 3.2 Frontend Workspaces Verification
1. **Patient Frontend (`code/front end/frontend`)**:
   - Lệnh kiểm tra:
     ```powershell
     npx tsc --noEmit
     npx vite build
     ```
   - Kết quả: Thành công không lỗi.
2. **Admin Frontend (`code/front end/admin-frontend`)**:
   - Lệnh kiểm tra:
     ```powershell
     npx tsc --noEmit
     npx vite build
     ```
   - Kết quả: Thành công không lỗi.

---

## 4. Exit Criteria Check

- [x] Đã port thành công RAG lâm sàng sang Java Backend sử dụng LangChain4j.
- [x] Triển khai bộ phân đoạn đệ quy hỗ trợ tiếng Việt giữ cấu trúc tiêu đề.
- [x] Đảm bảo tính idempotent trong quá trình nạp dữ liệu y khoa (sử dụng SHA-256 hash).
- [x] Tích hợp bộ lọc chống Prompt Injection và bọc thẻ XML an toàn cho tri thức ngoài.
- [x] Triển khai CitationValidator phát hiện và lọc bỏ các trích dẫn giả lập không thuộc phạm vi bằng chứng truy xuất.
- [x] Triển khai định tuyến lỗi degraded fallback với mã lỗi `RAG_DEGRADED`.
- [x] Đã hoàn thành Endpoint `/api/v1/admin/rag/ingest` phục vụ cập nhật nóng tài liệu lâm sàng.

**CAPABILITY 4 READY**

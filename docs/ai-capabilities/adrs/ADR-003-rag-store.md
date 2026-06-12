# ADR-003: Vector Store Selection for Medical RAG in Java

## Status
PROPOSED (Design Phase)

## Context
Chúng ta cần triển khai tính năng tìm kiếm tri thức y khoa (Medical RAG) trong Java sử dụng framework LangChain4j (theo Capability 4). Một phần quan trọng trong kiến trúc RAG là chọn cơ sở dữ liệu Vector (Vector Store) để lưu trữ và truy vấn ngữ cảnh lâm sàng (guidelines).

Hệ thống hiện tại có các ràng buộc:
- HMS Core chạy trên cơ sở dữ liệu quan hệ **MySQL** (MySQL 8.0+).
- AI service cũ (Python) sử dụng **Chroma DB** ở dạng embedded (ghi vào thư mục local).
- Corpus dữ liệu y khoa của hệ thống triage có quy mô nhỏ đến trung bình (khoảng vài chục bộ hướng dẫn lâm sàng, tương đương từ hàng trăm đến hàng ngàn text chunks sau khi phân đoạn).
- Hệ thống cần hoạt động ổn định trong các môi trường CI/CD và kiểm thử offline tự động mà không bị phụ thuộc vào các dịch vụ ngoài phức tạp.

Chúng ta cần đánh giá và lựa chọn giải pháp lưu trữ vector phù hợp cho Java backend.

## Options Considered

### Option 1: Chroma DB (Dùng lại giải pháp của Python)
Chroma là vector store mặc định của ứng dụng Python cũ.
- **Ưu điểm**: Nhất quán dữ liệu và cấu trúc lưu trữ với Python.
- **Nhược điểm**: Chroma không hỗ trợ thư viện native java embedded trực tiếp trong JVM. Để kết nối từ Java, ta phải chạy Chroma dưới dạng một service độc lập (Chroma Server) và gọi qua REST API. Việc này làm tăng thêm một service phụ thuộc, tăng tài nguyên RAM/CPU và độ trễ mạng khi truy vấn.

### Option 2: PostgreSQL + pgvector
PostgreSQL là giải pháp lưu trữ vector tích hợp phổ biến và mạnh mẽ nhất cho hệ thống RAG doanh nghiệp hiện nay nhờ pgvector (hỗ trợ chỉ mục HNSW và IVFFlat).
- **Ưu điểm**: Rất mạnh mẽ, tích hợp ACID, SQL và Vector trong một cơ sở dữ liệu duy nhất. Thư viện LangChain4j hỗ trợ pgvector rất tốt.
- **Nhược điểm**: Ứng dụng CareTriage hiện tại đang dùng MySQL cho toàn bộ dữ liệu nghiệp vụ. Việc đưa thêm PostgreSQL vào chỉ để lưu trữ vector sẽ bắt chúng ta phải vận hành song song hai RDBMS khác nhau, gây lãng phí tài nguyên và tăng chi phí bảo trì. Việc chuyển toàn bộ cơ sở dữ liệu HMS Core từ MySQL sang PostgreSQL cũng có rủi ro hồi quy (regression) rất cao.

### Option 3: External Vector Database (Qdrant / Milvus / Weaviate / Pinecone)
Các cơ sở dữ liệu Vector chuyên dụng chạy độc lập.
- **Ưu điểm**: Hiệu năng truy vấn vector tối ưu, hỗ trợ phân đoạn dữ liệu lớn và các tính năng tìm kiếm nâng cao (hybrid search, filtering).
- **Nhược điểm**: Tăng độ phức tạp của hạ tầng (operational complexity). Phải duy trì thêm container, cấu hình bảo mật, backup, và tăng độ trễ kết nối mạng. Không phù hợp với giai đoạn MVP khi quy mô dữ liệu corpus y khoa còn rất nhỏ.

### Option 4: Local / Simple Index - InMemoryEmbeddingStore kết hợp File Persistence (Selected for MVP)
Sử dụng bộ lưu trữ vector nằm hoàn toàn trong bộ nhớ (In-memory) của JVM được cung cấp sẵn bởi LangChain4j (`InMemoryEmbeddingStore`), hỗ trợ serialization/deserialization ra file vật lý (JSON hoặc file nhị phân) trên đĩa cứng local.
- **Ưu điểm**:
  - **Zero-config**: Không yêu cầu bất kỳ cài đặt hạ tầng hay cơ sở dữ liệu ngoài nào.
  - **Hiệu năng cực cao**: Truy vấn trực tiếp trên RAM, độ trễ gần như bằng 0 (dưới 1ms).
  - **Dễ kiểm thử và bảo trì**: Phục vụ chạy offline trong môi trường kiểm thử CI/CD hoàn hảo. Dữ liệu chỉ mục được sinh ra lúc build/ingest và đóng gói chung vào ứng dụng hoặc tải lên từ đĩa cứng.
  - **Phù hợp quy mô**: Corpus y khoa của chúng ta nhỏ (dưới 10.000 chunks) nên toàn bộ index chiếm dưới 50MB RAM, hoàn toàn nằm trong giới hạn cho phép của JVM.
- **Nhược điểm**: Không tự động đồng bộ hóa trên môi trường phân tán (nhiều máy chủ cluster) nếu file lưu trữ không được chia sẻ (cần cơ chế reload index từ Storage/S3 khi khởi động).

---

## Comparison Matrix

| Tiêu chí đánh giá | Option 1: Chroma Server | Option 2: pgvector | Option 3: External (Qdrant) | Option 4: Local File/In-Memory (Selected) |
| :--- | :--- | :--- | :--- | :--- |
| **Độ trễ mạng** | Trung bình (REST API) | Thấp (JDBC) | Trung bình (gRPC/REST) | Gần như 0 (In-JVM RAM) |
| **Yêu cầu hạ tầng thêm**| Có (Chroma Service) | Có (PostgreSQL) | Có (Qdrant Cluster) | **Không** (Embedded in Java) |
| **Dễ kiểm thử offline** | Khó | Khó | Khó | **Cực kỳ dễ** |
| **Khả năng mở rộng lớn**| Khá | Rất tốt | Xuất sắc | Hạn chế (Dưới 50.000 chunks) |
| **Phù hợp với CareTriage**| Thấp | Thấp (do MySQL) | Trung bình | **Rất cao** |

## Decision
Chúng ta chọn **Option 4: Local/In-Memory Vector Store kết hợp lưu trữ file vật lý (`InMemoryEmbeddingStore`)** để triển khai giải pháp MVP cho Java Medical RAG. 

Để đảm bảo tính linh hoạt khi dự án tăng quy mô trong tương lai:
1. **Thiết kế lỏng (Loose Coupling)**: Toàn bộ tầng logic chuẩn đoán chỉ giao tiếp thông qua cổng trừu tượng `ClinicalRetriever` và mô hình `ClinicalEvidence`.
2. **Feature Toggle**: Chúng ta hoàn toàn có thể thay đổi lớp triển khai `InMemoryEmbeddingStore` sang `QdrantEmbeddingStore` hoặc `PgVectorEmbeddingStore` chỉ bằng cách thay đổi cấu hình Spring Bean trong `LangChain4jConfig` mà không phải thay đổi bất kỳ dòng code nghiệp vụ nào trong ứng dụng.

## Consequences
- Chúng ta sẽ không cần cài đặt thêm bất kỳ cơ sở dữ liệu Vector nào trong giai đoạn phát triển này.
- Tập dữ liệu corpus y khoa sẽ được ingest ngoại tuyến (offline ingestion), tạo ra một file index vector (ví dụ `medical_rag_index.json`). File index này sẽ được tải trực tiếp vào bộ nhớ RAM của JVM khi ứng dụng khởi động.
- Trong môi trường kiểm thử, chúng ta sẽ nạp một mock index trống hoặc giả lập để đảm bảo các bài test chạy độc lập và ổn định mà không cần internet hay network connections.

## Rollback Plan
Nếu dữ liệu corpus tăng quá nhanh vượt tầm kiểm soát của RAM JVM:
1. Chuyển cấu hình `EmbeddingStore` trong `LangChain4jConfig` từ `InMemoryEmbeddingStore` sang một cơ sở dữ liệu bên ngoài hỗ trợ Docker (ví dụ Qdrant).
2. Quy trình này diễn ra hoàn toàn ở hạ tầng, không ảnh hưởng đến API hay logic của `ClinicalRetriever`.

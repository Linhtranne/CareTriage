# ADR-002: LangChain4j and Spring Boot Version Compatibility

## Status
APPROVED (Spike Completed)

## Context
Chúng ta cần tích hợp thư viện **LangChain4j** vào backend Spring Boot của CareTriage để dịch chuyển runtime AI từ Python sang Java (theo yêu cầu Kiến trúc của Capability 2 & 3).
Hiện tại:
- Phiên bản Java đang sử dụng: **Java 17**.
- Phiên bản Spring Boot hiện tại: **3.3.0**.
- Phiên bản LangChain4j Spring Boot Starters chính thức hiện tại (e.g., từ `0.30.0` trở lên) yêu cầu hoặc khuyến nghị phiên bản **Spring Boot 3.5+** để tự động cấu hình (Autoconfiguration) hoạt động chính xác mà không gặp xung đột thư viện transitive hoặc các class cấu hình của Spring Boot.

Do đó, chúng ta đứng trước xung đột tương thích giữa việc nâng cấp hệ thống Spring Boot của HMS Core và việc tích hợp LangChain4j.

## Decision
Chúng ta quyết định:
1. **Giữ nguyên Spring Boot ở phiên bản hiện tại 3.3.0** để bảo vệ HMS Core hiện tại khỏi rủi ro hồi quy (regression) diện rộng liên quan đến bảo mật (Spring Security), giao dịch cơ sở dữ liệu (JPA/Hibernate) và kết nối WebSocket.
2. **Không sử dụng các starter tự động cấu hình của LangChain4j** (e.g., `langchain4j-open-ai-spring-boot-starter`). Thay vào đó, chúng ta sẽ import trực tiếp các module core và provider độc lập của LangChain4j (e.g., `langchain4j-core`, `langchain4j-google-ai-gemini`) và **tự cấu hình bean thủ công (Manual Wiring)** trong một lớp cấu hình chuyên dụng `LangChain4jConfig`.
3. Định nghĩa toàn bộ tham số mô hình thông qua các typed properties (`@ConfigurationProperties`) để đảm bảo tính tùy biến cao, tách biệt khóa bí mật khỏi mã nguồn và quản lý vòng đời mô hình dễ dàng.

## Options Considered

### Option 1: Nâng cấp Spring Boot lên 3.5+ và dùng Starter của LangChain4j
- **Ưu điểm**:
  - Tích hợp chuẩn hóa nhanh, tận dụng autoconfiguration có sẵn của starter.
  - Mã nguồn khai báo cấu hình trong Java ngắn gọn hơn.
- **Nhược điểm**:
  - Rủi ro hồi quy cực kỳ lớn đối với toàn bộ core backend vốn đang chạy rất ổn định trên Boot 3.3.0.
  - Vi phạm nguyên tắc cô lập lỗi của Capability 2 (trộn lẫn nâng cấp framework hệ thống với chuyển dịch AI runtime).

### Option 2: Giữ nguyên Spring Boot 3.3.0 và Cấu hình Bean thủ công (Selected)
- **Ưu điểm**:
  - Không tác động hay thay đổi bất kỳ hành vi nào của các service hiện có của HMS Core.
  - Kiểm soát tuyệt đối cách khởi tạo, cấu hình timeout, listening telemetry và vòng đời của mô hình AI.
  - Tách biệt hoàn toàn phần triển khai AI độc lập với các tầng cơ sở của framework.
- **Nhược điểm**:
  - Cần viết một chút boilerplate code khởi tạo các Bean như `ChatLanguageModel`, `StreamingChatLanguageModel` thủ công thông qua Builder pattern của LangChain4j.

## Consequences
- Chúng ta sẽ thêm các dependency có phiên bản xác định thống nhất (ví dụ `0.31.0` hoặc tương đương) của `langchain4j` và `langchain4j-google-ai-gemini` vào `pom.xml` mà không dùng starter.
- Triển khai lớp `LangChain4jConfig` tại package `com.caretriage.infrastructure.ai.config` để khởi tạo mô hình Gemini và Fake Chat Model dùng cho môi trường test.
- Hệ thống hoàn toàn tương thích và không bị phá vỡ.

## Rollback Plan
Nếu gặp bất kỳ vấn đề bất khả kháng nào trong quá trình manual wiring ở các bước tiếp theo:
1. Revert toàn bộ các khai báo dependency của LangChain4j trong `pom.xml`.
2. Xóa các package và class cấu hình liên quan đến AI dưới Java.
3. Hệ thống sẽ tự động sử dụng fallback cũ (Python WebClient stream) qua cấu hình flag `app.ai.runtime=python`.

## Test Plan
- **Môi trường Test**: Tạo `FakeChatModel` và `FakeStreamingChatModel` của LangChain4j và cấu hình làm Bean mặc định trong profile `test`.
- **Unit Test**: Kiểm thử logic format prompt, mapping lỗi và stream Flux adapter hoạt động đúng đắn mà không cần gọi model thật.
- **Integration Test**: Đảm bảo Spring Context của backend khởi động thành công (`mvn test`) và không bị xung đột phiên bản.

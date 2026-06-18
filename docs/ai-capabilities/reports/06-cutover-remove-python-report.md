# Phân tích Cutover & Xóa Python Runtime (Capability 6)

## Tổng quan

Báo cáo này tóm tắt quá trình chuyển đổi hoàn toàn CareTriage AI runtime từ Python sang Java (LangChain4j), và loại bỏ toàn bộ kiến trúc Python khỏi dự án. Đây là cột mốc hoàn thành Capability 6 trong master plan.

## Chi tiết các thay đổi

### 1. Backend Java
- **Đã xóa**: `AiClientService` interface và implementation `AiClientServiceImpl`.
- **Đã xóa**: `WebClientConfig` (các WebClient bean gọi sang Python).
- **Đã refactor**:
  - `TriageAiRuntimeRouter`: Xóa logic fallback sang Python/shadow mode, ép buộc dùng luồng trực tiếp tới `TriageAiEngine` (Java).
  - `ChatSessionController`: Thay đổi endpoint `/health/ai` từ việc gọi Python `/health` sang kiểm tra LangChain4j model configuration.
  - `ChatServiceImpl`: Xóa dependency `AiClientService`.
  - `MedicalRecordServiceImpl`: Xóa `AiClientService` và loại bỏ logic trigger background research (sẽ được thay bằng `DoctorRecommendationService` ở Capability 7).

### 2. Cấu hình & Môi trường
- Xóa cấu hình `app.ai-service` khỏi `application.yml` và `application-dev.yml`.
- Đặt mặc định `app.ai.runtime = java` trong `LangChain4jConfig`.
- Cập nhật `docker-compose.yml` và `docker-compose.prod.yml`: Xóa container `ai-service`, xóa các biến môi trường `AI_SERVICE_URL`, `AI_SERVICE_INTERNAL_KEY`.

### 3. CI/CD & Repository
- Xóa hoàn toàn thư mục `code/backend/ai-service`.
- Xóa workflow `.github/workflows/ai-service-quality.yml`.
- Cập nhật `.github/workflows/ci.yml`: Xóa job kiểm tra Python.

### 4. Kiểm thử
- Xóa mock `AiClientService` khỏi các Integration Test:
  - `ChatSessionControllerIntegrationTest`
  - `ChatIdempotencyIntegrationTest`
  - `MedicalRecordServiceTest`
- Viết lại `TriageAiRuntimeRouterTest` chỉ test luồng Java.

## Kết quả
Hệ thống hiện tại hoàn toàn hoạt động trên Java. Kiến trúc được đơn giản hóa đáng kể, loại bỏ độ trễ của HTTP bridge và giảm chi phí vận hành (không cần chạy thêm Python container).

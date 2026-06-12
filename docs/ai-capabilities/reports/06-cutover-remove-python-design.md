# Báo cáo Thiết kế Cutover và Loại bỏ Phụ thuộc Python (Capability 6)

## 1. Trạng thái hiện tại: BLOCKED (Bị chặn)

Quy trình loại bỏ mã nguồn Python `ai-service` hiện đang bị **BLOCKED** do các điều kiện tiên quyết về tính năng và kiểm soát phụ thuộc chưa được thỏa mãn đầy đủ. Theo nguyên tắc tại [06-cutover-remove-python.md](file:///d:/CareTriage/docs/ai-capabilities/06-cutover-remove-python.md): *"Xóa Python là bước cuối, không phải bước đầu"*. 

Hệ thống chỉ có thể thực hiện xóa hoàn toàn Python sau khi toàn bộ pipeline Java thay thế cho triage, phân loại (classification), cờ đỏ (red flag), RAG, trích xuất bệnh án điện tử (EHR Extraction) đã sẵn sàng hoạt động độc lập và các báo cáo Capability 1-5 đều ghi nhận trạng thái READY.

---

## 2. Dependency Removal Report (Báo cáo Phụ thuộc)

Dưới đây là các vị trí mã nguồn Java và cấu hình hiện đang trực tiếp phụ thuộc và gọi sang dịch vụ Python thông qua WebClient:

### 2.1. Tầng Dịch vụ Chat & Triage (`ChatServiceImpl` & `AiClientServiceImpl`)
- Lớp [ChatServiceImpl.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/service/impl/ChatServiceImpl.java#L55) phụ thuộc vào `AiClientService`.
- Lớp [AiClientServiceImpl.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/service/impl/AiClientServiceImpl.java):
  - Phương thức `streamAnalyzeSymptoms` gọi endpoint `/api/triage/analyze/stream` của Python (Line 43).
  - Phương thức `triggerResearch` gọi endpoint `/api/triage/research` của Python (Line 57).
  - Phương thức `checkHealth` gọi endpoint `/health` của Python (Line 72-73).

### 2.2. Tầng Trích xuất Bệnh án Điện tử (`EHRServiceImpl`)
- Lớp [EHRServiceImpl.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/application/service/impl/EHRServiceImpl.java):
  - Gửi yêu cầu trích xuất văn bản tới endpoint `/api/ehr/extract-text` của Python (Line 556).
  - Gửi yêu cầu trích xuất tệp bệnh án tới endpoint `/api/ehr/extract-file` của Python (Line 577).

### 2.3. Tầng Cấu hình và Tệp Tài nguyên (`application.yml` & `WebClientConfig.java`)
- [WebClientConfig.java](file:///d:/CareTriage/code/backend/backend/src/main/java/com/caretriage/infrastructure/config/config/WebClientConfig.java): Định nghĩa các thuộc tính kết nối timeout và URL của `ai-service` (Line 20-32).
- [application.yml](file:///d:/CareTriage/code/backend/backend/src/main/resources/application.yml) và [application-dev.yml](file:///d:/CareTriage/code/backend/backend/src/main/resources/application-dev.yml):
  - Cấu hình URL của Python API: `app.ai-service.url` trỏ đến `http://localhost:8000` (Line 61-70).
  - Cấu hình mặc định `app.ai.runtime: python` (Line 74) đang bỏ qua Java AI skeleton để dùng Python runtime.

### 2.4. Frontend API Endpoint
- Frontend vẫn gọi trực tiếp các Java endpoint `/api/triage` và `/api/ehr`, các endpoint này hoạt động như một proxy chuyển tiếp yêu cầu sang Python `ai-service`.

---

## 3. File Deletion Plan (Kế hoạch xóa tệp)

Kế hoạch này chỉ được thực hiện sau khi Java Triage Pipeline được kích hoạt chính thức (`app.ai.runtime=java`), vượt qua toàn bộ smoke tests lâm sàng và nhận được sự phê duyệt chính thức từ người dùng.

### Bước 1: Dọn dẹp mã nguồn Java gọi Python
1. Xóa interface `AiClientService.java` và lớp triển khai `AiClientServiceImpl.java`.
2. Gỡ bỏ `WebClient` của `ai-service` khỏi `WebClientConfig.java`.
3. Thay đổi lớp gọi trong `ChatServiceImpl.java` và `MedicalRecordServiceImpl.java` chuyển sang gọi trực tiếp cổng `TriageAiEngine` hoặc `LangChainTriageEngine` của Java.
4. Cập nhật `EHRServiceImpl.java` sử dụng mô hình trích xuất y khoa Java thay thế hoàn toàn cho API `/api/ehr`.

### Bước 2: Loại bỏ tài nguyên cấu hình Python
1. Xóa các cấu hình `app.ai-service` trong `application.yml`, `application-dev.yml` và `application-test.yml`.
2. Xóa cấu hình biến môi trường của `ai-service` trong `docker-compose.yml` (hoặc cấu hình triển khai Kubernetes/CI-CD nếu có).

### Bước 3: Xóa thư mục dự án Python
1. Xóa toàn bộ thư mục [ai-service](file:///d:/CareTriage/code/backend/ai-service).
2. Xóa các file script hỗ trợ của Python ở thư mục root (nếu có).

---

## 4. Rollback Plan (Kế hoạch quay lui)

Sau khi thư mục mã nguồn Python đã bị xóa khỏi nhánh làm việc, cơ chế rollback bằng Feature Flag sẽ không còn tác dụng (do service vật lý đã bị loại bỏ). Kế hoạch quay lui như sau:

1. **Lưu vết Git Commit**: Trước khi tiến hành xóa tệp, quản trị viên bắt buộc phải gắn thẻ Git (Git Tag) cho phiên bản ổn định cuối cùng còn chứa Python (Ví dụ: `release-v1.2.0-last-python`).
2. **Kịch bản Rollback**:
   - Nếu phát hiện lỗi nghiêm trọng trên Staging/Production sau khi xóa Python:
     - Thực hiện Revert commit xóa trên Git.
     - Deploy lại Docker container của phiên bản `release-v1.2.0-last-python`.
     - Thay đổi tham số cấu hình hệ thống `app.ai.runtime=python` để chuyển dòng dữ liệu hội thoại trở lại dịch vụ Python.

---

## 5. Test Evidence (Bằng chứng kiểm thử)

Kết quả chạy công cụ tìm kiếm tĩnh cho thấy các phụ thuộc vẫn hoạt động rất sâu trong mã nguồn Java:

```text
D:\CareTriage\code\backend\backend\src\main\java\com\caretriage\application\service\impl\AiClientServiceImpl.java:43:                .uri("/api/triage/analyze/stream")
D:\CareTriage\code\backend\backend\src\main\java\com\caretriage\application\service\impl\AiClientServiceImpl.java:57:                .uri("/api/triage/research")
D:\CareTriage\code\backend\backend\src\main\java\com\caretriage\application\service\impl\EHRServiceImpl.java:556:                .uri("/api/ehr/extract-text")
D:\CareTriage\code\backend\backend\src\main\java\com\caretriage\application\service\impl\EHRServiceImpl.java:577:                    .uri("/api/ehr/extract-file")
```

Do đó, việc duy trì dịch vụ Python tại thời điểm hiện tại là **bắt buộc**.

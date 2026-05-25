# CareTriage — Agile Scrum Templates

> **Chuẩn Hóa Tài Liệu Theo Quy Trình Mới**

---

## 1. User Story Template
Dùng để mô tả yêu cầu nghiệp vụ cực kỳ chi tiết, làm cơ sở cho thiết kế, phát triển và kiểm thử.

```markdown
# [US-XXX] [Tên User Story]

## 1. Tổng quan & Bối cảnh (Overview & Context)
**Vấn đề (Problem):**
- Nêu rõ vấn đề hiện tại hệ thống đang gặp phải.
**Giá trị Nghiệp vụ (Business Value):**
- Nêu rõ giá trị mà tính năng này mang lại.
**Đối tượng (Actor):**
- Primary Actor: ...
- Secondary Actor: ...

**User Story Statement:**
Là [Actor], tôi muốn [Action], để [Benefit].

## 2. Phạm vi (Scope)
**In scope (Trong phạm vi):**
- ...
**Out of scope (Ngoài phạm vi):**
- ... (Tránh scope creep)

## 3. Luồng Người dùng (User Flow)
**3.1 Luồng chính: [Tên luồng]**
1. Bước 1...
2. Bước 2...

**3.2 Luồng thay thế/ngoại lệ (Alternative/Exception Flow)**
1. Bước 1...
2. Xử lý lỗi...

## 4. Tiêu chí Chấp nhận (Acceptance Criteria)
*Format BDD: Given - When - Then*

**AC-01: [Tên tiêu chí 1]**
- **Given:** [Điều kiện tiên quyết]
- **When:** [Hành động của người dùng]
- **Then:** [Kết quả mong đợi]

## 5. UI/UX Reference
- **Figma/Wireframe Link:** [Link đính kèm]

## 6. Non-functional Requirements
- **Performance:** ...
- **Security:** ...
```

---

## 2. Test Case Template (Markdown)
Dùng để ghi nhận kịch bản kiểm thử, liên kết trực tiếp với User Story.

```markdown
# Test Cases cho [US-XXX] [Tên User Story]

| TC ID | Tiêu đề (Title) | Luồng (Flow) | Loại (Type) | Ưu tiên | Trạng thái |
|-------|-----------------|--------------|-------------|---------|------------|
| TC-001| Kiểm tra đăng ký| Luồng chính  | Positive    | High    | To Do      |
| TC-002| Đăng ký lỗi     | Luồng ngoại lệ| Negative    | Medium  | To Do      |

## Chi tiết Test Case

### TC-001: [Tiêu đề]
- **Pre-conditions (Điều kiện tiên quyết):** ...
- **Test Steps (Các bước thực hiện):**
  1. ...
  2. ...
- **Test Data (Dữ liệu test):** ...
- **Expected Results (Kết quả mong đợi):** ...
- **Actual Results (Kết quả thực tế):** ...
- **Notes/Traceability:** Link tới AC-01 của US-XXX.
```

---

## 3. Bug Report Template
Dùng để log bug lên Jira/Linear.

```markdown
# [BUG-XXX] [Mô tả ngắn gọn lỗi]

## 1. Thông tin chung
- **Mức độ ảnh hưởng (Severity):** Critical / High / Medium / Low
- **Mức độ ưu tiên (Priority):** P0 / P1 / P2 / P3
- **Phiên bản (Version/Build):** v1.0.x
- **Môi trường (Environment):** Dev / Staging / Prod (OS, Browser)

## 2. Chi tiết lỗi
- **Các bước tái hiện (Steps to Reproduce):**
  1. ...
  2. ...
- **Kết quả mong đợi (Expected Result):** ...
- **Kết quả thực tế (Actual Result):** ...

## 3. Bằng chứng & Ghi chú
- **Tệp đính kèm (Screenshots/Videos):** [Link hoặc ảnh]
- **Logs/Console Error:** 
  ```text
  [Dán log vào đây]
  ```
- **Ghi chú kỹ thuật (Technical Notes cho Dev):** ...
```

---

## 4. Security Audit Template (Pentest)
Dựa theo chuẩn OWASP WSTG và OWASP Top 10.

```markdown
# Báo Cáo Kiểm Thử Xâm Nhập (Pentest Report)

## 1. Executive Summary
- Tóm tắt rủi ro tổng thể và khuyến nghị cấp thiết.

## 2. Phạm vi và Đối tượng
- Scope: [URL / IP / Module]
- Phương pháp luận: OWASP WSTG v4.2

## 3. Kết quả rà quét
- **Tổng số lỗi:** Critical (X) | High (X) | Medium (X) | Low (X)

## 4. Chi tiết Lỗ hổng
### VULN-001: [Tên lỗ hổng - OWASP Category]
- **Mức độ:** High
- **Mô tả:** ...
- **Tác động:** ...
- **Steps to reproduce (PoC):** ...
- **Khuyến nghị khắc phục (Remediation):** ...
- **Mã tham chiếu:** CVE-XXX / CWE-XXX
```

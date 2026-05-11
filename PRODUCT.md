# Product

## Register

product

## Users

### Bệnh nhân (Patient)
Người dùng chính, thường ở trạng thái thực tế: muốn kiểm tra triệu chứng trước khi quyết định đi khám trực tiếp. Họ cần câu trả lời nhanh, rõ ràng, và cảm giác yên tâm rằng hệ thống đang hướng dẫn đúng. Sử dụng linh hoạt trên điện thoại, tablet, và máy tính.

### Bác sĩ (Doctor)
Sử dụng trong và ngoài ca khám, trên mọi thiết bị. Cần nắm bắt nhanh triệu chứng bệnh nhân đã được AI phân tích sẵn, giảm thiểu các bước khám phổ thông lặp lại. Ưu tiên tốc độ thao tác và độ chính xác thông tin.

### Quản trị viên (Admin)
Quản lý người dùng, khoa/phòng, giám sát hệ thống. Làm việc chủ yếu trên desktop. Cần tổng quan nhanh và khả năng thao tác hàng loạt.

## Product Purpose

CareTriage là hệ thống quản lý bệnh viện thông minh tích hợp AI, giải quyết hai vấn đề cốt lõi:

1. **Giảm thiểu bước khám phổ thông:** AI sơ chẩn triệu chứng trước khi bệnh nhân gặp bác sĩ, giúp bác sĩ hiểu rõ tình trạng ngay từ đầu.
2. **Chuẩn hóa dữ liệu y tế:** Tự động trích xuất và cấu trúc hóa ghi chú lâm sàng (EHR), biến thông tin rời rạc thành dữ liệu có thể tìm kiếm và phân tích.

Thành công = bệnh nhân được phân luồng đúng chuyên khoa nhanh hơn, bác sĩ tiết kiệm thời gian hỏi bệnh, dữ liệu y tế được tổ chức có hệ thống.

## Brand Personality

**Thông minh. Đáng tin. Hiện đại.**

- **Thông minh:** Giao diện phản ánh khả năng AI, trình bày thông tin phức tạp một cách dễ hiểu.
- **Đáng tin:** Mỗi thao tác đều có phản hồi rõ ràng (loading, thành công, lỗi). Không bao giờ để người dùng đoán.
- **Hiện đại:** Giao diện phô diễn tính tiên tiến của công nghệ, không chỉ hoạt động tốt mà còn trông ấn tượng.

Giọng điệu: chuyên nghiệp nhưng gần gũi. Không lạnh lùng y tế, không quá casual.

## Anti-references

- **Phần mềm bệnh viện cũ kỹ:** Giao diện rối rắm, nhiều bảng biểu chồng chéo, màu xám nhạt buồn tẻ.
- **App y tế "trắng xanh" điển hình:** Thiết kế từ nhiều năm trước, an toàn nhưng nhạt nhẽo, không có cá tính.
- **Giao diện lạm dụng div:** HTML không semantic, không có cấu trúc logic.
- **UI không phản hồi:** Click mà không biết có xảy ra gì, không loading state, không thông báo lỗi.

## Design Principles

1. **Phản hồi mọi thao tác:** Mỗi tương tác của người dùng phải có phản hồi rõ ràng: loading, thành công, hoặc báo lỗi. Không bao giờ để trạng thái "treo".
2. **Linh hoạt và nhất quán:** Hệ thống khung linh hoạt, dễ chỉnh sửa, nhưng nhất quán về typography, spacing, và component patterns trên mọi thiết bị.
3. **Semantic trước tiên:** HTML semantic, không lạm dụng div. Điều hướng hợp lý, có thể dự đoán được.
4. **Hiệu suất là tính năng:** Tối ưu Core Web Vitals (LCP, CLS), lazy loading, minify assets, WebP/SVG. Trang phải nhanh.
5. **Tách biệt rõ ràng:** Component-based architecture, separation of concerns (logic, giao diện, styling). Clean code, đặt tên rõ ràng.

## Accessibility & Inclusion

- **Tuân thủ WCAG AA** cho tất cả các trang.
- Độ tương phản đủ để đọc thoải mái trên mọi thiết bị.
- Hỗ trợ trình đọc màn hình (screen reader): semantic HTML, ARIA labels khi cần.
- Sử dụng Autoprefixer cho CSS cross-browser compatibility.
- Kiểm tra feature support qua Can I Use trước khi dùng CSS mới.
- Responsive trên Chrome, Firefox, Safari; desktop, tablet, mobile.

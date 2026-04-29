# Báo cáo Tiến độ Sprint (Task T-001 -> T-003)

## T-001: Create User, Role entities + migration
- **Lý do thực hiện:** Xây dựng nền tảng lưu trữ thông tin tài khoản và phân quyền người dùng (Bệnh nhân, Bác sĩ, Admin), phục vụ tất cả các luồng nghiệp vụ xác thực và truy cập tài nguyên bảo mật.
- **Công nghệ sử dụng:** Java 17, Spring Data JPA, Hibernate, MySQL.
- **Logic triển khai:** 
  - Thiết lập quan hệ `@ManyToMany` giữa `User` và `Role`.
  - Áp dụng Hibernate DDL Update tự động đồng bộ các trường dữ liệu (`username`, `email`, `phone`, `password`, `is_active`, `deleted`).

## T-002: Implement AuthService (register, login, JWT)
- **Lý do thực hiện:** Xử lý logic nghiệp vụ xác thực cốt lõi: tiếp nhận, mã hóa dữ liệu an toàn và cấp quyền truy cập cho người dùng.
- **Công nghệ sử dụng:** Spring Security 6, JJWT (`io.jsonwebtoken`), BCrypt.
- **Logic triển khai:**
  - Luồng Đăng ký: Kiểm tra email trùng lặp, mã hóa mật khẩu bằng BCrypt, gán quyền mặc định (`PATIENT`).
  - Luồng Đăng nhập: Xác thực thông tin thông qua `AuthenticationManager`, ký tạo Access Token và Refresh Token.

## T-003: Create AuthController (register, login, refresh endpoints)
- **Lý do thực hiện:** Cung cấp các API Gateway công khai để ứng dụng Client (Frontend) tương tác trực tiếp với hệ thống.
- **Công nghệ sử dụng:** Spring Web MVC (`@RestController`), Jakarta Validation (`@Valid`).
- **Logic triển khai:**
  - Cấu trúc Endpoint: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`.
  - Tối ưu hóa DTO: Chuyển đổi cơ chế truyền tải map raw sang `TokenRequest` chuẩn hóa.
  - Quản lý Refresh Token Revocation: Lưu trạng thái token hoạt động vào DB thông qua cột `refresh_token`, kiểm tra trùng khớp hoặc xóa sạch khi Logout để vô hiệu hóa các hành vi chiếm dụng phiên trái phép.

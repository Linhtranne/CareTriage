# Báo cáo Tiến độ Sprint (Task T-001 -> T-011)

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

## T-004: Configure Spring Security + JWT filter chain
- **Lý do thực hiện:** Thiết lập hệ thống phân quyền truy cập tài nguyên, bảo vệ ứng dụng khỏi tấn công khai thác và quản lý trạng thái xác thực phi trạng thái (Stateless).
- **Công nghệ sử dụng:** Spring Security 6.x, OncePerRequestFilter.
- **Logic triển khai:**
  - Xây dựng `JwtAuthFilter` kế thừa `OncePerRequestFilter` giải mã token trên mỗi request và gán `SecurityContextHolder`.
  - Cấu hình `SecurityFilterChain` bỏ qua CSRF, chặn truy cập nặc danh ngoại trừ `/api/auth/**` và `/api/health`.

## T-005: Build Register page (form validation, MUI)
- **Lý do thực hiện:** Cho phép khách truy cập tạo tài khoản để sử dụng các dịch vụ y tế trực tuyến của hệ sinh thái.
- **Công nghệ sử dụng:** React (Vite), Material UI (MUI), React Hook Form.
- **Logic triển khai:**
  - Xây dựng giao diện đăng ký trực quan, tích hợp kiểm tra lỗi dữ liệu đầu vào (Validation) theo thời gian thực.
  - Nhúng dịch tự động đa ngôn ngữ thích ứng mượt mà.

## T-006: Build Login page
- **Lý do thực hiện:** Cung cấp cổng truy cập bảo mật, quản lý danh tính người dùng.
- **Công nghệ sử dụng:** React (Vite), Material UI (MUI).
- **Logic triển khai:**
  - Thiết lập điều hướng dựa trên quyền hạn người dùng trả về từ Backend.

## T-007: Implement Axios interceptor (JWT auto-attach, 401 refresh)
- **Lý do thực hiện:** Tự động hóa các quy trình xác thực phía Client, đảm bảo các giao tiếp bảo mật diễn ra trơn tru và tăng cường trải nghiệm đăng nhập xuyên suốt.
- **Công nghệ sử dụng:** Axios Interceptors, Zustand.
- **Logic triển khai:**
  - Request Interceptor: Rút trích access token và tự động đính kèm chuỗi `Bearer <token>` vào `Authorization` header.
  - Response Interceptor: Bắt lỗi 401 Unauthorized. Khi token hết hạn, gọi API `/api/auth/refresh` lấy chuỗi mới và gửi lại Request thất bại (Silent Refresh). Nếu lỗi sâu hơn, đưa người dùng quay về `/login`.

## T-008: Create AuthStore (Zustand) + Protected route
- **Lý do thực hiện:** Duy trì dữ liệu người dùng toàn cục (Session State) toàn vẹn, cung cấp hàng rào bảo vệ tài nguyên định tuyến an toàn.
- **Công nghệ sử dụng:** Zustand (Persist middleware), React Router.
- **Logic triển khai:**
  - Quản lý các hàm mutate states (`setCredentials`, `clearCredentials`, `updateUser`).
  - Cấu trúc wrapper `ProtectedRoute` chặn lọc truy cập trái phép.

## T-009: Implement protected route wrapper & Deep Linking
- **Lý do thực hiện:** Đảm bảo người dùng không thể truy cập trái phép vào các trang nội bộ khi chưa xác thực, đồng thời dẫn hướng người dùng quay lại đúng liên kết đang cố gắng truy cập (Deep Linking).
- **Công nghệ sử dụng:** React Router DOM (`useLocation`, `Navigate`), Zustand.
- **Logic triển khai:**
  - Bọc các Route cần bảo mật trong `<ProtectedRoute>`.
  - Lưu lại URL hiện tại qua `state={{ from: location }}` khi chưa đăng nhập để điều hướng ngược lại sau khi đăng nhập thành công.

## T-010: Role-based redirect after login & Session guards
- **Lý do thực hiện:** Đảm bảo trải nghiệm người dùng mượt mà, gán đúng Dashboard chức năng (Patient/Doctor/Admin) và chặn truy cập lặp `/login` khi phiên còn hiệu lực.
- **Công nghệ sử dụng:** React Router DOM (`useNavigate`), useAuthStore.
- **Logic triển khai:**
  - Sử dụng `useEffect` lắng nghe `isAuthenticated` để tự động chuyển hướng người dùng vào Dashboard phù hợp nếu cố tình gõ lại `/login` hoặc `/register`.

## T-011: Logout + token cleanup
- **Lý do thực hiện:** Cho phép người dùng chủ động chấm dứt phiên làm việc, bảo mật dữ liệu nhạy cảm.
- **Công nghệ sử dụng:** React (MUI Modals), LocalStorage.
- **Logic triển khai:**
  - Xóa sạch Tokens / State tree. Thu hồi session key trên DB Backend an toàn.

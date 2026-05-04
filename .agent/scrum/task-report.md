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
  - Xây dựng modal xác nhận đăng xuất.
  - Xóa sạch Tokens / State tree. Thu hồi session key trên DB Backend an toàn.

## T-012: Create PatientProfile, DoctorProfile entities + migration
- **Lý do thực hiện:** Phân tách thông tin chi tiết giữa các vai trò (Bệnh nhân/Bác sĩ) để quản lý hồ sơ y tế và chuyên môn chính xác.
- **Công nghệ sử dụng:** Java 17, Spring Data JPA, Lombok.
- **Logic triển khai:**
  - Thiết lập quan hệ `@OneToOne` từ `User` đến `PatientProfile` và `DoctorProfile`.
  - `PatientProfile`: Lưu trữ DOB, giới tính, địa chỉ, nhóm máu, dị ứng.
  - `DoctorProfile`: Lưu trữ tiểu sử (bio), chuyên môn (specialization), năm kinh nghiệm.
  - Tạo `PatientProfileRepository` và `DoctorProfileRepository` để truy vấn dữ liệu theo `userId`.

## T-013: UserController: GET/PUT profile endpoints
- **Lý do thực hiện:** Cung cấp giao diện API để người dùng có thể tự xem và cập nhật thông tin cá nhân/chuyên môn của mình một cách bảo mật.
- **Công nghệ sử dụng:** Spring Web, Spring Security, DTO Pattern.
- **Logic triển khai:**
  - `GET /api/users/profile`: Lấy email từ `Authentication`, truy vấn thông tin `User` và `Profile` tương ứng để trả về `UserProfileResponse`.
  - `PUT /api/users/profile`: Nhận `UpdateProfileRequest`, cập nhật các trường thông tin cơ bản (`fullName`, `phone`, `avatarUrl`) và các trường đặc thù của `Patient` hoặc `Doctor`.
  - Hỗ trợ cơ chế "Lazy Profile Creation": Tự động tạo bản ghi Profile nếu chưa tồn tại khi cập nhật.
  - Tích hợp `ApiResponse` chuẩn hóa cho toàn bộ phản hồi.

## T-014: Profile page UI (view mode + edit mode)
- **Lý do thực hiện:** Cung cấp giao diện đồ họa thân thiện để người dùng tương tác với thông tin cá nhân.
- **Công nghệ sử dụng:** React, Material UI (MUI), Zustand, Axios.
- **Logic triển khai:**
  - Xây dựng trang `Profile.jsx` dùng chung cho mọi vai trò.
  - Tự động hiển thị các trường dữ liệu tương ứng dựa trên vai trò (`Patient` hoặc `Doctor`).
  - Chế độ View/Edit linh hoạt: Cho phép xem thông tin dạng text và chuyển sang dạng Form để chỉnh sửa.
  - Đồng bộ dữ liệu: Sau khi lưu thành công, cập nhật lại trạng thái trong `authStore` để hiển thị đúng `fullName` và `avatar` trên Header/Sidebar.
  - Tích hợp thông báo thành công/thất bại (Alert).

## T-016: Admin UserController: list all, change role, toggle active
- **Lý do thực hiện:** Cung cấp các API cho quản trị viên quản lý tài khoản người dùng toàn hệ thống, bao gồm xem danh sách, tìm kiếm, thay đổi phân quyền và khoá/mở tài khoản.
- **Công nghệ sử dụng:** Spring Web MVC, Spring Data JPA (Pageable, @Query), Jakarta Validation.
- **Logic triển khai:**
  - Tạo `AdminUserController` mapped `/api/admin/users` — tự động được bảo vệ bởi `hasRole('ADMIN')` trong SecurityConfig.
  - Endpoint: `GET /` (paginated, search, filter by role/active), `GET /{id}`, `PUT /{id}/role`, `PUT /{id}/toggle-active`.
  - Tạo `AdminUserService` interface + `AdminUserServiceImpl` với logic search JPQL (email, fullName, username), filter by role hoặc isActive.
  - Tạo DTOs: `AdminUserResponse` (bao gồm roles, timestamps), `ChangeRoleRequest` (validated), `PagedResponse<T>` (generic pagination).
  - Mở rộng `UserRepository`: thêm `searchUsers()` (JPQL), `findByRolesName()`, `findByIsActive()` với Pageable.

## T-017: Admin User Management page (MUI DataGrid)
- **Lý do thực hiện:** Cung cấp giao diện quản trị viên trực quan để quản lý toàn bộ người dùng hệ thống.
- **Công nghệ sử dụng:** React, Material UI (MUI DataGrid @mui/x-data-grid), Axios.
- **Logic triển khai:**
  - Tạo `adminApi.js` — module API riêng cho admin endpoints.
  - Xây dựng `UserManagement.jsx` với DataGrid server-side pagination.
  - Search debounced (400ms) tìm kiếm theo tên, email, username.
  - Role filter sử dụng ToggleButtonGroup (PATIENT | DOCTOR | ADMIN).
  - Hiển thị: Avatar + tên + email, username, SĐT, role chips (color-coded), trạng thái (Hoạt động/Đã khóa), ngày tạo.
  - Actions column: Xem chi tiết, Đổi role, Khóa/Kích hoạt.
  - Thêm route `/admin/users` trong `App.jsx`.

## T-018: Role change dialog + confirmation
- **Lý do thực hiện:** Đảm bảo thao tác thay đổi quyền và trạng thái tài khoản được xác nhận rõ ràng để tránh thay đổi nhầm.
- **Công nghệ sử dụng:** MUI Dialog, Select, Alert, Snackbar.
- **Logic triển khai:**
  - Role Change Dialog: Hiển thị thông tin user, cảnh báo warning, dropdown chọn role mới (PATIENT/DOCTOR/ADMIN) với icon tương ứng. Nút "Xác nhận" disabled nếu role không thay đổi.
  - Toggle Active Dialog: Cảnh báo error (khi khóa) hoặc success (khi kích hoạt), mô tả rõ hậu quả.
  - User Detail Dialog (bonus): Grid layout hiển thị đầy đủ thông tin chi tiết người dùng.
  - Snackbar thông báo kết quả thao tác (thành công/thất bại).


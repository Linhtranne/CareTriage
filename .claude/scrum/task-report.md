# Báo cáo Tiến độ Sprint (Task T-001 -> T-011)

## T-001: Create User, Role entities + migration

- **Lý do thực hiện:** Xây dựng ná»n tảng lưu trữ thông tin tài khoản và phân quyá»n ngưá»i dùng (Bệnh nhân, Bác sĩ, Admin), phục vụ tất cả các luồng nghiệp vụ xác thực và truy cập tài nguyên bảo mật.

- **Công nghệ sử dụng:** Java 17, Spring Data JPA, Hibernate, MySQL.

- **Logic triển khai:** 

  - Thiết lập quan hệ `@ManyToMany` giữa `User` và `Role`.

  - Ãp dụng Hibernate DDL Update tự động đồng bộ các trưá»ng dữ liệu (`username`, `email`, `phone`, `password`, `is_active`, `deleted`).

## T-002: Implement AuthService (register, login, JWT)

- **Lý do thực hiện:** Xử lý logic nghiệp vụ xác thực cốt lõi: tiếp nhận, mã hóa dữ liệu an toàn và cấp quyá»n truy cập cho ngưá»i dùng.

- **Công nghệ sử dụng:** Spring Security 6, JJWT (`io.jsonwebtoken`), BCrypt.

- **Logic triển khai:**

  - Luồng Äăng ký: Kiểm tra email trùng lặp, mã hóa mật khẩu bằng BCrypt, gán quyá»n mặc định (`PATIENT`).

  - Luồng Äăng nhập: Xác thực thông tin thông qua `AuthenticationManager`, ký tạo Access Token và Refresh Token.

## T-003: Create AuthController (register, login, refresh endpoints)

- **Lý do thực hiện:** Cung cấp các API Gateway công khai để ứng dụng Client (Frontend) tương tác trực tiếp với hệ thống.

- **Công nghệ sử dụng:** Spring Web MVC (`@RestController`), Jakarta Validation (`@Valid`).

- **Logic triển khai:**

  - Cấu trúc Endpoint: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`.

  - Tối ưu hóa DTO: Chuyển đổi cơ chế truyá»n tải map raw sang `TokenRequest` chuẩn hóa.

  - Quản lý Refresh Token Revocation: Lưu trạng thái token hoạt động vào DB thông qua cột `refresh_token`, kiểm tra trùng khớp hoặc xóa sạch khi Logout để vô hiệu hóa các hành vi chiếm dụng phiên trái phép.

## T-004: Configure Spring Security + JWT filter chain

- **Lý do thực hiện:** Thiết lập hệ thống phân quyá»n truy cập tài nguyên, bảo vệ ứng dụng khá»i tấn công khai thác và quản lý trạng thái xác thực phi trạng thái (Stateless).

- **Công nghệ sử dụng:** Spring Security 6.x, OncePerRequestFilter.

- **Logic triển khai:**

  - Xây dựng `JwtAuthFilter` kế thừa `OncePerRequestFilter` giải mã token trên mỗi request và gán `SecurityContextHolder`.

  - Cấu hình `SecurityFilterChain` bá» qua CSRF, chặn truy cập nặc danh ngoại trừ `/api/auth/**` và `/api/health`.

## T-005: Build Register page (form validation, MUI)

- **Lý do thực hiện:** Cho phép khách truy cập tạo tài khoản để sử dụng các dịch vụ y tế trực tuyến của hệ sinh thái.

- **Công nghệ sử dụng:** React (Vite), Material UI (MUI), React Hook Form.

- **Logic triển khai:**

  - Xây dựng giao diện đăng ký trực quan, tích hợp kiểm tra lỗi dữ liệu đầu vào (Validation) theo thá»i gian thực.

  - Nhúng dịch tự động đa ngôn ngữ thích ứng mượt mà.

## T-006: Build Login page

- **Lý do thực hiện:** Cung cấp cổng truy cập bảo mật, quản lý danh tính ngưá»i dùng.

- **Công nghệ sử dụng:** React (Vite), Material UI (MUI).

- **Logic triển khai:**

  - Thiết lập điá»u hướng dựa trên quyá»n hạn ngưá»i dùng trả vá» từ Backend.

## T-007: Implement Axios interceptor (JWT auto-attach, 401 refresh)

- **Lý do thực hiện:** Tự động hóa các quy trình xác thực phía Client, đảm bảo các giao tiếp bảo mật diễn ra trơn tru và tăng cưá»ng trải nghiệm đăng nhập xuyên suốt.

- **Công nghệ sử dụng:** Axios Interceptors, Zustand.

- **Logic triển khai:**

  - Request Interceptor: Rút trích access token và tự động đính kèm chuỗi `Bearer <token>` vào `Authorization` header.

  - Response Interceptor: Bắt lỗi 401 Unauthorized. Khi token hết hạn, gá»i API `/api/auth/refresh` lấy chuỗi mới và gửi lại Request thất bại (Silent Refresh). Nếu lỗi sâu hơn, đưa ngưá»i dùng quay vá» `/login`.

## T-008: Create AuthStore (Zustand) + Protected route

- **Lý do thực hiện:** Duy trì dữ liệu ngưá»i dùng toàn cục (Session State) toàn vẹn, cung cấp hàng rào bảo vệ tài nguyên định tuyến an toàn.

- **Công nghệ sử dụng:** Zustand (Persist middleware), React Router.

- **Logic triển khai:**

  - Quản lý các hàm mutate states (`setCredentials`, `clearCredentials`, `updateUser`).

  - Cấu trúc wrapper `ProtectedRoute` chặn lá»c truy cập trái phép.

## T-009: Implement protected route wrapper & Deep Linking

- **Lý do thực hiện:** Äảm bảo ngưá»i dùng không thể truy cập trái phép vào các trang nội bộ khi chưa xác thực, đồng thá»i dẫn hướng ngưá»i dùng quay lại đúng liên kết đang cố gắng truy cập (Deep Linking).

- **Công nghệ sử dụng:** React Router DOM (`useLocation`, `Navigate`), Zustand.

- **Logic triển khai:**

  - Bá»c các Route cần bảo mật trong `<ProtectedRoute>`.

  - Lưu lại URL hiện tại qua `state={{ from: location }}` khi chưa đăng nhập để điá»u hướng ngược lại sau khi đăng nhập thành công.

## T-010: Role-based redirect after login & Session guards

- **Lý do thực hiện:** Äảm bảo trải nghiệm ngưá»i dùng mượt mà, gán đúng Dashboard chức năng (Patient/Doctor/Admin) và chặn truy cập lặp `/login` khi phiên còn hiệu lực.

- **Công nghệ sử dụng:** React Router DOM (`useNavigate`), useAuthStore.

- **Logic triển khai:**

  - Sử dụng `useEffect` lắng nghe `isAuthenticated` để tự động chuyển hướng ngưá»i dùng vào Dashboard phù hợp nếu cố tình gõ lại `/login` hoặc `/register`.

## T-011: Logout + token cleanup

- **Lý do thực hiện:** Cho phép ngưá»i dùng chủ động chấm dứt phiên làm việc, bảo mật dữ liệu nhạy cảm.

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

- **Lý do thực hiện:** Cung cấp giao diện API để ngưá»i dùng có thể tự xem và cập nhật thông tin cá nhân/chuyên môn của mình một cách bảo mật.

- **Công nghệ sử dụng:** Spring Web, Spring Security, DTO Pattern.

- **Logic triển khai:**

  - `GET /api/users/profile`: Lấy email từ `Authentication`, truy vấn thông tin `User` và `Profile` tương ứng để trả vá» `UserProfileResponse`.

  - `PUT /api/users/profile`: Nhận `UpdateProfileRequest`, cập nhật các trưá»ng thông tin cơ bản (`fullName`, `phone`, `avatarUrl`) và các trưá»ng đặc thù của `Patient` hoặc `Doctor`.

  - Hỗ trợ cơ chế "Lazy Profile Creation": Tự động tạo bản ghi Profile nếu chưa tồn tại khi cập nhật.

  - Tích hợp `ApiResponse` chuẩn hóa cho toàn bộ phản hồi.

## T-014: Profile page UI (view mode + edit mode)

- **Lý do thực hiện:** Cung cấp giao diện đồ há»a thân thiện để ngưá»i dùng tương tác với thông tin cá nhân.

- **Công nghệ sử dụng:** React, Material UI (MUI), Zustand, Axios.

- **Logic triển khai:**

  - Xây dựng trang `Profile.jsx` dùng chung cho mọi vai trò.

  - Tự động hiển thị các trưá»ng dữ liệu tương ứng dựa trên vai trò (`Patient` hoặc `Doctor`).

  - Chế độ View/Edit linh hoạt: Cho phép xem thông tin dạng text và chuyển sang dạng Form để chỉnh sửa.

  - Äồng bộ dữ liệu: Sau khi lưu thành công, cập nhật lại trạng thái trong `authStore` để hiển thị đúng `fullName` và `avatar` trên Header/Sidebar.

  - Tích hợp thông báo thành công/thất bại (Alert).

## T-016: Admin UserController: list all, change role, toggle active

- **Lý do thực hiện:** Cung cấp các API cho quản trị viên quản lý tài khoản ngưá»i dùng toàn hệ thống, bao gồm xem danh sách, tìm kiếm, thay đổi phân quyá»n và khoá/mở tài khoản.

- **Công nghệ sử dụng:** Spring Web MVC, Spring Data JPA (Pageable, @Query), Jakarta Validation.

- **Logic triển khai:**

  - Tạo `AdminUserController` mapped `/api/admin/users` â€” tự động được bảo vệ bởi `hasRole('ADMIN')` trong SecurityConfig.

  - Endpoint: `GET /` (paginated, search, filter by role/active), `GET /{id}`, `PUT /{id}/role`, `PUT /{id}/toggle-active`.

  - Tạo `AdminUserService` interface + `AdminUserServiceImpl` với logic search JPQL (email, fullName, username), filter by role hoặc isActive.

  - Tạo DTOs: `AdminUserResponse` (bao gồm roles, timestamps), `ChangeRoleRequest` (validated), `PagedResponse<T>` (generic pagination).

  - Mở rộng `UserRepository`: thêm `searchUsers()` (JPQL), `findByRolesName()`, `findByIsActive()` với Pageable.

## T-017: Admin User Management page (MUI DataGrid)

- **Lý do thực hiện:** Cung cấp giao diện quản trị viên trực quan để quản lý toàn bộ ngưá»i dùng hệ thống.

- **Công nghệ sử dụng:** React, Material UI (MUI DataGrid @mui/x-data-grid), Axios.

- **Logic triển khai:**

  - Tạo `adminApi.js` â€” module API riêng cho admin endpoints.

  - Xây dựng `UserManagement.jsx` với DataGrid server-side pagination.

  - Search debounced (400ms) tìm kiếm theo tên, email, username.

  - Role filter sử dụng ToggleButtonGroup (PATIENT | DOCTOR | ADMIN).

  - Hiển thị: Avatar + tên + email, username, SÄT, role chips (color-coded), trạng thái (Hoạt động/Äã khóa), ngày tạo.

  - Actions column: Xem chi tiết, Äổi role, Khóa/Kích hoạt.

  - Thêm route `/admin/users` trong `App.jsx`.

## T-018: Role change dialog + confirmation

- **Lý do thực hiện:** Äảm bảo thao tác thay đổi quyá»n và trạng thái tài khoản được xác nhận rõ ràng để tránh thay đổi nhầm.

- **Công nghệ sử dụng:** MUI Dialog, Select, Alert, Snackbar.

- **Logic triển khai:**

  - Role Change Dialog: Hiển thị thông tin user, cảnh báo warning, dropdown chá»n role mới (PATIENT/DOCTOR/ADMIN) với icon tương ứng. Nút "Xác nhận" disabled nếu role không thay đổi.

  - Toggle Active Dialog: Cảnh báo error (khi khóa) hoặc success (khi kích hoạt), mô tả rõ hậu quả.

  - User Detail Dialog (bonus): Grid layout hiển thị đầy đủ thông tin chi tiết ngưá»i dùng.

  - Snackbar thông báo kết quả thao tác (thành công/thất bại).

## T-019: Create Department entity + DepartmentRepository

- **Lý do thực hiện:** Xây dựng cấu trúc dữ liệu ná»n tảng cho quản lý Chuyên khoa, hỗ trợ việc phân loại bác sĩ và dịch vụ y tế trong hệ thống.

- **Công nghệ sử dụng:** Java 17, Spring Data JPA, Hibernate, H2 (Testing).

- **Logic triển khai:**

  - Thiết lập thực thể `Department` kế thừa từ `BaseEntity` để tự động hóa việc lưu vết (auditing: createdBy, updatedAt...).

  - Äịnh nghĩa các trưá»ng dữ liệu: `code` (mã định danh duy nhất), `name`, `description`, `imageUrl`, `slug` (URL-friendly), `status` (ACTIVE/INACTIVE).

  - Tích hợp JPA Auditing thông qua `JpaConfig` và `AuditorAware` để tự động điá»n thông tin ngưá»i tạo/ngưá»i cập nhật.

  - Triển khai `DepartmentRepository` với các phương thức truy vấn theo `code`, `name`, `slug` và hỗ trợ tìm kiếm không phân biệt hoa thưá»ng (`ContainingIgnoreCase`).

  - Kiểm chứng thông qua bộ unit test sử dụng database H2 in-memory để đảm bảo tính toàn vẹn của schema và các truy vấn.

## T-020: DepartmentController: CRUD endpoints

- **Lý do thực hiện:** Cung cấp hệ thống API RESTful hoàn chỉnh để quản lý thông tin Chuyên khoa, phục vụ các luồng nghiệp vụ phía Frontend (danh sách chuyên khoa cho bệnh nhân và trang quản trị cho Admin).

- **Công nghệ sử dụng:** Spring Web MVC, Spring Security (Role-based access control), Swagger/OpenAPI 3.

- **Logic triển khai:**

  - `DepartmentService`: Xử lý logic nghiệp vụ phức tạp:

    - Tự động tạo `slug` từ tên chuyên khoa.

    - Kiểm tra và ngăn chặn trùng lặp dữ liệu (`code`, `name`, `slug`).

    - Ràng buộc an toàn: Không cho phép xóa chuyên khoa nếu vẫn còn bác sĩ đang trực thuộc (kiểm tra qua `DoctorProfileRepository`).

  - `DepartmentController`: Phân chia quyá»n hạn truy cập thông qua Spring Security:

    - `GET /api/v1/departments`: Công khai, hỗ trợ phân trang (`page`, `size`), sắp xếp (`sortBy`, `direction`) và tìm kiếm theo tên.

    - `GET /api/v1/departments/{id}` & `/slug/{slug}`: Công khai, lấy chi tiết thông tin.

    - `POST/PUT/DELETE`: Bảo vệ bằng `@PreAuthorize("hasRole('ADMIN')")`, yêu cầu JWT token của quản trị viên.

  - `StringUtils`: Xây dựng tiện ích chuẩn hóa chuỗi và tạo slug chuẩn SEO, hỗ trợ xử lý tiếng Việt có dấu.

  - Tích hợp đầy đủ Swagger Documentation (`@Tag`, `@Operation`) giúp team Frontend dễ dàng tích hợp và test API.

  - Hoàn thành bộ unit test cho Service layer (Mockito) đạt độ bao phủ cao, đảm bảo logic nghiệp vụ hoạt động chính xác.

## T-021 & T-022: Admin Department Management Page & Dialog

- **Lý do thực hiện:** Xây dựng giao diện quản trị chuyên nghiệp giúp Admin quản lý danh mục chuyên khoa một cách dễ dàng, trực quan và an toàn.

- **Công nghệ sử dụng:** React 19, MUI (Material UI), MUI DataGrid, Axios, Zustand.

- **Logic triển khai:**

  - **Trang quản lý (`DepartmentManagement.jsx`)**:

    - Sử dụng `DataGrid` với cấu hình server-side pagination và sorting, giúp tối ưu hiệu năng khi dữ liệu lớn.

    - Thanh tìm kiếm tích hợp cho phép lá»c nhanh chuyên khoa theo tên.

    - Hiển thị thông tin dưới dạng bảng hiện đại: Avatar chuyên khoa, Mã, Tên, Mô tả (ellipsis), Trạng thái (ACTIVE/INACTIVE với màu sắc phân biệt).

    - Thiết kế giao diện theo phong cách Glassmorphism, bo góc má»m mại và đổ bóng hiện đại.

  - **Hệ thống Dialog (Tạo/Sửa)**:

    - Tích hợp Form thông minh trong Dialog, tự động chuyển đổi giữa chế độ "Thêm mới" và "Cập nhật".

    - Xử lý Validation: Hiển thị lỗi trực tiếp trên Form nếu tên hoặc mã chuyên khoa bị trùng lặp (dựa trên phản hồi từ Backend).

    - Input hình ảnh thông qua URL (với preview avatar).

  - **Xác nhận Xóa & Ràng buộc**:

    - Dialog xác nhận xóa an toàn để tránh thao tác nhầm.

    - Xử lý lỗi nghiệp vụ: Hiển thị thông báo chi tiết khi không thể xóa chuyên khoa (do có bác sĩ đang trực thuộc) theo đúng logic từ Service layer.

  - **Phân quyá»n & Äiá»u hướng**:

    - Äăng ký Route bảo mật trong `App.jsx`.

    - Thêm menu "Quản lý chuyên khoa" vào Sidebar cho ngưá»i dùng có quyá»n `ADMIN`.

## T-023: DoctorController: public list, filter by department

- **Lý do thực hiện:** Cung cấp API công khai giúp ngưá»i dùng tìm kiếm và xem danh sách bác sĩ theo chuyên khoa, hỗ trợ quá trình đặt lịch khám một cách dễ dàng và thuận tiện.

- **Công nghệ sử dụng:** Spring Data JPA (Specification), Spring Web MVC, Swagger/OpenAPI.

- **Logic triển khai:**

  - Xây dựng `DoctorResponse` DTO chứa thông tin bác sĩ và danh sách các chuyên khoa trực thuộc (phối hợp với quan hệ Many-to-Many).

  - Sử dụng `JpaSpecificationExecutor` để thực hiện các truy vấn động (Dynamic Query): lá»c theo `departmentId` (thông qua bảng trung gian), tìm kiếm theo tên bác sĩ (case-insensitive partial matching).

  - Tích hợp cơ chế phân trang (`Pageable`) và trả vá» `PagedResponse` chuẩn hóa giúp tối ưu hóa băng thông và hiệu năng Frontend.

  - Endpoint `GET /api/v1/doctors` được cấu hình cho phép truy cập công khai trong `SecurityConfig`, không yêu cầu xác thực JWT.

## T-024: Doctor-Department relationship (assign/unassign)

- **Lý do thực hiện:** Thiết lập mối quan hệ linh hoạt giữa Bác sĩ và Chuyên khoa, phản ánh chính xác thực tế một bác sĩ có thể đảm nhiệm nhiá»u chuyên môn khác nhau.

- **Công nghệ sử dụng:** JPA Many-to-Many, Hibernate `@JoinTable`, Spring Transactional.

- **Logic triển khai:**

  - Cấu trúc lại các thực thể `DoctorProfile` và `Department` từ quan hệ Một-Nhiá»u sang **Nhiá»u-Nhiá»u (Many-to-Many)**.

  - Triển khai `DoctorService` với logic nghiệp vụ gán chuyên khoa:

    - Kiểm tra sự tồn tại của Bác sĩ và danh sách các ID Chuyên khoa.

    - Xử lý cập nhật danh sách chuyên khoa mới trong một `@Transactional` duy nhất để đảm bảo tính nhất quán của dữ liệu.

  - Mở rộng `DoctorProfileRepository` để hỗ trợ đếm số lượng bác sĩ theo quan hệ Nhiá»u-Nhiá»u, phục vụ cho logic ràng buộc khi xóa Chuyên khoa.

  - Endpoint `PUT /api/v1/doctors/{id}/departments` được bảo vệ bởi `@PreAuthorize("hasRole('ADMIN')")`, đảm bảo chỉ quản trị viên mới có quyá»n điá»u phối nhân sự.

  - Äồng bộ hóa dữ liệu: Cập nhật `UserProfileResponse` và logic mapping để thông tin chuyên khoa luôn xuất hiện trong hồ sơ cá nhân của bác sĩ.

## T-025: Public Doctor listing page (cards, filter, search)

- **Lý do thực hiện:** Xây dựng giao diện tìm kiếm và xem danh sách bác sĩ dành cho bệnh nhân, giúp há» dễ dàng chá»n lựa bác sĩ phù hợp theo chuyên khoa và nhu cầu.

- **Công nghệ sử dụng:** React (Vite), MUI (Material UI), Lucide Icons, Framer Motion, Axios.

- **Logic triển khai:**

  - **Thiết kế Card:** Mỗi thẻ bác sĩ hiển thị đầy đủ: áº¢nh đại diện, Há»c hàm/Há»c vị (Specialization), Số năm kinh nghiệm, Nơi công tác và các Chuyên khoa liên quan.

  - **Bộ lá»c động:** Tích hợp Sidebar lá»c theo Chuyên khoa (lấy dữ liệu thực tế từ API) và thanh tìm kiếm theo tên ở phần Hero.

  - **Trạng thái Loading:** Sử dụng Skeleton screen để tạo cảm giác tải mượt mà.

  - **Phân trang:** Äồng bộ hóa tham số trang với API Backend để hiển thị kết quả phân đoạn (9 bác sĩ/trang).

  - **Hiệu ứng:** Sử dụng Framer Motion cho các chuyển động card khi lá»c và tìm kiếm, tạo trải nghiệm cao cấp.

  - **Navigation:** Cập nhật Navbar toàn hệ thống để dẫn link tới `/doctors`.

## T-027: Create Appointment entity + status enum

- **Lý do thực hiện:** Xây dựng cấu trúc dữ liệu cốt lõi cho hệ thống đặt lịch khám, quản lý mối liên kết giữa Bệnh nhân, Bác sĩ và Chuyên khoa.

- **Công nghệ sử dụng:** Java 17, Spring Data JPA, Hibernate, MySQL Indexing.

- **Logic triển khai:**

  - Thiết lập thực thể `Appointment` với các quan hệ `@ManyToOne` đến `User` (Patient/Doctor) và `Department`.

  - Sử dụng Enum `AppointmentStatus` (PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW).

  - Tối ưu hóa hiệu năng: Äánh Index cho các cột `appointment_date`, `status`, `patient_id` và `doctor_id` để đảm bảo tốc độ truy vấn < 200ms.

  - Tích hợp Auditing (`createdAt`, `updatedAt`) để theo dõi vết lịch sử đặt chỗ.

## T-028: AppointmentController: book, cancel, list endpoints

- **Lý do thực hiện:** Cung cấp bộ API RESTful cho các thao tác nghiệp vụ đặt lịch khám trực tuyến, đảm bảo tính nhất quán và bảo mật dữ liệu.

- **Công nghệ sử dụng:** Spring Boot Starter Web, Spring Security, Jakarta Validation.

- **Logic triển khai:**

  - **Äặt lịch (POST /api/v1/appointments):** Tiếp nhận thông tin, kiểm tra tính khả dụng của bác sĩ và khung giá».

  - **Hủy lịch (PATCH /api/v1/appointments/{id}/cancel):** Chuyển trạng thái sang `CANCELLED`. Ãp dụng ràng buộc nghiệp vụ: Không cho phép hủy nếu thá»i gian cách giá» hẹn dưới 02 tiếng.

  - **Danh sách lịch hẹn (GET):** Hỗ trợ lá»c theo `status`, `date` và phân quyá»n truy cập (Bệnh nhân chỉ xem lịch của mình, Bác sĩ xem lịch trực của mình).

  - **Khung giá» trống (GET /slots):** API tính toán các slot 30 phút khả dụng dựa trên lịch làm việc của bác sĩ và các cuộc hẹn đã có.

  - **Ràng buộc Business Rules:** Giới hạn tối đa 02 cuộc hẹn/ngày/bệnh nhân và chỉ cho phép đặt lịch trong vòng 30 ngày tới.

## T-029: Conflict Detection (Overlap logic)

- **Lý do thực hiện:** Äảm bảo tính toàn vẹn của lịch hẹn, ngăn chặn việc đặt trùng lặp bác sĩ hoặc tài nguyên trong cùng một khoảng thá»i gian.

- **Công nghệ sử dụng:** Spring Data JPA `@Query`, SQL Overlap Formula, Custom Exceptions.

- **Logic triển khai:**

  - **Công thức Overlap:** Ãp dụng điá»u kiện `(Start_A < End_B AND End_A > Start_B)` để phát hiện má»i trưá»ng hợp trùng lặp (trùng một phần, bao trùm, hoặc nằm trong).

  - **Xử lý Update:** Query hỗ trợ tham số `excludeId` để cho phép cập nhật lịch mà không tự xung đột với chính bản ghi hiện tại.

  - **HTTP 409 Conflict:** Tạo `ConflictException` và tích hợp vào `GlobalExceptionHandler` để trả vá» đúng mã lỗi tiêu chuẩn khi phát hiện trùng lịch.

  - **Tính nhất quán:** Sử dụng `@Transactional` để đảm bảo logic kiểm tra và lưu dữ liệu được thực hiện nguyên tử, ngăn chặn Race Condition.

  - **Hiệu năng:** Tối ưu hóa truy vấn thông qua các Index trên `appointment_date`, `doctor_id` và các cột thá»i gian.

## T-030: Multi-step Booking Form (Wizard)

- **Lý do thực hiện:** Tối ưu hóa trải nghiệm ngưá»i dùng (UX) trong quy trình đặt lịch phức tạp, giúp giảm tải nhận thức bằng cách chia nhá» các bước lựa chá»n.

- **Công nghệ sử dụng:** React, MUI Stepper, date-fns (lịch tiếng Việt), Lucide Icons.

- **Logic triển khai:**

  - **Quy trình 4 bước:** Chuyên khoa â†’ Bác sĩ â†’ Ngày/Giá» â†’ Xác nhận.

  - **Lá»c Ngày Thông minh:** Tích hợp logic kiểm tra lịch làm việc của bác sĩ (Doctor Schedule) để vô hiệu hóa (disable) các ngày không có lịch khám ngay trên bộ chá»n ngày.

  - **Quản lý State Chặt chẽ:** Äảm bảo tính tuần tự; khi ngưá»i dùng thay đổi chuyên khoa hoặc bác sĩ ở các bước trước, hệ thống sẽ tự động reset các lựa chá»n ở bước sau để tránh sai lệch dữ liệu.

  - **Responsive & Mobile-first:** Sử dụng Horizontal Scroller cho bộ chá»n ngày và Grid 3-cột cho bộ chá»n giá» giúp thao tác trên Mobile mượt mà, dễ bấm bằng ngón tay.

  - **Xác nhận & Gửi:** Hiển thị bản tóm tắt thông tin (Review) trước khi thực hiện cuộc gá»i API cuối cùng để đặt lịch.

## T-031: "My Appointments" management page for patients

- **Lý do thực hiện:** Cung cấp trung tâm quản lý lịch hẹn cho bệnh nhân, giúp há» theo dõi tiến độ điá»u trị và chủ động trong việc thay đổi kế hoạch khám.

- **Công nghệ sử dụng:** React, MUI (Tabs, Dialogs, Cards), date-fns.

- **Logic triển khai:**

  - **Phân loại Tab Thông minh:** Nhóm các trạng thái theo nhu cầu thực tế: Tất cả, Sắp tới (Upcoming - PENDING/CONFIRMED), Äã khám (COMPLETED), và Äã hủy (CANCELLED).

  - **Thẻ Lịch hẹn (Premium Cards):** Hiển thị trực quan với Avatar bác sĩ, Badge trạng thái có màu sắc nhận diện riêng, và tóm tắt thá»i gian/ngày khám.

  - **Modal Chi tiết (Detail View):** Tích hợp hộp thoại hiển thị đầy đủ thông tin: Äịa chỉ phòng khám (CareTriage Hà Nội), Lý do khám chi tiết, Ghi chú chuyên môn của bác sĩ và Chỉ dẫn đưá»ng đi.

  - **Tính năng Äặt lại (Re-booking):** Cho phép ngưá»i dùng đặt lại lịch với cùng bác sĩ chỉ bằng một cú click, tăng tỷ lệ quay lại của khách hàng.

  - **Quản lý Hủy lịch:** Tích hợp quy trình hủy lịch kèm lý do và xác nhận, tuân thủ ràng buộc Backend (chỉ hủy trước 2 tiếng).

  - **Empty State:** Thiết kế chuyên nghiệp với hình ảnh minh há»a và nút kêu gá»i hành động (CTA) khi danh sách trống.

## T-032: Doctor Today Appointments API & Status Logic

- **Lý do thực hiện:** Xây dựng hệ thống quản lý luồng bệnh nhân thá»i gian thực cho bác sĩ, tối ưu hóa quy trình khám chữa bệnh tại phòng khám.

- **Công nghệ sử dụng:** Spring Boot, JPA, `@Transactional`, Role-based Security.

- **Logic triển khai:**

  - **Quy tắc "Một bệnh nhân":** Thực thi ràng buộc Business Rule: Một bác sĩ chỉ có thể có duy nhất 01 bệnh nhân ở trạng thái `IN_PROGRESS` tại một thá»i điểm.

  - **Bảo mật Trạng thái:** Chặn các bước chuyển trạng thái không hợp lệ (ví dụ: không thể quay lại `PENDING` từ `COMPLETED`).

  - **Lá»c dữ liệu:** API tự động lá»c lịch hẹn theo `doctor_id` từ Token và ngày hiện tại (`LocalDate.now()`).

  - **Ghi chú & Lý do:** Tích hợp việc lưu trữ lý do hủy (`cancellationReason`) và ghi chú khám bệnh (`notes`) trực tiếp trong luồng cập nhật trạng thái.

## T-033: Doctor's Today Appointments Dashboard

- **Lý do thực hiện:** Cung cấp giao diện làm việc chính cho bác sĩ, giúp theo dõi danh sách bệnh nhân và thực hiện các thao tác chuyên môn nhanh chóng.

- **Công nghệ sử dụng:** React, MUI Table, Lucide Icons.

- **Logic triển khai:**

  - **Bảng điá»u khiển Real-time:** Tích hợp cơ chế **Auto-refresh (5 phút/lần)** và nút Refresh thủ công để cập nhật danh sách bệnh nhân mới nhất.

  - **Tìm kiếm & Bộ lá»c:** Cho phép bác sĩ tìm nhanh bệnh nhân qua Tên hoặc SÄT, kèm bộ lá»c Tab (Chá» khám, Äang khám, Hoàn thành).

  - **Bảo mật & Quyá»n:** Nút bấm chỉ hiển thị cho Bác sĩ được phân công và chỉ trong ngày hiện tại, tuân thủ nghiêm ngặt phân quyá»n Role-based.

## T-035: Medical Record Database Schema & Entity

- **Lý do thực hiện:** Xây dựng ná»n tảng lưu trữ thông tin lâm sàng và lịch sử bệnh lý, đảm bảo dữ liệu được cấu trúc hóa để phục vụ tra cứu và AI phân tích.

- **Công nghệ sử dụng:** Spring Data JPA, Hibernate Indexing.

- **Logic triển khai:**

  - **Cấu trúc thực thể:** Triển khai `MedicalRecord` với các trưá»ng quan trá»ng: Triệu chứng (`symptoms`), Chẩn đoán (`diagnosis`), Phác đồ điá»u trị (`treatmentPlan`), Ghi chú (`notes`) và Ngày tái khám (`followUpDate`).

  - **Thiết lập Quan hệ:** Many-to-One với `User` (Patient và Doctor), One-to-One với `Appointment` để đảm bảo mỗi ca khám có một hồ sơ duy nhất.

  - **Tối ưu hóa Truy vấn:** Äánh Index cho `patient_id` và `created_at` để đảm bảo việc tải lịch sử bệnh án (History) đạt hiệu năng cao (< 100ms).

  - **Tính toàn vẹn:** Ràng buộc `nullable = false` cho bệnh nhân và bác sĩ để đảm bảo tính pháp lý của hồ sơ.

## T-036: Medical Record API (Controller & Service)

- **Lý do thực hiện:** Cung cấp giao thức kết nối cho phép bác sĩ lưu trữ kết quả khám và bệnh nhân tra cứu lịch sử bệnh lý một cách bảo mật.

- **Công nghệ sử dụng:** Spring Boot REST, Spring Security (Role-based), Jakarta Validation.

- **Logic triển khai:**

  - **Tạo hồ sơ (POST /api/v1/medical-records):** 

    - Chỉ cho phép `DOCTOR` hoặc `ADMIN` thực hiện.

    - Tự động kiểm tra quyá»n sở hữu (Bác sĩ phải là ngưá»i phụ trách ca khám đó).

    - **Trigger:** Tự động cập nhật trạng thái Lịch hẹn sang `COMPLETED` khi hồ sơ bệnh án được lưu thành công.

  - **Tra cứu lịch sử (GET /patient/{id}):**

    - Ãp dụng phân quyá»n: Bệnh nhân chỉ được xem lịch sử của chính mình; Bác sĩ/Admin xem được toàn bộ.

    - Sắp xếp mặc định theo `createdAt` giảm dần (mới nhất lên đầu).

  - **DTO Mapping:** Sử dụng `MedicalRecordRequest` và `MedicalRecordResponse` để tách biệt lớp dữ liệu và lớp hiển thị, bảo vệ các thông tin hệ thống nhạy cảm.

## T-037: Medical Record Creation UI (Electronic Health Record)

- **Lý do thực hiện:** Cung cấp công cụ nhập liệu chuyên dụng cho bác sĩ, giúp số hóa hồ sơ khám bệnh và đơn thuốc một cách nhanh chóng và chính xác.

- **Công nghệ sử dụng:** React Hook Form, Yup Validation, MUI Autocomplete, Lucide Icons.

- **Logic triển khai:**

  - **Layout 3 vùng Chuyên nghiệp:** Tách biệt rõ ràng giữa Thông tin lâm sàng (Triệu chứng/Chẩn đoán), Äơn thuốc, và Thông tin hành chính (Hẹn tái khám).

  - **Quản lý Äơn thuốc Äộng:** Sử dụng `useFieldArray` cho phép bác sĩ thêm/bớt thuốc linh hoạt trong đơn.

  - **Autocomplete & Gợi ý:** Tích hợp bộ tìm kiếm thuốc thông minh giúp bác sĩ kê đơn nhanh chóng và tránh sai sót chính tả.

  - **Validation chặt chẽ:** Kiểm tra dữ liệu thá»i gian thực; ngăn chặn việc lưu hồ sơ nếu thiếu chẩn đoán hoặc có số lượng thuốc không hợp lệ.

  - **Tối ưu luồng công việc:** Nút "Lập hồ sơ" được tích hợp ngay tại Dashboard khi bệnh nhân đang khám, tự động hoàn tất ca khám sau khi lưu hồ sơ.

## T-034: Advanced State Transition Buttons

- **Lý do thực hiện:** Chuẩn hóa quy trình nghiệp vụ và giảm thiểu sai sót thao tác bằng cách chỉ hiển thị các hành động hợp lệ theo trạng thái hiện tại của lịch hẹn.

- **Công nghệ sử dụng:** React (Conditional Rendering), MUI Snackbar, Axios.

- **Logic triển khai:**

  - **State Machine UI:** Thiết kế các nút chức năng động: `PENDING` -> "Xác nhận" (Blue), `CONFIRMED` -> "Bắt đầu" (Green) + "Vắng mặt" (Gray), `IN_PROGRESS` -> "Xong" (Success).

  - **Thông báo tức thì:** Tích hợp Snackbar (Toast) để phản hồi kết quả cập nhật ngay lập tức mà không cần Reload trang (Optimistic UI approach).

  - **Xử lý Loading:** Toàn bộ các nút hành động đá»u có trạng thái Disable và Spinner trong khi chá» phản hồi từ API.

  - **Bảo mật & Quyá»n:** Nút bấm chỉ hiển thị cho Bác sĩ được phân công và chỉ trong ngày hiện tại, tuân thủ nghiêm ngặt phân quyá»n Role-based.

## T-038: Linkage mechanism between Appointment and Medical Record

- **Lý do thực hiện:** Äảm bảo dữ liệu khám chữa bệnh được lưu trữ đúng ngữ cảnh của lịch hẹn và bác sĩ có thể truy cập nhanh chóng lịch sử bệnh nhân.

- **Công nghệ sử dụng:** Spring Boot, JPA Transaction, Criteria API, Audit Logging.

- **Logic triển khai:**

  - Bổ sung trạng thái `CHECKED_IN` cho Lịch hẹn.

  - Xây dựng `ExaminationService.startExamination` thực hiện liên kết 7 bước: Query lịch hẹn -> Check status -> Validate PatientProfile -> Tạo ClinicalNote (Session) linked to Appointment -> Update status to IN_PROGRESS -> Error handling -> Ghi nhận Audit Log.

  - Tích hợp bảo mật Role-based: Chỉ bác sĩ phụ trách mới có quyá»n khởi tạo phiên khám.

  - Äảm bảo tính toàn vẹn dữ liệu qua `@Transactional`.

## T-039: Detailed Medical Record View (Giao diện chi tiết hồ sơ bệnh án)

- **Lý do thực hiện:** Xây dựng một giao diện chi tiết, chuyên nghiệp cho phép Bác sĩ và Quản trị viên xem toàn bộ lịch sử bệnh án, kết quả khám lâm sàng, cận lâm sàng và đơn thuốc của bệnh nhân một cách trực quan.

- **Công nghệ sử dụng:** MUI Grid & Card, Lucide Icons, CSS Print Media Queries, Axios Client.

- **Logic triển khai:**

  - **Bố cục Phân đoạn (Sectioned Layout):** Chia thông tin thành các khối logic: Thông tin hành chính, Chỉ số sinh tồn (Vital Signs), Chẩn đoán, Äơn thuốc và Hình ảnh cận lâm sàng.

  - **Tối ưu hóa In ấn (Print-Friendly):** Sử dụng CSS `@media print` để ẩn các thành phần điá»u hướng (Sidebar, Header, Buttons) và định dạng lại trang web thành một tá» hồ sơ y tế chuyên nghiệp khi nhấn nút "In hồ sơ".

  - **Hiển thị Dữ liệu Äộng:** Xử lý render dữ liệu từ API `/api/v1/medical-records/{id}`, hỗ trợ hiển thị danh sách thuốc và các chỉ số sức khá»e một cách linh hoạt.

  - **UI/UX Cao cấp:** Sử dụng Typography hiện đại, hệ thống Icon nhất quán và hiệu ứng hover/transistion mượt mà, tạo cảm giác cao cấp và tin cậy cho ngưá»i dùng ngành y tế.

  - **Xử lý Trạng thái:** Tích hợp Skeleton loading và thông báo lỗi 403/404 thân thiện thông qua `axiosClient`.

## T-040: Setup Gemini API client & Medical System Prompt

- **Lý do thực hiện:** Xây dựng ná»n tảng trí tuệ nhân tạo lõi cho hệ thống, đảm bảo AI hoạt động trong khuôn khổ an toàn y tế và có khả năng tương tác ngôn ngữ tự nhiên chất lượng cao.

- **Công nghệ sử dụng:** Python 3.11+, Google Generative AI SDK, Pydantic, Python-dotenv.

- **Logic triển khai:**

  - **Khởi tạo kết nối bảo mật:** Triển khai `TriageService` với cơ chế quản lý API Key qua biến môi trưá»ng, thiết lập `SafetySettings` để ngăn chặn các nội dung không phù hợp nhưng vẫn cho phép thảo luận các chủ đá» y tế nhạy cảm.

  - **Thiết kế System Prompt Chuyên gia:** Xây dựng prompt định danh AI là "CareTriage Assistant" với các chỉ thị nghiêm ngặt: Æ¯u tiên cứu sống (ABCDE), nhận diện Red Flags (FAST cho đột quỵ, đau thắt ngực), và luôn đính kèm miễn trừ trách nhiệm y khoa.

  - **Tối ưu hóa tham số AI:** Cấu hình `temperature=0.2` để giảm thiểu sự "sáng tạo" quá mức (hallucination) và tăng tính ổn định của câu trả lá»i y khoa.

## T-041: Implement conversation chain (Context memory)

- **Lý do thực hiện:** Duy trì ngữ cảnh của buổi tư vấn, giúp AI không há»i lặp lại các thông tin đã biết và có thể đưa ra tư vấn dựa trên toàn bộ diễn biến triệu chứng.

- **Công nghệ sử dụng:** Gemini Chat Session API, Stateful Service Pattern.

- **Logic triển khai:**

  - **Cấu trúc hóa History:** Chuyển đổi mảng tin nhắn từ Frontend thành định dạng `history=[{'role': 'user', 'parts': [...]}, ...]` tương thích với SDK của Google.

  - **Quản lý trạng thái phiên:** Lưu trữ và cập nhật liên tục lịch sử hội thoại trong bộ nhớ, cho phép AI thực hiện các truy vấn lùi (back-reference) vá» các triệu chứng bệnh nhân đã mô tả ở các tin nhắn trước đó.

## T-042: Create triage analysis endpoint (POST /api/triage/analyze)

- **Lý do thực hiện:** Cung cấp cổng giao tiếp chính giữa Frontend và AI Service, xử lý đa luồng các yêu cầu phân tích triệu chứng.

- **Công nghệ sử dụng:** FastAPI, Asynchronous Programming (async/await), Uvicorn.

- **Logic triển khai:**

  - **Xử lý Dữ liệu Äa phương thức:** Thiết kế Schema nhận diện cả Văn bản (triệu chứng) và Hình ảnh (kết quả xét nghiệm, đơn thuốc cũ) dưới dạng Base64.

  - **Pipeline phân tích:** Tiếp nhận -> Trích xuất Metadata (Tuổi, Giới tính) -> Chèn vào Prompt -> Gá»i AI -> Trả vá» kết quả JSON hóa.

  - **Global Exception Handling:** Tích hợp bộ lá»c lỗi tập trung để chuyển đổi các lỗi AI (Rate Limit, API Key invalid) thành các thông báo JSON thân thiện cho Frontend.

## T-043: Prompt engineering: symptom analysis & follow-up questions

- **Lý do thực hiện:** Tăng độ chính xác của quá trình sơ chẩn bằng cách hướng dẫn AI thực hiện các bước tư duy lâm sàng (Chain-of-Thought).

- **Công nghệ sử dụng:** Chain-of-Thought Prompting, Medical Triage Frameworks.

- **Logic triển khai:**

  - **Cơ chế suy luận (Thinking process):** Yêu cầu AI thực hiện phân tích ngầm trong tag `<thinking>` trước khi đưa ra câu trả lá»i chính thức, giúp AI tự kiểm tra các dấu hiệu nguy hiểm.

  - **Sàng lá»c thông tin:** Chỉ thị AI không được há»i quá 3 câu há»i cùng lúc để tránh gây quá tải cho bệnh nhân và tập trung vào các triệu chứng "loại trừ" (exclusionary symptoms).

  - **Äa ngôn ngữ:** Tự động phát hiện và phản hồi bằng ngôn ngữ của bệnh nhân (Tiếng Việt/Tiếng Anh) nhưng vẫn giữ chuẩn thuật ngữ y khoa quốc tế.

## T-044: Triage recommendation endpoint (POST /api/triage/recommend)

- **Lý do thực hiện:** Tổng hợp toàn bộ thông tin hội thoại để đưa ra quyết định phân luồng (Triage Decision) cuối cùng một cách chính xác và cấu trúc hóa.

- **Công nghệ sử dụng:** Gemini JSON Mode, Constraint-based Prompting.

- **Logic triển khai:**

  - **JSON Schema Enforcement:** Sử dụng `response_mime_type: "application/json"` để ép AI trả vá» dữ liệu có cấu trúc bao gồm: `department_id`, `urgency_level`, `reason`, `confidence_score`.

  - **Logic kiểm soát độ tin cậy:** Triển khai thuật toán hậu xử lý: Nếu `confidence_score < 0.6`, hệ thống sẽ tự động ghi đè đá» xuất sang "Nội tổng quát" để đảm bảo an toàn cho bệnh nhân.

  - **Mapping chuyên khoa:** Chuyển đổi tên chuyên khoa do AI đá» xuất sang hệ thống ID chuyên khoa chuẩn của Database Java thông qua bộ từ điển mapping.

## T-045: Spring Boot AiClientService (Java-Python Bridge)

- **Lý do thực hiện:** Tích hợp liá»n mạch khả năng thông minh của AI Service (Python) vào luồng nghiệp vụ chính của hệ thống CareTriage (Java).

- **Công nghệ sử dụng:** Spring RestTemplate, Jackson Mapper, Error Handling Interceptors.

- **Logic triển khai:**

  - **Giao tiếp liên dịch vụ:** Xây dựng `AiClientServiceImpl` với RestTemplate cấu hình Timeout chặt chẽ (Connection: 5s, Read: 30s) để tránh treo hệ thống khi AI phản hồi chậm.

  - **Cơ chế Fallback:** Triển khai xử lý ngoại lệ cho các mã lỗi 502 (Bad Gateway), 503 (Service Unavailable), đảm bảo trả vá» phản hồi mặc định an toàn khi dịch vụ AI gặp sự cố.

  - **Bảo mật nội bộ:** Sử dụng API Key hoặc JWT để xác thực các yêu cầu giữa hai dịch vụ Backend.

## T-046: WebSocket infrastructure (STOMP over SockJS)

- **Lý do thực hiện:** Xây dựng hạ tầng kết nối thá»i gian thực ổn định, hỗ trợ trải nghiệm chat mượt mà và các thông báo tức thá»i (Push notifications).

- **Công nghệ sử dụng:** Spring WebSocket, STOMP Protocol, SockJS Library.

- **Logic triển khai:**

  - **Cấu hình Message Broker:** Thiết lập Broker hỗ trợ `/topic` cho các tin nhắn broadcast (Group chat) và `/queue` cho các tin nhắn cá nhân (1-1 Chat), tối ưu hóa hiệu năng điá»u hướng tin nhắn.

  - **Äảm bảo tính tương thích:** Tích hợp SockJS để tự động chuyển đổi sang cơ chế HTTP Long Polling nếu trình duyệt của ngưá»i dùng không hỗ trợ WebSocket thuần túy.

  - **Quản lý Endpoint:** Äăng ký endpoint `/ws-chat` với chính sách CORS linh hoạt cho môi trưá»ng phát triển.

## T-047: ChatWebSocketController & JWT Security Integration

- **Lý do thực hiện:** Triển khai logic nghiệp vụ chat thực tế và bảo mật luồng dữ liệu, ngăn chặn truy cập trái phép vào các phiên tư vấn riêng tư.

- **Công nghệ sử dụng:** Spring Messaging, JWT Interceptor, HtmlUtils (Sanitization).

- **Logic triển khai:**

  - **Xác thực tầng thấp (Channel Interceptor):** Triển khai `AuthChannelInterceptorAdapter` để trích xuất và kiểm tra JWT Token ngay trong frame `CONNECT` của STOMP, đảm bảo tính danh chính ngôn thuận trước khi thiết lập kết nối.

  - **Xử lý tin nhắn an toàn:** Tích hợp `HtmlUtils.htmlEscape` để làm sạch nội dung tin nhắn, phòng chống tấn công XSS. Lưu trữ tin nhắn vào Database thông qua `ChatService` trước khi broadcast.

  - **Theo dõi trạng thái (Presence Management):** Lắng nghe sự kiện kết nối/ngắt kết nối để cập nhật trạng thái Online/Offline của ngưá»i dùng, phục vụ cho giao diện hiển thị trạng thái thực tế.

  - **Xử lý lỗi tập trung:** Sử dụng `@MessageExceptionHandler` để gửi các thông báo lỗi cụ thể vá» cho ngưá»i dùng qua queue `/user/queue/errors`.

## T-048: ChatSession, ChatMessage entities + persistence
- **Lý do thực hiện:** Xây dựng cấu trúc dữ liệu lưu trữ các phiên tư vấn và nội dung tin nhắn, đảm bảo lịch sử hội thoại được bảo tồn và có thể truy xuất lại khi người dùng quay lại hệ thống.
- **Công nghệ sử dụng:** Spring Data JPA, Hibernate, MySQL.
- **Logic triển khai:**
  - **Entity ChatSession:** Lưu trữ metadata của phiên (User, SessionType, Status, AI Summary, Urgency Level).
  - **Entity ChatMessage:** Lưu trữ nội dung tin nhắn, loại người gửi (USER/AI/SYSTEM) và metadata chi tiết.
  - **Persistence Logic:** Triển khai ChatService với các phương thức createSession, sendMessage, getSessionHistory và getUserSessions.
  - **API Endpoints:** Cung cấp REST endpoints để tạo session, lấy danh sách sessions của user và tải lại lịch sử tin nhắn của một session cụ thể.
  - **Data Integrity:** Sử dụng @Transactional để đảm bảo tính nhất quán khi lưu trữ hội thoại và xử lý AI response bất đồng bộ.
0
## T-049: Chat window component (message bubbles, typing indicator)
- **Lý do thực hiện:** Cung cấp giao diện tương tác trực quan, thân thiện cho hệ thống AI Triage, giúp người dùng dễ dàng mô tả triệu chứng và nhận tư vấn.
- **Công nghệ sử dụng:** React, Tailwind CSS v4, Framer Motion, Lucide Icons.
- **Logic triển khai:**
  - **ChatWindow:** Thiết kế giao diện Glassmorphism hiện đại, hỗ trợ Responsive (toàn màn hình trên mobile, cửa sổ nổi trên desktop).
  - **MessageBubble:** Phân biệt rõ rệt tin nhắn người dùng (phải) và AI (trái) bằng màu sắc và vị trí. Tích hợp Avatar người dùng/AI, thời gian gửi và trạng thái tin nhắn (Sending/Sent/Read).
  - **TypingIndicator:** Hiệu ứng 3 dấu chấm nhấp nháy kết hợp với Icon AI để thông báo trạng thái AI đang xử lý.
  - **Auto-scroll:** Sử dụng useRef và useEffect để tự động cuộn xuống tin nhắn mới nhất.
  - **UX/UI:** Tối ưu hóa các khoảng cách (padding/margin), sử dụng bo góc lớn (rounded-2xl) và bóng đổ mềm mại để tạo cảm giác cao cấp.
## T-050: useWebSocket hook (connect, send, receive, reconnect)
- **Lý do thực hiện:** Xây dựng một Custom Hook mạnh mẽ để quản lý tập trung logic kết nối WebSocket, giúp các component dễ dàng tương tác thời gian thực mà không cần quản lý vòng đời kết nối phức tạp.
- **Công nghệ sử dụng:** React Hooks, @stomp/stompjs, SockJS, Exponential Backoff Algorithm.
- **Logic triển khai:**
  - **Trạng thái kết nối:** Quản lý đầy đủ các trạng thái (IDLE, CONNECTING, CONNECTED, RECONNECTING, ERROR) giúp UI phản hồi chính xác.
  - **Exponential Backoff:** Triển khai thuật toán kết nối lại tự động với thời gian chờ tăng dần (1s, 2s, 4s, 8s...) để tránh làm quá tải server khi gặp sự cố.
  - **Bảo mật:** Tự động đính kèm JWT Token vào Header của mọi kết nối WebSocket.
  - **Cleanup:** Đảm bảo ngắt kết nối an toàn khi component unmount, ngăn ngừa rò rỉ bộ nhớ (Memory leaks).
  - **Abstraction:** Cung cấp các hàm send và subscribe đơn giản hóa việc giao tiếp qua giao thức STOMP.

## T-051: Symptom suggestion chips (quick input)
- **Lý do thực hiện:** Tăng cường trải nghiệm người dùng bằng cách cung cấp các gợi ý triệu chứng phổ biến, giúp quá trình nhập liệu nhanh chóng và chính xác hơn, đặc biệt là khi bắt đầu cuộc hội thoại.
- **Công nghệ sử dụng:** React, Tailwind CSS v4.
- **Logic triển khai:**
  - **Giao diện:** Thiết kế các chip (nút bo tròn) với hiệu ứng Hover và Active mượt mà.
  - **Điều kiện hiển thị:** Chỉ hiển thị các gợi ý khi số lượng tin nhắn trong hội thoại ít (dưới 4 tin), tránh làm loãng giao diện khi cuộc hội thoại đã đi vào chi tiết.
  - **Tương tác:** Tích hợp hàm callback onSendMessage giúp gửi nội dung gợi ý ngay lập tức khi người dùng click.
  - **Responsive:** Hỗ trợ cuộn ngang (Horizontal scroll) trên thiết bị di động với thanh cuộn ẩn (no-scrollbar).

## T-048 (Nâng cấp): Chat History Management (Pagination, Search, Last Message)
- **Lý do thực hiện:** Hoàn thiện tính năng xem lại lịch sử tư vấn theo yêu cầu chi tiết của US-013, đảm bảo hiệu năng và trải nghiệm người dùng mượt mà.
- **Công nghệ sử dụng:** Spring Data JPA Pagination, SQL Search, DTO Mapping.
- **Logic triển khai:**
  - **Metadata Optimization:** Lưu trực tiếp last_message_content và last_message_time vào ChatSession để tối ưu hóa việc load danh sách lịch sử.
  - **Pagination:** API /history hỗ trợ phân trang (Pageable) để triển khai Infinite Scroll ở Frontend.
  - **Search:** Triển khai truy vấn ContainingIgnoreCase cho phép tìm kiếm cuộc hội thoại theo tiêu đề.
  - **Business Rules:** Cấu trúc dữ liệu sẵn sàng cho việc phân quyền 'Chỉ xem' dựa trên trạng thái SessionStatus.

## T-052: TriageTicket entity (session, patient, dept, urgency, summary, status)
- **Lý do thực hiện:** Tạo cấu trúc dữ liệu trung tâm để chuyển kết quả tư vấn AI thành ticket cho bác sĩ theo dõi, phân công và xử lý.
- **Công nghệ sử dụng:** Java 17, Spring Data JPA, Hibernate, MySQL.
- **Logic triển khai:**
  - Thiết lập entity `TriageTicket` với quan hệ 1-1 đến `ChatSession`, nhiều-1 đến `User` bệnh nhân, `User` bác sĩ phụ trách và `Department` được đề xuất.
  - Lưu thông tin triage cốt lõi gồm `urgencyLevel`, `aiSummary`, `suggestedDepartment`, `symptoms`, `doctorNotes` và `status`.
  - Chuẩn hóa enum `UrgencyLevel` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) và `TicketStatus` (`OPEN`, `ASSIGNED`, `IN_REVIEW`, `RESOLVED`, `CLOSED`).
  - Thêm ràng buộc unique cho `chat_session_id` để đảm bảo mỗi phiên chat chỉ sinh một ticket, kèm index cho session, patient, doctor, department, status và urgency.
  - Cung cấp `TriageTicketRepository` với các truy vấn nền tảng theo bệnh nhân, bác sĩ, trạng thái, mức độ khẩn cấp và phiên chat.

## T-058: Ticket → Create Appointment action
- **Lý do thực hiện:** Giúp bác sĩ chuyển trực tiếp từ phiếu triage sang lịch hẹn để giảm thao tác nhập lại và đảm bảo liên kết dữ liệu giữa 2 nghiệp vụ.
- **Công nghệ sử dụng:** Spring Boot, Spring Security, React, MUI.
- **Logic triển khai:**
  - Bổ sung DTO `CreateAppointmentFromTicketRequest` và API `POST /api/v1/appointments/from-ticket` (role DOCTOR).
  - Mở rộng `AppointmentService`/`AppointmentServiceImpl` với `createAppointmentFromTicket`:
    - kiểm tra ticket tồn tại,
    - chặn tạo trùng nếu đã có appointment theo `triageTicketId`,
    - chặn ngày quá khứ,
    - tái sử dụng luồng `bookAppointment` để giữ nguyên validate schedule/conflict,
    - lưu liên kết `appointment.triageTicketId = ticket.id`.
  - Cập nhật kiểu `triageTicketId` trong `Appointment` và `AppointmentResponse` sang `UUID`.
  - Frontend doctor inbox: thêm form trong dialog chi tiết ticket để chọn ngày/giờ/chuyên khoa và gọi API tạo lịch hẹn.
  - Hiển thị lỗi/ thành công tại chỗ (bao gồm trường hợp ticket đã có lịch hẹn).

## T-060: Sync status between ticket and appointment
- **Lý do thực hiện:** Đồng bộ trạng thái giữa phiếu triage và lịch hẹn để bác sĩ/patient luôn thấy cùng một tiến trình xử lý, tránh lệch dữ liệu giữa hai luồng nghiệp vụ.
- **Công nghệ sử dụng:** Spring Boot Events, `@TransactionalEventListener`, `@Async`, Spring Data JPA.
- **Logic triển khai:**
  - Tạo event `AppointmentStatusChangedEvent` và `TriageTicketStatusChangedEvent` cho hai chiều đồng bộ.
  - Thêm listener async sau commit để map trạng thái:
    - `Appointment.CHECKED_IN` → `TriageTicket.NEW`
    - `Appointment.IN_PROGRESS` → `TriageTicket.IN_TRIAGE`
    - `Appointment.COMPLETED` → `TriageTicket.TRIAGED`
    - `Appointment.CANCELLED` / `NO_SHOW` → `TriageTicket.REJECTED`
    - `TriageTicket.NEW` → `Appointment.CHECKED_IN`
    - `TriageTicket.IN_TRIAGE` → `Appointment.IN_PROGRESS`
    - `TriageTicket.TRIAGED` / `CLOSED` → `Appointment.COMPLETED`
    - `TriageTicket.REJECTED` → `Appointment.CANCELLED`
  - Publish event sau khi đổi trạng thái trong `AppointmentServiceImpl`, `TriageTicketServiceImpl`, `ExaminationServiceImpl`, `MedicalRecordServiceImpl`.
  - Bổ sung `findByTriageTicketId` cho `AppointmentRepository` để listener tìm lịch hẹn liên kết.
  - Giữ cập nhật đồng bộ mà không tạo vòng lặp bằng cách cho listener cập nhật trực tiếp entity qua repository.

## T-061: Landing page components (Hero, Services, CTA)
- **Lý do thực hiện:** Xây dựng bộ nhận diện thương hiệu và cung cấp thông tin dịch vụ cốt lõi tại trang chủ.
- **Công nghệ sử dụng:** React, MUI, Framer Motion, Tailwind CSS v4.
- **Logic triển khai:**
  - Thiết kế Hero section với hiệu ứng tương tác (Interactive Particles/Morphing Particles).
  - Tích hợp CMS Bridge (i18n) để load nội dung động từ Backend.
  - Chuẩn hóa layout với Container `xl` (1536px) và cấu trúc Grid responsive (sử dụng size prop thay cho xs/md/item để tương thích MUI v9).

## T-062: UI Modernization (Vision & Mission, Footer)
- **Lý do thực hiện:** Đồng nhất bộ nhận diện thương hiệu số của CareTriage theo phong cách Glassmorphism cao cấp, thay thế giao diện cũ đơn điệu bằng trải nghiệm hiện đại, trong suốt và tinh tế.
- **Logic triển khai:**
  - **Vision & Mission**: Chuyển đổi nền từ màu xanh đậm/xám sang dải gradient sáng (`#f0fdf4` -> `#f8fafc`). Áp dụng hiệu ứng Glassmorphism (`backdrop-filter: blur(10px)`) cho các khối nội dung và Hero section.
  - **Footer**: Loại bỏ nền xanh đậm truyền thống, thay bằng lớp phủ trắng mờ 40% với độ nhòe 20px. Chuẩn hóa màu chữ sang Dark Green (`#064e3b`) và Slate (`#4b5563`) để đảm bảo độ tương phản cao cấp.
  - **Typography & Layout**: Cân chỉnh lại toàn bộ hệ thống chữ và nút bấm (CTA) theo chuẩn MUI v9, sử dụng organic shapes và micro-animations để tăng tính tương tác.

## T-063: Department detail page
- **Lý do thực hiện:** Cung cấp thông tin chuyên sâu về từng khoa, danh sách bác sĩ và trang thiết bị.
- **Logic triển khai:**
  - Tích hợp API `publicApi.getDepartmentById` và `publicApi.getDoctors` để load dữ liệu khoa.
  - Hiển thị danh sách bác sĩ dưới dạng Card với thông tin chi tiết và đánh giá (Star Rating).
  - Xử lý trạng thái loading và empty state một cách tinh tế, gỡ bỏ các icon dư thừa theo yêu cầu UI. 

## T-064: Emergency Info page (Hotlines, First-aid, GPS)
- **Lý do thực hiện:** Cung cấp thông tin cấp cứu khẩn cấp và hướng dẫn sơ cứu nhanh cho người dùng.
- **Logic triển khai:**
  - Thiết kế Banner cấp cứu với hiệu ứng Pulse báo động.
  - Tích hợp Geolocation API để tính toán khoảng cách đến bệnh viện gần nhất dựa trên công thức Haversine.
  - Cung cấp danh sách Hotline hỗ trợ gọi điện trực tiếp (`tel:` links).

## T-065: Contact Form with Spam Protection
- **Lý do thực hiện:** Kênh liên lạc chính thức giữa bệnh viện và khách hàng, đảm bảo an toàn trước spam.
- **Logic triển khai:**
  - Form liên hệ với Validation dữ liệu và xử lý trạng thái gửi (loading/success/error) mượt mà.
  - Tích hợp cơ chế Robot check (Checkbox confirm) để bảo vệ hệ thống trước các yêu cầu tự động.
  - Thiết kế layout 2 cột khoa học, tách biệt giữa thông tin liên hệ và form tương tác.

## T-066: Doctor dashboard (today's schedule, pending tickets, stats)
- **Lý do thực hiện:** Cung cấp màn hình làm việc chính cho bác sĩ để theo dõi lịch hẹn hôm nay, backlog triage và các chỉ số vận hành trong ngày.
- **Logic triển khai:**
  - Gọi song song lịch hẹn trong ngày và danh sách triage chờ để hiển thị dữ liệu mới nhất ngay khi mở dashboard.
  - Hiển thị 4 KPI trọng tâm: tổng lịch hôm nay, chờ khám, đang khám và số ticket chờ xử lý.
  - Tự động refresh mỗi 60 giây khi tab đang hiển thị, đồng thời giữ nút làm mới thủ công và điều hướng sang danh sách đầy đủ.

## T-067: Admin dashboard (user count, appointment stats, charts)
- **Lý do thực hiện:** Cung cấp cockpit điều hành cho admin với số liệu người dùng, lịch hẹn và biểu đồ xu hướng để theo dõi hoạt động hệ thống.
- **Logic triển khai:**
  - Xây dựng dashboard với metric cards, line chart xu hướng lịch hẹn, doughnut chart trạng thái lịch hẹn và phân bố user theo role.
  - Hỗ trợ lọc theo kỳ `today / 7d / 30d`, làm mới dữ liệu và hiển thị trạng thái loading/error rõ ràng.
  - Kết nối `adminApi.getDashboardStats({ period })` để lấy dữ liệu tổng hợp cho toàn trang.

## T-068: Dashboard API endpoints (stats, counts)
- **Lý do thực hiện:** Cung cấp API thống kê tập trung cho dashboard admin, bao gồm counts, trend và KPI vận hành.
- **Logic triển khai:**
  - Thêm endpoint `GET /api/v1/admin/dashboard/stats` trong `AdminDashboardController`.
  - Tổng hợp `totalUsers`, `totalDoctors`, `totalPatients`, `totalAppointments`, `pendingTriage`, `usersByRole`, `appointmentsByStatus`, `recentAppointmentTrend` và `operationalKpis`.
  - Hỗ trợ các khoảng thời gian `today`, `7d`, `30d` và tính delta so với kỳ trước.

---

### Maintenance Notes:
- **MUI v9 Migration**: Always use `size` prop for `<Grid>` instead of `xs, md, lg`.
- **Styling**: Prioritize HSL color system for Glassmorphism to ensure contrast on all backgrounds.
- **Performance**: Use `useMemo` for large doctor/department lists to optimize rendering.

---

### Backend Refactor Technical Report (Security & Quality):
#### 1. EHRController Refactor:
- **Security**: Replaced hardcoded ID (`1L`) with a dynamic mechanism to retrieve `UserID` via `@AuthenticationPrincipal UserDetails`.
- **Clean Code**: Cleaned up redundant imports (`java.util.List`, `java.util.Map`) and restored corrupted Javadoc comment formats.

#### 2. Service Layer Optimization:
- **ExaminationServiceImpl.java**: Expanded wildcard imports (`entity.*`, `repository.*`) into explicit imports to eliminate IDE warnings.
- **AdminUserServiceImpl.java**: Explicitly defined dependency imports and cleaned up file structure.
- **AdminDashboardServiceImpl.java**: Updated imports for specific Repositories, ensuring consistency with `TriageTicket.Status`.
- **EHRService.java**: Optimized imports and handled unchecked cast warnings in helper methods processing AI results.

#### 4. Verification:
- All changes have been confirmed via `mvn compile -DskipTests` command with **BUILD SUCCESS** status.

---
*Updated by Antigravity AI Assistant at 02:00 PM on May 8, 2026*

render_diffs(file:///d:/CareTriage/frontend/src/pages/public/VisionMission.jsx)
render_diffs(file:///d:/CareTriage/frontend/src/components/public/Footer.jsx)

render_diffs(file:///d:/CareTriage/.agent/scrum/task-report.md)

## Task #2: Tạo bộ seed dữ liệu Việt Nam

- **Lý do thực hiện:** Cần một bộ dữ liệu tiếng Việt lớn, có quan hệ đầy đủ, để test luồng end-to-end trên local/dev từ đăng nhập, chat, đặt lịch, bệnh án cho đến EHR mà không phụ thuộc dữ liệu mẫu quá nhỏ.

- **Công nghệ sử dụng:** SQL seed, Hibernate schema generation, BCrypt, Spring Boot dev profile.

- **Logic triển khai:**

  - Thay thế `backend/src/main/resources/data.sql` bằng bộ seed Việt Nam quy mô lớn, bám sát schema hiện tại: `roles`, `users`, `user_roles`, `departments`, `ticket_categories`, `doctor_profiles`, `doctor_departments`, `patient_profiles`, `doctor_schedules`, `chat_sessions`, `chat_messages`, `chat_attachments`, `triage_tickets`, `appointments`, `medical_records`, `clinical_notes`.

  - Dùng chung BCrypt hash cho tài khoản seed để có thể đăng nhập và test luồng xác thực cục bộ.

  - Giữ test isolation an toàn bằng cách để profile test tắt SQL init, tránh seed đè lên dữ liệu do test tự tạo.

- **Xác minh:** Khởi động backend với profile `dev` thành công sau khi nạp seed mới, không phát sinh lỗi schema/FK/SQL init.


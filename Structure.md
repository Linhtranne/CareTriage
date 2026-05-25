
I. Source tổng
Hãy đưa cả tài liệu và source code vào cùng folder để AI có thêm nhiều tri thức để làm
├── docs/
│   ├── srs.md/             # tài liệu đặc tả phần mềm
│   ├── convention.md/                # quy tắc code
│   ├── backlogs/         # chứa backlog
│   │   ├── sprint1/           # chứa các user story, task
│   │   └── sprint2/       # chứa các user story, task
│   ├── DB-erd/                # thiết kế db
│   └── UI/UX style guideline/              # style front end
│
├── code/            # chứa code của dự án
│   ├── front end/            
│   └── backend/              
│
├── .agent          # chứa các rule, workflow và skill của AI 
├── test          # chứa các file test case 
II. Frontend
Có thể chọn 1 trong 2 cấu trúc dựa vào công nghệ sử dụng
1. React JS
react-frontend/
├── .husky/                 # Thư mục chứa các script chặn commit (pre-commit hook) để đảm bảo code đã chuẩn convention, đáp ứng đúng lint, build không lỗi,... trước khi được đẩy lên
│   └── pre-commit          # Script chạy tsc và eslint trước khi cho phép git commit
│
├── public/                 # Tài nguyên tĩnh không qua build (favicon, robots.txt, ảnh landing page)
│
├── src/
│   ├── assets/             # Tài nguyên tĩnh đi qua build (images, svg, local fonts)
│   ├── pages/              # Thay thế cho app/ của Next.js (Chứa các trang màn hình)
│   │   ├── Auth/           # Ví dụ: LoginPage.tsx, RegisterPage.tsx
│   │   └── Dashboard/      # Ví dụ: DashboardPage.tsx
│   ├── components/         # Chứa các component giao diện
│   │   ├── base/           # Các component base tự custom (BaseButton, BaseTable...)
│   │   └── features/       # Component theo nghiệp vụ
│   ├── routes/             # Nơi cấu hình react-router-dom
│   │   └── index.tsx       # Định nghĩa các đường dẫn (path) nối tới các Pages
│   ├── layouts/            # Chứa bộ khung UI (Header, Sidebar, Footer)
│   │   ├── MainLayout.tsx  # Layout cho user đã đăng nhập
│   │   └── AuthLayout.tsx  # Layout cho trang đăng nhập/đăng ký
│   ├── lib/                # Cấu hình axios, utils chung
│   ├── hooks/              # Custom React Hooks
│   ├── store/              # Global State (Zustand/Redux)
│   ├── types/              # Định nghĩa TypeScript
│   ├── App.tsx             # Component gốc bao bọc toàn bộ ứng dụng (chứa Router Provider)
│   ├── main.tsx            # Điểm neo vào file index.html
│   ├── styles/           # Cấu hình CSS như theme, global 
│   ├── providers/           # Các provider của react
│   ├── schemas/           # Các validator trên front end (Sử dụng zod)
│   ├── services/           # Các hàm gọi api đến backend
│   ├── utils/           # Chứa các hàm sử dụng chung
│   └── constants/              # Định nghĩa các hằng số
│
├── index.html              
├── eslint.config.mjs          # Cấu hình linter khắt khe để đảm bảo chất lượng mã nguồn. Cơ bản sẽ phải kiểm tra những điều sau: eslint-plugin-boundaries (để phân chia ranh giới các phần vào đúng folder), áp dụng quy tắc đặt tên của dự án (kebab-case), không hard code hard text hard mã màu, unusedImports, không lạm dụng any, không sử dụng Magic number
├── .prettierrc             # Cấu hình Prettier
├── tailwind.config.js      # Cấu hình TailwindCSS, nên ghi đè tailwind bằng ghi đè mã màu
├── tsconfig.json           # Cấu hình TypeScript (Bật Strict Mode)
├── vite.config.ts          # Cấu hình Vite
├── Dockerfile, .dockerignore, docker compose         # Nếu sử dụng Docker để build
├── Sentry         # Cấu hình để ghi nhận bug trên product
├── package.json
├── .gitignore           # Cấu hình những thứ không push lên git
└── .env             # Cấu hình biến môi trường, có thể tạo thêm các biến thể như .env.local, .env.development,...
2. Clean Architecture (Thử thách Nâng cao)
backend-clean/
├── src/main/java/com/caretriage
│   ├── Application.java
│   │
│   ├── shared/                           # Mã nguồn dùng chéo qua các tầng
│   │   ├── base/                         # BaseDomainEntity, BaseUseCase, BaseController
│   │   ├── exception/                    # Lỗi kỹ thuật (không dính tới nghiệp vụ)
│   │   └── utils/                        # Các helper thuần Java (không chứa thư viện Spring)
│   │
│   ├── domain/                           # TẦNG LÕI
│   │   ├── entity/                       # Plain Java Model
│   │   ├── enums/                        # Các trạng thái nghiệp vụ (UserRole, ProjectStatus)
│   │   ├── exception/                    # Lỗi nghiệp vụ (UserNotFoundException, InvalidScoreException)
│   │   └── repository/                   # CHỈ CÓ INTERFACE (IUserRepository)
│   │
│   ├── application/                      # TẦNG NGHIỆP VỤ (USE CASE)
│   │   ├── dto/                          # Model truyền vào Use Case (Input/Output Boundary)
│   │   ├── usecase/                      # Interface quy định hành động (Ví dụ: CreateUserUseCase)
│   │   └── service/                      # Class implement UseCase. Nó sẽ được "tiêm" IUserRepository vào để làm việc.
│   │
│   ├── infrastructure/                   # TẦNG HẠ TẦNG (KẾT NỐI VỚI THẾ GIỚI BÊN NGOÀI & DB)
│   │   ├── config/                       # Spring Security, Bean Configuration, Kafka/Redis config
│   │   └── persistence/                  # Phần giao tiếp Database
│   │       ├── entity/                   # JPA Entity (Chứa các Annotation @Entity, @Table)
│   │       ├── repository/               # Spring Data JpaRepository
│   │       └── adapter/                  # MẮT XÍCH QUAN TRỌNG: Class implement IUserRepository (ở tầng Domain), gọi xuống JpaRepository để lưu dữ liệu, đồng thời map JPA Entity <-> Domain Entity.
│   │
│   └── presentation/                     # TẦNG HIỂN THỊ (GIAO TIẾP HTTP)
│       ├── controller/                   # Rest Controllers (Nhận HTTP, gọi xuống tầng Application/UseCase)
│       ├── payload/                      # HTTP Request Body, JSON Response
│       └── exception/                    # @RestControllerAdvice để map lỗi Domain sang HTTP Status Code (400, 404, 500)
│
│   ├── unitest/                           # Cài thêm unit test để kiểm thử
│   ├── sonarLint/                           # Cài sonarlint để quản lý chất lượng mã nguồn
├── Dockerfile, .dockerignore, docker compose         # Nếu sử dụng Docker để build
└── resources/
    ├── application.yml
    ├── text/                   # Cấu hình ResourceBundle để lưu text, không hard text vào code
    └── db/migration/                     # Nơi viết các thay đổi DB

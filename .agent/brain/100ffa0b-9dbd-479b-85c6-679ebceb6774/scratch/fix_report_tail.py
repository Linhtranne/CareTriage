
path = r"d:\CareTriage\.agent\scrum\task-report.md"
with open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Find the line starting with ## T-048
start_line = -1
for i, line in enumerate(lines):
    if "## T-048" in line:
        start_line = i
        break

if start_line != -1:
    new_lines = lines[:start_line]
    new_lines.append("## T-048: ChatSession, ChatMessage entities + persistence\n")
    new_lines.append("- **Lý do thực hiện:** Xây dựng cấu trúc dữ liệu lưu trữ các phiên tư vấn và nội dung tin nhắn, đảm bảo lịch sử hội thoại được bảo tồn và có thể truy xuất lại khi người dùng quay lại hệ thống.\n")
    new_lines.append("- **Công nghệ sử dụng:** Spring Data JPA, Hibernate, MySQL.\n")
    new_lines.append("- **Logic triển khai:**\n")
    new_lines.append("  - **Entity ChatSession:** Lưu trữ metadata của phiên (User, SessionType, Status, AI Summary, Urgency Level).\n")
    new_lines.append("  - **Entity ChatMessage:** Lưu trữ nội dung tin nhắn, loại người gửi (USER/AI/SYSTEM) và metadata chi tiết.\n")
    new_lines.append("  - **Persistence Logic:** Triển khai ChatService với các phương thức createSession, sendMessage, getSessionHistory và getUserSessions.\n")
    new_lines.append("  - **API Endpoints:** Cung cấp REST endpoints để tạo session, lấy danh sách sessions của user và tải lại lịch sử tin nhắn của một session cụ thể.\n")
    new_lines.append("  - **Data Integrity:** Sử dụng @Transactional để đảm bảo tính nhất quán khi lưu trữ hội thoại và xử lý AI response bất đồng bộ.\n")
    new_lines.append("\n")
    new_lines.append("## T-049: Chat window component (message bubbles, typing indicator)\n")
    new_lines.append("- **Lý do thực hiện:** Cung cấp giao diện tương tác trực quan, thân thiện cho hệ thống AI Triage, giúp người dùng dễ dàng mô tả triệu chứng và nhận tư vấn.\n")
    new_lines.append("- **Công nghệ sử dụng:** React, Tailwind CSS v4, Framer Motion, Lucide Icons.\n")
    new_lines.append("- **Logic triển khai:**\n")
    new_lines.append("  - **ChatWindow:** Thiết kế giao diện Glassmorphism hiện đại, hỗ trợ Responsive (toàn màn hình trên mobile, cửa sổ nổi trên desktop).\n")
    new_lines.append("  - **MessageBubble:** Phân biệt rõ rệt tin nhắn người dùng (phải) và AI (trái) bằng màu sắc và vị trí. Tích hợp Avatar người dùng/AI, thời gian gửi và trạng thái tin nhắn (Sending/Sent/Read).\n")
    new_lines.append("  - **TypingIndicator:** Hiệu ứng 3 dấu chấm nhấp nháy kết hợp với Icon AI để thông báo trạng thái AI đang xử lý.\n")
    new_lines.append("  - **Auto-scroll:** Sử dụng useRef và useEffect để tự động cuộn xuống tin nhắn mới nhất.\n")
    new_lines.append("  - **UX/UI:** Tối ưu hóa các khoảng cách (padding/margin), sử dụng bo góc lớn (rounded-2xl) và bóng đổ mềm mại để tạo cảm giác cao cấp.\n")

    with open(path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print("Updated T-048 and T-049 successfully.")
else:
    print("Could not find T-048 section.")


import os

path = r"d:\CareTriage\.agent\scrum\task-report.md"

# Nội dung chuẩn cho T-050 và T-051
correct_tail = """
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
"""

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

# Tìm vị trí bắt đầu của T-050
start_idx = -1
for i, line in enumerate(lines):
    if "## T-050" in line:
        start_idx = i
        break

if start_idx != -1:
    # Cắt bỏ phần cũ từ T-050 trở đi và nối phần mới
    new_content = "".join(lines[:start_idx]) + correct_tail.strip() + "\n"
    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Fixed T-050 and T-051 encoding.")
else:
    # Nếu không tìm thấy (do lỗi font quá nặng), append vào cuối
    with open(path, "a", encoding="utf-8") as f:
        f.write(correct_tail)
    print("Appended correct text to the end.")

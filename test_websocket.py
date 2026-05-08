import websocket
import json
import time
import threading

# Cấu hình
WS_URL = "ws://localhost:8080/ws-chat/websocket" # SockJS raw websocket endpoint
TOKEN = "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJwYXRpZW50QGNhcmV0cmlhZ2UuY29tIiwiaWF0IjoxNzc3OTY0NzM0LCJleHAiOjE3NzgwNTExMzR9.iQr-CA7xVjS0RLBLu7N-0R7UdHmeJEE_S5ldesjHZ6GZsyt7pghAJdayP1MA5ghvq1GMqEK45fFHLpw61AW5dg"
SESSION_ID = 3

import sys
import io

# Fix encoding for Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def on_message(ws, message):
    print(f"\n[RECEIVED] {message}")

def on_error(ws, error):
    print(f"\n[ERROR] {error}")

def on_close(ws, close_status_code, close_msg):
    print("\n[CLOSED] Connection closed")

def on_open(ws):
    print("\n[OPEN] Connection established")
    
    # 1. Gửi CONNECT frame
    connect_frame = f"CONNECT\naccept-version:1.1,1.2\nAuthorization:Bearer {TOKEN}\nheart-beat:10000,10000\n\n\0"
    ws.send(connect_frame)
    print("[SENT] CONNECT")
    
    time.sleep(1)
    
    # 2. Gửi SUBSCRIBE frame
    sub_frame = f"SUBSCRIBE\nid:sub-0\ndestination:/topic/chat/{SESSION_ID}\n\n\0"
    ws.send(sub_frame)
    print(f"[SENT] SUBSCRIBE to /topic/chat/{SESSION_ID}")
    
    time.sleep(1)
    
    # 3. Gửi SEND frame (Tin nhắn người dùng)
    message_body = json.dumps({
        "sessionId": SESSION_ID,
        "content": "Tôi bị đau ngực trái âm ỉ khoảng 30 phút nay, bạn tư vấn giúp tôi.",
        "senderType": "USER"
    })
    send_frame = f"SEND\ndestination:/app/chat.sendMessage\ncontent-type:application/json\n\n{message_body}\0"
    ws.send(send_frame)
    print("[SENT] MESSAGE")

if __name__ == "__main__":
    # websocket.enableTrace(True)
    ws = websocket.WebSocketApp(WS_URL,
                              on_open=on_open,
                              on_message=on_message,
                              on_error=on_error,
                              on_close=on_close)

    # Chạy trong thread riêng để có thể quan sát phản hồi
    wst = threading.Thread(target=ws.run_forever)
    wst.daemon = True
    wst.start()
    
    print("Waiting for AI response (60s)...")
    time.sleep(60)
    ws.close()

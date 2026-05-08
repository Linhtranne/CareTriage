FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .

# Trở lại dùng pip + mirror Aliyun. 
# Loại bỏ uv vì mạng của bạn đang chặn/bóp băng thông tải image từ GitHub Container Registry.
RUN pip install --no-cache-dir -r requirements.txt \
    --index-url https://mirrors.aliyun.com/pypi/simple/ \
    --trusted-host mirrors.aliyun.com \
    --default-timeout=1000

COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

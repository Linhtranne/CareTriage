# Implementation Plan: Java-first AI Triage

Tài liệu này là entry point chính cho kế hoạch mới.

Kế hoạch cũ theo hướng Python AI service đã bị thay thế theo yêu cầu:

- tạo ChatSession từ tin nhắn đầu tiên;
- hỗ trợ đổi tên cuộc hội thoại;
- dùng LangChain4j trong Spring Boot;
- xây Medical RAG;
- chỉ xóa Python sau khi Java đạt parity.

Đọc và triển khai theo đúng thứ tự tại:

- [AI capability roadmap](docs/ai-capabilities/README.md)
- [Capability 0 - Baseline](docs/ai-capabilities/00-baseline-and-target.md)
- [Capability 1 - ChatSession lifecycle](docs/ai-capabilities/01-chat-session-lifecycle.md)
- [Capability 2 - LangChain4j foundation](docs/ai-capabilities/02-langchain4j-foundation.md)
- [Capability 3 - Java triage pipeline](docs/ai-capabilities/03-java-triage-pipeline.md)
- [Capability 4 - Medical RAG](docs/ai-capabilities/04-medical-rag.md)
- [Capability 5 - Document intelligence](docs/ai-capabilities/05-document-intelligence.md)
- [Capability 6 - Remove Python](docs/ai-capabilities/06-cutover-remove-python.md)
- [Capability 7 - Quality and rollout](docs/ai-capabilities/07-quality-rollout.md)

Không triển khai capability tiếp theo khi capability hiện tại chưa qua gate.


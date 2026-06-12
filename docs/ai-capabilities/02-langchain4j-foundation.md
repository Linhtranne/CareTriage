# Capability 2: Nền tảng LangChain4j

## Mục tiêu

Đưa model invocation vào Spring Boot nhưng chưa thay production triage path.

## Bước 1: Compatibility spike

Repo đang dùng Spring Boot 3.3.0. Spring Boot starter hiện tại của LangChain4j
hỗ trợ Spring Boot 3.5+. Tạo ADR chọn:

- nâng Spring Boot trong PR độc lập; hoặc
- dùng LangChain4j core và cấu hình bean thủ công trước.

Không nâng Spring Boot, LangChain4j và thay AI runtime trong cùng commit.

## Package đích

```text
application/ai/
  port/
    TriageAiEngine.java
    ClinicalRetriever.java
    DocumentIntelligence.java
  model/
    TriageAiRequest.java
    TriageClassification.java
    ClinicalEvidence.java
  service/
    LangChainTriageEngine.java

infrastructure/ai/
  config/
    LangChain4jConfig.java
  model/
    ModelProviderFactory.java
  prompt/
    TriagePromptFactory.java
  telemetry/
    AiModelListener.java
```

Domain/application không import provider SDK.

## Quy tắc cấu hình

- API key chỉ đọc từ environment/secret.
- Model name, temperature, timeout, max token nằm trong typed properties.
- Không bật request/response logging chứa PHI.
- Có fake model cho unit/contract tests.
- Có health indicator không gửi dữ liệu bệnh nhân.

## Spike bắt buộc

1. Non-streaming structured output thành Java record.
2. Streaming `Flux<String>` hoặc adapter từ callback sang Flux.
3. Cancellation propagation.
4. Connect/inactivity/whole-turn timeout.
5. Provider error được map sang safe error code.
6. Không gọi model thật trong CI.

## Feature switch

```yaml
app:
  ai:
    runtime: python
```

Giá trị chuyển tiếp: `python`, `java-shadow`, `java`.

- `python`: behavior cũ.
- `java-shadow`: Java chạy với dữ liệu test/được kiểm soát, không persist output.
- `java`: Java là runtime chính.

## Tests

- Configuration binding.
- Streaming order và cancellation.
- Structured output validation.
- Timeout/error mapping.
- Secret không xuất hiện trong log.
- Application context khởi động với fake provider.


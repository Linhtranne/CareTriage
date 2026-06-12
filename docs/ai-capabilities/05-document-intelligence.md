# Capability 5: EHR và Document Intelligence trong Java

## Mục tiêu

Thay các endpoint Python `/api/ehr/extract-text` và `/api/ehr/extract-file`.

## Phạm vi

- PDF text.
- DOCX text.
- TXT.
- OCR chỉ là phase sau, có provider interface riêng.
- Structured clinical entity extraction.

## Pipeline

```text
upload
  -> Java authorization/size/type validation
  -> malware/content guard
  -> parser
  -> normalized text
  -> deterministic section splitter
  -> LLM structured extraction (nếu cần)
  -> validation
  -> persistence
  -> optional RAG ingestion
```

## Thiết kế

- Dùng Apache Tika hoặc parser Java phù hợp qua `DocumentParser` port.
- Raw parsing không gọi LLM.
- LLM chỉ chuyển text đã parse thành structured record.
- Không đưa toàn bộ file vượt context budget vào model.
- Attachment triage dùng extracted facts, không giả thành chat history.
- Không log raw document.

## Contract parity

Lập fixtures PDF/DOCX không chứa PHI và so sánh:

- text extraction;
- section order;
- entity fields;
- malformed/encrypted file;
- oversize file;
- unsupported MIME;
- timeout.

## Done

- `EHRServiceImpl` không gọi `aiServiceWebClient`.
- `ChatServiceImpl` không gọi `/api/ehr/extract-file`.
- File processing có limit và safe failure.
- RAG ingestion chỉ chạy sau khi tài liệu được duyệt.


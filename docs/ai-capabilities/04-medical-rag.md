# Capability 4: Medical RAG bằng LangChain4j

## Mục tiêu

Cung cấp tri thức y khoa có nguồn cho triage. Đây là retrieval, không phải
training model.

## Phạm vi corpus đầu tiên

Chỉ ingest tài liệu được duyệt:

- hướng dẫn nội bộ có version;
- Bộ Y tế/cơ quan y tế nhà nước;
- guideline chuyên ngành;
- tài liệu bệnh viện uy tín.

Không crawl web tự do trong synchronous triage.

## Indexing pipeline

```text
document source
  -> validate provenance
  -> parse
  -> normalize
  -> chunk
  -> metadata
  -> embedding
  -> vector store
  -> ingestion report
```

Metadata bắt buộc:

- `evidenceId`;
- `sourceType`;
- `sourceName`;
- `title`;
- `sourceUrl`;
- `documentVersion`;
- `publishedAt`;
- `retrievedAt`;
- `language`;
- `specialtyCodes`;
- `corpusVersion`;
- `contentHash`.

Không lưu PHI trong vector metadata.

## Retrieval pipeline

```text
ClinicalRetrievalQuery
  -> semantic retrieval
  -> optional keyword retrieval
  -> deterministic fusion
  -> trust/freshness filter
  -> context budget
  -> List<ClinicalEvidence>
```

RAG failure trả empty evidence và `degraded=true`; triage vẫn tiếp tục với safety
policy và không giả vờ có citation.

## Store decision

ADR-003 phải so sánh ít nhất:

- In-memory store: chỉ dùng test/POC.
- Chroma/Qdrant/Weaviate: service riêng.
- PostgreSQL + pgvector: cần hạ tầng PostgreSQL, repo hiện dùng MySQL.
- MySQL vector support nếu môi trường thật sự hỗ trợ.

Không chọn vector store chỉ vì framework có example.

## LangChain4j integration

- Dùng `EmbeddingModel`, `EmbeddingStore`, `ContentRetriever` hoặc
  `RetrievalAugmentor`.
- Tách interface application khỏi LangChain4j implementation.
- Query là dữ liệu transient, không log.
- Retrieved text là untrusted input, không được override system/safety prompt.

## Citation

Mỗi kết luận được phép trích dẫn phải tham chiếu `evidenceId` tồn tại trong tập
retrieved. Citation không hợp lệ bị loại trước khi phát final.

## Evaluation

- Recall@K.
- MRR.
- Empty retrieval rate.
- Citation validity.
- Source trust distribution.
- Latency.
- Bộ câu hỏi tiếng Việt có expected evidence IDs.

## Done

- Ingestion idempotent theo `contentHash`.
- Corpus version có thể rollback.
- Retrieval test không cần network.
- Không tăng số LLM call ngoài Phase A và Phase B.


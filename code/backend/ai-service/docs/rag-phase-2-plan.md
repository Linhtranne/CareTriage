# RAG Phase 2 Plan

> Historical baseline notes only. The canonical, implementation-ready plan is
> `D:\CareTriage\docs\ai-capabilities\02-medical-rag.md`. New implementation
> work must follow that document and its slice gates.

## Goal

Harden the current RAG pipeline incrementally without overbuilding. Phase 2 should improve retrieval precision, context quality, and testability while preserving the current Chroma/Gemini setup and avoiding heavy local model dependencies.

## Current Status

The current `ai-service` RAG foundation is intentionally lightweight:

- `IRetriever` defines context retrieval for application use cases.
- `IResearchService` extends retrieval with background medical research.
- `IReranker` and `IContextCompressor` interfaces exist as future extension points.
- `ResearchService` owns the current Chroma-backed retrieval and optional PubMed/Tavily ingestion.
- Retrieved context is wrapped inside `<external_context>` as untrusted content.
- Basic prompt-injection phrases are stripped from retrieved chunks before prompt assembly.
- Telemetry captures safe metadata only: document count, retrieval latency, and context character count.
- RAG and web research are disabled by default and must be explicitly enabled through configuration.

## Gaps

The current pipeline is safe enough as a baseline, but retrieval quality is still limited:

- No hybrid search yet. Retrieval depends primarily on vector similarity.
- No reranker implementation yet. `IReranker` is an interface only.
- No context compressor implementation yet. `IContextCompressor` is an interface only.
- Metadata filtering is minimal and does not yet enforce strong corpus scope, source class, freshness, or specialty filters.
- No explicit corpus freshness strategy exists.
- No scoring trace exists for why a chunk was selected.
- No default offline corpus build job exists for deterministic CI-safe RAG tests.

## Recommended Implementation Order

1. **Metadata Schema Hardening**
   - Standardize document metadata fields: `source`, `title`, `url`, `retrieved_at`, `scope`, `specialty`, `document_type`, and `language`.
   - Validate metadata before inserting chunks into Chroma.
   - Keep `patient_id`, raw patient query, and PHI out of metadata.

2. **Local Keyword Scoring**
   - Add a lightweight keyword score based on normalized term overlap.
   - Do not add BM25 dependency immediately unless simple scoring proves insufficient.
   - Keep this deterministic and unit-testable.

3. **Score Fusion**
   - Combine vector similarity rank with keyword score using a simple weighted formula.
   - Record only safe score metadata in telemetry or debug traces.
   - Return top candidates with source metadata, not raw user query.

4. **Deterministic Context Compression**
   - Implement `IContextCompressor` with a rule-based extractor first.
   - Prefer sentence filtering based on query terms, specialty keywords, and red-flag terms.
   - Avoid LLM compression in default path until evaluation shows it is needed.

5. **Optional External Reranker Later**
   - Implement `IReranker` against an external service only if retrieval quality remains poor.
   - Do not introduce local cross-encoder or GPU dependency in this phase.
   - Keep reranker disabled by default and covered by mocked tests.

## Non-Goals

- No local cross-encoder model dependency.
- No GPU requirement.
- No live web search in CI.
- No live Gemini calls in default tests.
- No raw patient query, prompt, retrieved full context, or PHI in logs/telemetry.
- No rewrite of the full RAG service into a separate microservice in this phase.

## Test Plan

- Unit test metadata validation and PHI exclusion.
- Unit test context wrapper preservation.
- Unit test prompt-injection stripping for retrieved documents.
- Unit test local keyword scoring with Vietnamese and no-accent Vietnamese text.
- Unit test score fusion ordering with deterministic fake documents.
- Unit test context compression to ensure output is shorter and still includes clinically relevant sentences.
- Add mocked retriever tests for `TriageUseCase`; default CI must not call live search, Chroma, PubMed, Tavily, Gemini, or Langfuse.

## Decision Points

- Whether to use a small BM25 library after local keyword scoring is measured.
- Whether Chroma remains the only vector store for the capstone/personal deployment.
- Whether reranking should be local, external API-based, or deferred.
- How often the medical corpus should refresh.
- Whether PubMed/Web ingestion should be an admin-triggered job or scheduled background job.
- Whether source trust tiers should be added, for example guideline, PubMed, hospital page, general web.

## Recommended Next Task

Implement metadata schema hardening first. It has the highest quality-to-risk ratio because it improves retrieval safety and future filtering without adding dependencies or changing endpoint contracts.

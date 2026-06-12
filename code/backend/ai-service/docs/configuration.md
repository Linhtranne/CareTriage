# CareTriage AI Service - Configuration Guide

This guide details the environment profiles, variables, and security parameters required to run the `ai-service` in production, development, and testing/CI pipelines.

---

## ⚙️ Environment Profile Separation

The `ai-service` enforces strict environment isolation to prevent security credential leaks and ensure reliable unit testing.

1. **Production & Development Profile (`TESTING=false`):** 
   - Strict validation is active. 
   - The service will **fail fast** at startup if any required environment variables are missing or empty.
   - Internal API keys are verified on all endpoints (except `/health` and `/docs`).
2. **Testing & CI Profile (`TESTING=true`):**
   - Unit tests use safe, non-functional mock values for keys (e.g. `test-gemini-key`).
   - Mock LLM providers are instantiated automatically if `LLM_PROVIDER=mock` is set.
   - The auth middleware is bypassed to facilitate clean, isolated unit and integration testing.

---

## 📋 Variables Dictionary

### 1. Required Production Variables
These variables **must** be explicitly set in your production `.env` or container settings. Leaving any of these blank will trigger a `RuntimeError` at startup.

| Key | Format / Type | Default | Purpose / Description |
|---|---|---|---|
| `INTERNAL_API_KEY` | Base64 string | N/A | Symmetric key verified against the incoming `X-Internal-Api-Key` header. Minimum 32 characters required for production safety. |
| `GEMINI_API_KEY` | String | N/A | Your Google Gemini API authentication key. |
| `GEMINI_MODEL_NAME` | String | `gemini-2.5-pro` | Model ID used for intake symptoms triage and text entity parsing. |
| `GEMINI_EMBEDDING_MODEL`| String | `models/text-embedding-004` | Model ID used for medical literature vector embeddings. |
| `ENTREZ_EMAIL` | Email address | N/A | User email appended to Entrez queries for NCBI compliance during PubMed lookups. |
| `CHROMA_DB_PATH` | File path | `./chroma_db` | Folder location of the SQLite Chroma vector database index. |

---

### 2. Optional Production Variables
These keys configure optional telemetry integrations, web fallbacks, and performance tunings.

| Key | Type / Range | Default | Purpose / Description |
|---|---|---|---|
| `MAX_BODY_SIZE_BYTES` | Integer | `5242880` (5MB) | Absolute payload size limit for incoming API request bodies. |
| `GEMINI_TEMPERATURE` | Float (`0.0` - `2.0`)| `0.2` | Creativity/variance control for symptom follow-up queries. Lower is safer. |
| `GEMINI_TOP_P` | Float (`0.0` - `1.0`)| `0.8` | Nucleus sampling parameter. |
| `GEMINI_MAX_TOKENS` | Integer | `1024` | Maximum length of LLM-generated follow-up dialogue. |
| `TAVILY_API_KEY` | String | `None` | API key for Tavily Web Search. Required only if `ENABLE_WEB_RESEARCH=true`. |
| `ENABLE_WEB_RESEARCH` | Boolean | `false` | When enabled, triggers background PubMed and web literature queries. |
| `RAG_ENABLED` | Boolean | `false` | Toggles semantic retrieval augmentation from clinical database files. |
| `TELEMETRY_PROVIDER` | `noop` / `structured` / `langfuse` | `noop` | Telemetry target. `structured` prints structured JSON logs; `langfuse` streams events to Langfuse tracing dashboards. |
| `LANGFUSE_PUBLIC_KEY` | String | `None` | Langfuse tracing public key. |
| `LANGFUSE_SECRET_KEY` | String | `None` | Langfuse tracing secret key. |
| `LANGFUSE_HOST` | URL | `https://cloud.langfuse.com` | Host URL for the self-hosted or cloud Langfuse event server. |

---

### 3. Testing & CI Variables
These variables must be set in your CI workflows (e.g. GitHub Actions) or local test suites to bypass third-party external calls.

| Key | Value | Purpose / Description |
|---|---|---|
| `TESTING` | `true` | Activates mock baseline defaults and disables strict production validation. |
| `LLM_PROVIDER` | `mock` | Decouples tests from Gemini servers by routing through deterministic mock providers. |
| `ENABLE_WEB_RESEARCH` | `false` | Bypasses external search engine calls. |

---

## 🚀 Setting Up Local Development Configuration

1. Copy the `.env.example` file to create a local `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in the values:
   - For regular local development, replace `your_google_gemini_api_key_here` with a valid Gemini API key.
   - For isolated testing, run `check.ps1` which automatically configures the testing profile variables internally.

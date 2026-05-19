You are the orchestrator for the CareTriage project. Please coordinate the following roles:

@product-manager

@project-architect

@backend-specialist

@python-patterns

@security-auditor

@test-engineer

@devops-engineer

@performance-optimizer

@clean-code

@database-architect (if schema/vector store is needed)

Objective:
Improve task cluster T-040 through T-045 to achieve "production initial readiness" for the AI Symptom Checker & Triage system.

Scope:

T-040: Gemini API client + medical system prompt

T-041: Conversation chain/context memory

T-042: /api/triage/analyze

T-043: Prompt engineering: symptom analysis + follow-up questions

T-044: /api/triage/recommend

T-045: Spring Boot AiClientService bridge

Current Context:
Several improvements have already been made:

Centralized AI service config via app/core/config.py.

Red-flag detector has been extracted into app/services/red_flag_detector.py.

/health endpoint returns config_status, rag_enabled, and corpus_status.

Backend AiClientServiceImpl has basic retry/fallback mechanisms.

.env.example includes timeout/resilience/RAG variables.

Prompts have reduced direct chain-of-thought instructions.

Remaining Blockers:

AI service tests fail at runtime because ResearchService hard-imports Bio:

ModuleNotFoundError: No module named 'Bio'

Even if RAG_ENABLED=false, the app crashes because routes.py imports ResearchService at startup.

ResearchService does not respect ENABLE_WEB_RESEARCH=false; it still uses Tavily if the key is present.

/api/triage/research is not guarded by an environment flag.

Backend application.yml still contains default secrets:

JWT secret fallback

AI internal API key fallback

Triage logic still relies on the free-text marker [TRIAGE_COMPLETE].

Manual test test_ai.py still references result['thinking'], even though this field has been removed.

RAG does not yet have a real, approved corpus, so we cannot claim full production RAG status.

Production Target:
Achieve an "initial production release" state, meaning:

The app starts successfully in environments where RAG is disabled.

No hardcoded/default secrets in production.

No leakage of CoT (Chain-of-Thought) / PII / secrets.

Deterministic red-flag emergency screening is operational.

Analyze/recommend endpoints return safe, structured responses.

Backend bridge has timeouts/retries/fallbacks.

RAG/web research are strictly optional and do not cause runtime crashes.

Core tests pass.

If the standard corpus is missing, health/status must explicitly state NOT_CONFIGURED.

What NOT to do (Strict Constraints):

Do NOT train a text classification model in this phase.

Do NOT use free web search to reply directly to patients in production.

Do NOT claim production RAG if there is no approved medical corpus.

Do NOT log raw symptoms/medical content in production.

Do NOT log chain-of-thought reasoning.

Do NOT return chain-of-thought to the frontend.

Do NOT use default production secrets.

Do NOT allow the model to autonomously generate departments outside the whitelist.

Do NOT rewrite the entire system if localized fixes are sufficient.

Approved NLP Architecture:
Use a hybrid approach:

Deterministic red-flag screening.

Optional RAG over an approved corpus.

Gemini LLM for conversation and structured triage.

Safety post-processing.

Department whitelist mapping.

Backend fallback/resilience.

Implementation Priorities:
P0 — App must start and have no production fallback secrets
1. Make ResearchService optional/lazy
Currently, routes.py instantiates research_service = ResearchService() at import time. This causes the app to crash if RAG dependencies are missing.

Requirements:

If RAG_ENABLED=false:

Do not hard-import Bio, Chroma, GoogleGenerativeAIEmbeddings, or TavilyClient.

Do not initialize the vector DB.

get_context(query) must return "".

/health must return:

rag_enabled=false

corpus_status=NOT_CONFIGURED

The application must start successfully.

If RAG_ENABLED=true:

Only then import/initialize RAG dependencies.

If dependencies are missing or the vector DB/corpus is not ready:

Do not crash the entire app if avoidable.

Log the error safely.

Set corpus_status=NOT_CONFIGURED or ERROR.

get_context(query) must return "".

Suggested Design:

Create a lightweight interface/class (e.g., ResearchService vs. DisabledResearchService).

Or, inside ResearchService.__init__, conditionally lazy-import dependencies only when settings["rag_enabled"] == True.

routes.py must not cause the app to crash due to optional dependencies.

2. Guard Web Research
ENABLE_WEB_RESEARCH=false must be the default.

/api/triage/research must:

Return 404/403/503 if web research is disabled.

Or return a clear message: "Web research is disabled".

_perform_research should only use Tavily when:

ENABLE_WEB_RESEARCH=true AND TAVILY_API_KEY exists.

PubMed/web ingestion must not run by default during runtime patient interactions.

3. Remove default secrets from Backend Production Config
In backend/src/main/resources/application.yml, remove production fallbacks for:

JWT_SECRET

AI_SERVICE_INTERNAL_KEY

Requirements:

Production must fail-fast if environment variables are missing.

You can keep defaults in application-dev.yml for local development, but not in the production profile.

Since application.yml is currently the active prod config, be careful not to break local workflows. If needed, use profiles:

application.yml (no hardcoded secrets).

application-dev.yml (retains dev secrets).

Production fetches strictly from env.

P1 — Structured triage, safety, department whitelist
4. Reduce dependency on [TRIAGE_COMPLETE]
Currently, triage_service.py relies on the [TRIAGE_COMPLETE] marker.

Requirements:

analyze can continue using conversational text for follow-ups, but the final business logic should not rely solely on a free-text marker.

/triage/recommend must call direct structured JSON generation.

Create or standardize Pydantic schemas:

TriageAnalyzeRequest

TriageAnalyzeResponse

TriageRecommendation

RedFlagResult

The structured result should include:

reply

is_complete

clinical_reasoning_summary

triage_result

suggested_department_code

suggested_department_name

urgency_level

confidence_score

department_mapping_status

fallback

fallback_reason

5. Department Whitelist
Do not arbitrarily hardcode IDs if the backend DB uses different departments.

Requirements:

The AI service must enforce a whitelist by code/name.

If the ID is unknown, return suggested_department_code and suggested_department_name.

The backend will map the code/name to the DB if necessary.

If confidence < 0.6:

Fallback to GENERAL_INTERNAL_MEDICINE / Nội tổng quát.

Set department_mapping_status=LOW_CONFIDENCE_FALLBACK.

If red-flag triggered:

Map to EMERGENCY / Cấp cứu.

Set department_mapping_status=RED_FLAG_BYPASS.

Set confidence_score=1.0.

6. Prompt Safety
Do not request chain-of-thought.

Do not output <thinking> tags.

Do not log CoT.

No definitive diagnoses.

No prescriptions.

Always include a short disclaimer.

Limit follow-ups to a maximum of 1–2 questions.

Red flags must direct immediately to emergency care.

P1 — Backend Resilience
7. Backend AiClientServiceImpl
Basic retry/fallback exists, but needs refinement and verification:

Fetch timeouts from env:

AI_CONNECT_TIMEOUT_MS

AI_READ_TIMEOUT_SECONDS

AI_WRITE_TIMEOUT_SECONDS

Retry logic:

Retry on 429, 502, 503, 504, and timeouts.

Do NOT retry on 400, 401, 403, 413, 422.

The fallback structure must be stable and consistent with the AI service DTO.

Do not log raw medical content. Logging sessionId, status, and latency/error class is sufficient.

Health checks must not block indefinitely; if using .block(), ensure it has a clear timeout or relies on the WebClient's timeout.

P2 — Tests and Validation
8. Fix Tests / Manual Scripts
test_ai.py must no longer use result['thinking'].

test_security.py must run successfully when RAG_ENABLED=false and Bio is missing.

Add tests for:

Red-flag bypass.

Negation handling in red flags.

Health check when RAG is disabled.

Web research disabled endpoint behavior.

Missing authentication.

Invalid payload structures.

AI invalid JSON fallback.

Backend retry/fallback logic.

9. Validation Execution
After making modifications, run:

python -m compileall ai-service/app ai-service/test_security.py

python ai-service/test_security.py

mvn test -f backend/pom.xml -Dtest=AiClientServiceTest

If a dependency is missing due to the environment, clearly log which dependency is missing and ensure the app still starts with the feature disabled.

Deliverables:

Pre-implementation Report: Briefly outline remaining P0/P1/P2 tasks.

Code Implementation.

Update Env Examples: Ensure newly added variables are documented.

Execute Validation.

Final Report:

Pass/fail status.

The completion level of tasks T-040→T-045.

What is still required before claiming full production RAG.

Definition of Done:

AI service starts successfully when RAG_ENABLED=false, even without Bio/Chroma/Tavily.

/health correctly returns RAG disabled/not configured statuses.

/triage/analyze successfully executes red-flag bypasses.

/triage/research is inaccessible when ENABLE_WEB_RESEARCH=false.

Backend has no default production secrets for JWT/internal AI keys.

Backend AI client retry/fallback tests pass.

No CoT/thinking artifacts remain in public responses.

No hardcoded models/keys/secrets exist in runtime.

Targeted tests pass successfully.

If a concise summary is needed for immediate execution:

Please push T-040→T-045 to "production initial readiness".

P0 Priorities:

The AI service must start when RAG_ENABLED=false even if Bio/Chroma/Tavily are missing. ResearchService must be optional/lazy; do not import optional dependencies at startup.

/api/triage/research must only run when ENABLE_WEB_RESEARCH=true (disabled by default).

Remove default production secrets from backend application.yml: JWT_SECRET, AI_SERVICE_INTERNAL_KEY.

P1 Priorities:
4. /triage/recommend must return structured JSON directly, reducing reliance on the [TRIAGE_COMPLETE] marker.
5. Department whitelist by code/name; map low confidence fallbacks to GENERAL_INTERNAL_MEDICINE and red flags to EMERGENCY.
6. Remove all CoT/thinking from prompts, logs, and responses.
7. Backend AiClientService must have timeouts, retries, and fallbacks aligned with DTOs. Do not log raw symptoms.

P2 Priorities:
8. Update test_ai.py to remove result['thinking'].
9. Run validations:

python -m compileall ai-service/app ai-service/test_security.py

python ai-service/test_security.py

mvn test -f backend/pom.xml -Dtest=AiClientServiceTest

Reminder: Do not claim production RAG without an approved corpus; health must return corpus_status=NOT_CONFIGURED.
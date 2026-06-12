# Dependency Map (Minimal)

## Root Structure (per Structure.md)
- docs/: specifications, conventions, backlogs
- code/: main source (front end, backend)
- .agent/: AI rules, workflows, skills
- test/: test cases

## Frontend: Admin (code/front end/admin-frontend)
- routes -> layouts/pages -> services/store/types/styles
- components/hooks/utils as shared building blocks
- tokens/theme: src/constants/design-tokens.ts and src/styles/theme.ts

## Frontend: User App (code/front end/frontend)
- routes -> public/auth/shared/common -> services/store/types/styles
- components/hooks/utils as shared building blocks
- tokens/theme: src/constants/design-tokens.ts and src/styles/theme.ts

## Exclusions (Hard)
- code/front end/frontend/src/pages/doctor/**
- code/front end/frontend/src/pages/patient/**

## Backend (code/backend/backend)
- Status: compile/test already passed (no further audit in this task)

## Java-first AI Triage Roadmap
- Master roadmap: `docs/ai-capabilities/README.md`.
- Implement capabilities in numbered order from baseline to Python removal.
- Spring Boot owns transactional orchestration and the new LangChain4j AI runtime.
- Python remains only as a temporary parity baseline and is removed at Capability 6.
- RAG is retrieval/indexing, not model training.
- Each capability requires contract tests, rollback notes and a green quality gate.

# Frontend Type/Lint Stabilization

## Scope
- Admin-frontend: stabilize build/type/lint after TS migration.
- Frontend (non doctor/patient): shared/public/auth/common/routes/services/store/styles/constants.
- Do not touch doctor/patient pages.

## Hard Exclusions
- code/front end/frontend/src/pages/doctor/**
- code/front end/frontend/src/pages/patient/**

## Strategy
- Order: build -> typecheck -> cleanup by scope.
- MUI v9: use compatibility layer in src/types or clear wrappers; document technical debt.
- Theme/tokens: source of truth is in code; map any hardcoded colors to existing tokens.
- No large dependency changes.

## Validation (Sequential)
1. Admin-frontend: .\node_modules\.bin\tsc.cmd --noEmit --pretty false
2. Admin-frontend: npm run build
3. Admin-frontend: lint targeted on modified files, then full lint if feasible
4. Frontend: .\node_modules\.bin\tsc.cmd --noEmit --pretty false
5. Frontend: npm run build
6. Frontend: lint targeted on modified files, then full lint if feasible

## Reporting
- Checks pass/fail
- Files changed
- Remaining errors: classify as excluded doctor/patient or needs follow-up
- Compatibility layer changes (if any)
- Confirmation: no changes in hard exclusions

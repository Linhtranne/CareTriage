# ai-service Quality Gates and CI Pipeline

This document describes the automated quality gate pipeline established for the `ai-service` codebase. These gates enforce code linting, formatting, type checking, test suites, triage evaluation accuracy, and Clean Architecture layer boundary constraints before code is committed or merged.

---

## Local Development Execution

To ensure local changes do not break the quality gate, run the master quality check before pushing or submitting a pull request.

### Master Quality Check Command

From the `code/backend/ai-service` directory, run:

```powershell
.\check.ps1 check-all
```

This read-only gate runs the following steps in sequence and will halt execution with a non-zero exit code immediately if any step fails:

1. **Import Check**: Validates that the application main entry point can be successfully imported without runtime dependency errors.
2. **Lint check**: Runs `ruff check . --no-cache` to identify syntax errors, code styling issues, and code smells.
3. **Format Check**: Runs `ruff format --check .` to verify that all code conforms to the standard formatter rules (without modifying any files).
4. **Type Check**: Runs sequential MyPy type checks on core codebase layers (`app/domain`, `app/application`, and `app/shared`) with the `--no-incremental` flag.
5. **Unit Tests**: Executes the unit test suite via `pytest`.
6. **Mocked Evaluations**: Runs triage scenario evaluation checks on the golden dataset in mocked mode.
7. **Boundary Scan**: Scans imports in the domain and application layers using `ripgrep` to enforce architecture constraints.

---

### Individual Quality Gate Commands

You can run individual quality checks using the sub-commands below:

| Command | Action |
|---------|--------|
| `.\check.ps1 import-check` | Performs import verification of the main entry point |
| `.\check.ps1 lint` | Identifies style issues using `ruff check` |
| `.\check.ps1 format` | Automatically formats all python files in place |
| `.\check.ps1 format-check` | Validates formatting consistency without changing files |
| `.\check.ps1 typecheck-domain` | Runs MyPy typecheck only on `app/domain` |
| `.\check.ps1 typecheck-application` | Runs MyPy typecheck only on `app/application` |
| `.\check.ps1 typecheck-shared` | Runs MyPy typecheck only on `app/shared` |
| `.\check.ps1 typecheck-core` | Runs MyPy typecheck on domain, application, and shared layers |
| `.\check.ps1 test` | Executes the unit test suite using `pytest` |
| `.\check.ps1 eval` | Performs mocked evaluation runs |
| `.\check.ps1 boundary-check` | Scans for forbidden architectural boundaries |

---

## CI Runner Execution

For CI runners (such as GitHub Actions or self-hosted UNIX nodes), a POSIX-compliant script is available:

```bash
./check.sh
```

This runs the exact same checks in sequence using `set -e` so that any step failure immediately causes the pipeline run to fail. It also implements an automated fallback search utilizing standard `grep -rnE` if `ripgrep` is not installed on the running node.

---

## Architectural Boundary Rules

To preserve clean decoupled layers, the following rules are strictly enforced by the boundary scans:

* **Domain Layer Boundaries**: Code in `app.domain` must not import any modules from `app.application`, `app.infrastructure`, or `app.api`.
* **Application Layer Boundaries**: Code in `app.application` must not import any modules from `app.infrastructure` or `app.api`.

---

## Known Alerts & Troubleshooting

### Why Live Evaluations are Excluded
Live evaluations depend on external LLM APIs (Gemini, Langfuse, Tavily), which require live API key secrets. To ensure that local pre-commit checks and CI runner workflows can run securely, quickly, and deterministically without depending on external services, they are configured to run exclusively in **mocked mode** (`--mode mocked --threshold 0.8`).

### PyTest Cache Warning (Windows-specific)
During local test suite execution on Windows, you might occasionally see the following warning or minor permission error:
```
RuntimeWarning: .pytest_cache WinError 5 Access is denied
```
> [!NOTE]
> This is a known, local permission issue related to Windows file system locking on the temporary `.pytest_cache` directory and does not affect test correctness or quality gate outcomes. It is safe to ignore.

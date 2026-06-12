#!/bin/sh
set -e

echo "=== Running CI Quality Gates ==="

export TESTING="${TESTING:-true}"
export LLM_PROVIDER="${LLM_PROVIDER:-mock}"
export ENABLE_LIVE_EVALS="${ENABLE_LIVE_EVALS:-false}"
export RAG_ENABLED="${RAG_ENABLED:-false}"
export ENABLE_WEB_RESEARCH="${ENABLE_WEB_RESEARCH:-false}"
export TELEMETRY_PROVIDER="${TELEMETRY_PROVIDER:-noop}"

echo "--- Step 1: Import Check ---"
python -c "import app.main; print('import ok')"

echo "--- Step 2: Ruff Linter ---"
ruff check . --no-cache

echo "--- Step 3: Ruff Format Check ---"
ruff format --check . --no-cache

echo "--- Step 4: MyPy Type Checker (Domain) ---"
mypy app/domain --no-incremental

echo "--- Step 5: MyPy Type Checker (Application) ---"
mypy app/application --no-incremental

echo "--- Step 6: MyPy Type Checker (Shared) ---"
mypy app/shared --no-incremental

echo "--- Step 7: MyPy Type Checker (API) ---"
mypy app/api --no-incremental

echo "--- Step 8: MyPy Type Checker (Infrastructure) ---"
mypy app/infrastructure --no-incremental

echo "--- Step 9: PyTest ---"
python -m pytest -q

echo "--- Step 10: Evaluations (Mocked Mode) ---"
python evaluations/run_triage_evals.py --mode mocked --threshold 0.8

echo "--- Step 11: Clean Architecture Boundary Scan ---"
if command -v rg >/dev/null 2>&1; then
    echo "Using ripgrep for boundary scan..."
    set +e
    violations=$(rg -n "from app\.infrastructure|import app\.infrastructure|from app\.api|import app\.api" app/application app/domain)
    exit_code=$?
    set -e
    if [ $exit_code -eq 0 ]; then
        echo "$violations"
        echo "Clean Architecture boundary violation detected."
        exit 1
    elif [ $exit_code -eq 1 ]; then
        echo "No Clean Architecture boundary violations found."
    else
        echo "Boundary scan failed with error code $exit_code."
        exit $exit_code
    fi
else
    echo "ripgrep not found, falling back to grep..."
    set +e
    violations=$(grep -rnE "from app\.infrastructure|import app\.infrastructure|from app\.api|import app\.api" app/application app/domain)
    exit_code=$?
    set -e
    if [ $exit_code -eq 0 ]; then
        echo "$violations"
        echo "Clean Architecture boundary violation detected."
        exit 1
    elif [ $exit_code -eq 1 ]; then
        echo "No Clean Architecture boundary violations found."
    else
        echo "Boundary scan failed with error code $exit_code."
        exit $exit_code
    fi
fi

echo "=== All quality gate checks passed successfully! ==="

param (
    [string]$command = "check-all"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$venv_python = ".\venv\Scripts\python.exe"
$venv_ruff = ".\venv\Scripts\ruff.exe"
$venv_pytest = ".\venv\Scripts\pytest.exe"
$venv_mypy = ".\venv\Scripts\mypy.exe"

function Run-ImportCheck {
    Write-Host "[INFO] Running Python App Import Check..." -ForegroundColor Cyan
    & $venv_python -c "import app.main; print('import ok')"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Python App Import Check failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "[OK] Python App Import Check passed." -ForegroundColor Green
}

function Run-Lint {
    Write-Host "[INFO] Running Ruff Linter..." -ForegroundColor Cyan
    if (Test-Path $venv_ruff) {
        & $venv_ruff check . --no-cache
    } else {
        Write-Host "[WARN] ruff not found in venv. Installing..." -ForegroundColor Yellow
        & $venv_python -m pip install ruff
        & $venv_ruff check . --no-cache
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Ruff linter failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "[OK] Ruff linter passed." -ForegroundColor Green
}

function Run-Format {
    Write-Host "[INFO] Running Ruff Formatter..." -ForegroundColor Cyan
    if (Test-Path $venv_ruff) {
        & $venv_ruff format . --no-cache
    } else {
        Write-Host "[WARN] ruff not found in venv. Installing..." -ForegroundColor Yellow
        & $venv_python -m pip install ruff
        & $venv_ruff format . --no-cache
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Ruff formatter failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "[OK] Ruff formatting complete." -ForegroundColor Green
}

function Run-FormatCheck {
    Write-Host "[INFO] Running Ruff Format Check..." -ForegroundColor Cyan
    if (Test-Path $venv_ruff) {
        & $venv_ruff format --check . --no-cache
    } else {
        Write-Host "[WARN] ruff not found in venv. Installing..." -ForegroundColor Yellow
        & $venv_python -m pip install ruff
        & $venv_ruff format --check . --no-cache
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Ruff format check failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "[OK] Ruff format check passed." -ForegroundColor Green
}

function Run-TypeCheckDomain {
    Write-Host "[INFO] Running MyPy Type Checker on Domain Layer..." -ForegroundColor Cyan
    if (Test-Path $venv_mypy) {
        & $venv_mypy app\domain --no-incremental
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] MyPy type checker on Domain Layer failed." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "[OK] MyPy type checker on Domain Layer passed." -ForegroundColor Green
    } else {
        Write-Host "[WARN] mypy not found." -ForegroundColor Yellow
    }
}

function Run-TypeCheckApplication {
    Write-Host "[INFO] Running MyPy Type Checker on Application Layer..." -ForegroundColor Cyan
    if (Test-Path $venv_mypy) {
        & $venv_mypy app\application --no-incremental
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] MyPy type checker on Application Layer failed." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "[OK] MyPy type checker on Application Layer passed." -ForegroundColor Green
    } else {
        Write-Host "[WARN] mypy not found." -ForegroundColor Yellow
    }
}

function Run-TypeCheckShared {
    Write-Host "[INFO] Running MyPy Type Checker on Shared Layer..." -ForegroundColor Cyan
    if (Test-Path $venv_mypy) {
        & $venv_mypy app\shared --no-incremental
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] MyPy type checker on Shared Layer failed." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "[OK] MyPy type checker on Shared Layer passed." -ForegroundColor Green
    } else {
        Write-Host "[WARN] mypy not found." -ForegroundColor Yellow
    }
}

function Run-TypeCheckCore {
    Write-Host "[INFO] Running MyPy Type Checker on Core Layers..." -ForegroundColor Cyan
    if (Test-Path $venv_mypy) {
        Run-TypeCheckDomain
        Run-TypeCheckApplication
        Run-TypeCheckShared
        Write-Host "[OK] MyPy type checker on Core Layers passed." -ForegroundColor Green
    } else {
        Write-Host "[WARN] mypy not found." -ForegroundColor Yellow
    }
}

function Run-TypeCheckApi {
    Write-Host "[INFO] Running MyPy Type Checker on API Layer..." -ForegroundColor Cyan
    if (Test-Path $venv_mypy) {
        & $venv_mypy app\api --no-incremental
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] MyPy type checker on API Layer failed." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "[OK] MyPy type checker on API Layer passed." -ForegroundColor Green
    } else {
        Write-Host "[WARN] mypy not found." -ForegroundColor Yellow
    }
}

function Run-TypeCheckInfrastructure {
    Write-Host "[INFO] Running MyPy Type Checker on Infrastructure Layer..." -ForegroundColor Cyan
    if (Test-Path $venv_mypy) {
        & $venv_mypy app\infrastructure --no-incremental
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] MyPy type checker on Infrastructure Layer failed." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "[OK] MyPy type checker on Infrastructure Layer passed." -ForegroundColor Green
    } else {
        Write-Host "[WARN] mypy not found." -ForegroundColor Yellow
    }
}

function Run-TypeCheckService {
    Write-Host "[INFO] Running MyPy Type Checker on Service Layers (Domain, Application, Shared, API, Infrastructure)..." -ForegroundColor Cyan
    if (Test-Path $venv_mypy) {
        Run-TypeCheckDomain
        Run-TypeCheckApplication
        Run-TypeCheckShared
        Run-TypeCheckApi
        Run-TypeCheckInfrastructure
        Write-Host "[OK] MyPy type checker on Service Layers passed." -ForegroundColor Green
    } else {
        Write-Host "[WARN] mypy not found." -ForegroundColor Yellow
    }
}

function Run-Test {
    Write-Host "[INFO] Running PyTest..." -ForegroundColor Cyan
    if (Test-Path $venv_python) {
        & $venv_python -m pytest -q
        if ($LASTEXITCODE -ne 0) {
            Write-Host "[ERROR] PyTest failed." -ForegroundColor Red
            exit $LASTEXITCODE
        }
        Write-Host "[OK] PyTest passed." -ForegroundColor Green
    } else {
        Write-Host "[ERROR] python not found in venv. Please check dependencies." -ForegroundColor Red
        exit 1
    }
}

function Run-Eval {
    Write-Host "[INFO] Running Evaluations (Mocked Mode)..." -ForegroundColor Cyan
    & $venv_python evaluations\run_triage_evals.py --mode mocked --threshold 0.8
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Evaluations failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "[OK] Evaluations passed." -ForegroundColor Green
}

function Run-BoundaryCheck {
    Write-Host "[INFO] Running Clean Architecture boundary scan..." -ForegroundColor Cyan
    $violations = & rg -n "from app\.infrastructure|import app\.infrastructure|from app\.api|import app\.api" app\application app\domain
    if ($LASTEXITCODE -eq 0) {
        Write-Host $violations
        Write-Host "[ERROR] Clean Architecture boundary violation detected." -ForegroundColor Red
        exit 1
    }
    if ($LASTEXITCODE -eq 1) {
        Write-Host "[OK] No Clean Architecture boundary violations found." -ForegroundColor Green
    }
    if ($LASTEXITCODE -gt 1) {
        Write-Host "[ERROR] Boundary scan failed." -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

switch ($command) {
    "import-check" {
        Run-ImportCheck
    }
    "lint" {
        Run-Lint
    }
    "format" {
        Run-Format
    }
    "format-check" {
        Run-FormatCheck
    }
    "typecheck-domain" {
        Run-TypeCheckDomain
    }
    "typecheck-application" {
        Run-TypeCheckApplication
    }
    "typecheck-shared" {
        Run-TypeCheckShared
    }
    "typecheck-core" {
        Run-TypeCheckCore
    }
    "typecheck-api" {
        Run-TypeCheckApi
    }
    "typecheck-infrastructure" {
        Run-TypeCheckInfrastructure
    }
    "typecheck-service" {
        Run-TypeCheckService
    }
    "test" {
        Run-Test
    }
    "eval" {
        Run-Eval
    }
    "boundary-check" {
        Run-BoundaryCheck
    }
    "check-all" {
        Write-Host "[INFO] Starting all quality gate checks..." -ForegroundColor Cyan
        Run-ImportCheck
        Run-Lint
        Run-FormatCheck
        Run-TypeCheckService
        Run-Test
        Run-Eval
        Run-BoundaryCheck
        Write-Host "[OK] All checks passed successfully!" -ForegroundColor Green
    }
    default {
        Write-Host "[ERROR] Unknown command: $command" -ForegroundColor Red
        Write-Host "Usage: .\check.ps1 [import-check|lint|format|format-check|typecheck-domain|typecheck-application|typecheck-shared|typecheck-core|typecheck-api|typecheck-infrastructure|typecheck-service|test|eval|boundary-check|check-all]"
        exit 1
    }
}

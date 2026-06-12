import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.ehr_routes import router as ehr_router
from app.api.routes import router
from app.shared.config import get_settings
from app.shared.errors import (
    AIConnectionError,
    AIError,
    AIQuotaExceeded,
    AISafetyBlocked,
)
from app.shared.log_sanitizer import sanitize_error

settings = get_settings()

logger = logging.getLogger(__name__)

app = FastAPI(
    title="CareTriage AI Service",
    description="AI Symptom Checker & Triage + EHR Data Extraction powered by Google Gemini",
    version="0.2.0",
)

# CORS is disabled for production since it's an internal service
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=True,
    allow_methods=[],
    allow_headers=[],
)

MAX_BODY_SIZE = settings["max_body_size_bytes"]
INTERNAL_API_KEY = settings["internal_api_key"]


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # 1. Payload size limit
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(status_code=413, content={"message": "Payload too large"})

    # 2. Internal Auth check (skip health and docs)
    path = request.url.path
    if (
        path != "/health"
        and not path.endswith("/docs")
        and not path.endswith("/openapi.json")
    ):
        if os.getenv("TESTING") == "true":
            pass
        else:
            api_key = request.headers.get("X-Internal-Api-Key")
            if not api_key or api_key != INTERNAL_API_KEY:
                return JSONResponse(
                    status_code=401, content={"message": "Unauthorized access"}
                )

    return await call_next(request)


app.include_router(router, prefix="/api")
app.include_router(ehr_router, prefix="/api")


@app.exception_handler(AIQuotaExceeded)
async def quota_handler(request: Request, exc: AIQuotaExceeded):
    logger.warning(f"Quota Exceeded: {sanitize_error(exc)}")
    return JSONResponse(
        status_code=429,
        content={"message": "Hệ thống AI đang quá tải. Vui lòng thử lại sau."},
    )


@app.exception_handler(AISafetyBlocked)
async def safety_handler(request: Request, exc: AISafetyBlocked):
    logger.warning(f"Safety Blocked: {sanitize_error(exc)}")
    return JSONResponse(
        status_code=422,
        content={"message": "Nội dung không phù hợp để phân tích tự động."},
    )


@app.exception_handler(AIConnectionError)
async def ai_unavailable_handler(request: Request, exc: AIConnectionError):
    logger.error(f"AI Connection Error: {sanitize_error(exc)}")
    return JSONResponse(
        status_code=503, content={"message": "Dịch vụ AI tạm thời không khả dụng."}
    )


@app.exception_handler(AIError)
async def ai_exception_handler(request: Request, exc: AIError):
    logger.error(f"AI Error: {sanitize_error(exc)}")
    return JSONResponse(
        status_code=500,
        content={"message": "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled AI service error: {sanitize_error(exc)}")
    return JSONResponse(
        status_code=500,
        content={"message": "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."},
    )


@app.get("/health")
async def health():
    # Enforce safe local RAG index checks without calling external Gemini API
    db_path = settings.get("chroma_db_path", "./chroma_db")
    sqlite_file = os.path.join(db_path, "chroma.sqlite3")

    # A valid Chroma collection exists if the chroma.sqlite3 file is present
    has_index = os.path.exists(sqlite_file)
    rag_enabled_env = settings.get("rag_enabled", False)

    # Dynamically determine RAG availability
    is_rag_ready = bool(rag_enabled_env and has_index)
    corpus_status = "READY" if is_rag_ready else "NOT_CONFIGURED"

    return {
        "status": "UP",
        "service": "caretriage-ai-service",
        "config_status": "LOADED",
        "rag_enabled": is_rag_ready,
        "corpus_status": corpus_status,
    }

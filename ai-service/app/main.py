from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.api.ehr_routes import router as ehr_router
from app.services.exceptions import AIError, AIQuotaExceeded, AISafetyBlocked, AIConnectionError
import os
import logging
from dotenv import load_dotenv

# Load .env file
load_dotenv()

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

MAX_BODY_SIZE = 16 * 1024 * 1024
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
if not INTERNAL_API_KEY or len(INTERNAL_API_KEY) < 32:
    # Allow a fallback only if running tests, otherwise fail fast
    if "pytest" in os.environ.get("_", "") or "test" in os.getenv("ENVIRONMENT", "").lower():
        INTERNAL_API_KEY = "caretriage-internal-secret-for-dev-only-min-32-chars-long"
    else:
        raise RuntimeError("CRITICAL: INTERNAL_API_KEY must be set and be at least 32 characters long.")


@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # 1. Payload size limit
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_BODY_SIZE:
        return JSONResponse(status_code=413, content={"message": "Payload too large"})
        
    # 2. Internal Auth check (skip health and docs)
    path = request.url.path
    if path != "/health" and not path.endswith("/docs") and not path.endswith("/openapi.json"):
        api_key = request.headers.get("X-Internal-Api-Key")
        if not api_key or api_key != INTERNAL_API_KEY:
            return JSONResponse(status_code=401, content={"message": "Unauthorized access"})
            
    return await call_next(request)

app.include_router(router, prefix="/api")
app.include_router(ehr_router, prefix="/api")

@app.exception_handler(AIQuotaExceeded)
async def quota_handler(request: Request, exc: AIQuotaExceeded):
    logger.warning(f"Quota Exceeded: {str(exc)}")
    return JSONResponse(status_code=429, content={"message": "Hệ thống AI đang quá tải. Vui lòng thử lại sau."})

@app.exception_handler(AISafetyBlocked)
async def safety_handler(request: Request, exc: AISafetyBlocked):
    logger.warning(f"Safety Blocked: {str(exc)}")
    return JSONResponse(status_code=422, content={"message": "Nội dung không phù hợp để phân tích tự động."})

@app.exception_handler(AIConnectionError)
async def ai_unavailable_handler(request: Request, exc: AIConnectionError):
    logger.error(f"AI Connection Error: {str(exc)}")
    return JSONResponse(status_code=503, content={"message": "Dịch vụ AI tạm thời không khả dụng."})

@app.exception_handler(AIError)
async def ai_exception_handler(request: Request, exc: AIError):
    logger.error(f"AI Error: {str(exc)}")
    return JSONResponse(status_code=500, content={"message": "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."})

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled AI service error")
    return JSONResponse(status_code=500, content={"message": "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau."})

@app.get("/health")
async def health():
    return {"status": "UP", "service": "caretriage-ai-service"}

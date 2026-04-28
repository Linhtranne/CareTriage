from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.ehr_models import EHRExtractRequest, EHRExtractResponse
from app.services.ehr_extraction_service import EHRExtractionService

router = APIRouter(prefix="/ehr", tags=["EHR Extraction"])

ehr_service = EHRExtractionService()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "txt"}


@router.post("/extract-text", response_model=EHRExtractResponse)
async def extract_from_text(request: EHRExtractRequest):
    """Extract medical entities from clinical note text."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    try:
        result = await ehr_service.extract_from_text(request.text)
        return EHRExtractResponse(success=True, result=result)
    except Exception as e:
        return EHRExtractResponse(success=False, error=str(e))


@router.post("/extract-file", response_model=EHRExtractResponse)
async def extract_from_file(file: UploadFile = File(...)):
    """Extract medical entities from uploaded PDF/Word file."""
    # Validate file extension
    ext = file.filename.lower().rsplit(".", 1)[-1] if file.filename and "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '.{ext}' not supported. Allowed: {ALLOWED_EXTENSIONS}",
        )

    # Read and validate file size
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB",
        )

    try:
        result = await ehr_service.extract_from_file(file_bytes, file.filename or "unknown.txt")
        return EHRExtractResponse(success=True, result=result)
    except Exception as e:
        return EHRExtractResponse(success=False, error=str(e))


@router.get("/health")
async def ehr_health():
    """Health check for EHR extraction module."""
    return {"status": "UP", "module": "ehr-extraction"}

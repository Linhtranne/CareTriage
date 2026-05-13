from fastapi import APIRouter, UploadFile, File, HTTPException
from app.models.ehr_models import EHRExtractRequest, EHRExtractResponse
from app.services.ehr_extraction_service import EHRExtractionService

router = APIRouter(prefix="/ehr", tags=["EHR Extraction"])

ehr_service = EHRExtractionService()

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}


@router.post("/extract-text", response_model=EHRExtractResponse)
async def extract_from_text(request: EHRExtractRequest):
    """Extract medical entities from clinical note text."""
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Clinical note text cannot be empty")

    try:
        result = await ehr_service.extract_from_text(request.text)
        if not result.entities and request.text.strip():
            # This could happen if model fails or no entities found
            return EHRExtractResponse(success=True, result=result)
        return EHRExtractResponse(success=True, result=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.post("/extract-file", response_model=EHRExtractResponse)
async def extract_from_file(file: UploadFile = File(...)):
    """Extract medical entities from uploaded PDF/Word file."""
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename missing")
        
    ext = file.filename.lower().rsplit(".", 1)[-1] if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type '.{ext}' not supported. Supported types: {ALLOWED_EXTENSIONS}",
        )

    # Read and validate file size
    try:
        file_bytes = await file.read()
        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB",
            )

        if not file_bytes:
            raise HTTPException(status_code=400, detail="File is empty")

        result = await ehr_service.extract_from_file(file_bytes, file.filename)
        return EHRExtractResponse(success=True, result=result)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File extraction failed: {str(e)}")


@router.get("/health")
async def ehr_health():
    """Health check for EHR extraction module."""
    return {"status": "UP", "module": "ehr-extraction"}

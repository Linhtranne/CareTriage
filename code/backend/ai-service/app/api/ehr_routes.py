import logging

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.api.schemas import EHRExtractRequest, EHRExtractResponse
from app.application.usecases.ehr_extraction_use_case import EhrExtractionUseCase
from app.infrastructure.llm.provider_factory import get_llm_provider
from app.infrastructure.telemetry.factory import get_telemetry_client
from app.shared.log_sanitizer import sanitize_error

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ehr", tags=["EHR Extraction"])

telemetry_client = get_telemetry_client()
llm_provider = get_llm_provider(telemetry=telemetry_client)
ehr_use_case = EhrExtractionUseCase(
    llm_provider=llm_provider, telemetry=telemetry_client
)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {"pdf", "doc", "docx", "txt"}


@router.post("/extract-text", response_model=EHRExtractResponse)
async def extract_from_text(request: EHRExtractRequest) -> EHRExtractResponse:
    """Extract medical entities from clinical note text."""
    if not request.text or not request.text.strip():
        raise HTTPException(
            status_code=400, detail="Clinical note text cannot be empty"
        )

    try:
        result = await ehr_use_case.extract_from_text(request.text)
        return EHRExtractResponse(success=True, result=result)
    except Exception as e:
        logger.error(f"EHR extraction from text failed: {sanitize_error(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal AI service error occurred during extraction",
        ) from e


@router.post("/extract-file", response_model=EHRExtractResponse)
async def extract_from_file(file: UploadFile = File(...)) -> EHRExtractResponse:  # noqa: B008
    """Extract medical entities from uploaded PDF/Word/Text file."""
    # Validate file presence and filename
    if not file or not file.filename:
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
        if not file_bytes or len(file_bytes) == 0:
            raise HTTPException(status_code=400, detail="File is empty")

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024 * 1024)}MB",
            )

        result = await ehr_use_case.extract_from_file(file_bytes, file.filename)
        return EHRExtractResponse(success=True, result=result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"EHR extraction from file failed: {sanitize_error(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal AI service error occurred during file extraction",
        ) from e


@router.get("/health")
async def ehr_health() -> dict[str, str]:
    """Health check for EHR extraction module."""
    return {"status": "UP", "module": "ehr-extraction"}

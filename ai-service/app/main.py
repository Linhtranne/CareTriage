from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router
from app.api.ehr_routes import router as ehr_router

app = FastAPI(
    title="CareTriage AI Service",
    description="AI Symptom Checker & Triage + EHR Data Extraction powered by Google Gemini",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")
app.include_router(ehr_router, prefix="/api")


@app.get("/health")
async def health():
    return {"status": "UP", "service": "caretriage-ai-service"}

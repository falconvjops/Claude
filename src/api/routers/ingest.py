"""POST /api/v1/ingest — trigger ingestion of an Excel file via Celery."""
import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.workers.ingest_tasks import ingest_file_task

log = structlog.get_logger(__name__)
router = APIRouter()


class IngestRequest(BaseModel):
    file_path: str  # Absolute path on the server filesystem


class IngestResponse(BaseModel):
    job_id: str
    file_path: str
    status: str = "queued"


@router.post("/ingest", response_model=IngestResponse)
async def trigger_ingest(req: IngestRequest) -> IngestResponse:
    if not req.file_path.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only .xlsx and .xls files are supported")

    result = ingest_file_task.delay(req.file_path)
    log.info("ingest_queued", file=req.file_path, job_id=result.id)
    return IngestResponse(job_id=result.id, file_path=req.file_path)


class IngestStatusResponse(BaseModel):
    job_id: str
    status: str
    result: dict | None = None


@router.get("/ingest/status/{job_id}", response_model=IngestStatusResponse)
async def ingest_status(job_id: str) -> IngestStatusResponse:
    from celery.result import AsyncResult
    from src.workers.celery_app import celery_app

    result = AsyncResult(job_id, app=celery_app)
    return IngestStatusResponse(
        job_id=job_id,
        status=result.status,
        result=result.result if result.ready() else None,
    )

"""
Celery task for async Excel ingestion.
Handles the full pipeline: read → clean → chunk → embed → store.
"""
import asyncio
from pathlib import Path

import structlog

from src.workers.celery_app import celery_app

log = structlog.get_logger(__name__)


@celery_app.task(bind=True, max_retries=3, default_retry_delay=30)
def ingest_file_task(self, file_path: str) -> dict:
    """Ingest a single Excel file. Returns summary dict on success."""
    try:
        return asyncio.run(_ingest_file(file_path))
    except Exception as exc:
        log.error("ingest_failed", file=file_path, error=str(exc))
        raise self.retry(exc=exc)


async def _ingest_file(file_path: str) -> dict:
    from src.pipeline.ingestion.excel_reader import read_excel
    from src.pipeline.cleaning.normalizer import normalize_record, compute_duration_minutes
    from src.pipeline.cleaning.pii_scrubber import scrub_pii
    from src.pipeline.chunking.narrative_builder import build_narrative, build_metadata
    from src.pipeline.embedding.embedder import Embedder
    from src.storage.vector.chroma_store import ChromaVectorStore
    from src.storage.relational.postgres import init_schema, upsert_records

    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    log.info("ingest_start", file=path.name)
    await init_schema()

    records = []
    for raw in read_excel(path):
        normalized = normalize_record(raw)
        duration = compute_duration_minutes(normalized)
        if duration is not None:
            normalized["duration_minutes"] = duration
        cleaned = scrub_pii(normalized)
        records.append(cleaned)

    if not records:
        return {"file": path.name, "records": 0, "status": "no_records"}

    # Persist full records to PostgreSQL
    await upsert_records(records)

    # Build narratives and embed
    narratives = [build_narrative(r) for r in records]
    metadatas = [build_metadata(r) for r in records]
    ids = [f"{r.get('_record_type', 'unknown')}:{r.get('number', i)}" for i, r in enumerate(records)]

    embedder = Embedder()
    vectors = await embedder.embed_batch(narratives)

    # Upsert into vector store
    vector_store = ChromaVectorStore()
    await vector_store.upsert(ids=ids, vectors=vectors, documents=narratives, metadatas=metadatas)

    summary = {"file": path.name, "records": len(records), "status": "success"}
    log.info("ingest_complete", **summary)
    return summary

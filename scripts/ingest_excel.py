#!/usr/bin/env python3
"""
CLI for ingesting ServiceNow Excel exports directly (without Celery).
Useful for initial data load and development.

Usage:
    python scripts/ingest_excel.py path/to/incidents.xlsx path/to/changes.xlsx
    python scripts/ingest_excel.py data/*.xlsx
"""
import asyncio
import sys
from pathlib import Path


async def main(file_paths: list[str]) -> None:
    from src.config.logging import configure_logging
    from src.pipeline.ingestion.excel_reader import read_excel
    from src.pipeline.cleaning.normalizer import normalize_record, compute_duration_minutes
    from src.pipeline.cleaning.pii_scrubber import scrub_pii
    from src.pipeline.chunking.narrative_builder import build_narrative, build_metadata
    from src.pipeline.embedding.embedder import Embedder
    from src.storage.vector.chroma_store import ChromaVectorStore
    from src.storage.relational.postgres import init_schema, upsert_records

    configure_logging()
    await init_schema()

    vector_store = ChromaVectorStore()
    embedder = Embedder()
    total_records = 0

    for file_path in file_paths:
        path = Path(file_path)
        if not path.exists():
            print(f"[WARN] File not found, skipping: {file_path}", file=sys.stderr)
            continue

        print(f"[INFO] Ingesting {path.name}...")
        records = []
        for raw in read_excel(path):
            normalized = normalize_record(raw)
            duration = compute_duration_minutes(normalized)
            if duration is not None:
                normalized["duration_minutes"] = duration
            cleaned = scrub_pii(normalized)
            records.append(cleaned)

        if not records:
            print(f"[WARN] No recognizable records found in {path.name}")
            continue

        await upsert_records(records)

        narratives = [build_narrative(r) for r in records]
        metadatas = [build_metadata(r) for r in records]
        ids = [f"{r.get('_record_type', 'unknown')}:{r.get('number', i)}" for i, r in enumerate(records)]

        vectors = await embedder.embed_batch(narratives)
        await vector_store.upsert(ids=ids, vectors=vectors, documents=narratives, metadatas=metadatas)

        print(f"[OK] {path.name}: {len(records)} records ingested")
        total_records += len(records)

    count = await vector_store.count()
    print(f"\n[DONE] Total ingested this run: {total_records} | Total in vector store: {count}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/ingest_excel.py file1.xlsx [file2.xlsx ...]")
        sys.exit(1)
    asyncio.run(main(sys.argv[1:]))

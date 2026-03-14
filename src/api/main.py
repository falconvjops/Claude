"""FastAPI application factory."""
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routers import health, ingest, query
from src.config.logging import configure_logging
from src.storage.relational.postgres import init_schema
from src.storage.vector.chroma_store import ChromaVectorStore

log = structlog.get_logger(__name__)

_vector_store: ChromaVectorStore | None = None


def get_vector_store() -> ChromaVectorStore:
    global _vector_store
    if _vector_store is None:
        _vector_store = ChromaVectorStore()
    return _vector_store


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_logging()
    log.info("startup: initializing database schema")
    await init_schema()
    log.info("startup: vector store ready", count=await get_vector_store().count())
    yield
    log.info("shutdown")


app = FastAPI(
    title="ServiceNow LLM Pipeline",
    description="RAG-based Q&A over ServiceNow ITSM data",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(query.router, prefix="/api/v1", tags=["query"])
app.include_router(ingest.router, prefix="/api/v1", tags=["ingest"])

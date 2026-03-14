"""ChromaDB vector store implementation (Phase 1)."""
import chromadb
import structlog
from chromadb.config import Settings as ChromaSettings

from src.config.settings import settings
from src.storage.interfaces import SearchResult, VectorStore

log = structlog.get_logger(__name__)


class ChromaVectorStore(VectorStore):
    def __init__(self) -> None:
        self._client = chromadb.PersistentClient(
            path=settings.chroma_persist_dir,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
        self._collection = self._client.get_or_create_collection(
            name=settings.chroma_collection_name,
            metadata={"hnsw:space": "cosine"},
        )

    async def upsert(
        self,
        ids: list[str],
        vectors: list[list[float]],
        documents: list[str],
        metadatas: list[dict],
    ) -> None:
        # ChromaDB client is sync; wrap in executor for async callers
        self._collection.upsert(
            ids=ids,
            embeddings=vectors,
            documents=documents,
            metadatas=[_sanitize_metadata(m) for m in metadatas],
        )
        log.debug("chroma_upsert", count=len(ids))

    async def search(
        self,
        query_vector: list[float],
        top_k: int = 10,
        where: dict | None = None,
    ) -> list[SearchResult]:
        kwargs: dict = {"query_embeddings": [query_vector], "n_results": top_k}
        if where:
            kwargs["where"] = where

        results = self._collection.query(**kwargs)
        output: list[SearchResult] = []
        ids = results["ids"][0]
        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]

        for id_, doc, meta, dist in zip(ids, docs, metas, distances):
            output.append(
                SearchResult(
                    record_number=meta.get("record_number", id_),
                    record_type=meta.get("record_type", "unknown"),
                    narrative=doc,
                    metadata=meta,
                    score=1.0 - dist,  # cosine distance → similarity
                )
            )
        return output

    async def count(self) -> int:
        return self._collection.count()

    async def delete_by_source(self, source_file: str) -> None:
        self._collection.delete(where={"source_file": source_file})
        log.info("chroma_deleted_by_source", source_file=source_file)


def _sanitize_metadata(meta: dict) -> dict:
    """ChromaDB only accepts str/int/float/bool metadata values."""
    clean = {}
    for k, v in meta.items():
        if isinstance(v, (str, int, float, bool)):
            clean[k] = v
        elif v is not None:
            clean[k] = str(v)
    return clean

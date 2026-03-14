"""
Abstract base classes for storage backends.
This interface governs the Phase 1 (ChromaDB) → Phase 2 (pgvector) migration.
All call sites depend only on these interfaces, so swapping backends requires
changing only the concrete implementation, not the rest of the codebase.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class SearchResult:
    record_number: str
    record_type: str
    narrative: str
    metadata: dict
    score: float  # higher = more similar (cosine similarity or negative distance)


class VectorStore(ABC):
    @abstractmethod
    async def upsert(
        self,
        ids: list[str],
        vectors: list[list[float]],
        documents: list[str],
        metadatas: list[dict],
    ) -> None: ...

    @abstractmethod
    async def search(
        self,
        query_vector: list[float],
        top_k: int = 10,
        where: dict | None = None,
    ) -> list[SearchResult]: ...

    @abstractmethod
    async def count(self) -> int: ...

    @abstractmethod
    async def delete_by_source(self, source_file: str) -> None: ...

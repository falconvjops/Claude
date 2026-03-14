"""Batch embedding client with retry/backoff for Voyage AI."""
import asyncio
import time
from typing import Sequence

import structlog
import voyageai

from src.config.settings import settings

log = structlog.get_logger(__name__)


class Embedder:
    def __init__(self) -> None:
        self._client = voyageai.AsyncClient(api_key=settings.voyage_api_key)
        self._model = settings.voyage_model
        self._batch_size = settings.embedding_batch_size

    async def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        """Embed a list of texts in batches, returning all vectors."""
        all_vectors: list[list[float]] = []
        batches = [texts[i : i + self._batch_size] for i in range(0, len(texts), self._batch_size)]

        for i, batch in enumerate(batches):
            log.debug("embedding_batch", batch_num=i + 1, total=len(batches), size=len(batch))
            vectors = await self._embed_with_retry(list(batch))
            all_vectors.extend(vectors)

        return all_vectors

    async def embed_query(self, text: str) -> list[float]:
        """Embed a single query string."""
        vectors = await self._embed_with_retry([text], input_type="query")
        return vectors[0]

    async def _embed_with_retry(
        self,
        texts: list[str],
        input_type: str = "document",
        max_retries: int = 4,
    ) -> list[list[float]]:
        delay = 2.0
        for attempt in range(max_retries):
            try:
                result = await self._client.embed(
                    texts,
                    model=self._model,
                    input_type=input_type,
                )
                return result.embeddings
            except Exception as exc:
                if attempt == max_retries - 1:
                    raise
                log.warning("embedding_retry", attempt=attempt + 1, error=str(exc), wait_s=delay)
                await asyncio.sleep(delay)
                delay *= 2
        raise RuntimeError("unreachable")

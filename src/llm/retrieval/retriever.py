"""
Hybrid retrieval orchestration: metadata pre-filter + semantic search.
All 5 primary use cases flow through this module.
"""
import structlog

from src.config.settings import settings
from src.llm.retrieval.filter_parser import parse_filters
from src.pipeline.embedding.embedder import Embedder
from src.storage.interfaces import SearchResult, VectorStore
from src.storage.relational.postgres import get_aggregate_stats

log = structlog.get_logger(__name__)

_embedder: Embedder | None = None


def get_embedder() -> Embedder:
    global _embedder
    if _embedder is None:
        _embedder = Embedder()
    return _embedder


async def retrieve(
    query: str,
    vector_store: VectorStore,
    record_types: list[str] | None = None,
    extra_filters: dict | None = None,
) -> tuple[list[SearchResult], dict]:
    """
    Run hybrid retrieval for the given query.

    Returns:
        (results, aggregate_stats) where results are the top-k SearchResult objects
        and aggregate_stats are PostgreSQL-computed statistics for the filtered set.
    """
    # 1. Extract metadata filters from natural language
    filters = parse_filters(query)
    if extra_filters:
        filters.update(extra_filters)

    # 2. Build ChromaDB `where` clause
    chroma_where = _build_chroma_where(filters, record_types)

    # 3. Embed the query
    embedder = get_embedder()
    query_vector = await embedder.embed_query(query)

    # 4. Semantic search (with pre-filter if any)
    results = await vector_store.search(
        query_vector=query_vector,
        top_k=settings.retrieval_top_k,
        where=chroma_where if chroma_where else None,
    )
    log.info("retrieval_complete", query_len=len(query), results=len(results), filters=filters)

    # 5. Trim to context budget
    results = results[: settings.context_top_k]

    # 6. Fetch aggregate stats from PostgreSQL for the primary record type
    agg_stats: dict = {}
    if results:
        primary_type = record_types[0] if record_types else results[0].record_type
        try:
            agg_stats = await get_aggregate_stats(primary_type, filters)
        except Exception as exc:
            log.warning("aggregate_stats_failed", error=str(exc))

    return results, agg_stats


def _build_chroma_where(filters: dict, record_types: list[str] | None) -> dict:
    """Convert filter dict to ChromaDB `where` clause."""
    clauses: list[dict] = []

    if record_types and len(record_types) == 1:
        clauses.append({"record_type": {"$eq": record_types[0]}})

    if "priority" in filters:
        clauses.append({"priority": {"$eq": filters["priority"]}})

    if "category" in filters:
        clauses.append({"category": {"$eq": filters["category"]}})

    if not clauses:
        return {}
    if len(clauses) == 1:
        return clauses[0]
    return {"$and": clauses}

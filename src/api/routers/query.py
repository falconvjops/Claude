"""POST /api/v1/query — natural language Q&A over ITSM data."""
import time
import uuid
from typing import Optional

import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from src.api.main import get_vector_store
from src.llm import client as llm_client
from src.llm.prompts.context_builder import build_context_block
from src.llm.prompts.system_prompts import ITSM_ANALYST, NO_CONTEXT_FALLBACK
from src.llm.retrieval.retriever import retrieve
from src.storage.cache.redis_cache import (
    get_cached_response,
    get_session,
    query_cache_key,
    set_cached_response,
    set_session,
)

log = structlog.get_logger(__name__)
router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    filters: Optional[dict] = None
    record_types: Optional[list[str]] = None
    session_id: Optional[str] = None


class QueryResponse(BaseModel):
    answer: str
    cited_records: list[str]
    retrieved_count: int
    session_id: str
    model_used: str
    latency_ms: int
    cached: bool = False


@router.post("/query", response_model=QueryResponse)
async def query_itsm(req: QueryRequest) -> QueryResponse:
    if not req.query.strip():
        raise HTTPException(status_code=400, detail="query must not be empty")

    start = time.monotonic()
    session_id = req.session_id or str(uuid.uuid4())

    # Check cache
    cache_key = query_cache_key(req.query, req.filters, req.record_types)
    cached = await get_cached_response(cache_key)
    if cached:
        cached["cached"] = True
        cached["session_id"] = session_id
        return QueryResponse(**cached)

    # Retrieve relevant records
    vector_store = get_vector_store()
    results, agg_stats = await retrieve(
        query=req.query,
        vector_store=vector_store,
        record_types=req.record_types,
        extra_filters=req.filters,
    )

    # Build context and system prompt
    if not results:
        system = NO_CONTEXT_FALLBACK
        messages = [{"role": "user", "content": req.query}]
        model = llm_client.select_model(complex_query=False)
    else:
        context_block = build_context_block(results, agg_stats)
        system = ITSM_ANALYST
        history = await get_session(session_id)
        messages = history + [
            {"role": "user", "content": f"{context_block}\n\n{req.query}"},
        ]
        # Use Sonnet for multi-record analysis, Haiku for simple single-record
        model = llm_client.select_model(complex_query=len(results) > 3)

    # Call Claude
    answer = await llm_client.chat(messages=messages, system=system, model=model)

    # Update session history (store user query + answer without full context block)
    history = await get_session(session_id)
    history.append({"role": "user", "content": req.query})
    history.append({"role": "assistant", "content": answer})
    await set_session(session_id, history)

    cited = [r.metadata.get("record_number", "") for r in results if r.metadata.get("record_number")]
    latency_ms = int((time.monotonic() - start) * 1000)

    response_data = {
        "answer": answer,
        "cited_records": cited,
        "retrieved_count": len(results),
        "session_id": session_id,
        "model_used": model,
        "latency_ms": latency_ms,
        "cached": False,
    }
    await set_cached_response(cache_key, response_data)

    log.info("query_complete", session_id=session_id, results=len(results), latency_ms=latency_ms, model=model)
    return QueryResponse(**response_data)

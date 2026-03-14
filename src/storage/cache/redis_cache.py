"""Redis cache for query results and session state."""
import hashlib
import json
from typing import Any

import redis.asyncio as aioredis
import structlog

from src.config.settings import settings

log = structlog.get_logger(__name__)

_client: aioredis.Redis | None = None


def get_client() -> aioredis.Redis:
    global _client
    if _client is None:
        _client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _client


def query_cache_key(query: str, filters: dict | None, record_types: list | None) -> str:
    payload = json.dumps({"q": query, "f": filters, "rt": record_types}, sort_keys=True)
    return "query:" + hashlib.sha256(payload.encode()).hexdigest()[:16]


async def get_cached_response(key: str) -> dict | None:
    client = get_client()
    value = await client.get(key)
    if value:
        log.debug("cache_hit", key=key)
        return json.loads(value)
    return None


async def set_cached_response(key: str, response: dict) -> None:
    client = get_client()
    await client.setex(key, settings.cache_ttl_seconds, json.dumps(response))


async def get_session(session_id: str) -> list[dict]:
    client = get_client()
    value = await client.get(f"session:{session_id}")
    return json.loads(value) if value else []


async def set_session(session_id: str, history: list[dict]) -> None:
    client = get_client()
    # Keep last 10 turns; 4-hour TTL
    await client.setex(f"session:{session_id}", 14400, json.dumps(history[-10:]))

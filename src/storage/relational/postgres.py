"""PostgreSQL async client for full record storage and analytics queries."""
import json
from typing import Any

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from src.config.settings import settings

log = structlog.get_logger(__name__)

_engine: AsyncEngine | None = None
_session_factory: sessionmaker | None = None


def get_engine() -> AsyncEngine:
    global _engine
    if _engine is None:
        _engine = create_async_engine(
            settings.database_url,
            pool_size=10,
            max_overflow=20,
            echo=settings.app_env == "development",
        )
    return _engine


def get_session_factory() -> sessionmaker:
    global _session_factory
    if _session_factory is None:
        _session_factory = sessionmaker(
            bind=get_engine(),
            class_=AsyncSession,
            expire_on_commit=False,
        )
    return _session_factory


async def init_schema() -> None:
    """Create tables if they don't exist."""
    async with get_engine().begin() as conn:
        await conn.execute(text("""
            CREATE TABLE IF NOT EXISTS itsm_records (
                id              TEXT PRIMARY KEY,
                record_type     TEXT NOT NULL,
                record_number   TEXT NOT NULL,
                source_file     TEXT,
                priority        INTEGER,
                state           TEXT,
                category        TEXT,
                ci              TEXT,
                application     TEXT,
                environment     TEXT,
                opened_date     DATE,
                resolved_date   DATE,
                sla_breached    BOOLEAN,
                duration_minutes INTEGER,
                data            JSONB NOT NULL,
                created_at      TIMESTAMPTZ DEFAULT NOW(),
                updated_at      TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_itsm_record_type   ON itsm_records(record_type);
            CREATE INDEX IF NOT EXISTS idx_itsm_record_number ON itsm_records(record_number);
            CREATE INDEX IF NOT EXISTS idx_itsm_priority      ON itsm_records(priority);
            CREATE INDEX IF NOT EXISTS idx_itsm_opened_date   ON itsm_records(opened_date);
            CREATE INDEX IF NOT EXISTS idx_itsm_ci            ON itsm_records(ci);
        """))
    log.info("postgres_schema_initialized")


async def upsert_records(records: list[dict]) -> int:
    """Insert or update records. Returns number of rows upserted."""
    if not records:
        return 0
    async with get_session_factory()() as session:
        for record in records:
            record_id = f"{record.get('_record_type', 'unknown')}:{record.get('number', '')}"
            await session.execute(
                text("""
                    INSERT INTO itsm_records
                        (id, record_type, record_number, source_file,
                         priority, state, category, ci, application, environment,
                         opened_date, resolved_date, sla_breached, duration_minutes, data)
                    VALUES
                        (:id, :record_type, :record_number, :source_file,
                         :priority, :state, :category, :ci, :application, :environment,
                         :opened_date, :resolved_date, :sla_breached, :duration_minutes, :data::jsonb)
                    ON CONFLICT (id) DO UPDATE SET
                        state = EXCLUDED.state,
                        sla_breached = EXCLUDED.sla_breached,
                        duration_minutes = EXCLUDED.duration_minutes,
                        data = EXCLUDED.data,
                        updated_at = NOW()
                """),
                {
                    "id": record_id,
                    "record_type": record.get("_record_type"),
                    "record_number": str(record.get("number", "")),
                    "source_file": record.get("_source_file"),
                    "priority": record.get("priority"),
                    "state": record.get("state"),
                    "category": record.get("category"),
                    "ci": record.get("ci"),
                    "application": record.get("application"),
                    "environment": record.get("environment"),
                    "opened_date": record.get("opened_at", "")[:10] or None,
                    "resolved_date": record.get("resolved_at", "")[:10] or None,
                    "sla_breached": record.get("sla_breached"),
                    "duration_minutes": record.get("duration_minutes"),
                    "data": json.dumps(record),
                },
            )
        await session.commit()
    return len(records)


async def get_aggregate_stats(
    record_type: str,
    filters: dict[str, Any] | None = None,
) -> dict:
    """Return aggregate statistics for a filtered record set."""
    where_clauses = ["record_type = :record_type"]
    params: dict[str, Any] = {"record_type": record_type}

    if filters:
        if "priority" in filters:
            where_clauses.append("priority = :priority")
            params["priority"] = filters["priority"]
        if "date_from" in filters:
            where_clauses.append("opened_date >= :date_from")
            params["date_from"] = filters["date_from"]
        if "date_to" in filters:
            where_clauses.append("opened_date <= :date_to")
            params["date_to"] = filters["date_to"]
        if "category" in filters:
            where_clauses.append("category = :category")
            params["category"] = filters["category"]

    where = " AND ".join(where_clauses)
    query = text(f"""
        SELECT
            COUNT(*)                                        AS total_count,
            COUNT(*) FILTER (WHERE sla_breached = true)    AS sla_breach_count,
            ROUND(AVG(duration_minutes))                    AS avg_duration_minutes,
            ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP
                  (ORDER BY duration_minutes))              AS p50_duration_minutes
        FROM itsm_records
        WHERE {where}
    """)

    async with get_session_factory()() as session:
        result = await session.execute(query, params)
        row = result.fetchone()
        if not row:
            return {}
        total = row.total_count or 0
        sla_breach = row.sla_breach_count or 0
        return {
            "total_count": total,
            "sla_breach_count": sla_breach,
            "sla_breach_rate": round(sla_breach / total, 3) if total else 0,
            "avg_duration_minutes": row.avg_duration_minutes,
            "p50_duration_minutes": row.p50_duration_minutes,
        }

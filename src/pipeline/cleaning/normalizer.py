"""Normalize field values across ServiceNow record types."""
import re
from datetime import datetime
from typing import Any

import structlog

from src.pipeline.ingestion.schema_detector import normalize_columns

log = structlog.get_logger(__name__)

# Priority normalization: various ServiceNow representations → integer 1-4
_PRIORITY_MAP: dict[str, int] = {
    "1": 1, "p1": 1, "critical": 1, "1 - critical": 1,
    "2": 2, "p2": 2, "high": 2, "2 - high": 2,
    "3": 3, "p3": 3, "medium": 3, "moderate": 3, "3 - moderate": 3,
    "4": 4, "p4": 4, "low": 4, "4 - low": 4,
    "5": 5, "p5": 5, "planning": 5,
}

_STATE_MAP: dict[str, str] = {
    "1": "new", "new": "new",
    "2": "in_progress", "in progress": "in_progress", "wip": "in_progress",
    "3": "on_hold", "on hold": "on_hold", "pending": "on_hold",
    "6": "resolved", "resolved": "resolved", "closed": "resolved",
    "7": "closed", "complete": "resolved", "completed": "resolved",
    "cancelled": "cancelled", "canceled": "cancelled",
}

_DATE_FORMATS = [
    "%Y-%m-%d %H:%M:%S",
    "%Y-%m-%dT%H:%M:%S",
    "%m/%d/%Y %H:%M",
    "%m/%d/%Y",
    "%d/%m/%Y",
    "%Y-%m-%d",
]

_HTML_TAG_RE = re.compile(r"<[^>]+>")


def normalize_record(raw: dict) -> dict:
    """Apply all normalization steps to a raw parsed record dict."""
    record = normalize_columns(raw)
    record = _normalize_priority(record)
    record = _normalize_state(record)
    record = _normalize_dates(record)
    record = _strip_html(record)
    record = _normalize_sla_breach(record)
    return record


def _normalize_priority(record: dict) -> dict:
    raw = record.get("priority")
    if raw is None:
        return record
    normalized = _PRIORITY_MAP.get(str(raw).lower().strip())
    if normalized:
        record["priority"] = normalized
    else:
        log.debug("unknown_priority_value", value=raw)
    return record


def _normalize_state(record: dict) -> dict:
    raw = record.get("state")
    if raw is None:
        return record
    normalized = _STATE_MAP.get(str(raw).lower().strip())
    if normalized:
        record["state"] = normalized
    return record


def _normalize_dates(record: dict) -> dict:
    for field in ("opened_at", "resolved_at", "planned_start", "planned_end"):
        raw = record.get(field)
        if raw is None:
            continue
        if isinstance(raw, datetime):
            record[field] = raw.isoformat()
            continue
        parsed = _parse_date(str(raw).strip())
        if parsed:
            record[field] = parsed.isoformat()
    return record


def _parse_date(value: str) -> datetime | None:
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _strip_html(record: dict) -> dict:
    for field in ("description", "short_description", "resolution_notes", "justification"):
        value = record.get(field)
        if isinstance(value, str):
            stripped = _HTML_TAG_RE.sub(" ", value)
            record[field] = " ".join(stripped.split())
    return record


def _normalize_sla_breach(record: dict) -> dict:
    raw = record.get("sla_breached")
    if raw is None:
        return record
    if isinstance(raw, bool):
        return record
    record["sla_breached"] = str(raw).lower() in ("yes", "true", "1", "breached")
    return record


def compute_duration_minutes(record: dict) -> dict | None:
    """Add duration_minutes field if both opened_at and resolved_at are present."""
    opened = record.get("opened_at")
    resolved = record.get("resolved_at")
    if not opened or not resolved:
        return None
    try:
        delta = datetime.fromisoformat(resolved) - datetime.fromisoformat(opened)
        return max(0, int(delta.total_seconds() / 60))
    except (ValueError, TypeError):
        return None

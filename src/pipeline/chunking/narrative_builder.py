"""
Build embedding-rich narrative text from structured ITSM records.

This is the most critical file in the pipeline. The quality of the narrative
text directly determines embedding quality and retrieval accuracy for all
downstream queries. Narrative format outperforms raw JSON because it gives the
embedding model contextual signals that field values belong together.
"""
from src.pipeline.cleaning.normalizer import compute_duration_minutes
from src.pipeline.ingestion.schema_detector import RecordType

_PRIORITY_LABEL = {1: "P1-Critical", 2: "P2-High", 3: "P3-Medium", 4: "P4-Low", 5: "P5-Planning"}


def build_narrative(record: dict) -> str:
    """Return a narrative string for the given normalized record."""
    record_type = record.get("_record_type")
    if record_type == RecordType.INCIDENT.value:
        return _incident_narrative(record)
    if record_type == RecordType.CHANGE_REQUEST.value:
        return _change_narrative(record)
    if record_type == RecordType.DEPLOYMENT.value:
        return _deployment_narrative(record)
    if record_type == RecordType.SUPPORT_TICKET.value:
        return _support_ticket_narrative(record)
    return _generic_narrative(record)


def build_metadata(record: dict) -> dict:
    """Return the metadata envelope stored alongside the vector (not embedded)."""
    meta = {
        "record_type": record.get("_record_type", "unknown"),
        "record_number": str(record.get("number", "")),
        "source_file": record.get("_source_file", ""),
    }
    # Optional structured fields for hybrid filtering
    for field in ("priority", "state", "category", "ci", "application", "environment"):
        val = record.get(field)
        if val is not None:
            meta[field] = val
    for field in ("opened_at", "resolved_at", "planned_start", "planned_end"):
        val = record.get(field)
        if val:
            # Store date prefix only for range filtering
            meta[field.replace("_at", "_date")] = str(val)[:10]
    sla = record.get("sla_breached")
    if sla is not None:
        meta["sla_breached"] = bool(sla)
    return meta


# ── Private helpers ───────────────────────────────────────────────────────────

def _f(record: dict, key: str, default: str = "") -> str:
    val = record.get(key)
    return str(val).strip() if val is not None else default


def _priority_str(record: dict) -> str:
    p = record.get("priority")
    if isinstance(p, int):
        return _PRIORITY_LABEL.get(p, f"P{p}")
    return str(p) if p else "Unknown"


def _incident_narrative(r: dict) -> str:
    number = _f(r, "number", "UNKNOWN")
    priority = _priority_str(r)
    state = _f(r, "state", "unknown")
    category = _f(r, "category")
    short_desc = _f(r, "short_description")
    description = _f(r, "description")
    resolution = _f(r, "resolution_notes")
    ci = _f(r, "ci")
    assigned_to = _f(r, "assigned_to")
    assignment_group = _f(r, "assignment_group")
    opened = _f(r, "opened_at")
    resolved = _f(r, "resolved_at")
    sla_breach = "Yes" if r.get("sla_breached") else "No"
    duration = compute_duration_minutes(r)

    parts = [
        f"Incident {number} | Priority: {priority} | Category: {category} | State: {state}",
    ]
    if short_desc:
        parts.append(f"Short Description: {short_desc}")
    if description:
        parts.append(f"Description: {description[:800]}")
    if resolution:
        parts.append(f"Resolution Notes: {resolution[:800]}")
    if ci:
        parts.append(f"Configuration Item (CI): {ci}")
    if assigned_to or assignment_group:
        parts.append(f"Assigned To: {assigned_to or '—'} | Group: {assignment_group or '—'}")
    timing = []
    if opened:
        timing.append(f"Opened: {opened}")
    if resolved:
        timing.append(f"Resolved: {resolved}")
    if duration is not None:
        timing.append(f"Duration: {duration} minutes")
    timing.append(f"SLA Breach: {sla_breach}")
    if timing:
        parts.append(" | ".join(timing))
    return "\n".join(parts)


def _change_narrative(r: dict) -> str:
    number = _f(r, "number", "UNKNOWN")
    change_type = _f(r, "change_type", "Normal")
    state = _f(r, "state", "unknown")
    risk = _f(r, "risk")
    impact = _f(r, "impact")
    desc = _f(r, "description")
    justification = _f(r, "justification")
    ci = _f(r, "ci")
    assigned_to = _f(r, "assigned_to")
    planned_start = _f(r, "planned_start")
    planned_end = _f(r, "planned_end")

    parts = [
        f"Change Request {number} | Type: {change_type} | State: {state} | Risk: {risk} | Impact: {impact}",
    ]
    if desc:
        parts.append(f"Description: {desc[:800]}")
    if justification:
        parts.append(f"Justification: {justification[:400]}")
    if ci:
        parts.append(f"Configuration Item (CI): {ci}")
    if assigned_to:
        parts.append(f"Change Owner: {assigned_to}")
    timing = []
    if planned_start:
        timing.append(f"Planned Start: {planned_start}")
    if planned_end:
        timing.append(f"Planned End: {planned_end}")
    if timing:
        parts.append(" | ".join(timing))
    return "\n".join(parts)


def _deployment_narrative(r: dict) -> str:
    number = _f(r, "number", "UNKNOWN")
    application = _f(r, "application")
    environment = _f(r, "environment")
    version = _f(r, "version")
    state = _f(r, "state", "unknown")
    assigned_to = _f(r, "assigned_to")
    related_change = _f(r, "related_change")
    opened = _f(r, "opened_at")
    resolved = _f(r, "resolved_at")

    parts = [
        f"Deployment {number} | Application: {application} | Environment: {environment} | Version: {version} | Status: {state}",
    ]
    if assigned_to:
        parts.append(f"Deployed By: {assigned_to}")
    if related_change:
        parts.append(f"Related Change Request: {related_change}")
    timing = []
    if opened:
        timing.append(f"Start: {opened}")
    if resolved:
        timing.append(f"End: {resolved}")
    if timing:
        parts.append(" | ".join(timing))
    return "\n".join(parts)


def _support_ticket_narrative(r: dict) -> str:
    number = _f(r, "number", "UNKNOWN")
    priority = _priority_str(r)
    state = _f(r, "state", "unknown")
    category = _f(r, "category")
    desc = _f(r, "description")
    customer = _f(r, "customer")
    sla_target = _f(r, "sla_target")
    csat = _f(r, "csat_score")
    opened = _f(r, "opened_at")
    resolved = _f(r, "resolved_at")

    parts = [
        f"Support Ticket {number} | Priority: {priority} | Category: {category} | State: {state}",
    ]
    if desc:
        parts.append(f"Description: {desc[:800]}")
    if customer:
        parts.append(f"Customer: {customer}")
    detail = []
    if sla_target:
        detail.append(f"SLA Target: {sla_target}")
    if csat:
        detail.append(f"CSAT: {csat}")
    if detail:
        parts.append(" | ".join(detail))
    timing = []
    if opened:
        timing.append(f"Opened: {opened}")
    if resolved:
        timing.append(f"Resolved: {resolved}")
    if timing:
        parts.append(" | ".join(timing))
    return "\n".join(parts)


def _generic_narrative(r: dict) -> str:
    record_type = r.get("_record_type", "record")
    number = _f(r, "number", "UNKNOWN")
    lines = [f"{record_type.title()} {number}"]
    skip = {"_record_type", "_source_file", "number"}
    for k, v in r.items():
        if k not in skip and v is not None:
            lines.append(f"{k.replace('_', ' ').title()}: {v}")
    return "\n".join(lines)

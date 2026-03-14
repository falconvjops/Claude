"""Assemble retrieved records into a structured context block for the LLM."""
from src.storage.interfaces import SearchResult


def build_context_block(results: list[SearchResult], aggregate_stats: dict | None = None) -> str:
    if not results:
        return ""

    lines = [
        f"=== RETRIEVED ITSM RECORDS ({len(results)} records) ===",
        "",
    ]
    for r in results:
        meta = r.metadata
        record_type = meta.get("record_type", "record").upper()
        number = meta.get("record_number", "UNKNOWN")
        header_parts = [f"[{record_type} {number}]"]
        if meta.get("priority"):
            header_parts.append(f"P{meta['priority']}")
        if meta.get("state"):
            header_parts.append(meta["state"].upper())
        if meta.get("opened_date"):
            header_parts.append(meta["opened_date"])
        lines.append(" | ".join(header_parts))
        lines.append(r.narrative)
        lines.append("")

    if aggregate_stats:
        lines.append("=== AGGREGATE STATISTICS ===")
        total = aggregate_stats.get("total_count", 0)
        breach_count = aggregate_stats.get("sla_breach_count", 0)
        breach_rate = aggregate_stats.get("sla_breach_rate", 0)
        avg_dur = aggregate_stats.get("avg_duration_minutes")
        lines.append(f"Total matching records: {total}")
        if breach_count is not None:
            lines.append(f"SLA breach count: {breach_count} ({breach_rate:.0%})")
        if avg_dur is not None:
            lines.append(f"Average resolution time: {avg_dur} minutes")

    return "\n".join(lines)

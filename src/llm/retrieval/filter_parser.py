"""
Parse natural language query hints into ChromaDB metadata filters.
Uses simple heuristics rather than a separate LLM call to keep latency low.
"""
import re
from datetime import datetime, timedelta


def parse_filters(query: str) -> dict:
    """
    Extract structured filter hints from a natural language query.
    Returns a dict compatible with ChromaDB's `where` parameter.
    """
    q = query.lower()
    filters: dict = {}

    priority = _extract_priority(q)
    if priority:
        filters["priority"] = priority

    date_range = _extract_date_range(q)
    if date_range:
        filters.update(date_range)

    category = _extract_category(q)
    if category:
        filters["category"] = category

    return filters


def _extract_priority(q: str) -> int | None:
    patterns = [
        (r"\bp1\b|critical priority|priority.{0,5}1", 1),
        (r"\bp2\b|high priority|priority.{0,5}2", 2),
        (r"\bp3\b|medium priority|moderate priority|priority.{0,5}3", 3),
        (r"\bp4\b|low priority|priority.{0,5}4", 4),
    ]
    for pattern, value in patterns:
        if re.search(pattern, q):
            return value
    return None


def _extract_date_range(q: str) -> dict | None:
    today = datetime.utcnow().date()

    # Quarter patterns: "Q1 2024", "Q4 last year"
    quarter_match = re.search(r"q([1-4])\s+(\d{4})", q)
    if quarter_match:
        quarter = int(quarter_match.group(1))
        year = int(quarter_match.group(2))
        start_month = (quarter - 1) * 3 + 1
        end_month = start_month + 2
        return {
            "opened_date_from": f"{year}-{start_month:02d}-01",
            "opened_date_to": f"{year}-{end_month:02d}-{_last_day(year, end_month):02d}",
        }

    # "last N days/weeks/months"
    rel_match = re.search(r"last\s+(\d+)\s+(day|week|month|year)s?", q)
    if rel_match:
        n = int(rel_match.group(1))
        unit = rel_match.group(2)
        delta = {
            "day": timedelta(days=n),
            "week": timedelta(weeks=n),
            "month": timedelta(days=n * 30),
            "year": timedelta(days=n * 365),
        }[unit]
        return {"opened_date_from": str(today - delta)}

    # "this year", "this month"
    if "this year" in q:
        return {"opened_date_from": f"{today.year}-01-01"}
    if "this month" in q:
        return {"opened_date_from": f"{today.year}-{today.month:02d}-01"}

    return None


def _extract_category(q: str) -> str | None:
    categories = {
        "network": ["network", "vpn", "firewall", "dns", "routing", "bandwidth"],
        "database": ["database", "db", "sql", "postgres", "oracle", "mysql"],
        "application": ["application", "app", "software", "code", "deploy"],
        "hardware": ["hardware", "server", "disk", "cpu", "memory", "storage"],
        "security": ["security", "access", "auth", "certificate", "ssl", "tls", "permission"],
    }
    for category, keywords in categories.items():
        if any(kw in q for kw in keywords):
            return category
    return None


def _last_day(year: int, month: int) -> int:
    import calendar
    return calendar.monthrange(year, month)[1]

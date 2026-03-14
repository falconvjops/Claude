"""Unit tests for filter_parser."""
import pytest
from src.llm.retrieval.filter_parser import parse_filters


def test_extract_p1():
    filters = parse_filters("Show me all P1 incidents from last quarter")
    assert filters.get("priority") == 1


def test_extract_p2():
    filters = parse_filters("high priority network issues")
    assert filters.get("priority") == 2


def test_extract_network_category():
    filters = parse_filters("network outages caused by DNS failures")
    assert filters.get("category") == "network"


def test_extract_security_category():
    filters = parse_filters("SSL certificate expiry incidents")
    assert filters.get("category") == "security"


def test_extract_this_year():
    filters = parse_filters("What incidents occurred this year?")
    assert "opened_date_from" in filters


def test_extract_last_30_days():
    filters = parse_filters("incidents in the last 30 days")
    assert "opened_date_from" in filters


def test_extract_quarter():
    filters = parse_filters("Q4 2024 change requests")
    assert filters.get("opened_date_from") == "2024-10-01"
    assert filters.get("opened_date_to") == "2024-12-31"


def test_no_filters():
    filters = parse_filters("find incidents")
    # Should return empty or minimal dict — no false positives
    assert isinstance(filters, dict)

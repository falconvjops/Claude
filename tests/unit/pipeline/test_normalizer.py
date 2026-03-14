"""Unit tests for the normalizer."""
import pytest
from src.pipeline.cleaning.normalizer import normalize_record, compute_duration_minutes


def _base_record(**kwargs):
    return {"_record_type": "incident", "_source_file": "test.xlsx", "number": "INC001", **kwargs}


def test_priority_p1_variants():
    for val in ("1", "p1", "P1", "critical", "1 - critical"):
        r = normalize_record(_base_record(priority=val))
        assert r["priority"] == 1, f"Failed for {val!r}"


def test_priority_p2():
    r = normalize_record(_base_record(priority="2 - High"))
    assert r["priority"] == 2


def test_state_normalized():
    r = normalize_record(_base_record(state="In Progress"))
    assert r["state"] == "in_progress"


def test_state_resolved():
    r = normalize_record(_base_record(state="Resolved"))
    assert r["state"] == "resolved"


def test_date_iso_format():
    r = normalize_record(_base_record(opened_at="01/15/2024 14:32"))
    assert r["opened_at"].startswith("2024-01-15")


def test_html_stripped():
    r = normalize_record(_base_record(description="<p>Some <b>text</b></p>"))
    assert r["description"] == "Some text"


def test_sla_breach_yes():
    r = normalize_record(_base_record(sla_breached="Yes"))
    assert r["sla_breached"] is True


def test_sla_breach_no():
    r = normalize_record(_base_record(sla_breached="No"))
    assert r["sla_breached"] is False


def test_duration_minutes():
    r = {
        "opened_at": "2024-01-15T14:32:00",
        "resolved_at": "2024-01-15T16:45:00",
    }
    assert compute_duration_minutes(r) == 133


def test_duration_missing_resolved():
    r = {"opened_at": "2024-01-15T14:32:00", "resolved_at": None}
    assert compute_duration_minutes(r) is None

"""Unit tests for narrative_builder."""
import pytest
from src.pipeline.chunking.narrative_builder import build_narrative, build_metadata


def _incident(**kwargs):
    return {
        "_record_type": "incident",
        "_source_file": "test.xlsx",
        "number": "INC0012345",
        "priority": 1,
        "state": "resolved",
        "category": "Network",
        "short_description": "VPN gateway unreachable",
        "description": "Users cannot connect via VPN",
        "resolution_notes": "Expired SSL certificate renewed",
        "ci": "vpn-gw-prod-01",
        "assigned_to": "John Smith",
        "opened_at": "2024-01-15T14:32:00",
        "resolved_at": "2024-01-15T16:45:00",
        "sla_breached": True,
        **kwargs,
    }


def test_incident_narrative_contains_number():
    narrative = build_narrative(_incident())
    assert "INC0012345" in narrative


def test_incident_narrative_contains_priority_label():
    narrative = build_narrative(_incident())
    assert "P1-Critical" in narrative


def test_incident_narrative_contains_resolution():
    narrative = build_narrative(_incident())
    assert "Expired SSL certificate" in narrative


def test_incident_narrative_contains_sla_breach():
    narrative = build_narrative(_incident())
    assert "SLA Breach: Yes" in narrative


def test_metadata_has_required_fields():
    meta = build_metadata(_incident())
    assert meta["record_type"] == "incident"
    assert meta["record_number"] == "INC0012345"
    assert meta["priority"] == 1
    assert meta["sla_breached"] is True


def test_metadata_date_prefix():
    meta = build_metadata(_incident())
    assert meta["opened_date"] == "2024-01-15"


def test_change_narrative():
    record = {
        "_record_type": "change_request",
        "_source_file": "test.xlsx",
        "number": "CHG0001234",
        "change_type": "Normal",
        "state": "closed",
        "risk": "Medium",
        "impact": "Low",
        "description": "Database schema migration",
        "ci": "db-server-02",
        "planned_start": "2024-01-20T22:00:00",
        "planned_end": "2024-01-21T02:00:00",
    }
    narrative = build_narrative(record)
    assert "CHG0001234" in narrative
    assert "Database schema migration" in narrative


def test_pii_not_in_narrative_after_scrubbing():
    from src.pipeline.cleaning.pii_scrubber import scrub_pii
    record = _incident(description="Contact user@example.com or call 555-867-5309")
    scrubbed = scrub_pii(record)
    narrative = build_narrative(scrubbed)
    assert "user@example.com" not in narrative
    assert "555-867-5309" not in narrative
    assert "[EMAIL]" in narrative or "[PHONE]" in narrative

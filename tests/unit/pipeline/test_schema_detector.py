"""Unit tests for schema_detector."""
import pytest
from src.pipeline.ingestion.schema_detector import RecordType, detect_schema


def test_detect_incident_by_number():
    assert detect_schema(["Incident Number", "Priority", "Short Description", "Resolution Notes"]) == RecordType.INCIDENT


def test_detect_incident_by_resolution_notes():
    assert detect_schema(["Number", "Category", "Resolution Notes"]) == RecordType.INCIDENT


def test_detect_change_by_change_type():
    assert detect_schema(["Change Number", "Change Type", "State", "Risk"]) == RecordType.CHANGE_REQUEST


def test_detect_change_by_planned_start():
    assert detect_schema(["Change Number", "Planned Start Date", "Impact"]) == RecordType.CHANGE_REQUEST


def test_detect_deployment():
    assert detect_schema(["Deployment ID", "Application", "Version", "Related Change"]) == RecordType.DEPLOYMENT


def test_detect_support_ticket():
    assert detect_schema(["Ticket Number", "Priority", "SLA Target", "Customer"]) == RecordType.SUPPORT_TICKET


def test_returns_none_for_unknown():
    assert detect_schema(["Column A", "Column B", "Column C"]) is None


def test_case_insensitive():
    assert detect_schema(["INCIDENT NUMBER", "PRIORITY", "SHORT DESCRIPTION", "RESOLUTION NOTES"]) == RecordType.INCIDENT

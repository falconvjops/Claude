"""
Detect ServiceNow record type from Excel column names.
ServiceNow exports vary in column naming across instances and versions,
so we use a fingerprint-based approach rather than exact column matching.
"""
from enum import Enum


class RecordType(str, Enum):
    INCIDENT = "incident"
    CHANGE_REQUEST = "change_request"
    DEPLOYMENT = "deployment"
    SUPPORT_TICKET = "support_ticket"


# Column name fragments that strongly indicate a record type.
# Matching is case-insensitive, substring-based.
_FINGERPRINTS: dict[RecordType, list[list[str]]] = {
    RecordType.INCIDENT: [
        ["incident", "number"],  # must contain both fragments
        ["resolution notes"],
        ["short description", "category"],
    ],
    RecordType.CHANGE_REQUEST: [
        ["change", "number"],
        ["change type"],
        ["planned start"],
    ],
    RecordType.DEPLOYMENT: [
        ["deployment", "id"],
        ["deployment", "version"],
        ["related change"],
    ],
    RecordType.SUPPORT_TICKET: [
        ["ticket", "number"],
        ["sla target"],
        ["csat"],
    ],
}

# Column name aliases: normalize to canonical names
COLUMN_ALIASES: dict[str, str] = {
    # Incident
    "inc number": "number",
    "incident number": "number",
    "ticket number": "number",
    "short desc": "short_description",
    "short description": "short_description",
    "description": "description",
    "resolution notes": "resolution_notes",
    "resolution": "resolution_notes",
    "priority": "priority",
    "p1/p2/p3": "priority",
    "state": "state",
    "status": "state",
    "category": "category",
    "subcategory": "subcategory",
    "assignment group": "assignment_group",
    "assigned to": "assigned_to",
    "configuration item": "ci",
    "ci": "ci",
    "opened": "opened_at",
    "opened at": "opened_at",
    "resolved": "resolved_at",
    "resolved at": "resolved_at",
    "sla breach": "sla_breached",
    "sla breached": "sla_breached",
    # Change
    "chg number": "number",
    "change number": "number",
    "change type": "change_type",
    "type": "change_type",
    "risk": "risk",
    "impact": "impact",
    "justification": "justification",
    "planned start date": "planned_start",
    "planned start": "planned_start",
    "planned end date": "planned_end",
    "planned end": "planned_end",
    "change owner": "assigned_to",
    # Deployment
    "deployment id": "number",
    "application": "application",
    "app": "application",
    "environment": "environment",
    "env": "environment",
    "version": "version",
    "start time": "opened_at",
    "end time": "resolved_at",
    "deployed by": "assigned_to",
    "related change": "related_change",
    # Support
    "sla target": "sla_target",
    "csat": "csat_score",
    "customer": "customer",
    "resolution time": "resolved_at",
}


def detect_schema(columns: list[str]) -> RecordType | None:
    """Return the RecordType that best matches the column set, or None."""
    cols_lower = {c.lower().strip() for c in columns}

    for record_type, fingerprint_groups in _FINGERPRINTS.items():
        for required_fragments in fingerprint_groups:
            # All fragments in a group must appear (as substrings) in some column
            if all(
                any(frag in col for col in cols_lower)
                for frag in required_fragments
            ):
                return record_type

    return None


def normalize_columns(raw: dict) -> dict:
    """Rename raw column keys to canonical field names."""
    result = {}
    for key, value in raw.items():
        if key.startswith("_"):
            result[key] = value
            continue
        canonical = COLUMN_ALIASES.get(key.lower().strip(), key.lower().strip().replace(" ", "_"))
        result[canonical] = value
    return result

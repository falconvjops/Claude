"""Basic PII scrubbing for free-text fields before embedding."""
import re

_EMAIL_RE = re.compile(r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b")
_PHONE_RE = re.compile(r"\b(\+?1[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}\b")

_TEXT_FIELDS = ("description", "short_description", "resolution_notes", "justification")


def scrub_pii(record: dict) -> dict:
    """Replace emails and phone numbers in text fields with placeholders."""
    for field in _TEXT_FIELDS:
        value = record.get(field)
        if not isinstance(value, str):
            continue
        value = _EMAIL_RE.sub("[EMAIL]", value)
        value = _PHONE_RE.sub("[PHONE]", value)
        record[field] = value
    return record

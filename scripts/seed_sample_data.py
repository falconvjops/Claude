#!/usr/bin/env python3
"""
Generate synthetic ServiceNow Excel exports for development and testing.

Usage:
    python scripts/seed_sample_data.py --incidents 100 --changes 50 --out data/
"""
import argparse
import random
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd


PRIORITIES = ["1 - Critical", "2 - High", "3 - Moderate", "4 - Low"]
STATES = ["Resolved", "Closed", "In Progress", "New"]
CATEGORIES = ["Network", "Database", "Application", "Hardware", "Security"]
CIS = ["vpn-gw-prod-01", "db-server-02", "web-app-prod", "ldap-01", "firewall-core"]
SHORT_DESCRIPTIONS = [
    "VPN gateway unreachable for remote users",
    "Database connection pool exhausted",
    "SSL certificate expiry causing auth failures",
    "DNS resolution failures in production",
    "Application server out of memory",
    "Disk space critical on backup server",
    "Firewall rule blocking internal traffic",
    "Scheduled job failed to execute",
    "Load balancer health check failures",
    "LDAP authentication timeout",
]
RESOLUTION_NOTES = [
    "Root cause: expired SSL certificate. Renewed via internal CA.",
    "Connection pool limit increased and idle timeout reduced.",
    "Rebooted service and cleared stuck sessions.",
    "DNS cache flushed; issue traced to misconfigured zone record.",
    "Memory leak patched in application release 2.3.1.",
    "Archived old log files; added disk monitoring alert.",
]


def random_date(start_days_ago: int = 365) -> datetime:
    return datetime.utcnow() - timedelta(
        days=random.randint(0, start_days_ago),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59),
    )


def generate_incidents(n: int) -> pd.DataFrame:
    rows = []
    for i in range(1, n + 1):
        opened = random_date()
        duration_h = random.uniform(0.5, 48)
        resolved = opened + timedelta(hours=duration_h)
        rows.append({
            "Incident Number": f"INC{100000 + i:07d}",
            "Priority": random.choice(PRIORITIES),
            "State": random.choice(STATES),
            "Category": random.choice(CATEGORIES),
            "Short Description": random.choice(SHORT_DESCRIPTIONS),
            "Description": f"Detailed description for incident {i}. " + random.choice(SHORT_DESCRIPTIONS),
            "Resolution Notes": random.choice(RESOLUTION_NOTES) if random.random() > 0.2 else "",
            "Configuration Item": random.choice(CIS),
            "Assigned To": f"user{random.randint(1, 20)}@example.com",
            "Assignment Group": random.choice(["network-ops", "db-team", "app-support", "infra"]),
            "Opened": opened.strftime("%Y-%m-%d %H:%M:%S"),
            "Resolved": resolved.strftime("%Y-%m-%d %H:%M:%S"),
            "SLA Breach": random.choice(["Yes", "No", "No", "No"]),
        })
    return pd.DataFrame(rows)


def generate_changes(n: int) -> pd.DataFrame:
    rows = []
    for i in range(1, n + 1):
        planned_start = random_date()
        planned_end = planned_start + timedelta(hours=random.uniform(1, 8))
        rows.append({
            "Change Number": f"CHG{200000 + i:07d}",
            "Change Type": random.choice(["Normal", "Standard", "Emergency"]),
            "State": random.choice(["Closed", "Approved", "Cancelled", "Implemented"]),
            "Risk": random.choice(["Low", "Medium", "High"]),
            "Impact": random.choice(["Low", "Medium", "High"]),
            "Description": f"Change to {random.choice(CIS)}: {random.choice(SHORT_DESCRIPTIONS)}",
            "Justification": "Required for compliance and stability improvement.",
            "Configuration Item": random.choice(CIS),
            "Change Owner": f"user{random.randint(1, 10)}@example.com",
            "Planned Start Date": planned_start.strftime("%Y-%m-%d %H:%M:%S"),
            "Planned End Date": planned_end.strftime("%Y-%m-%d %H:%M:%S"),
        })
    return pd.DataFrame(rows)


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic ITSM sample data")
    parser.add_argument("--incidents", type=int, default=200)
    parser.add_argument("--changes", type=int, default=100)
    parser.add_argument("--out", type=str, default="tests/fixtures/sample_data")
    args = parser.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)

    incidents_path = out / "sample_incidents.xlsx"
    changes_path = out / "sample_changes.xlsx"

    generate_incidents(args.incidents).to_excel(incidents_path, index=False)
    print(f"Generated {args.incidents} incidents → {incidents_path}")

    generate_changes(args.changes).to_excel(changes_path, index=False)
    print(f"Generated {args.changes} changes → {changes_path}")


if __name__ == "__main__":
    main()

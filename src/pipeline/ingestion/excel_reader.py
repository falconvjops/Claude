"""Parse ServiceNow Excel exports into normalized record dicts."""
from pathlib import Path
from typing import Iterator

import pandas as pd
import structlog

from src.pipeline.ingestion.schema_detector import RecordType, detect_schema

log = structlog.get_logger(__name__)


def read_excel(path: str | Path) -> Iterator[dict]:
    """
    Yield one dict per data row from an Excel file.
    Handles multi-sheet workbooks by reading each sheet separately.
    """
    path = Path(path)
    xl = pd.ExcelFile(path)

    for sheet_name in xl.sheet_names:
        df = xl.parse(sheet_name)
        if df.empty:
            continue

        record_type = detect_schema(df.columns.tolist())
        if record_type is None:
            log.warning("unrecognized_schema", file=str(path), sheet=sheet_name)
            continue

        log.info("ingesting_sheet", file=path.name, sheet=sheet_name, rows=len(df), record_type=record_type.value)

        for _, row in df.iterrows():
            yield {
                "_record_type": record_type.value,
                "_source_file": path.name,
                **{k: (None if pd.isna(v) else v) for k, v in row.items()},
            }

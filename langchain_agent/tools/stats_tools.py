import json

import numpy as np
import pandas as pd
from langchain_core.tools import tool


def _load_ohlcv(data_json: str) -> pd.DataFrame:
    records = json.loads(data_json)
    df = pd.DataFrame(records)
    df["date"] = pd.to_datetime(df["date"])
    df = df.set_index("date").sort_index()
    return df


@tool
def compute_statistics(data_json: str) -> str:
    """Compute descriptive statistics for OHLCV stock data.

    Args:
        data_json: JSON string of OHLCV records as returned by get_stock_data.

    Returns:
        Markdown table with descriptive statistics and rolling averages.
    """
    df = _load_ohlcv(data_json)
    close = df["close"]

    stats = {
        "mean_close": round(close.mean(), 2),
        "std_close": round(close.std(), 2),
        "min_close": round(close.min(), 2),
        "max_close": round(close.max(), 2),
        "period_return_pct": round((close.iloc[-1] / close.iloc[0] - 1) * 100, 2),
        "rolling_30d_avg_latest": round(close.rolling(30).mean().iloc[-1], 2),
        "avg_daily_volume": int(df["volume"].mean()),
    }

    lines = ["| Metric | Value |", "|--------|-------|"]
    for k, v in stats.items():
        lines.append(f"| {k.replace('_', ' ').title()} | {v} |")
    return "\n".join(lines)


@tool
def detect_trend(data_json: str) -> str:
    """Detect the price trend direction using linear regression on closing prices.

    Args:
        data_json: JSON string of OHLCV records as returned by get_stock_data.

    Returns:
        Trend analysis with direction, slope, R², and plain-English interpretation.
    """
    df = _load_ohlcv(data_json)
    close = df["close"].values
    x = np.arange(len(close))

    slope, intercept = np.polyfit(x, close, 1)
    predicted = slope * x + intercept
    ss_res = np.sum((close - predicted) ** 2)
    ss_tot = np.sum((close - close.mean()) ** 2)
    r_squared = 1 - ss_res / ss_tot if ss_tot != 0 else 0.0

    pct_change = (close[-1] - close[0]) / close[0] * 100
    if slope > 0.05:
        direction = "Bullish"
    elif slope < -0.05:
        direction = "Bearish"
    else:
        direction = "Flat"

    strength = "strong" if abs(r_squared) > 0.6 else "weak"

    summary = (
        f"Trend: {direction} ({strength})\n"
        f"Slope: {round(slope, 4)} per trading day\n"
        f"R²: {round(r_squared, 4)}\n"
        f"Period return: {round(pct_change, 2)}%\n"
        f"Interpretation: The closing price shows a {direction.lower()} trend with "
        f"{'high' if strength == 'strong' else 'low'} consistency (R²={round(r_squared, 2)}), "
        f"moving approximately ${round(slope, 2)} per day."
    )
    return summary

import json

import yfinance as yf
from langchain_core.tools import tool


@tool
def get_stock_data(ticker: str, period: str = "6mo") -> str:
    """Fetch historical OHLCV stock data for a given ticker symbol.

    Args:
        ticker: Stock ticker symbol (e.g. 'TSLA', 'AAPL').
        period: History period string accepted by yfinance (e.g. '6mo', '1y').

    Returns:
        JSON string of OHLCV records.
    """
    hist = yf.Ticker(ticker).history(period=period)
    if hist.empty:
        return json.dumps({"error": f"No data found for ticker '{ticker}'"})

    records = []
    for date, row in hist.iterrows():
        records.append({
            "date": date.strftime("%Y-%m-%d"),
            "open": round(float(row["Open"]), 4),
            "high": round(float(row["High"]), 4),
            "low": round(float(row["Low"]), 4),
            "close": round(float(row["Close"]), 4),
            "volume": int(row["Volume"]),
        })
    return json.dumps(records)

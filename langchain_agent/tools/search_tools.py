from datetime import datetime

from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool

_search = DuckDuckGoSearchRun()


@tool
def get_recent_news(ticker: str) -> str:
    """Search for recent news about a stock ticker.

    Args:
        ticker: Stock ticker symbol (e.g. 'TSLA').

    Returns:
        Recent news snippets as a string.
    """
    year = datetime.now().year
    query = f"{ticker} stock news {year}"
    return _search.run(query)

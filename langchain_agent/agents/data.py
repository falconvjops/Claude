import json

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent

from langchain_agent.config import settings
from langchain_agent.state import AgentResult, GraphState
from langchain_agent.tools.stock_tools import get_stock_data
from langchain_agent.tools.stats_tools import compute_statistics, detect_trend

_llm = ChatAnthropic(
    model=settings.model,
    api_key=settings.anthropic_api_key,
    temperature=0,
)

_agent = create_react_agent(
    model=_llm,
    tools=[get_stock_data, compute_statistics, detect_trend],
    prompt=(
        "You are a financial data interpretation agent. "
        "Analyze stock price statistics and trend data. "
        "Identify the trend direction, volatility regime, key support/resistance levels, "
        "and provide a clear plain-English interpretation of what the data means for investors."
    ),
)


def data_node(state: GraphState) -> dict:
    plan = json.loads(state["plan"])
    task = plan["data_task"]
    ticker = state["ticker"]

    result = _agent.invoke({
        "messages": [HumanMessage(content=f"Ticker: {ticker}\nTask: {task}")]
    })

    output = result["messages"][-1].content
    return {"agent_results": [AgentResult(agent="data", output=output, error=None)]}

import json

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent

from langchain_agent.config import settings
from langchain_agent.state import AgentResult, GraphState
from langchain_agent.tools.search_tools import get_recent_news
from langchain_agent.tools.stock_tools import get_stock_data

_llm = ChatAnthropic(
    model=settings.model,
    api_key=settings.anthropic_api_key,
    temperature=0,
)

_agent = create_react_agent(
    model=_llm,
    tools=[get_stock_data, get_recent_news],
    prompt=(
        "You are a financial research agent. "
        "Retrieve historical stock price data and recent news for the given ticker. "
        "Be concise and factual. Always include actual numbers from the data."
    ),
)


def research_node(state: GraphState) -> dict:
    plan = json.loads(state["plan"])
    task = plan["research_task"]
    ticker = state["ticker"]

    result = _agent.invoke({
        "messages": [HumanMessage(content=f"Ticker: {ticker}\nTask: {task}")]
    })

    output = result["messages"][-1].content
    return {"agent_results": [AgentResult(agent="research", output=output, error=None)]}

import json

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langgraph.prebuilt import create_react_agent

from langchain_agent.config import settings
from langchain_agent.state import AgentResult, GraphState
from langchain_agent.tools.repl_tools import python_repl

_llm = ChatAnthropic(
    model=settings.model,
    api_key=settings.anthropic_api_key,
    temperature=0,
)

_agent = create_react_agent(
    model=_llm,
    tools=[python_repl],
    prompt=(
        "You are a quantitative coding agent. "
        "Write and execute self-contained Python code using pandas, numpy, and yfinance. "
        "Always print your results. Compute technical indicators such as moving averages, "
        "RSI, Bollinger Bands, and any other relevant metrics. "
        "Show the actual computed values, not just the code."
    ),
)


def coder_node(state: GraphState) -> dict:
    plan = json.loads(state["plan"])
    task = plan["coder_task"]
    ticker = state["ticker"]

    result = _agent.invoke({
        "messages": [HumanMessage(content=f"Ticker: {ticker}\nTask: {task}")]
    })

    output = result["messages"][-1].content
    return {"agent_results": [AgentResult(agent="coder", output=output, error=None)]}

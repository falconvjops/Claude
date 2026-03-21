import json
import re

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END

from langchain_agent.config import settings
from langchain_agent.state import GraphState

_llm = ChatAnthropic(
    model=settings.model,
    api_key=settings.anthropic_api_key,
    temperature=0,
)

_PLANNING_SYSTEM = """\
You are a financial analysis supervisor. Given a user query about a stock, extract the ticker
symbol and create a task plan for three specialized agents.

Output ONLY valid JSON — no prose, no markdown fences:
{
  "ticker": "<SYMBOL>",
  "research_task": "<one sentence: what data and news to fetch>",
  "coder_task": "<one sentence: what quantitative analysis to compute>",
  "data_task": "<one sentence: what trends and statistics to interpret>"
}
"""

_SYNTHESIS_SYSTEM = """\
You are a financial analysis supervisor. You have received outputs from three specialized agents.
Synthesize them into a coherent analyst report with the following sections:

## Summary
## Stock Data & News
## Quantitative Analysis
## Statistical Trends
## Conclusion

Be specific. Reference actual numbers from the agent outputs. Be insightful and actionable.
"""


def supervisor_node(state: GraphState) -> dict:
    agent_results = state.get("agent_results", [])

    # Phase 1: planning — no agent results yet
    if not agent_results:
        response = _llm.invoke([
            SystemMessage(content=_PLANNING_SYSTEM),
            HumanMessage(content=state["query"]),
        ])

        raw = response.content.strip()
        # Strip markdown code fences if the model wraps the JSON
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)

        plan = json.loads(raw)
        return {
            "ticker": plan["ticker"],
            "plan": json.dumps(plan),
            "next": "dispatch",
        }

    # Phase 2: synthesis — all three agents have reported back
    research_out = next((r["output"] for r in agent_results if r["agent"] == "research"), "")
    coder_out = next((r["output"] for r in agent_results if r["agent"] == "coder"), "")
    data_out = next((r["output"] for r in agent_results if r["agent"] == "data"), "")

    synthesis_prompt = (
        f"User query: {state['query']}\n\n"
        f"=== Research Agent Output ===\n{research_out}\n\n"
        f"=== Coder Agent Output ===\n{coder_out}\n\n"
        f"=== Data Agent Output ===\n{data_out}"
    )

    response = _llm.invoke([
        SystemMessage(content=_SYNTHESIS_SYSTEM),
        HumanMessage(content=synthesis_prompt),
    ])

    return {
        "final_answer": response.content,
        "next": "done",
    }


def route(state: GraphState) -> list[str] | str:
    if state.get("next") == "dispatch":
        return ["research_agent", "coder_agent", "data_agent"]
    return END

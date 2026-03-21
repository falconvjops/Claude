from __future__ import annotations

from typing import Annotated, TypedDict


class AgentResult(TypedDict):
    agent: str        # "research" | "coder" | "data"
    output: str
    error: str | None


def _merge_results(existing: list, new: list) -> list:
    return existing + new


class GraphState(TypedDict):
    query: str
    ticker: str
    plan: str                                                      # JSON string from supervisor
    agent_results: Annotated[list[AgentResult], _merge_results]   # parallel fan-out reducer
    final_answer: str
    next: str                                                      # routing signal

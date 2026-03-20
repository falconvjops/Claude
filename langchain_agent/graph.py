from langgraph.graph import END, StateGraph

from langchain_agent.agents.coder import coder_node
from langchain_agent.agents.data import data_node
from langchain_agent.agents.research import research_node
from langchain_agent.state import GraphState
from langchain_agent.supervisor import route, supervisor_node


def build_graph():
    g = StateGraph(GraphState)

    g.add_node("supervisor", supervisor_node)
    g.add_node("research_agent", research_node)
    g.add_node("coder_agent", coder_node)
    g.add_node("data_agent", data_node)

    g.set_entry_point("supervisor")

    # Supervisor routes: fan-out to all three agents (parallel) or END after synthesis
    g.add_conditional_edges("supervisor", route)

    # All three agents converge back to supervisor for synthesis
    # LangGraph waits for all parallel branches before firing the target node
    g.add_edge("research_agent", "supervisor")
    g.add_edge("coder_agent", "supervisor")
    g.add_edge("data_agent", "supervisor")

    return g.compile()


graph = build_graph()

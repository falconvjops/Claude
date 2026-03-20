"""CLI entry point for the LangChain multi-agent financial analyst.

Usage:
    python -m langchain_agent.main "Analyze Tesla's stock performance and show insights."
    python langchain_agent/main.py "Analyze Apple's stock performance."
"""
import argparse

from langchain_agent.graph import graph


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Multi-agent financial analyst powered by LangChain + Claude."
    )
    parser.add_argument(
        "query",
        nargs="?",
        default="Analyze Tesla's stock performance and show insights.",
        help="Natural language query about a stock (default: Tesla analysis)",
    )
    args = parser.parse_args()

    print(f"\nQuery: {args.query}")
    print("=" * 60)
    print("Running multi-agent analysis...\n")

    result = graph.invoke({"query": args.query, "agent_results": []})

    print("\nFinal Answer:")
    print("=" * 60)
    print(result["final_answer"])


if __name__ == "__main__":
    main()

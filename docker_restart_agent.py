#!/usr/bin/env python3
"""Docker container restart agent.

Monitors Docker containers and automatically restarts them when they crash
(exit with a non-zero exit code).
"""

import argparse
import logging
import sys
import time

import docker
import docker.errors

logger = logging.getLogger(__name__)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Restart Docker containers that crash (non-zero exit code)."
    )
    parser.add_argument(
        "--containers",
        metavar="NAME",
        nargs="+",
        help="Container names to watch. If omitted, all containers are watched.",
    )
    parser.add_argument(
        "--label",
        metavar="KEY=VALUE",
        help="Only watch containers that have this label (e.g. restart-policy=auto).",
    )
    parser.add_argument(
        "--max-restarts",
        type=int,
        default=5,
        metavar="N",
        help="Max restarts per container before giving up (default: 5).",
    )
    parser.add_argument(
        "--cooldown",
        type=int,
        default=5,
        metavar="SECONDS",
        help="Seconds to wait before restarting a crashed container (default: 5).",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging verbosity (default: INFO).",
    )
    return parser.parse_args()


def should_watch(name: str, labels: dict, args: argparse.Namespace) -> bool:
    """Return True if this container should be monitored."""
    if args.containers and name not in args.containers:
        return False
    if args.label:
        key, _, value = args.label.partition("=")
        if labels.get(key) != value:
            return False
    return True


def handle_die_event(
    event: dict,
    restart_counts: dict,
    client: docker.DockerClient,
    args: argparse.Namespace,
) -> None:
    """Process a container die event and restart if appropriate."""
    attributes = event.get("Actor", {}).get("Attributes", {})
    container_id = event.get("Actor", {}).get("ID", "")
    name = attributes.get("name", container_id[:12])
    exit_code = attributes.get("exitCode", "0")

    # Clean exit — not a crash
    if exit_code == "0":
        logger.debug("Container %s exited cleanly (code 0), skipping.", name)
        return

    # Fetch labels to check watch filters
    try:
        container = client.containers.get(container_id)
        labels = container.labels
    except docker.errors.NotFound:
        logger.warning("Container %s (%s) not found — already removed.", name, container_id[:12])
        return

    if not should_watch(name, labels, args):
        logger.debug("Container %s is not being watched, skipping.", name)
        return

    count = restart_counts.get(container_id, 0)
    if count >= args.max_restarts:
        logger.warning(
            "Container %s has crashed %d time(s) — max restarts (%d) reached, giving up.",
            name,
            count,
            args.max_restarts,
        )
        return

    logger.info(
        "Container %s crashed (exit code %s). Restarting in %ds... (attempt %d/%d)",
        name,
        exit_code,
        args.cooldown,
        count + 1,
        args.max_restarts,
    )
    time.sleep(args.cooldown)

    try:
        container.restart()
        restart_counts[container_id] = count + 1
        logger.info("Container %s restarted successfully.", name)
    except docker.errors.NotFound:
        logger.warning("Container %s was removed before restart could occur.", name)
    except docker.errors.APIError as exc:
        logger.error("Failed to restart container %s: %s", name, exc)


def run(args: argparse.Namespace) -> None:
    """Connect to Docker and stream events, restarting crashed containers."""
    try:
        client = docker.from_env()
        client.ping()
    except docker.errors.DockerException as exc:
        logger.error("Cannot connect to Docker daemon: %s", exc)
        sys.exit(1)

    logger.info("Docker restart agent started.")
    if args.containers:
        logger.info("Watching containers: %s", ", ".join(args.containers))
    elif args.label:
        logger.info("Watching containers with label: %s", args.label)
    else:
        logger.info("Watching all containers.")

    restart_counts: dict[str, int] = {}

    for event in client.events(decode=True, filters={"type": "container"}):
        action = event.get("Action", "")

        if action == "die":
            handle_die_event(event, restart_counts, client, args)
        elif action == "start":
            # Reset restart count when a container starts fresh (e.g. manual start)
            container_id = event.get("Actor", {}).get("ID", "")
            if container_id in restart_counts:
                restart_counts.pop(container_id)
                name = event.get("Actor", {}).get("Attributes", {}).get("name", container_id[:12])
                logger.debug("Reset restart count for %s.", name)


if __name__ == "__main__":
    args = parse_args()
    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    run(args)

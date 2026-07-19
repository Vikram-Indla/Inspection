#!/usr/bin/env python3
"""Safe one-shot launcher/status reader for the Inspection Claude lead.

The durable event directory and Codex heartbeat perform loopback. This script
only guarantees that at most one discoverable Claude background lead is
launched for the canonical repository. It never executes commands found in
coordination files.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

CANONICAL_REPO = Path("/Users/vikramindla/Developer/Inspection")
COORDINATION = CANONICAL_REPO / "product-contract" / "operationalization" / "coordination"
PROMPT = COORDINATION / "CLAUDE_LOOP_PROMPT.md"
LOCK = COORDINATION / "locks" / "supervisor-launch.lock"
STOP_ALL = COORDINATION / "STOP_ALL"


def claude_binary() -> str:
    binary = shutil.which("claude")
    if not binary:
        raise RuntimeError("Claude CLI is not installed or not on PATH")
    return binary


def agents() -> list[dict]:
    result = subprocess.run(
        [claude_binary(), "agents", "--json", "--all", "--cwd", str(CANONICAL_REPO)],
        cwd=CANONICAL_REPO,
        text=True,
        capture_output=True,
        check=True,
        timeout=30,
    )
    parsed = json.loads(result.stdout or "[]")
    if not isinstance(parsed, list):
        raise RuntimeError("Unexpected Claude agents response")
    return parsed


def active_agents() -> list[dict]:
    completed = {"completed", "failed", "cancelled", "stopped"}
    # The user's open Claude Desktop conversation is an interactive session and
    # may be idle at its prompt. It is not the discoverable supervised lead.
    # Only a non-interactive/background session prevents another launch.
    return [
        item for item in agents()
        if str(item.get("kind", "")).lower() != "interactive"
        and str(item.get("status", "")).lower() not in completed
    ]


def acquire_launch_lock() -> None:
    LOCK.parent.mkdir(parents=True, exist_ok=True)
    try:
        LOCK.mkdir()
    except FileExistsError as exc:
        raise RuntimeError(f"Launch lock already exists: {LOCK}") from exc
    (LOCK / "owner.json").write_text(
        json.dumps({"pid": os.getpid(), "created_epoch": time.time(), "host": os.uname().nodename}, indent=2),
        encoding="utf-8",
    )


def release_launch_lock() -> None:
    owner = LOCK / "owner.json"
    if owner.exists():
        owner.unlink()
    if LOCK.exists():
        LOCK.rmdir()


def launch() -> dict:
    if STOP_ALL.exists():
        raise RuntimeError(f"Global kill switch is present: {STOP_ALL}")
    if not PROMPT.is_file():
        raise RuntimeError(f"Missing loop prompt: {PROMPT}")
    current = active_agents()
    if current:
        return {"launched": False, "reason": "active_agent_exists", "agents": current}

    acquire_launch_lock()
    try:
        current = active_agents()
        if current:
            return {"launched": False, "reason": "active_agent_exists_after_lock", "agents": current}
        prompt_text = PROMPT.read_text(encoding="utf-8")
        result = subprocess.run(
            [
                claude_binary(),
                "--background",
                "--model", "sonnet",
                "--permission-mode", "default",
                prompt_text,
            ],
            cwd=CANONICAL_REPO,
            text=True,
            capture_output=True,
            check=True,
            timeout=60,
        )
        return {"launched": True, "stdout": result.stdout.strip(), "stderr": result.stderr.strip(), "agents": agents()}
    finally:
        release_launch_lock()


def main() -> int:
    action = sys.argv[1] if len(sys.argv) > 1 else "status"
    if action == "status":
        print(json.dumps({"agents": agents(), "stop_all": STOP_ALL.exists()}, indent=2))
        return 0
    if action == "launch":
        print(json.dumps(launch(), indent=2))
        return 0
    raise RuntimeError("Usage: ops_loopback_supervisor.py [status|launch]")


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(json.dumps({"error": str(exc)}, indent=2), file=sys.stderr)
        raise SystemExit(1)

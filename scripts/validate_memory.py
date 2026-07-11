#!/usr/bin/env python3
from pathlib import Path
import json, csv, sys, subprocess

root = Path(__file__).resolve().parents[1]
required = [
    root/"CLAUDE.md",
    root/".claude"/"settings.json",
    root/"product-contract"/"00_START_HERE.md",
    root/"product-contract"/"CURRENT_STATE.md",
    root/"product-contract"/"GATE_STATUS.md",
    root/"product-contract"/"execution"/"CURRENT_SLICE.yaml",
    root/"product-contract"/"execution"/"TASK_ROUTER.yaml",
    root/"product-contract"/"sessions"/"SESSION_LEDGER.json",
    root/".obsidian"/"app.json"
]
missing = [str(p.relative_to(root)) for p in required if not p.exists()]
if missing:
    print("MISSING:")
    print("\n".join(missing))
    sys.exit(1)

for p in [root/".claude"/"settings.json", root/"product-contract"/"MANIFEST.json",
          root/"product-contract"/"sessions"/"SESSION_LEDGER.json"]:
    json.loads(p.read_text(encoding="utf-8"))

claude_lines = len((root/"CLAUDE.md").read_text(encoding="utf-8").splitlines())
if claude_lines > 200:
    print(f"CLAUDE.md too long: {claude_lines} lines")
    sys.exit(1)

print("G4 memory structure validation: PASS")
print(f"CLAUDE.md lines: {claude_lines}")
print("Repository root is ready to be opened as an Obsidian vault.")

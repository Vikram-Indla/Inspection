#!/usr/bin/env bash
set -euo pipefail

echo "MIM Inspection Platform - G4 bootstrap"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

python3 scripts/validate_memory.py

mkdir -p product-contract/evidence/attachments .project-memory/audit
chmod +x scripts/*.py .claude/hooks/*.py 2>/dev/null || true

if [ ! -d .git ]; then
  git init -b main
fi

echo "Repository root: $ROOT"
echo "Next:"
echo "1. Open this exact folder as an Obsidian vault."
echo "2. Run Claude Code from this root."
echo "3. Run /memory and confirm CLAUDE.md and rules are loaded."
echo "4. Execute the G4 verification runbook."

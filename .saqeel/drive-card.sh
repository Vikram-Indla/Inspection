#!/usr/bin/env bash
# SAQEEL OS — generalized Codex card driver.
#
#   .saqeel/drive-card.sh <card-id> [extra instructions...]
#
# Builds the full card prompt from the OS artifacts (spine + designs + baseline),
# prepends the workstation authorization, and runs Codex non-interactively.
# One card per invocation. One session per card.

set -euo pipefail

REPO="/Users/jahanarakhan/inspection latest"
CODEX="${CODEX_BIN:-/Users/jahanarakhan/.codex/plugins/.plugin-appserver/codex}"
SPINE="$REPO/status/saqeel-status.json"
AUTH="$REPO/.saqeel/WORKSTATION_AUTHORIZATION.md"
BASELINE="$REPO/product-contract/web-admin-phase1/REQUIREMENT_BASELINE.csv"

CARD="${1:-}"
if [[ -z "$CARD" ]]; then
  echo "usage: drive-card.sh <card-id> [extra instructions]" >&2
  echo "PWA cards:" >&2
  python3 -c "
import json
for c in json.load(open('$SPINE'))['cards']:
    if c['channel']=='pwa': print('  ', c['id'], '-', c['name'])
" >&2
  exit 2
fi
shift || true
EXTRA="${*:-}"

[[ -f "$AUTH" ]] || { echo "STOP: no workstation authorization at $AUTH" >&2; exit 3; }

PROMPT_FILE="$(mktemp -t saqeel-card)"
trap 'rm -f "$PROMPT_FILE"' EXIT

{
  echo "## WORKSTATION AUTHORIZATION (read this before any repository-authority check)"
  echo
  cat "$AUTH"
  echo
  echo "---"
  echo
  echo "You are working SAQEEL card \`$CARD\` on the PWA / iPad inspector channel."
  echo "REPO: $REPO"
  echo "BRANCH: $(git -C "$REPO" branch --show-current)"
  echo "SPINE: status/saqeel-status.json   DESIGNS: designs/pwa/pwa/"
  echo "BASELINE: product-contract/web-admin-phase1/REQUIREMENT_BASELINE.csv"
  echo
  echo "### Your card (verbatim from the spine)"
  echo '```json'
  python3 -c "
import json,sys
cards=json.load(open('$SPINE'))['cards']
c=next((x for x in cards if x['id']=='$CARD'),None)
if not c: sys.exit('CARD $CARD NOT FOUND')
print(json.dumps(c,indent=2,ensure_ascii=False))
"
  echo '```'
  echo
  echo "### Candidate baseline rows (target_routes touching /field)"
  python3 -c "
import csv
rows=[r for r in csv.DictReader(open('$BASELINE',encoding='utf-8'))
      if '/field' in (r.get('target_routes') or '')]
print(f'{len(rows)} rows own this channel. Join them to the card yourself on capability/purpose.')
for r in rows[:60]:
    print(f\"  {r['requirement_id']:8} {(r.get('target_module_id') or '-'):8} {r['capability'][:58]}\")
"
  echo
  echo "### Hard rules"
  cat <<'RULES'
- NEVER run `next build` / `npm run build` in apps/web while a dev server is live (check `lsof -ti:3000`).
  The dev server and the production build share apps/web/.next; building over a running dev server
  CORRUPTS that cache and hangs the server. This has already happened twice on this workstation
  (see apps/web/.next.corrupt-bak-*). Use `npm run typecheck` to verify. If you genuinely need a
  production build, say so and stop — the operator will run it against a separate build dir.
- Build to the card's designPage in designs/pwa/pwa/ — canonical (tracked; the extract copy was removed 2026-07-26). Never build from the live render or memory.
- EN/LTR and AR/RTL both. Never invent values; if a value is not governed, render nothing.
- Do NOT touch files owned by another agent. One card, one file set, no overlap.
- Do NOT push, merge, or modify main. Do NOT edit frozen product-contract artifacts.
- Web/Admin routes belong to the other workstation — do not touch them.
- Surface hard stops (OPEN_BUSINESS_DECISION rows, unresolved BREAK rules) instead of deciding them.

STATUS PROTOCOL (BS-3, non-negotiable):
Edit ONLY your own card object inside status/saqeel-status.json — its design/code/wiring and pending[].
Bump the top-level "revision" and "updated". NEVER rewrite the whole file. No number without evidence.

Start by reading the designPage and the source files, then report the concrete diff list before editing.
RULES
  [[ -n "$EXTRA" ]] && { echo; echo "### Operator instructions"; echo "$EXTRA"; }
} > "$PROMPT_FILE"

echo "[saqeel] card=$CARD prompt=$(wc -l < "$PROMPT_FILE") lines — launching Codex" >&2
exec "$CODEX" exec -C "$REPO" --sandbox workspace-write "$(cat "$PROMPT_FILE")" < /dev/null

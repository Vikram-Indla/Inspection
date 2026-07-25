#!/usr/bin/env bash
# SAQEEL OS — what is running right now, and what ran before.
#   .saqeel/sessions.sh
set -uo pipefail
REPO="/Users/jahanarakhan/inspection latest"
SESS="$REPO/.saqeel/sessions"

echo "=== LIVE Codex sessions ==="
if pgrep -f "codex exec" >/dev/null 2>&1; then
  pgrep -f "codex exec" | while read -r pid; do
    et=$(ps -p "$pid" -o etime= 2>/dev/null | tr -d ' ')
    cpu=$(ps -p "$pid" -o %cpu= 2>/dev/null | tr -d ' ')
    echo "  pid $pid  running ${et}  cpu ${cpu}%"
  done
else
  echo "  (none — Codex is idle)"
fi

echo
echo "=== Visible Terminal windows ==="
osascript -e 'tell application "System Events" to (name of processes) contains "Terminal"' 2>/dev/null | grep -q true && \
  osascript -e 'tell application "Terminal" to get name of every window' 2>/dev/null | tr ',' '\n' | sed 's/^ */  /' || \
  echo "  (Terminal not running)"

echo
echo "=== Session logs (newest first) ==="
if compgen -G "$SESS/*.log" >/dev/null; then
  ls -t "$SESS"/*.log 2>/dev/null | head -10 | while read -r f; do
    printf "  %-46s %6s lines  %s\n" "$(basename "$f")" "$(wc -l < "$f" | tr -d ' ')" "$(date -r "$f" '+%H:%M:%S')"
  done
else
  echo "  (no session logs yet)"
fi

echo
echo "=== Spine ==="
python3 -c "
import json
d=json.load(open('$REPO/status/saqeel-status.json'))
print(f\"  revision {d['revision']} · updated {d['updated']} · by {d.get('updatedBy')}\")
" 2>/dev/null || echo "  (spine unreadable)"

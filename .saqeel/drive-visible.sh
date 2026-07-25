#!/usr/bin/env bash
# SAQEEL OS — VISIBLE Codex driver.
#
#   .saqeel/drive-visible.sh <card-id> [extra instructions...]
#
# Same as drive-card.sh, but opens a real Terminal.app window you can watch,
# titled for the card. One window = one card = one session.
# The transcript is still captured to .saqeel/sessions/<card>-<ts>.log.

set -euo pipefail

REPO="/Users/jahanarakhan/inspection latest"
SESS="$REPO/.saqeel/sessions"
mkdir -p "$SESS"

CARD="${1:-}"
[[ -z "$CARD" ]] && { echo "usage: drive-visible.sh <card-id> [extra]" >&2; exit 2; }
shift || true
EXTRA="${*:-}"

TS="$(date +%Y%m%d-%H%M%S)"
LOG="$SESS/${CARD}-${TS}.log"

# Build the command the Terminal window will run. Title the window/tab for the
# card so several concurrent sessions stay tellable apart, and keep the window
# open afterwards so the verdict stays readable.
RUN=$(cat <<EOF
printf '\033]0;SAQEEL · ${CARD}\007';
cd '${REPO}';
echo '=== SAQEEL session: ${CARD} · started ${TS} ===';
echo '=== log: ${LOG} ===';
echo;
'${REPO}/.saqeel/drive-card.sh' '${CARD}' $(printf '%q' "$EXTRA") 2>&1 | tee '${LOG}';
echo;
echo '=== ${CARD} finished — window kept open. Close it when done. ===';
EOF
)

osascript >/dev/null <<OSA
tell application "Terminal"
  activate
  do script "${RUN//\"/\\\"}"
end tell
OSA

echo "[saqeel] VISIBLE session opened for '${CARD}'"
echo "[saqeel] window title: SAQEEL · ${CARD}"
echo "[saqeel] log: ${LOG}"

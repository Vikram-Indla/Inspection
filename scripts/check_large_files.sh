#!/usr/bin/env bash
set -euo pipefail

limit="${INSPECTION_MAX_TRACKED_FILE_BYTES:-10485760}"
repo_root="$(git rev-parse --show-toplevel)"
allowlist="$repo_root/.githooks/large-file-allowlist"
failed=0

while IFS= read -r -d '' path; do
  [ -f "$repo_root/$path" ] || continue
  size="$(wc -c < "$repo_root/$path" | tr -d '[:space:]')"
  [ "$size" -le "$limit" ] && continue
  if [ -f "$allowlist" ] && grep -Fqx -- "$path" "$allowlist"; then
    continue
  fi
  printf 'Blocked: newly added file exceeds %s bytes: %s (%s bytes)\n' "$limit" "$path" "$size" >&2
  failed=1
done < <(git diff --cached --diff-filter=A --name-only -z)

if [ "$failed" -ne 0 ]; then
  printf 'Store documentation externally or obtain review and add the exact required runtime/build path to %s.\n' "$allowlist" >&2
  exit 1
fi

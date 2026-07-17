# Cycle 2 Wave 0 — Credential Remediation Evidence

Task: TASK-... Cycle 2 defect-fix/hardening (fix/mvp1-cycle2-production-hardening).
Related: BLK-P2-008, BLK-P25-010 (MVP1_TO_MVP2_READINESS_AUDIT_20260716_2227).

## Finding

`.project-memory/audit/tool_events.jsonl` is a **tracked, pushed** file (audit
log written by `.claude/hooks/post_tool_audit.py`). Five entries logged the raw
`tool_input.command` of `Bash` calls that embedded a live Supabase credential
string inside a `curl` request against
`https://iiozvqntawxfwbgffzqu.supabase.co/rest/v1/...`. Decoding the token
payload shows `"role":"anon"` — the Supabase **anon/publishable** key, not
`service_role`. It is nonetheless a live, project-identifying credential value
committed to source control, which violates
`docs/SECURITY_AND_SECRETS.md` ("Hooks log metadata only; remove sensitive tool
input logging if the repository begins handling secrets.").

No secret **value** is reproduced in this file, in the migration added by this
task, or in any commit message. Exact locations (commit-independent, current
tracked file) for the credential owner to locate and rotate:

- `.project-memory/audit/tool_events.jsonl` — 5 matching lines as of this scan
  (JWT-shaped strings following `apikey:`/`Authorization:` inside logged
  `curl` commands, decoded role: `anon`).

A repository-wide scan found **no** `service_role`, `sk-`, or Postgres
connection-string secrets tracked anywhere else (repo root, `apps/web`,
`.project-memory`).

## What this task changed (forward-only, no history rewrite)

- `.claude/hooks/_common.py` — added `redact_secrets()`, applied to every
  `tool_input` before it is appended to `tool_events.jsonl`
  (`.claude/hooks/post_tool_audit.py`). JWT-shaped strings, `sk-`-prefixed
  keys, and `apikey:`/`authorization:`/`token:`/`password:`/`secret:`-labelled
  values are replaced with `[REDACTED]` at write time. This prevents any
  **future** hook-logged command from reintroducing this exposure. It does
  **not** alter any already-committed line.

## What this task explicitly did NOT do (per Cycle 2 prompt authorization limits)

- Did not print, copy, or otherwise expose the actual credential value anywhere
  in this evidence file, in chat, or in code.
- Did not rewrite Git history (`git filter-repo`/`BFG`/force-push) to purge the
  already-committed lines — that is a destructive, history-rewriting action
  explicitly requiring separate authorization ("do not... rewrite Git history
  without explicit authorization").
- Did not rotate the credential itself — rotation requires an operator with
  Supabase project-owner access to the `iiozvqntawxfwbgffzqu` project, which
  this session does not have standing authorization to perform unilaterally
  (matches BLK-P25-010's owner: Security/Repository Owner, not Engineering).

## Required follow-up (owner: Security/Repository Owner — outside this task's authority)

1. Rotate the exposed Supabase anon key in the Supabase dashboard for project
   `iiozvqntawxfwbgffzqu`; update every dependent configured target
   (`.env.local`, hosting provider env vars, CI secrets) atomically so nothing
   breaks mid-rotation.
2. Decide whether the already-tracked history needs to be purged
   (`git filter-repo` + coordinated force-push) — a separate, explicitly
   authorized, destructive action per repository governance
   (`.claude/rules/governance.md`: "No direct push or merge to main without
   human approval").
3. Re-run a secret-pattern scan after rotation + any history action to confirm
   closure; record the result against BLK-P25-010.

## Status

Evidence prepared; redaction landed to prevent recurrence. Rotation and any
history remediation remain **OPEN**, owned outside this task's authorized
scope, exactly as this task's authorization required.

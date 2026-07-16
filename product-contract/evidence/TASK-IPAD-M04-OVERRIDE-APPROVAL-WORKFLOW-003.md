# Governed iPad geofence-override approval workflow

- Task: `TASK-IPAD-M04-OVERRIDE-APPROVAL-WORKFLOW-003`
- Source implementation: `62916ee` on `codex/ipad/m04-geofence-policy-promotion-002`
- Gate: G11 hardening
- Approval: `HUMAN_APPROVALS.yaml#IPAD-GEO-OVERRIDE-APPROVAL-WORKFLOW`
- Scope: P06A · `MVP1-M04-039`, `MVP1-M04-043`, `MVP1-M04-045`, `MVP1-M08-013` · `SCR-IPAD-620`, `SCR-WEB-500`, `SCR-ADM-070` · `ENG-06`, `ENG-08`, `ENG-11` · `AC-0152..AC-0156`

## Sponsor-approved policy implemented

1. Only the existing Operations approver group (Operations Supervisor or
   Manager) may decide. The requesting inspector is explicitly refused.
2. A request carries a controlled reason code, a mandatory explanation and the
   immutable outside-fence GPS/time. A photo is required unless the selected
   safety/security condition makes capture unsafe.
3. One active journey permits one arrival attempt; the request expires after
   30 minutes and is expired sooner when the visit closes.
4. Offline use queues the real outside check-in, evidence and request in that
   order. It never creates an arrival, approval or unlocked check-in locally.

## Delivered controls

- Forward-only migrations add a committed `geo_override` evidence enum value,
  an RLS-protected request object, immutable audit trigger, controlled reason
  configuration, request/decision RPCs, deadline materialization and a
  visit-close expiry trigger.
- The request RPC derives coordinates, accuracy, distance and timestamp from
  the immutable check-in event. It rejects another inspector, a non-active
  journey, an inside-fence or unrelated event, an unknown reason, missing
  photo evidence, and any direct replay outside the governed flow.
- The decision RPC is the sole approval path. It checks the Operations role,
  blocks self-decision, re-checks evidence and expiry under lock, writes an
  immutable override event and makes the guarded `on_the_way → arrived`
  transition atomically.
- The iPad captures a request rather than a local override, resumes queued
  offline work safely, waits for online Operations approval and refreshes the
  server-authoritative result. Operations receives a queue with captured facts,
  evidence link, approve/reject controls and a mandatory rejection reason.

## Verification

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npx playwright test --config=playwright.static.config.ts` | PASS — 3/3 source contracts |
| `git diff --check` | PASS |
| Normal authenticated browser run | BLOCKED — the clean worktree has no Supabase URL/key, so auth setup cannot begin |
| Local database migration/RLS fixture | BLOCKED — no Supabase project configuration or running local PostgreSQL/Docker daemon |
| Shared remote migration apply | NOT ATTEMPTED — remote migration history/access must be reconciled; no blind DDL application |

## Certification boundary

This is a source-verified, review-ready implementation. It is not a claim that
the migration has been applied to the shared database or that an authenticated
multi-persona runtime journey has passed. The controlled next step is to repair
the remote migration-history/access path, apply the two forward migrations in a
staging or approved shared environment, then run inspector/Operations RLS and
offline-reconnect acceptance scenarios before production promotion.

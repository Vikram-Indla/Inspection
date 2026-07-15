# CD-043 / SCR-VIR-720 · Design-to-Live Wiring Closure

**Slice:** TASK-BASELINE-WIRING-AUDIT-001 · P06B Provider-Neutral Virtual Inspection Session
**Date:** 2026-07-15 · **Branch:** feat/admin-control-plane
**Design source:** `outputs/cd-043-r2/CD-043_SCR-VIR-720_r2.dc.html` (Claude Design R2 package, imported from ZIP)
**Route:** `/virtual/:id` (inspector-operated Room)

## Finding: proven boundary already live

CD-043 rides the **same `/virtual/:id` surface** CD-041 built. The design's own
`source-receipt.md` (row 8) and `runtime-truth-ledger.md` (A2–A7) name the live
`Room.tsx` / `actions.ts` as the contract they restate. Already wired before this
slice: `beginRemote` (verified/in_progress guard, frozen-package inspection,
begin event, redirect to `/field/inspection/:id`), `closeSession` (mandatory
reason, immutable), CD-042 verification gate, provider-pending bounded room,
append-only timeline. **No new server contract was invented.**

## Closures implemented this slice (additive, proven-backed)

| State | Closure | Files |
|-------|---------|-------|
| **S12** closed / read-only | Explicit `ax-banner--immutable` (🔒) — reason preserved; closing ≠ submission; hand-off to engine → P08 | `Room.tsx`, `page.tsx` (strings) |
| **S15** offline | Client `navigator.onLine` banner; begin/reschedule/close disabled; "nothing queued, no reconnection promised" | `Room.tsx`, `page.tsx` |
| **S13** stale / concurrent | Optimistic-concurrency rev token `state:timelineLength` submitted with each mutation; server refuses on mismatch (`STALE`) **before any write**; reload affordance | `actions.ts` (beginRemote, closeSession, rescheduleSession), `Room.tsx`, `page.tsx` |
| **S08** loading | Route-level `loading.tsx` skeleton over the genuine async session read | `loading.tsx` (new) |
| **S20** route reconciliation | Catalogue `SCR-VIR-720` amended `/virtual/sessions/:id` → `/virtual/:id` (runtime is canonical; no third route, no silent redirect) | `screen_route_catalogue.csv:39` |

**S13 note:** no schema change. `virtual_sessions` has no `updated_at`; `state` +
append-only `timeline` length is already server-authoritative, and beginRemote/
closeSession were already forward-only/immutable on `state`. The rev check adds
honest UI feedback for a concurrent change; it never fabricates a conflict.

## Blocked seams — NOT shipped (surfaced only)

Per `implementation-handoff.md` §7 and `runtime-truth-ledger.md` §B, these remain
labelled hand-offs and were **not** implemented as live:
`HANDOFF_BLOCKED_PROVIDER_ADAPTER`, `_PROVIDER_SELECTION`,
`_REMOTE_EVIDENCE_CAPTURE`, `_MEDIA_CUSTODY`, `_CONTINUITY_PREVIEW_SEAM`,
`_PHYSICAL_FOLLOW_UP_SEAM`, `_CLOSE_NOTIFICATION_CONTRACT`. No provider control,
no live checklist/evidence read, no invented "opened on shared engine" event, no
"physical follow-up recorded" claim, no live state-changed-vs-notification-degraded
close outcome. R1 failure modes were not reintroduced.

## Change control

- **Catalogue route amendment (S20):** frozen-artifact edit authorized by sponsor
  decision (Vikram Indla, 2026-07-15) under TASK-BASELINE-WIRING-AUDIT-001:
  "Keep /virtual/:id, amend catalogue." Downstream: no other artifact referenced
  `/virtual/sessions/:id` in code (runtime already served `/virtual/:id`).

## Verification

- `tsc -p apps/web/tsconfig.json --noEmit` → **No errors found**.
- `next lint` (full app) → **0 errors / 0 warnings**.
- Color-law grep on all four changed files → clean (ADS tokens only; reused
  `ax-banner`, `ax-banner--immutable`, `ax-skeleton`, `ax-btn`).
- **E2E authored:** `apps/web/e2e/cd-043-virtual-boundary-states.spec.ts` — driven
  coverage for S12 (closed read-only, no mutating control), S13 (rev-mismatch
  refuses close before any write + reload prompt; asserts session not closed),
  S15 (offline disables begin/close + banner, recovery on reconnect). Follows the
  cd-041 sacrificial-fixture + persona-JWT/RLS pattern.
- **E2E not yet run:** the suite (and `cd-041/042`) requires a Supabase test DB,
  which is parked (no token / test project). `playwright --list` discovers all 3
  tests and they typecheck; **runtime pass is PENDING** the test DB.

## DEC-012

Independent recorded wiring audit **DONE** — see
`CD-043_DEC-012_INDEPENDENT_WIRING_AUDIT_2026-07-15.md`. Verdict
**ACCEPT-WITH-FIXES** by an independent reviewer (not the implementer).

- **Finding 1 (MEDIUM, reschedule STM-VIR TOCTOU): FIXED** — CAS `.in("state",
  ["scheduled","waiting"])` added to the reschedule UPDATE in `actions.ts`.
- **Finding 2 (LOW, gate): OPEN** — e2e runtime pass still PENDING the Supabase
  test DB; slice not marked accepted until S12/S13/S15 pass live.
- Finding 3: cosmetic, no action (🔒 is a CSS `::before` glyph, renders fine).

# CD-043 / SCR-VIR-720 · DEC-012 Independent Wiring Audit (audit of record)

**Slice:** TASK-BASELINE-WIRING-AUDIT-001 · CD-043 · SCR-VIR-720 · P06B
**Commit audited:** 81ba156 (`feat(virtual): CD-043 SCR-VIR-720 D2L boundary-state closures`)
**Date:** 2026-07-15
**Auditor:** independent reviewer agent — adversarial, did **not** implement the change;
verified against actual code + migrations, not the commit message or the
implementer's self-note. Satisfies DEC-012's "implementation/self-review is not
sufficient" requirement.

## Verdict: ACCEPT-WITH-FIXES

Core finding: the DEC-012 claims hold as written. The S13 rev check is genuinely
placed before every write; the rev token is server-authoritative and computed
identically on both sides (page and actions both read the `timeline` jsonb
column — no divergent events source); S12/S15/S08 are correctly and honestly
wired; no blocked seam leaked as a live control; CD-041 behaviour is not weakened;
the e2e proves the S13 write is absent (not just the banner).

## Per-item verdict

| Item | Verdict | Evidence |
|---|---|---|
| PROVEN-intact (beginRemote/closeSession/verified gate/bounded room) | PASS | actions.ts begin guard + forward-only CAS + single begin event + redirect; close reason-mandatory + closed-immutable; markSessionVerified unchanged; room static `role="img"` placeholder |
| S12 closed/read-only | PASS | `open = state!=="closed"`; immutable banner `{!open}`; every mutating affordance gated on `open` (primary/reschedule/close/join/OTP); DB-enforced by guard_virtual_transition (0018) |
| S13 stale/concurrent | PASS (with Finding 1 on reschedule) | rev check before write in all three actions; token source consistent; empty-rev fails open safely |
| S15 offline | PASS | navigator.onLine listeners; begin/reschedule/close disabled offline; banner; "nothing queued / no reconnection" copy; client-only disable is honest (offline browser can't reach server) |
| S08 loading | PASS | static legacy-skeleton over the genuine async session read; no fabricated progress |
| Blocked seams surfaced-only | PASS | no provider/media/capture control; no live checklist/evidence read; closed-handoff copy invents no capability |
| e2e soundness | PASS (authored, unrun) | S13 re-reads server state, asserts `after.state !== "closed"`; selectors match live DOM; runtime PENDING test DB |
| CD-041 regression | PASS | errors-banner rewrite behaviour-preserving; oks unchanged; added `timeline` selects are additive; verified gate untouched |

## Findings

**Finding 1 — MEDIUM — reschedule S13 refusal was not race-safe (STM-VIR TOCTOU).**
`rescheduleSession` updated `appointment_at` with no state CAS filter; the STM-VIR
guard allows updates where `new.state = old.state`, so an appointment-only write
could land on an already-joined session if a concurrent join advanced it between
the SELECT and the UPDATE — violating the accepted "reschedule only before join"
rule. The rev check narrowed but did not close it.
**Disposition: FIXED** in follow-up commit — added
`.in("state", ["scheduled","waiting"])` CAS to the reschedule UPDATE (mirrors
`openWaitingRoom`); a race now loses the row and the reschedule is refused.

**Finding 2 — LOW (completion gate) — e2e execution.**
**RESOLVED** — `cd-043-virtual-boundary-states.spec.ts` run 2026-07-15 against the
configured live project (`iiozvqntawxfwbgffzqu`) over the local production build:
**6 passed** (3 persona setup + S12/S13/S15). S13 proved the concurrent-change
close is refused before any write (`state != closed` on re-read). Slice is now
runtime-evidenced.

**Finding 3 — COSMETIC — no action.** Auditor flagged a missing 🔒 glyph in the
immutable banner markup. Not a defect: the glyph is supplied by CSS
`.legacy-banner--immutable::before { content: "🔒" }` (retired-predecessor.css:288) and renders at
runtime. Offline/stale banners share `.legacy-banner--warning` disambiguated by text
(acceptable). Join/OTP not disabled offline — outside the S15-named
begin/reschedule/close scope, not a violation.

## Residual gate to acceptance
- Finding 1: **closed** (CAS fix committed, 503a56c).
- Finding 2: **closed** — e2e executed live, 6 passed (2026-07-15).
- **No residual gates. Slice is implementation-complete, independently audited,
  fix-remediated, and runtime-evidenced.**

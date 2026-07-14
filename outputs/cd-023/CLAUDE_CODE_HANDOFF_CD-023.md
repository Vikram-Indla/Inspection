# CLAUDE_CODE_HANDOFF_CD-023

> **SUPERSEDED IMPLEMENTATION BRIEF — historical design context only.**
> The pre-remediation Planner-only, required-region/city, +8h window,
> sequential-write/partial-ledger, three-reason, and cancel-unassigned claims
> below are not current runtime authority. Use IMPLEMENTATION_MANIFEST_CD-023.yaml,
> WIRING_MAP_CD-023.csv, ACCEPTANCE_CHECKLIST_CD-023.md, and the current source.
> CD-023 is implemented and remediated but still awaits migration 20260714060935,
> coherent regression, and a fresh independent DEC-012 Codex audit.

Design-only package for SCR-WEB-130 (/planning/immediate). Do NOT implement until sponsor approval and the independent Codex wiring audit are recorded.

## Read first
- Canvas section CD-023 (frames 3a-3i) in "CD-021 Bulk Targeting.dc.html" + 6 PNGs in outputs/cd-023/
- IMPLEMENTATION_MANIFEST_CD-023.yaml · WIRING_MAP_CD-023.csv · ACCEPTANCE_CHECKLIST_CD-023.md

## Design thesis (selected: compact authority-bar flow)
Speed through hierarchy, prefilled verified context and progressive disclosure — never removed controls. The Minimum Viable Authority Bar keeps all nine protections visible, individually focusable and individually explained in every state and viewport. Urgency is an operational state: Saqeel tokens throughout, amber only for degraded truths, no red theatre.

## Confirmed runtime defects (do not normalize)
1. Temp factory hard-codes region:"Riyadh", captures no city → design requires planner-selected region + city.
2. Assignment insert error UNCHECKED → today an assignment failure yields a published, unassigned visit that looks successful. Design: checked step ledger (3f), retry-by-visit-id.
3. 4 sequential writes, no transaction → orphan temp factory possible; accounted for explicitly in 3f; atomicity RPC = HANDOFF_BLOCKED.
4. No duplicate/retry protection; visit born published with no M02-012 check → retry keyed to created ids; exact-CR match blocks temp-entity duplication.
5. Raw e.message exposed → catalogued neutral copy.
6. No work preservation (uncontrolled inputs, no resetKey) → adopt the Wizard/BulkForm pattern.
7. Coordinates prefilled to Riyadh center → removed; location must be an explicit act.

## Authority truths
- "Specifically authorized Inspector" has NO runtime mechanism (rbac/shell grant /planning to planner only). Designed as role-chip variant only; activates only if governance defines the grant. HANDOFF_BLOCKED — no override role or bypass switch invented.
- Priority: no approved value list exists → stays optional free text, truth-labelled; enum HANDOFF_BLOCKED.
- Urgency reasons: exactly the 3 governed enum values; no free text.
- Notification: insert row = "queued"; delivery never claimed (ENG-11 providers are a known gap).

## Locked baselines
Shared shell (frozen), RBAC/RLS, canonical transitions, append-only audit, M01-044..050, urgent default window, auto-assign + candidates audit, Saqeel tokens, Arabic-first RTL, dark/light parity.

## A11y/RTL contract (DSG-A11Y-001)
Authority bar = labelled group, roving tabindex, Enter jumps to owning control; assertive protection/validation/step announcements; first-error focus transfer; >=48px targets, 16px inputs; glyph+text status; bdi-isolated CRs/coordinates/times; no horizontal overflow at 420px; reduced motion disables chip transitions and map fly-to.

## Self-criticism (5 passes)
1 Coverage: 32 states mapped across 3a/3d/3e/3f/3g/3h/3i + board. 2 Domain: regulatory dispatch language (temporary flagged entity, reconciliation queue, no-plan bypass M01-050, geofence) — not ticket escalation. 3 Differentiation: the authority bar is governance-as-UI; ambulance-dispatch or scheduling tools have no equivalent of "protections that cannot be switched off" — genericity test fails deliberately. 4 Family: reuses CD-021/022 ledger, chip and identity-card grammar on the same tokens. 5 Fit: the bar derives from existing validation state; every fix maps to a named file change; nothing invented (no thresholds, capacity limits, priority values, override roles).

READY_FOR_DESIGN_REVIEW

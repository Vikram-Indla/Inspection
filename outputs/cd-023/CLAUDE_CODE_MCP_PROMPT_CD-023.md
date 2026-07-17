# CLAUDE CODE IMPLEMENTATION PROMPT — CD-023 / SCR-WEB-130

> **SUPERSEDED — DO NOT EXECUTE THIS ORIGINAL PROMPT.**
> Its Planner-only, three-reason, +8h and partial-ledger assumptions were
> replaced by source-authoritative atomic Planner/Inspector runtime behavior.
> Continue only from IMPLEMENTATION_MANIFEST_CD-023.yaml,
> WIRING_MAP_CD-023.csv, ACCEPTANCE_CHECKLIST_CD-023.md, and the current slice.

Use the claude_code MCP to implement the sponsor-approved CD-023 design for Saqeel MVP1.

This is IMPLEMENTATION of an approved design only. Do not redesign, reinterpret or expand scope. This slice is security-sensitive: urgency must never bypass governance.

## PRECONDITIONS — verify before writing any code

1. Confirm sponsor approval of CD-023 (frames 3a–3i) is recorded. If not, STOP and return `BLOCKED_NO_SPONSOR_APPROVAL`.
2. Confirm the independent Codex wiring audit of `outputs/cd-023/WIRING_MAP_CD-023.csv` is recorded. If not, STOP and return `BLOCKED_NO_CODEX_AUDIT`.
3. Record source branch, source commit and dirty-worktree state at start (manifest carries `UNVERIFIED_HANDOFF_BLOCKED`). Work on `feat/cd-023-immediate-authority-bar`; never touch `main`.
4. Do not overwrite concurrent work (CD-020/021/022 areas, dashboard slice).

## TASK

Implement Immediate Visit Planning with the Minimum Viable Authority Bar.

- Screen: SCR-WEB-130 · Route: /planning/immediate · Persona: Planner (Inspector grant = HANDOFF_BLOCKED, see below)
- Journey: P01 · Engines: ENG-03, ENG-05, ENG-06, ENG-12 · Acceptance: DSG-018, DSG-A11Y-001
- Repository area: apps/web/src/app/planning/immediate

## MANDATORY INPUTS — read in this order

1. AGENTS.md, product-contract/00_START_HERE.md, CURRENT_STATE.md, GATE_STATUS.md, execution/CURRENT_SLICE.yaml, governance/OPEN_DECISIONS.yaml
2. design/claude-design-mvp1/00_START_HERE.md and CURRENT_UI_BASELINE.md
3. design/claude-design-mvp1/authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md
4. The CD-023 design package (authoritative for this task):
   - outputs/cd-023/IMPLEMENTATION_MANIFEST_CD-023.yaml  (file_changes = exact scope; confirmed_runtime_defects = must-fix list)
   - outputs/cd-023/COMPONENT_MAP_CD-023.csv
   - outputs/cd-023/CLAUDE_CODE_HANDOFF_CD-023.md
   - outputs/cd-023/WIRING_MAP_CD-023.csv
   - outputs/cd-023/ACCEPTANCE_CHECKLIST_CD-023.md
   - PNGs: CD-023_SCR-WEB-130_{primary,unregistered,unauthorized,partial_failure,ar_rtl,narrow}.png
   - Design canvas frames 3a–3i in "CD-021 Bulk Targeting.dc.html"
5. Runtime files you will change: apps/web/src/app/planning/immediate/{page.tsx, ImmediateForm.tsx, actions.ts}; read-only: GeoMap.tsx, lib/notify.ts, tokens.css, state_transitions.csv, error_catalogue.csv.

## CONFIRMED RUNTIME DEFECTS — every one must be fixed in this slice

1. `actions.ts` hard-codes `region:"Riyadh"` on the temporary-factory path and captures no city → region + city become REQUIRED planner inputs (option lists from existing factories values; no new source).
2. The `assignments` insert error is UNCHECKED — flow notifies and redirects even when assignment failed → check the result; on failure return the structured step state (visit exists, unassigned) instead of continuing.
3. 4 sequential writes, no transaction → implement the truthful step ledger (3f); orphan temporary factories are accounted for explicitly, never hidden.
4. No duplicate/retry protection → retry is keyed to already-created ids (temp factory + visit) and never duplicates; an exact registered CR match refuses temporary-entity creation.
5. Raw `e.message` reaches the UI → catalogued neutral copy only; raw errors logged server-side.
6. `ImmediateForm` lacks work preservation → adopt the controlled-inputs + resetKey pattern from Wizard.tsx/BulkForm.tsx.
7. lat/lng prefill Riyadh center (24.7136/46.6753) → remove all coordinate prefill; location must be an explicit pin-drop or typed pair (both, range-validated).

## SCOPE — exactly the manifest's file_changes

A. `page.tsx` — UPDATE: region/city option lists for the temporary path; registry freshness only if a governed field exists (else omit).
B. `ImmediateForm.tsx` — UPDATE: authority-bar composition; explicit Registered/Unregistered toggle (no auto-switch); registered identity preview card; required region+city on temporary path; no coordinate prefill; consequence summary beside dispatch; work preservation; narrow 9-dot strip.
C. `AuthorityBar.tsx` — CREATE: nine protection chips (AUTHORIZED, REASON, IDENTITY, LOCATION, PACKAGE, INSPECTOR, WINDOW, AUDIT, NOTIFY) deriving ENTIRELY from existing validation state — no new policy objects. Chip states: ✓ satisfied (evidence named) / ✕ blocking (Enter jumps to owning control) / ◌ truth-labelled (e.g. "NOTIFY · queued — delivery unproven"). Roving tabindex in a labelled group; assertive announcements; never a progress meter or percentage.
D. `actions.ts` — UPDATE: defects 1–5 above; structured step results; retry variant that re-checks existing ids before any insert; refuse temp entity on exact registered CR match. Cancel of an unassigned visit goes through the canonical cancellation transition only.
E. REMOVE: nothing (requires separate human approval; none granted).

## HANDOFF_BLOCKED LEGS — do not implement without a recorded decision

- Atomicity/compensation RPC (backend decision) — implement the truthful ledger over sequential writes; do not fake atomicity.
- "Specifically authorized Inspector" grant — NO mechanism exists in rbac_matrix/user_roles/route. Do NOT invent an override role, permission flag or bypass switch. Inspectors continue to see the unauthorized state (3e). The role-chip variant activates only if governance defines the grant.
- Approved priority value list — none exists. Priority stays optional free text, truth-labelled in UI. Do not invent values.
- Temporary-entity reconciliation queue surface — does not exist; keep the flagged-entity note without claiming a queue.
List any still-undecided leg in the completion report as `HANDOFF_BLOCKED_REMAINS`.

## PROTECTED BEHAVIOR — never weaken

RLS/RBAC as the boundary; canonical transitions only (no direct status mutation); append-only audit; the 3 governed urgency enum values (no free-text urgency); M01-044..050 gates verbatim; urgent default window now→+8h with the both-or-neither rule (M01-047); auto-assign availability check + candidates audit JSON (M01-048); notification insert = "queued", delivery never claimed; frozen shared shell untouched; no location accuracy thresholds, capacity limits or confidence scores; no red emergency theatre — Saqeel tokens, amber only for degraded truths.

## ARABIC / ACCESSIBILITY (DSG-A11Y-001)

Document-level RTL untouched; authority bar mirrors with bdi-isolated CRs/coordinates/times inside Arabic labels; logical properties only; assertive protection/validation/step-failure announcements, polite search/availability counts; first-error focus transfer; ≥48px targets; 16px inputs; glyph+text chip states (never color alone); 420px no horizontal overflow (9-dot strip + expanded blocking chip); reduced motion disables chip transitions and map fly-to. Tokens from tokens.css only.

## TESTS AND EVIDENCE — required before completion

- TypeScript typecheck PASS; production build PASS.
- New Playwright coverage: authority-bar chip navigation (focus, Enter-jump, announcements); temporary path requires region+city; no coordinate prefill; exact-CR refusal; forced failure at EACH write (temp factory / visit / assignment / notification) yields the correct ledger state; retry idempotence (no second visit/temp factory); unassigned-visit cancel via canonical transition; work preservation on blocked create and transport failure; unauthorized state for non-planner roles; no raw provider text in DOM.
- Full existing regression suite PASS.
- Visual evidence: dark/light × EN/AR × desktop/narrow matching the six design PNGs, under ${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/immediate-v2/.
- Reconcile DSG-018 and DSG-A11Y-001 acceptance rows; update CURRENT_STATE.md, SESSION_LEDGER.json and the acceptance checklist with per-item results.

## COMPLETION

Do not self-approve, commit to main, push, merge or deploy. Return a completion report: branch, commit, dirty-worktree state, file-by-file diff summary vs the manifest, defect-by-defect fix evidence (1–7 above), test results, evidence paths, and `HANDOFF_BLOCKED_REMAINS` items.

Finish with: READY_FOR_SPONSOR_RUNTIME_ACCEPTANCE

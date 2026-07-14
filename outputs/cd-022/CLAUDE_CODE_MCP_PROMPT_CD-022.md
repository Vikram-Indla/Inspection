# CLAUDE CODE IMPLEMENTATION PROMPT — CD-022 / SCR-WEB-120

Use the claude_code MCP to implement the sponsor-approved CD-022 design for Saqeel MVP1.

This is IMPLEMENTATION of an approved design only. Do not redesign, reinterpret or expand scope.

## PRECONDITIONS — verify before writing any code

1. Confirm sponsor approval of CD-022 (frames 2a–2h) is recorded. If not recorded, STOP and return `BLOCKED_NO_SPONSOR_APPROVAL`.
2. Confirm the independent Codex wiring audit of `outputs/cd-022/WIRING_MAP_CD-022.csv` is recorded. If not, STOP and return `BLOCKED_NO_CODEX_AUDIT`.
3. Record source branch, source commit and dirty-worktree state at start (the design manifest carries `UNVERIFIED_HANDOFF_BLOCKED` for these — you must resolve them now). Work on a new branch `feat/cd-022-single-identity-lens`; never touch `main`.
4. Do not overwrite concurrent work (CD-020/CD-021/CD-023 areas, dashboard slice).

## TASK

Implement the Identity Confidence Lens for Single Visit Planning.

- Screen: SCR-WEB-120 · Route: /planning/single · Persona: Planner
- Journey: P01 · Engines: ENG-04, ENG-05, ENG-06 · Acceptance: DSG-017, DSG-A11Y-001
- Repository area: apps/web/src/app/planning/single

## MANDATORY INPUTS — read in this order

1. AGENTS.md, product-contract/00_START_HERE.md, CURRENT_STATE.md, GATE_STATUS.md, execution/CURRENT_SLICE.yaml, governance/OPEN_DECISIONS.yaml
2. design/claude-design-mvp1/00_START_HERE.md and CURRENT_UI_BASELINE.md
3. design/claude-design-mvp1/authority/SHARED_SHELL_BUSINESS_TAB_CONTRACT_V1.md
4. The CD-022 design package (authoritative for this task):
   - outputs/cd-022/IMPLEMENTATION_MANIFEST_CD-022.yaml  (file_changes = the exact scope)
   - outputs/cd-022/COMPONENT_MAP_CD-022.csv             (dispositions)
   - outputs/cd-022/CLAUDE_CODE_HANDOFF_CD-022.md        (thesis + hard truths)
   - outputs/cd-022/WIRING_MAP_CD-022.csv                (every action/state leg)
   - outputs/cd-022/ACCEPTANCE_CHECKLIST_CD-022.md       (exit criteria)
   - PNGs: CD-022_SCR-WEB-120_{primary,outlier,partial_failure,ar_rtl,narrow}.png
   - Design canvas frames 2a–2h in "CD-021 Bulk Targeting.dc.html"
5. Runtime files you will change: apps/web/src/app/planning/single/{page.tsx, Wizard.tsx, actions.ts} and apps/web/src/components/GeoMap.tsx (read-only), tokens.css (read-only).

## SCOPE — exactly the manifest's file_changes

A. `page.tsx` — UPDATE
- Server-side identifier search (CR, factory_code, license_number, **name** — name search is new).
- Graded results by RULE, never score: EXACT = governed identifier equality; SIMILAR NAME (identifiers differ — return the differing identifier); DEGRADED (missing license/coordinates).
- Duplicate/overlap read at selection time using the IDENTICAL visits query the publish gate uses (one query, two call sites).
- Expose registry sync freshness ONLY if a governed field exists; otherwise omit (do not invent — HANDOFF_BLOCKED in manifest).

B. `Wizard.tsx` — UPDATE (dossier composition)
- Comparison rail (nothing pre-selected; explicit dossier open), IdentityDossier (new component, see C), progressive configuration column unlocked by license + location confirmation, readiness chips, publish stepper.
- PRESERVE VERBATIM: M01-036 license gate; M01-038 location confirm + planner-pin semantics (planner pin never edits registry); M03-011 mode eligibility incl. auto-switch effect; M01-040 availability; controlled inputs + resetKey work-preservation pattern.

C. `IdentityDossier.tsx` — CREATE
- Identifier grid (bdi-isolated LTR values), provenance row, GeoMap official/planner pins with Map/Text toggle (text equivalent mandatory), risk context labelled "ENG-04 v1 · advisory", visit history + duplicate/overlap guard, Factory 360 deep link.

D. `actions.ts` — UPDATE
- Replace raw `e.message` with catalogued neutral copy (error_catalogue.csv); log raw errors server-side only.
- Return structured step-level results {step, done, failed} powering the 2e stepper.
- Resumable retry keyed by visit_plan_id — retry must NEVER create a second visit.
- All existing validation blockers preserved verbatim; success redirect unchanged.

E. REMOVE: nothing. (REMOVE requires separate human approval; none granted.)

## HANDOFF_BLOCKED LEGS — do not implement without a recorded decision

- True atomicity (Postgres RPC/transaction wrapping plan→visit→assignment→publish) — backend decision. If undecided, implement the truthful step-ledger UI over the existing sequential writes; do not fake atomicity.
- Registry sync-timestamp source; discard-draft action (must use the canonical cancellation transition if built); CD-020/CD-021 family baselines.
If any blocked leg is still undecided, implement around it truthfully and list it in the completion report as `HANDOFF_BLOCKED_REMAINS`.

## PROTECTED BEHAVIOR — never weaken

RLS/RBAC as the authorization boundary; canonical state transitions only; append-only audit; M02-012 duplicate rule; no confidence percentages; no silent result preference; no name-based merging; no factory creation from this flow (unregistered → Immediate Visit M01-045); notifications described as "queued", never "delivered"; official location stays GIS-Admin-owned; frozen shared shell untouched; raw provider/Supabase errors never reach the DOM; entered work preserved on every validation/transport failure.

## ARABIC / ACCESSIBILITY (DSG-A11Y-001)

Document-level RTL untouched; Arabic-primary entity names with LTR secondary line; bdi-isolated CR/license/coords/dates; logical properties only; results as listbox with graded aria-live announcement; assertive duplicate/overlap/failure announcements; focus transfer to first blocking error; ≥48px targets; 16px inputs; glyph+text status; 420px no horizontal overflow; reduced-motion selection continuity. Tokens from tokens.css only — no new raw values.

## TESTS AND EVIDENCE — required before completion

- TypeScript typecheck PASS; production build PASS.
- New Playwright coverage: grading rules (exact/similar/degraded); name search; duplicate-at-selection parity with publish; keyboard-only end-to-end flow; focus transfer; work preservation on blocked publish; forced mid-step publish failure leaves a consistent draft; retry idempotence; no raw provider text in DOM.
- Full existing regression suite PASS.
- Visual evidence: dark/light × EN/AR × desktop/narrow screenshots matching the five design PNGs, stored under product-contract/evidence/screens/single-v2/.
- Reconcile DSG-017 and DSG-A11Y-001 rows in the design acceptance matrix; update CURRENT_STATE.md, SESSION_LEDGER.json and the acceptance checklist with per-item results.

## COMPLETION

Do not self-approve, commit to main, push, merge or deploy. Return a completion report containing: branch, commit, dirty-worktree state, file-by-file diff summary against the manifest, test results, evidence paths, and any `HANDOFF_BLOCKED_REMAINS` items.

Finish with: READY_FOR_SPONSOR_RUNTIME_ACCEPTANCE

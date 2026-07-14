# Independent Codex Wiring Audit — CD-022 (pre-implementation)

- reviewer: Claude Code (this session) — independent of any CD-022 implementation (none exists yet; `apps/web/src/app/planning/single/*` is unmodified by this reviewer)
- date: 2026-07-13
- branch: `feat/cd-023-immediate-authority-bar` (audit is read-only against `main`-equivalent unmodified `planning/single` code; no CD-022 branch exists yet)
- scope note: CD-022 has NOT been implemented. `outputs/cd-022/WIRING_MAP_CD-022.csv` describes intended wiring *and* makes factual claims about the CURRENT (pre-CD-022) runtime as its baseline. This audit checks those baseline claims against the actual current code in `apps/web/src/app/planning/single/{page.tsx,Wizard.tsx,actions.ts}` — it verifies the design's foundation is honest, not that an implementation matches it (there is no implementation to check yet).
- verdict: **PASS on baseline-claim accuracy (9/9 checkable rows confirmed accurate)** — this satisfies the pre-implementation half of DEC-012 due diligence for CD-022. **A second, post-implementation audit is still required once CD-022 code actually exists** (same principle DEC-012 applies to CD-021/023) — this PASS does not carry forward automatically to a future implementation.

## Per-row verification

| Wiring row | Claim | Verdict | Evidence |
|---|---|---|---|
| Type identifier query | Today's search is client-side, filters CR/factory_code/license_number only, min 3 chars, no name field ("name = NEW leg") | **CONFIRMED ACCURATE** | `Wizard.tsx:80-84` — `searching = query.length >= 3`; `matches = factories.filter(f => cr_number.includes \|\| factory_code.includes \|\| license_number.includes)`. No `name` comparison anywhere. `page.tsx:12` fetches ALL factories unpaginated with no `is_temporary` filter — confirms the "client-side filter over full table" framing. |
| Open dossier / duplicate-at-selection | No selection-time duplicate/overlap read exists today; only a publish-time check in `actions.ts` ("DESIGN-NEW read; publish-time query exists in actions.ts") | **CONFIRMED ACCURATE** | `Wizard.tsx` radio `onChange={() => setFactory(f)}` is pure client state, no server call. The only duplicate-visit read in the whole feature is `actions.ts:63-68` (`M02-012` check), which runs only inside `publishSingleVisit`. |
| Confirm industrial license | License must equal `factories.license_number` (M01-036) | **CONFIRMED ACCURATE** | `actions.ts:35` — `if (fac?.license_number && license_number !== fac.license_number) blockers.push(...)`. |
| Confirm location / planner pin | M01-038 both-coords rule; confirm checkbox required | **CONFIRMED ACCURATE** | `actions.ts:37-42,55`; `Wizard.tsx:168` renders the required checkbox. |
| Choose execution mode | M03-011 physical needs coords / virtual needs `engine_settings(otp)`, incl. auto-switch | **CONFIRMED ACCURATE** | `actions.ts:48-53` (server re-validation); `Wizard.tsx:96-104` (client auto-switch effect) and `:181-185` (disabled-option UI) both present and consistent with each other. |
| Pick/auto-assign inspector | Pool membership + overlapping-assignment check (M01-040) | **CONFIRMED ACCURATE** | `actions.ts:74-93` — pool from `user_roles`, overlap computed via `assignments` joined to `visits` on window intersection, auto vs. manual branches both re-validate. |
| Publish visit | Exact blocker list; 6 sequential writes, no transaction, raw `e.message` returned, atomicity HANDOFF_BLOCKED | **CONFIRMED ACCURATE — verbatim** | `actions.ts:69` blocker list matches the wiring row's list exactly (factory/license/location+confirm/mode/package ERR-PUB-001/inspector/window FLD-PLAN-005/duplicate M02-012). Writes counted at `:95,98,107,113,114,116` = exactly 6 (visit_plans insert, visits insert, assignments insert, visits update, visit_plans update, notifications insert). Each of lines 97/106/111/115 returns `{ error: e*.message }` — literal raw provider error text, confirming the "raw e.message returned" and "atomicity HANDOFF_BLOCKED (no txn/RPC)" claims precisely. |
| Discard draft | HANDOFF_BLOCKED — no discard action exists | **CONFIRMED ACCURATE** | `actions.ts` exports only `publishSingleVisit`; no cancel/discard function anywhere in the file. |
| Stale registry banner | HANDOFF_BLOCKED — no sync-timestamp field exposed on this screen | **CONFIRMED ACCURATE** | `page.tsx:12` factories select list has no `source_synced_at` (or equivalent) column; `Wizard.tsx` never references one. |
| Unauthorized access | RLS empty scope + role guard, existing shell tests | **PLAUSIBLE, not independently re-verified this pass** | Consistent with the standard shell-routing pattern used across CD-021/CD-023's equivalent rows; would require reading `shell-navigation.ts` and its test suite to fully confirm — not done in this pass, flagged rather than asserted as confirmed. |

## What this audit does NOT cover

- No implementation exists for CD-022 yet, so nothing was checked against the manifest's `file_changes` (server-side name search, graded EXACT/SIMILAR-NAME/DEGRADED results, `IdentityDossier.tsx`, structured step ledger, etc.) — there is no code there to audit.
- `automated_test` cells in the wiring map still all read `proposed` — correctly, since no tests exist for unbuilt code.
- This PASS is scoped to "the design's stated baseline is true today." It is not a substitute for the post-implementation audit DEC-012 requires once CD-022 is actually built — that audit must re-run against real code the same way it did for CD-021 and CD-023.

## Gate effect

Precondition 2 of `CLAUDE_CODE_MCP_PROMPT_CD-022.md` required "the independent Codex wiring audit of `outputs/cd-022/WIRING_MAP_CD-022.csv` is recorded." That is now recorded here, for what is currently auditable (the wiring map's factual claims about the runtime it will modify). Combined with the sponsor design approval recorded 2026-07-13 (`governance/HUMAN_APPROVALS.yaml`, gate `CD-022-design-approval`), **both stated preconditions for starting CD-022 implementation are now met.** A fresh, independent, post-implementation audit will still be required before CD-022 can be considered complete or closed — same rule already applied to CD-021 and CD-023.

# Independent Codex Wiring Audit — CD-023 Post-Live Remediation

- reviewer: OpenAI Codex `/root` (independent post-live review session; no CD-023 design or implementation authorship)
- date: 2026-07-14
- checklist: `product-contract/governance/CODEX_WIRING_AUDIT_CHECKLIST.md`
- target branch: `feat/cd-023-immediate-authority-bar`
- target commit: `7a01355` (`fix(cd-023): certify live immediate visits`)
- verdict: **FAIL**
- gate effect: DEC-012 remains open for CD-023. The slice returns to wiring-map/implementation reconciliation and may not close or unblock CD-024+ implementation.

## Outcome

The remediated runtime is materially stronger than the original design package:
Immediate Visit creation is atomic and idempotent, Planner and Inspector source
paths are present, Visit-level location provenance is persisted, assignment
overlap is serialized, notification delivery is not overstated, and the focused
live contract passed independently in this session.

The DEC-012 artifact itself did not move with that redesign.
`outputs/cd-023/WIRING_MAP_CD-023.csv` still describes the pre-remediation
Planner-only, sequential-write, partial-ledger implementation. It also leaves
every implementation row's `automated_test` cell as `proposed`. The checklist
explicitly says a `proposed` test is a gap and that each of the 13 columns must
match the current runtime. On that strict basis the map cannot receive a PASS.

## Independence and branch provenance

The shared checkout was on `feat/cd-022-single-identity-lens` with unrelated
dirty work. No branch switch, reset, cleanup, or application-code edit was made.
Instead, Git blob hashes were compared for all CD-023 application, focused-test,
migration, and database-contract files. Every compared worktree blob matched
`feat/cd-023-immediate-authority-bar` at `7a01355` exactly. This audit therefore
reviews the requested branch snapshot without overwriting concurrent work.

## Independent verification performed

- `npm run typecheck`: **PASS**.
- `npm run build`: **PASS**; `/planning/immediate` and `/field/[visitId]` compiled.
- focused live Playwright, excluding only the screenshot-writing case:
  **11/11 PASS** (3 persona setup + 8 CD-023 product tests). Covered blank
  coordinates/work preservation, minimum manual identity, Visit location and
  audit rows, package and duplicate blockers, same-request idempotency,
  Inspector-window serialization, source-identity serialization, Inspector
  self-create/no-notification/start handoff, and Arabic authority announcements.
- eight preserved EN/AR × dark/light × desktop/narrow PNGs: present, opened and
  visually inspected; desktop is 1280 px wide and narrow is 420 px wide.
- complete regression: **not independently available as PASS**. The handoff
  records the latest full attempt as non-clean because of concurrent CD-022 work.
- forced package-read/notification-write failures: the repeatable SQL contract
  contains these cases, but this session did not treat the implementation
  author's prior execution log as independent reproduction.

## Per-row 13-column audit

Every row below was checked across `client_component`, `server_action`,
`validation_guard`, `canonical_transition`, `table_rpc_storage`,
`rls_grant_role`, `audit_event`, `notification_side_effect`, `success_result`,
`negative_partial_result`, `automated_test`, `runtime_evidence`, and any
`HANDOFF_BLOCKED` claim.

| # | ui_trigger | verdict | evidence |
|---|---|---|---|
| 1 | Open `/planning/immediate` | **FAIL** | `page.tsx:20-46` authorizes both Planner and Inspector, loads `profiles` in addition to the three disclosed sources, and only rejects users with neither role. The map says `RLS; planner` and does not disclose the profile read. Its cited “existing shell tests” do not exercise a non-Planner/non-Inspector direct route; `persona-tours.spec.ts:12-17` checks only Planner link visibility. |
| 2 | Inspector persona access | **FAIL** | The row states no mechanism exists and that Inspector sees an unauthorized state. Current code does the opposite by source authority: `page.tsx:20-30`, `0027...sql:71-110,248-257`, and `0029...sql:24-61` authorize the ordinary Inspector role through the SECURITY INVOKER/RLS path. Independent Playwright `cd-023...spec.ts:247-266` passed self-assignment, no assignment notification, and `/field/:visitId` handoff. The `HANDOFF_BLOCKED` claim is no longer true. |
| 3 | Select urgency reason | **FAIL** | `ImmediateForm.tsx:241-249` offers three client values, but `0027...sql:272-275` enforces only non-empty text; a crafted request can submit any reason. The map's “enum of 3 governed values” is therefore not server-enforced. The value is stored in `visits.immediate_reason` (`0027...sql:445-455`), not “visit notes”; the row's storage cell says `none`. The visit INSERT audit captures the row, but the request audit deliberately omits the reason (`0027...sql:165-184`). `automated_test=proposed`. |
| 4 | Search registered factories | **FAIL** | `page.tsx:42-43` preloads all registered factories and `ImmediateForm.tsx:102-105,189-205` performs a flat client substring filter. There is no server search action, no graded result model, and fewer than two characters show the full list rather than enforcing the claimed guard. `automated_test=proposed`. |
| 5 | Toggle unregistered / capture temporary identity | **FAIL** | The runtime correctly follows the source, not the map: any of name/CR/licence/activity is sufficient (`ImmediateForm.tsx:110-111`; `0027...sql:311-317`) and region/city are optional (`page.tsx:69-77`; `0027...sql:370-379`). The map incorrectly claims name plus region plus city are required. Exact CR/licence refusal and factory audit are implemented (`0027...sql:318-379`, trigger at `:112-121`). The reconciliation-surface subleg remains truthfully unavailable, but the row still fails its other columns and says `automated_test=proposed`. |
| 6 | Drop/type location | **FAIL** | Typed coordinates and official-pin selection exist and are server range/provenance guarded (`ImmediateForm.tsx:107-123,259-277`; `actions.ts:95-100`; `0027...sql:263-270,340-353`). The current `GeoMap` use has no drop-pin handler, and the row's storage claim is wrong: coordinates are persisted on `visits.planner_lat/planner_lng/visit_location_source` (`0027...sql:445-455`), not on a temporary factory or as transient dispatch context. No tiles-down path is automated; `automated_test=proposed`. |
| 7 | Select package | **FAIL** | The runtime behavior is good: the RPC re-reads `package_versions` and accepts only published/locked (`0027...sql:280-286`); independent Playwright `:131-150` passed the unavailable-package blocker. The wiring cell still says `automated_test=proposed`, which the checklist defines as a closing gap, and it does not name the now-existing test. |
| 8 | Assign inspector | **FAIL** | Role-pool membership, overlap reads, candidate audit JSON, and the canonical write-time race guard are implemented (`0027...sql:398-463`; `0031...sql:7-58`). Independent Playwright `:183-216` proved two requests cannot claim the same Inspector window. The map still says `automated_test=proposed`, so its automation column is false/stale even though runtime behavior passed. |
| 9 | Set window | **FAIL** | The map claims `blank=default now→+8h`. Exact source and DEC-003 forbid that invented duration. Current code correctly requires an explicit ordered Planner window and gives Inspector a single start-now instant (`ImmediateForm.tsx:114-116,279-287`; `0027...sql:288-301`). The row therefore describes the opposite guard and still says `automated_test=proposed`. |
| 10 | Create & dispatch | **FAIL** | The map describes four sequential writes, a partial ledger, possible unassigned Visit, and Planner-only RLS. Current runtime calls one atomic SECURITY INVOKER RPC (`actions.ts:103-147`; `0027...sql:190-511`) for Planner or Inspector, redirects Planner to `/visits/:id` and Inspector to `/field/:id`, writes request/factory/Visit/assignment/notification audit legs, and rolls back on failure. The disclosed storage omits the RPC and `audit_events`; success/negative claims are obsolete; `automated_test` remains `proposed forced-failure suite`. |
| 11 | Retry after partial failure | **FAIL** | There is no `3f ledger` client component or resumable-variant action. Partial creation was structurally removed by the atomic RPC. Retry is automatic request-id replay under an advisory lock and unique indexes (`ImmediateForm.tsx:90-91,175`; `0027...sql:40-45,235-246`), independently proven at `cd-023...spec.ts:152-180`. That is stronger behavior, but it does not make the row's named component/action/result columns accurate; `automated_test=proposed` is also stale. |
| 12 | Cancel unassigned visit | **FAIL** | No cancellation trigger, `3f ledger`, or cancellation server action exists under `planning/immediate` (confirmed by repository search and the four runtime files). `STM-VIS-002` exists in `state_transitions.csv`, but it is not reachable from this claimed trigger. The row is not truthfully marked `HANDOFF_BLOCKED` and has no test. |

## Cross-cutting checks

| check | result | evidence |
|---|---|---|
| RLS / authorization boundary | **PASS in runtime; FAIL in map** | `create_immediate_visit` is SECURITY INVOKER (`0027...sql:190-215`) and role/RLS guards apply to both source-authorized actors. The map still says Planner-only. |
| Atomicity and idempotency | **PASS in runtime; FAIL in map** | Single transaction, request advisory lock, unique request/assignment guards, neutral exception result (`0027...sql:40-45,235-246,445-501`). Independent same-request and Inspector-window concurrency tests passed. |
| Raw provider/DB text | **PASS on creation action; residual FAIL downstream** | `actions.ts:134-143` logs raw detail server-side and returns neutral copy. The Inspector handoff's standard start path still appends `error.message` to the visible log at `field/[visitId]/Startup.tsx:299-303`, which violates the checklist's whole-slice raw-error rule when an inspection INSERT fails. |
| Notification truth | **PASS** | Planner creates one notification with `delivery_state='not_configured'`; Inspector self-create creates none (`0027...sql:465-474`). UI says queued/provider status and never claims delivery (`page.tsx:110-112,153`). |
| Non-color status | **PASS** | `AuthorityBar.tsx:19,62-92` uses glyph, text, accessible state label, and live announcement. Independent Arabic assertion passed. |
| No invented duration | **PASS in runtime; FAIL in map** | No +8h default remains; Planner window explicit, Inspector start-now instant. |
| Arabic/RTL evidence | **PASS for the narrow authority-bar contract** | Arabic chip labels/details and assertive announcement passed independently; eight RTL/theme/viewport frames exist. Several non-authority form strings still fall back to English in the preserved Arabic frames, so this audit does not certify whole-screen Arabic scope while DEC-004 remains open. |
| Complete regression | **FAIL / missing evidence** | No coherent post-remediation full-suite PASS is recorded or independently reproducible from the shared dirty checkout. |

## Required next action

1. Reconcile `WIRING_MAP_CD-023.csv` to the exact post-remediation runtime and
   source contract. Replace obsolete Planner-only, required-name/region/city,
   +8h, sequential-ledger, retry-ledger, and cancellation claims; disclose the
   RPC, Visit location columns, audit tables, both actor paths, and exact tests.
2. Resolve the urgency-reason contract. Either enforce the actually approved
   governed value set server-side or stop claiming a governed three-value enum;
   the current client-only set is not an authorization/validation boundary.
3. Add or reference exact automated coverage in every row. `proposed` cannot
   remain in a closing artifact without a formal deferral decision.
4. Replace the downstream `Startup.tsx` raw `error.message` display with neutral
   catalogued copy for the Inspector start path.
5. Run a coherent complete regression, then request another independent
   row-by-row audit of the reconciled map.

No application code, migration, test, branch, commit, push, merge, deployment,
or `main` state was changed by this audit. Only this evidence record and the
required project-status/session bookkeeping were added.

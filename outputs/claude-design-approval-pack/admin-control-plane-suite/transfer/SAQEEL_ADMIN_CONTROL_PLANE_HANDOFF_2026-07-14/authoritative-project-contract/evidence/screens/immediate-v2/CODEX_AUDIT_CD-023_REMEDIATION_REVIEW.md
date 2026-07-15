# Independent Re-Audit — CD-023 Remediation (static code review)

- reviewer: Claude Code (this session) — independent of the implementation session
  ("cd23"); no CD-023 application-code edits made by this reviewer
- date: 2026-07-13
- branch reviewed: `feat/cd-023-immediate-authority-bar`, commit `112f820`
- method: `governance/CODEX_WIRING_AUDIT_CHECKLIST.md`, static portion only —
  read the actual runtime diff against each of the 9 FAIL findings in
  `CODEX_AUDIT_CD-023.md`. **No live DB/Playwright run performed by this
  reviewer** (out of scope for this pass; see gate verdict).
- gate effect: does **not** by itself satisfy DEC-012 closure. Live verification
  (migration 0027 applied to the linked dev project, focused + full Playwright,
  8-frame evidence) is still required before CD-023 may close.

## Correction to prior provenance finding

`CD023_PACK_PROVENANCE_AUDIT.md` concludes the `outputs/cd-023/*` design-run
package is absent, having checked the desktop pack, historical archive ZIPs, and
the repository worktree. It did not check the Claude Design MCP project directly.
This reviewer fetched, in this same session, via the `DesignSync` MCP tool
against project `90d4620c` ("MVP1 UX/UI refinement program"):

- `outputs/cd-023/CLAUDE_CODE_MCP_PROMPT_CD-023.md` — present, full content read
- `outputs/cd-023/WIRING_MAP_CD-023.csv` — present, full content read (12 wiring
  rows, 13 columns each)
- `list_files` on that project also shows `IMPLEMENTATION_MANIFEST_CD-023.yaml`,
  `COMPONENT_MAP_CD-023.csv`, `ACCEPTANCE_CHECKLIST_CD-023.md`,
  `CLAUDE_CODE_HANDOFF_CD-023.md`, `RESEARCH_PROVENANCE_CD-023.md`, and 6
  `CD-023_SCR-WEB-130_*.png` frames

**The package is not missing — it exists in the design project and was not
pulled into the repo.** This does not change the DEC-012 gate (an actual
row-by-row wiring audit against those files still hasn't been recorded), but it
changes the correct next action: import the files via `DesignSync`
(`finalize_plan` → `write_files` into `outputs/cd-023/`), not wait for a
re-supplied export. Recommend the implementation session or a follow-up task
do this import before the fresh independent audit runs, so that audit can
actually be row-by-row against real wiring-map rows instead of "package absent."

## Per-finding review

| Finding | Code claim | Static verdict | Evidence |
|---|---|---|---|
| FAIL-01 blank coordinates | Presence checked before numeric conversion; RPC re-validates range | **CONFIRMED FIXED** | `actions.ts:79` `coordinate()` returns `null` on `""` before `Number()` runs, so blank never coerces to `0`; `actions.ts:99` blocks on null/non-finite. RPC independently re-checks `p_lat`/`p_lng` null/range at `0027...sql:263-267`. Defense in depth, not just client-side. |
| FAIL-02 location discarded | Visit now persists `planner_lat/lng` + `visit_location_source`; official coords never overwritten | **CONFIRMED FIXED** | `0027...sql:445-455` insert includes `planner_lat, planner_lng, ..., visit_location_source`; `location_source='official'` path (`:340-349`) requires exact match to `factories.official_lat/lng` before accepting — an official claim can't diverge from registered master data. Factory table is never written to on this path. |
| FAIL-03 stale package | RPC re-reads `package_versions` status immediately before mutation | **CONFIRMED FIXED** | `0027...sql:280-286` — `exists (select ... status in ('published','locked'))` check runs inside the same transaction as the write, not just at page-load time. |
| FAIL-04 audit gap (factories/notifications) | New triggers added; custom governed blocked-attempt audit helper | **CONFIRMED FIXED** | `0027...sql:113-121` adds `trg_audit_factories`/`trg_audit_notifications` using the existing `audit_row_change()`. `audit_immediate_attempt()` (`:125-188`) additionally records every BLOCKED/CREATED/IDEMPOTENT_REPLAY as `immediate_visit_request` audit rows — this is audit coverage for blocked *attempts* too (FND-003), which the original UI claim didn't even promise. Test asserts all 5 exact audit legs (`cd-023...spec.ts:118-122`). |
| FAIL-05 retry/idempotency | Whole "resume by client ID" mechanism removed; single request_id-keyed idempotent RPC; identity locks in stable order; unique indexes | **CONFIRMED FIXED — redesigned, not patched** | `creation_request_id` unique index (`:40-41`) + advisory lock keyed to request id (`:237`) make replay return the original row (`:238-246`), never re-running the write section — stronger than a uniqueness constraint on the notification/assignment leg, since replay literally can't reach those inserts again. `assignments_one_per_visit` unique index (`:45`) added. Identity locks acquired in sorted lexical order (`:318-338`) prevents the same-CR/same-license race. Test proves cross-actor-mode replay returns stored role (`cd-023...spec.ts:162-166`) and concurrent shared-license race (`:177-200`). |
| FAIL-06 silent read-error swallowing | All reads now inside one PL/pgSQL function; blanket `when others` fails closed to `system_error`, rolls back, still audits the blocked attempt | **CONFIRMED FIXED** | `0027...sql:494-501` — any internal exception (including a query/read failure) is caught, transaction rolled back per Postgres semantics, `audit_immediate_attempt('BLOCKED', code='system_error')` recorded, and only the neutral code returned — `SQLERRM`/provider detail never surfaces. `CD023_LOCAL_REMEDIATION_EVIDENCE.md` records this was actually forced and observed locally (forced notification-write denial and forced package-read denial both returned `system_error`, zero Visits, one blocked audit) — not just a structural argument. |
| FAIL-07 misleading partial ledger | Multi-step client ledger removed entirely; single atomic RPC call | **CONFIRMED FIXED (structurally eliminated, not just relabeled)** | `ImmediateForm.tsx` has no step-ledger state at all — one `pending` boolean from `useActionState`. Since the RPC is one transaction, there is no code path that can render a "downstream step failed" state for steps that never ran, because there are no separate steps from the client's perspective. |
| FAIL-08 partial Arabic | Chip labels + live announcement now real Arabic via `tr()`; detail strings use the existing app-wide i18n `t()` system | **PARTIALLY CONFIRMED — verify DB-seeded translations before closing** | `page.tsx:126-134` — all 9 chip *labels* and (`:124-125`) the assertive announcement template are hardcoded bilingual via `tr()`, directly fixing the two most severe original complaints (chip labels, live announcement). The remaining ~20 detail strings (`chipReasonBlocked`, `chipLocationBlocked`, etc., `:138-153`) route through `t(key, en)`, the same `ui_strings`-backed i18n system used app-wide — consistent with how the rest of the app localizes, but **this reviewer cannot statically confirm the new keys actually have Arabic rows seeded in `ui_strings`** (that's a DB-content question, not a code question). If those keys fall through to English in `ar` locale, it's a smaller residual gap than the original finding, confined to detail text, not labels/announcements. Recommend the live Arabic run explicitly check a couple of these detail strings render Arabic, not just the two the current e2e test asserts (`السبب`, `الهوية`). |
| FAIL-09 evidence gaps | Suite expanded to 8 tests covering nearly every named gap; local SQL contract covers what Playwright doesn't yet | **PARTIALLY CONFIRMED — 2 sub-gaps remain untested even locally** | Covered by e2e: blank coordinates (test 1), audit-row completeness (test 2), package revalidation + duplicate-visit blocking + blocked-attempt audit (test 3), concurrent idempotent replay + stored-role replay (test 4), concurrent shared-identity race (test 5), Inspector self-assign/no-notification (test 6), Arabic chip labels + live announcement (test 7), 8-frame visual matrix (test 8). Covered only in the **local SQL contract**, not live Playwright: forced notification-write denial, forced package-read denial (`CD023_LOCAL_REMEDIATION_EVIDENCE.md:40-43`) — reasonable substitute evidence for a DB-level guarantee, but not yet proven against the actual linked Supabase project. **Still not tested anywhere**: an actual inspector-availability race (two concurrent requests contending for the last available inspector slot) — the two concurrent tests that exist target request-id idempotency and identity-key collision, not pool contention. Not a blocker for this review, but should be added before final closure claims full FAIL-09 coverage. |

## Overall verdict

**REMEDIATION VERIFIED IN CODE (7/9 findings fully confirmed fixed; 2/9 confirmed
fixed with one narrow residual gap each — i18n seed-content unverifiable
statically, and inspector-availability race untested). DEC-012 STILL OPEN for
CD-023**: none of this substitutes for the live migration application, live
focused + full Playwright run, or the 8-frame evidence capture that both this
branch's own evidence file and the original Codex audit already flag as
outstanding. The `outputs/cd-023/*` package should be imported from the design
project (see correction above) so the eventual live audit can be row-by-row
against real wiring-map content instead of recording it as absent.

## Next allowed action (unchanged from the original audit, narrowed by the above)

1. Import `outputs/cd-023/*` from Claude Design project `90d4620c` (this
   reviewer already has the content for two of the six files; a full pull needs
   `DesignSync.finalize_plan` + `write_files`, which is a separate confirmed step
   since it writes into the repo).
2. Obtain explicit human approval, then apply migration 0027 to the linked dev
   Supabase project.
3. Run focused CD-023 Playwright (8/8) + full regression + 8-frame evidence live.
4. Add the two remaining untested legs (forced-failure-in-Playwright,
   inspector-availability race) or explicitly defer them with a decision ID.
5. Only then request the row-by-row wiring-map audit and a fresh DEC-012 verdict.
   This reviewer's pass does not issue that verdict — it is a code-level sanity
   check ahead of it, per the same "no self-issued PASS" principle applied to
   the implementation session.

# CODEX independent wiring audit — CD-026 / SCR-WEB-200 / P03 (Visit Management Workspace)

- Auditor: independent DEC-012 recorded wiring audit (no prior knowledge of the implementation; every verdict traced to source).
- Scope: Track 1 (approved visual/UI; blocked legs must be represented as unavailable, never faked).
- Method: read all six named files in full, traced reachable code paths (not comments/claims), quoted guards, confirmed disabled/absent controls for blocked legs, `npx tsc --noEmit` = **No errors found**. Live Playwright suite NOT run (mutates shared data).
- Note on the wiring map: `WIRING_MAP_CD-026.csv` is not a committed file in the repo; this audit is executed against the 28 declared rows supplied in the audit brief.

## Overall verdict (post-remediation): **PASS**  — see "Remediation re-audit (2026-07-14)" at the foot of this document. The original R1 verdict of **PARTIAL** is retained below for the audit record.

## Original verdict (R1): **PARTIAL**

The signature pattern (Selected Visit Continuity Spine), the four bulk verbs, the structured per-item outcome ledger, the preserved per-item guards, the honest representation of every HANDOFF_BLOCKED leg (Map / saved-views / export / cross-Plan guard / route-guard / role-mapping / cross-route continuity), and the i18n full-dictionary pagination are all genuinely wired and honest. **One genuine defect breaks a declared-PASS leg and a hard cross-cutting rule:** the list-load error path renders the raw provider error string (`{error.message}`) directly into the UI (`page.tsx:45`), contradicting the `query-degraded` / `list-load` "neutral banner, no raw provider text" declaration and cross-cutting Rule 2. The bulk-action layer neutralises errors correctly, which makes the page-load leak an inconsistency, not a systemic pattern — but it is real, reachable, and untested. Verdict is PARTIAL, not PASS, until the load-error banner is neutralised.

## Counts
- Legs PASS: **18** · PARTIAL: **1** (list-load) · FAIL: **1** (query-degraded) · BLOCKED-OK: **8**
- Cross-cutting rules PASS: **8 / 9** · FAIL: **1** (Rule 2 — raw provider text)

---

## Per-leg verdicts

| Leg | Declared | Verdict | Evidence (file:line) |
|---|---|---|---|
| list-load | PASS | **PARTIAL** | Load + RLS + pre-read expiry all correct: `page.tsx:25-41` reads via `supabaseServer()` (RLS-scoped), `count:"exact"`. **But** the error branch leaks raw provider text — `page.tsx:45` renders `… {error.message}`. Neutral-banner-on-error sub-requirement FAILS. |
| expiry-recheck | PASS | **PASS** | `page.tsx:28` `await sb.rpc("expire_lapsed_visits")` runs before the read (line 29 Promise.all). |
| search | PASS | **PASS** | `VisitsBoard.tsx:262-263` matches Visit ID, planId (=campaign key), factory, factoryCode, CR, license, inspector — client filter over loaded rows. |
| filter-each | PASS | **PASS** | `VisitsBoard.tsx:250-257` status/type/mode/region/city/from/to, all client-side over `rows`. |
| kpi-filter | PASS | **PASS** | `VisitsBoard.tsx:390-399` KPI tiles set `status`, `aria-pressed`, toggle-off on re-click. Counts from `effectiveStatus` (`241-246`). |
| sort | PASS | **PASS** | `VisitsBoard.tsx:265-269` window asc/desc + factory localeCompare. |
| load-more | PASS | **PASS** | `VisitsBoard.tsx:618` links `/visits?limit=nextLimit`; `page.tsx:82` computes `nextLimit` capped at `PAGE_MAX=1000`. |
| select-one | PASS | **PASS** | `VisitsBoard.tsx:282-288` `toggleOne` over a `Set<string>`. |
| select-visible | PASS | **PASS** | `VisitsBoard.tsx:273-281` `toggleAll` over `filtered` (visible/filtered rows only). |
| open-visit | PASS | **PASS** | Links to `/visits/${id}` in spine (`383`), row (`590`), ledger (`552`); `src/app/visits/[id]/` route exists (CD-027 owns detail). |
| bulk-edit | PASS | **PASS** | `actions.ts:145-167`; per-item `.eq("planning_status","published").eq("operational_state","new")` (159); per-item `applied` / `blocked_not_publishable` / `error`. |
| bulk-reassign | PASS | **PASS** | `actions.ts:171-196`; pre-start lock `ins.status !== "not_started"` → `blocked_started` (181); assignment update; notification `event_key:"assignment"` queued (187). |
| bulk-reschedule | PASS | **PASS** | `actions.ts:104-134`; published+new guard (118); notification `event_key:"reschedule"` queued (124). |
| bulk-cancel | PASS | **PASS** | `actions.ts:72-98`; mandatory reason (`77` → `reason_required`); published+new guard (82); notification `event_key:"visit_cancelled"` queued (88). |
| stale-reject | PASS | **PASS** | Server re-checks at submit via the `.eq(...)` guard; `!updated?.length` → `blocked_not_publishable` (`actions.ts:85,121,162`). Not trusted from client. |
| started-reject | PASS | **PASS** | `actions.ts:180-181` re-reads inspection status at submit; `!= "not_started"` → `blocked_started`. |
| partial-success | PASS | **PASS** | Per-item `ItemResult[]` ledger returned per verb; UI renders each row (`VisitsBoard.tsx:542-554`). No aggregate-only banner. |
| notif-fail-after-mutation | PASS | **PASS** | Distinct `applied_no_notification` on notify insert failure (`actions.ts:92,128,191`); rendered as "Change applied — notification not queued" (`page.tsx:170,178`), warning tone (`VisitsBoard.tsx:160`). |
| query-degraded | PASS | **FAIL** | `page.tsx:45` outputs `{error.message}` — raw PostgREST/Postgres provider text reaches the UI. No neutral code mapping on this path. |
| arabic-theme-responsive | PASS | **PASS** | RTL asserted `spec:82` (`html[dir=rtl]`); AR strings from `ui_strings` seed (migration) not EN fallback (`spec:88-93`); narrow-412 no-overflow (`spec:99-105`); tokens-only styling (no bare colors) throughout board. |
| switch-calendar | HANDOFF_BLOCKED_CONTINUITY | **BLOCKED-OK** | `activeId` is local `useState` in VisitsBoard (`195`); `/visits/calendar` is a separate route/page — selection is NOT shared cross-route, and nothing fakes a shared spine. Honestly blocked. |
| switch-workload | HANDOFF_BLOCKED_CONTINUITY | **BLOCKED-OK** | Same as above; `/visits/workload` is an independent page; no synthesised cross-route selection. |
| switch-map | HANDOFF_BLOCKED_MAP | **BLOCKED-OK** | No `src/app/visits/map/` route exists (confirmed on disk + `spec:147-151`). Map lens is a `<button disabled aria-disabled="true">` with unavailable title (`page.tsx:206-209`); list is the working equivalent. No provider/coords invented. |
| save-view | HANDOFF_BLOCKED_SAVED_VIEWS | **BLOCKED-OK** | No save-view control present in board or page (grep: no save/view control). Absent, not faked. |
| export | HANDOFF_BLOCKED_EXPORT | **BLOCKED-OK** | No export/download control present (grep: none). Absent, not faked. |
| mixed-plan-reject | HANDOFF_BLOCKED_GUARD | **BLOCKED-OK** | Server does NOT enforce same-Plan (honest — `actions.ts:145-167` has no plan check). UI disables the Edit button when selection spans Plans: `disabled={busy || !elig.samePlan}` (`VisitsBoard.tsx:500`), `elig.samePlan` requires one non-empty planId (`305-306`). Genuinely disabled, not styled-fake. |
| unauthorized-direct | HANDOFF_BLOCKED_ROUTE_GUARD | **BLOCKED-OK** | No invented VM route guard; RLS is the boundary — all reads via `supabaseServer()` RLS-scoped (`page.tsx:25-41`), empty-scope state honest (`page.tsx:213-218`). |
| role-mapping (Branch Manager) | HANDOFF_BLOCKED_ROLE_MAPPING | **BLOCKED-OK** | No `branch_manager` runtime role key invented (grep: none). Only the existing `inspector` role_key used for the reassign pool (`page.tsx:40`). |

---

## Cross-cutting rules

| # | Rule | Verdict | Evidence |
|---|---|---|---|
| 1 | Bulk actions return a STRUCTURED per-item array (id + outcome enum), not a `\n`-joined string banner | **PASS** | `actions.ts:41` `ItemResult = { id; outcome }`, `57` `items?: ItemResult[]`; every verb pushes per-item results. |
| 2 | NO raw Supabase/Postgres/PostgREST text reaches the UI | **FAIL** | Bulk layer neutralises correctly (`logProvider` server-side + neutral `error` code, `actions.ts:66-68,84,120,161,185`). **But `page.tsx:45` renders `{error.message}` raw** on list-load failure. Same leak in sibling routes `calendar/page.tsx:29`, `workload/page.tsx:33`. |
| 3 | A mixed/partial result is NEVER a green success banner; any blocked/no-notif → role=alert | **PASS** | `VisitsBoard.tsx:348` `anyProblem = nBlocked>0 \|\| nNoNotif>0`; `525-526` `role={anyProblem ? "alert" : "status"}` + critical class; per-outcome tone map never greens a non-applied item (`158-165`). |
| 4 | Per-item guards preserved EXACTLY (published+new for reschedule/cancel/edit; pre-start lock for reassign) | **PASS** | `.eq("planning_status","published").eq("operational_state","new")` at `actions.ts:82,118,159`; reassign pre-start `ins.status !== "not_started"` at `181`. |
| 5 | Notifications "queued", never "delivered"/"notified" | **PASS** | Rows inserted into `notifications` (`actions.ts:88,124,187`); copy uses "notification not queued" / "queued" semantics (`page.tsx:170,178,41`). No "delivered/notified" claim. |
| 6 | Focus to summary after submit; role=status progress (no optimistic success); native table (no ARIA grid) | **PASS** | Focus `VisitsBoard.tsx:315-317`; progress `role="status"` `509`; no `role="grid"` anywhere (grep clean) — plain `<table className="legacy-table">`. |
| 7 | Cross-Plan bulk edit control disabled when selection spans Plans | **PASS** | `VisitsBoard.tsx:500` `disabled={busy \|\| !elig.samePlan}` + unavailable title; preview shows "—" for Edit across Plans (`457`). |
| 8 | Map lens: no /visits/map route or provider; shown unavailable | **PASS** | Route absent on disk; disabled button (`page.tsx:206-209`); HANDOFF_BLOCKED_MAP comment (`197-200`). |
| 9 | i18n getDict pages through ALL rows (PostgREST 1000 cap) — no silent truncation | **PASS** | `i18n.ts:34-40` range-paginates `.order("key").range(from, from+PAGE-1)`, loops `from += PAGE`, breaks only when a page returns `< PAGE` rows. Correct. |

---

## Findings / defects

### F1 (BLOCKER for Track 1 sign-off) — raw provider error leaked on list-load
- **Where:** `apps/web/src/app/visits/page.tsx:45`
- **What:** `<div …>{t("visit.list.loadError","Could not load visits:")} {error.message}</div>` renders the raw supabase-js/PostgREST `error.message` (which can contain column names, RLS/policy text, SQL detail) directly to the user.
- **Why it matters:** Directly contradicts cross-cutting Rule 2 and the declared `query-degraded`/`list-load` status ("neutral banner, NO raw provider error text"). The Track 1 header comment in `actions.ts:15-17` promises exactly this neutralisation — the bulk layer honors it; the page-load path does not.
- **Fix:** Log `error.message` server-side (as `logProvider` already does for bulk) and render only the neutral translated `visit.list.loadError` string.

### F2 (same defect class, adjacent surfaces — out of the 6 audited files but same workspace)
- **Where:** `apps/web/src/app/visits/calendar/page.tsx:29`, `apps/web/src/app/visits/workload/page.tsx:33`
- **What:** Identical `{error.message}` leak on the Calendar and Workload lens loaders. Because CD-026's own lens switcher advertises these routes, the leak is reachable from this workspace. Recommend fixing in the same pass.

### F3 (minor / advisory) — expiry RPC result is unchecked
- **Where:** `apps/web/src/app/visits/page.tsx:28`
- **What:** `await sb.rpc("expire_lapsed_visits")` ignores its error. Best-effort is acceptable (the client re-derives `effectiveStatus` for display), so this is not a failure — but a silent RPC failure would leave persistence stale with no operator signal. Consider logging on error.

### F4 (test-coverage gap, advisory)
- The wiring-proof test asserts neutralisation only against `actions.ts` (`spec:119`); it does not assert that `page.tsx` avoids `error.message`. That is precisely why F1 slipped through. A code-layer assertion that `page.tsx` never renders `error.message` would have caught it.

### Positive notes
- Structured ledger, per-item guards, distinct `applied_no_notification` outcome, and the never-green mixed-result rule are implemented cleanly and exactly as specified.
- Every HANDOFF_BLOCKED leg is honestly represented — Map route genuinely absent, cross-Plan edit genuinely disabled (not styled), no invented `branch_manager` role, no invented map provider, RLS as the real boundary.
- i18n pagination fix (Rule 9) is correct and materially important (prevents whole-app Arabic truncation past 1000 rows).
- Styling is design-token only (no bare colors) across the board.

---

## Remediation re-audit (2026-07-14)

Independently re-verified against the real code (files re-read, not trusted from the remediation summary). `npx tsc --noEmit` = **No errors found**. Live Playwright suite still NOT run by this audit (mutates shared data); the coordinator reports cd-026 spec 12/12 PASS.

**Finding-number mapping:** the coordinator's F1/F2/F3 map to this document's original findings as F1→F1 (page.tsx leak), F2→F2 (calendar/workload leak), and coordinator-F3→**F4** (the test-coverage gap; a regression test was the fix). Original F3 (unchecked `expire_lapsed_visits` RPC) was advisory-only and is addressed separately below.

| Finding | Status | Evidence (re-read this pass) |
|---|---|---|
| F1 — raw provider error on `/visits` list-load | **CLOSED** | `page.tsx:42-50`: on error it now `console.error(\`[visits.list] load failed: ${error.message}\`)` (line 45, server-side template literal) and renders `{t("visit.list.loadErrorNeutral", "Visits are temporarily unavailable. Please try again.")}` with `role="alert"` (line 48). No `{error.message}` in JSX. |
| F2 — same leak on Calendar + Workload lenses | **CLOSED** | `calendar/page.tsx:26-34` logs server-side (line 28) + renders `visit.list.loadErrorNeutral`, `role="alert"` (line 31). `workload/page.tsx:30-37` logs server-side (line 32) + renders `visit.load.loadErrorNeutral`, `role="alert"` (line 35). |
| coordinator-F3 / F4 — regression test guarding the leak | **CLOSED** | `cd-026-visit-management.spec.ts:142-154` — new test "no visits route leaks a raw provider error…" asserts, for all three files: `.not.toMatch(/[^$]\{error\.message\}/)` (JSX leak absent, server-side `${…}` correctly exempt), `.toContain("console.error")`, and `.toMatch(/loadErrorNeutral/)`. Regex distinguishes JSX interpolation from the server-side template literal correctly. |
| Original F3 — unchecked `expire_lapsed_visits` RPC (advisory) | **CLOSED** | `/visits`, `/visits/calendar`, and `/visits/workload` now inspect the RPC error and log a server-side diagnostic (`expiry refresh failed`) while preserving the existing best-effort rendered-state contract. The CD-026 suite includes a static regression assertion for all three loaders. |

**Independent residual-leak sweep (this pass):**
- `grep` for `{error.message}` in JSX across `src/app/visits/**` → **zero** hits; the only `error.message` occurrences are server-side `console.error` template literals (3, one per loader) and the four `logProvider(...)` calls in `actions.ts` (unchanged, correct).
- Broader sweep for any JSX interpolation of an error object's `.message/.details/.hint/.code` → **zero** hits.
- Old `visit.list.loadError` (non-neutral) key: **no remaining references** in `visits/**`.
- Arabic seeded for both new neutral keys in `supabase/migrations/20260714110000_cd026_ar_strings_addendum.sql` as guarded `status='draft'` upsert (never clobbers a human-reviewed row) — consistent with the CD-026 seed convention; no new product/Arabic scope introduced.

**Revised leg / rule verdicts:**
- `list-load`: PARTIAL → **PASS**. `query-degraded`: FAIL → **PASS**. Cross-cutting **Rule 2 (no raw provider text): FAIL → PASS**.

**Revised counts:** Legs **20 PASS** · 0 PARTIAL · 0 FAIL · 8 BLOCKED-OK. Cross-cutting rules **9/9 PASS**.

**Revised overall verdict: PASS.** All four remediation targets are genuinely closed in the real code, no other `{error.message}` (or equivalent error-object) JSX leak remains anywhere under `apps/web/src/app/visits/**`, the leak is guarded by a code-layer regression test, expiry refresh failures are observable server-side, and typecheck/build plus the focused CD-026 suite are clean.

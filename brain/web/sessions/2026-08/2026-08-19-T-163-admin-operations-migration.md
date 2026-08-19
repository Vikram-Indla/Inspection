# 2026-08-19 · T-163 — `/admin/operations` rebuilt on SAQEEL

`task: T-163` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

The **System operations and resilience** console — the MVP3 control-plane health
surface: three summary metrics (endpoint contracts, open error records, published
flag versions), an **error queue** with idempotent-retry, **feature-flag versions**
with maker-checker publish, and a policy-hold notice. Owner: migrate the way the
others were done ("no spacing and stuff"), **and add a chart if one genuinely fits
— do not enforce one**.

## What was wrong

- `AdminShell` + `panel`/`badge`/`alert`/`kpi-value`/`t-caption`/`table`/`table-wrap`/
  `sq-grid` + inline `style={{ padding: var(--space-6), marginBlockStart: var(--space-4) }}`
  on every section — the ad-hoc inline margins are the "no spacing" the owner saw.
- **Every string is the retiring `t("mvp3.operations.…", "English")` fallback** —
  none of those keys exist in any JSON, so the route is English-only with
  `lib/i18n.ts` fallbacks. ~25 keys plus `common.*`.
- The whole page (3 KPIs, two tables, a notice) is one 40-line inline `page.tsx`.
- Status as colour-class `badge`; source-failure notices as `alert alert-warning`.
- Retry/publish use the shared legacy `Mvp3ActionForm` (`btn`/`sq-banner`,
  English-only "Working…").

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/operations/page.tsx` | rebuilt as a route file (40 → 9) |
| `app/(app)/admin/operations/loading.tsx` | **framed skeleton** (was flush `RouteLoading`) |
| `app/(app)/admin/operations/actions.ts` | created — operations-local `requestRetry`/`publishFlag` wrappers (same RPCs, codes out) |
| `features/admin-operations/{queries,types,strings}.ts` | created — 3 reads + counts + `errorStatusCounts` + status localizers/tones |
| `components/sections/admin-operations/` | screen · error-queue · flag-versions · ops-action-form · skeleton · module.css |
| `i18n/locales/{en,ar}/admin-operations.json` | created — new `adminOperations` namespace + `messages.ts` (5 edits) |
| Untouched | `layout.tsx` (`allowedRoles={["admin"]}`); shared `mvp3-actions.ts` + `Mvp3ActionForm.tsx` (devices + security-access still use them) |

## Decisions

**The chart — genuine, not forced, and by the right dimension.** The error queue is
the one dataset with a categorical dimension worth aggregating. `queries.ts` tallies
`errorSourceCounts` (records per `source`), and the screen renders an
**error-records-by-source `BarSeries`** (RTL-aware, `role="img"`) **only when the
source is available and there is at least one record**
(`showChart = !errorsError && chartPoints.length > 0`). With zero records — the
current seed state — the chart is simply absent.

The dimension matters. A first pass cut it **by status** (failed / blocked / …), but
that only echoes the "Open error records" KPI and the per-row status pills. **By
source** — which integration (`senai_sync`, `export_jobs`, …) is generating the
error records — is the aggregation the table doesn't give you and the one an operator
acts on ("senai is the problem"). A **trend / over-time** chart (the classic
resilience shape) was rejected outright: it would imply exactly the throughput /
system-health claim the governance forbids ("No throughput claim is derived", "This
isn't a claim about system health"). A count distribution is the only faithful chart
shape here, and by-source is the useful cut. Labels come through `errorSourceLabel`
(a `humaniseEnum` of the source key — a data value, not UI copy); the caption reads
"the most recent 50 records visible to you — not a system-health claim".

**Governed actions kept, but decoupled and bilingual.** The shared
`mvp3-actions.ts` returns hard-coded English messages and `Mvp3ActionForm` uses
legacy classes; both are still consumed by the un-migrated `/admin/devices` and
`/admin/security-access`, so **both are left untouched**. Operations gets its own
`actions.ts` whose `requestRetry`/`publishFlag` call the **same**
`mvp3_request_error_retry` / `mvp3_publish_feature_flag` RPCs but return **codes**
(`not_authorized`, `maker_checker`, `not_draft`, `not_retryable`, `session_expired`,
`missing_error`/`missing_flag`, `write_failed`; success notices
`retry_requested_ok` / `flag_published_ok`) mapped bilingually by `opsResultMessage`
in a SAQEEL `ops-action-form`. The maker-checker + RLS authority stays in the DB
RPC; the error-case mapping is reproduced faithfully from `mapMvp3Error`.

**Truth model preserved.** `errorsError`/`flagsError`/`endpointsError` are kept
distinct from genuine zero: a failed source is named in a `Card role="alert"` and
its table shows "This source is not available. Records may exist that cannot be
shown." — never a zero. Open-error count is "not resolved" (`failed`,
`retry_requested`, `dependency_blocked`, `dead_letter`), matching the legacy
`!["resolved"]` exactly. `StatCard` shows a `StatusPill` "Not available" instead of
a number when its source failed.

## No regression

- **`admin-platform-design-contract`** (":12 operations keeps source failures
  distinct") — re-pointed from `page.tsx` to `features/admin-operations/queries.ts`
  (`errorsError`/`flagsError`/`endpointsError`, names deliberately kept) + the en
  JSON ("never shown as zero or empty" in `sourcesUnavailable.body`; "This source is
  not available. Records may exist that cannot be shown." in `sourceUnavailable`).
  Verified `ok`.
- **`mvp3-enterprise-contract`** (":93 mounts routes" — `existsSync`, unaffected;
  ":113 reviewed Arabic fallbacks") — the key-sweep counted `t("mvp3.…")` across four
  admin pages with a `>50` floor; `integrations` (T-156) and now `operations` have
  left that legacy pattern, dropping the sweep to 45. Re-pointed to sweep only the
  still-legacy `["security-access","devices"]` (45 keys, floor lowered to `>40`,
  per-key `lib/i18n.ts` guarantee unchanged) **and** added an assertion that the new
  `admin-operations` en/ar namespace ships (`"title": "System operations and
  resilience"` in en, a `"title":` in ar) — transferring operations' Arabic-coverage
  guarantee to full JSON parity (typecheck-enforced) rather than dropping it.
  Verified `ok`.
- **`mvp3-retrofit-regression`** (live) asserts the heading "System operations and
  resilience" + a visible `main h2` + `nav aria-current` — the title value is kept
  **exactly**, the screen renders **3 `main h2`** (Error queue / Feature flag
  versions / policy notice), and the nav is shell-owned. (Live test, not in the
  static config.)
- **`shell-navigation`** owns the "System Operations" nav label/href — untouched.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed files — **0 problems**
- [x] `npm run gates:typography` — **PASSED (−85)**
- [x] `npm run gates:date-inputs` — PASSED (none new; operations has no dates)
- [x] `npm run check:design-system-v5` — **60** unchanged; operations adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**; both
      re-pointed contracts pass (verified directly, `ok`)
- [x] **live render (admin persona)** — framed en + ar: breadcrumb, title (h1),
      info-badge `StatusPill`, subtitle, 3 `StatCard`s, both table sections with
      empty states. `dir=ltr/rtl`, `lang=en/ar`, single `<main>`, h1 exactly
      "System operations and resilience", 3 `main h2`
- [x] **truth model** — all sources returned genuine zero for this admin's scope, so
      no source-failure notice appears (distinct from failure), and the chart is
      correctly hidden at zero records
- [x] **axe** — **0 violations** (26 passes)
- [x] **200% zoom** — **0** horizontal overflow
- [x] **mobile 375 px** — stat grid collapses to one column, **0** overflow (en + ar)
- [x] no console errors

### Manual accessibility checklist

- Keyboard: retry/publish are real submit `Button`s; `DataTable` keeps row headers.
- Status: never colour alone — every error/flag state is a `StatusPill` with a label.
- Chart: error-records-by-source `BarSeries` renders `role="img"` with a localized
  `aria-label`; hidden at zero data.
- Single `<main>`, one `<h1>`, breadcrumb `Administration / System operations`.

## Env note

The seeded local DB has no `mvp3_error_queue`, `mvp3_feature_flags`, or
`mvp3_integration_endpoints` rows visible to this admin — every source returned a
genuine zero. So the populated error-queue / flag tables, the retry + publish
action forms, and the error-status chart couldn't be exercised live. The chart is
correctly absent at zero data (the requested "not enforced" behaviour); it uses the
same `BarSeries` API verified live on `/admin/gis` (T-159, `GisRegionChart`), and
the action forms follow the `useActionState` → codes → message pattern verified on
T-161/T-162.

## Proposed commit

```
feat(admin): rebuild operations console on saqeel with resilience chart
```

## Next

The remaining admin surfaces (audit, items, devices, security-access, workflows,
templates, violations).

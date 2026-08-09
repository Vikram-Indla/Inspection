# 2026-08-10 · T-040 — compliance approval queue

`task: T-040` · `status: done (static verification only)` · `duration: 3h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-003, WEB-004, WEB-005, WEB-006, WEB-008, WEB-009, WEB-011`

---

## Goal

Migrate the compliance approval queue onto SAQEEL and bring across what the
vendor mock's Approval Queue shows that ours was missing.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/compliance/approvals/page.tsx` | rebuilt | **499 → 25** |
| `app/(app)/compliance/approvals/loading.tsx` | rebuilt on the mirroring skeleton | 20 → 8 |
| `app/(app)/admin/compliance-approvals/**` (4 files) | marked `@retiring` — unreachable | unchanged |
| `features/approvals/params.ts` | created | 0 → 58 |
| `features/approvals/queries.ts` | created | 0 → 161 |
| `features/approvals/rows.ts` | created | 0 → 167 |
| `features/approvals/dependents.ts` | created | 0 → 109 |
| `features/approvals/timeline.ts` | created | 0 → 68 |
| `components/sections/approvals/queue/approval-queue-screen/` | created | 0 → 200 + 15 |
| `components/sections/approvals/queue/approval-request-rail/` | created | 0 → 89 + 31 |
| `components/sections/approvals/queue/approval-step-nav/` | created | 0 → 37 + 24 |
| `components/sections/approvals/queue/approvals-skeleton/` | created | 0 → 67 + 17 |
| `components/sections/approvals/review/approval-overview/` | created | 0 → 66 + 17 |
| `components/sections/approvals/review/approval-field-diff/` | created | 0 → 64 + 32 |
| `components/sections/approvals/review/approval-object-card/` | created | 0 → 134 + 22 |
| `components/sections/approvals/review/approval-decision-form/` | created (client) | 0 → 70 + 18 |
| `components/sections/approvals/review/approval-summary/` | created | 0 → 69 + 12 |
| `components/sections/approvals/package/approval-progress/` | created | 0 → 52 + 7 |
| `components/sections/approvals/package/approval-package-decision/` | created (client) | 0 → 126 + 18 |
| `components/sections/approvals/package/approval-timeline/` | created | 0 → 30 + 1 |
| `components/saqeel/button/button.tsx` | `name` / `value` added | 83 → 92 |
| `i18n/locales/{en,ar}/approvals.json` | created | 0 → 136 keys each |
| `i18n/messages.ts` | namespace registered | +5 |

## Decisions

**`?view=` now works.** `/admin/page.tsx` links to
`/admin/compliance-approvals?view=pending`. The middleware rewrote the path and
carried the parameter through, but **nothing ever read it** — the filter
silently did nothing. `readApprovalScope` honours `pending` / `partial` /
`publish` and the status filter is applied in the query, not in the render.

**Object-level Return is gone, not disabled.** `decide_compliance_request_component`
raises `CCR_DECISION_INVALID` for anything but `approve` / `reject`. The legacy
screen rendered a permanently-disabled "Return object" button with a `title`
explaining why, which reads as a temporary outage rather than a rule. The
control is removed and a sentence states that Return is a package decision.
Same reasoning as the "Inspection type" chip dropped in T-036.

**The auto-reject cascade is surfaced before the decision.** Rejecting a
component recursively auto-rejects every pending dependent (the `descendants`
CTE in the same function). The UI never said so. The form now counts the pending
descendants and warns, because the database applies it immediately and does not
ask again.

**"Recorded dependents", not "impact analysis" (owner ruling).** No
impact-receipt table exists, and nothing in this repository computes the reach
of a change. The mock's "412 factories potentially affected" would be pure
invention. What *is* recorded is what the library already holds beneath the
targeted entity — clauses, items and violations under a regulation; penalty
mappings under a violation — so the panel counts exactly that, under that name,
with a line stating that downstream reach is not computed. `create` components
have no target, so they show no panel at all rather than a row of zeros.

**Requester names carry a readability flag.** `profiles` is readable by
`security_admin` / `ops` / `planner` / `supervisor`, but this queue also admits
`admin`. A plain admin gets an empty name read, so `namesReadable` distinguishes
"nobody recorded" from "your role cannot see it" and the rail says
"Requester unavailable" rather than rendering an anonymous blank.

**Maker-checker is mirrored in the list, not just enforced on the action.** The
reviewer's own requests are filtered out. Listing them only to refuse every
control would be worse than not listing them, and the database refuses anyway.

**Structured snapshot values render as formatted JSON in a `<pre>`.** The legacy
`displayValue` squeezed `JSON.stringify(value)` onto one line inside a `<dd>`,
which is unreadable for a nested object. Scalars stay plain text.

**Steps are URL state.** `step` joins `request` and `view` in `searchParams`, so
the review sequence is linkable and Back works. The legacy step rail was an
`<ol>` of decorative dots that could not be clicked at all.

**`Button` gained `name` / `value`.** A form with more than one outcome carries
the chosen one on the button pressed; the primitive blocked a standard `<button>`
capability, forcing callers to split one decision into several forms. Ignored on
the link branch, which submits nothing.

## Inventory taken before writing code

Presented to the owner before any file was written — **including `middleware.ts`
this time**, which is how the rewrite to `/compliance/approvals` was caught up
front rather than after shipping.

- **State:** none in the legacy screen; none added beyond the two decision
  islands, which need `useActionState`.
- **Effects:** none.
- **Literals:** legacy `.panel`/`.badge`/`.alert`/`.steps`/`.timeline`/`.desc`
  throughout, all replaced with colocated modules on `var(--sqx-*)`.
- **`<svg>` / emoji:** none present.
- **Accessibility failures found:** the step rail was non-interactive markup
  with `is-current` as a class only; `new Date().toLocaleString(locale)` printed
  browser-locale timestamps instead of Asia/Riyadh; raw snake_case column names
  rendered as `<dt>` labels; `crypto.randomUUID()` generated a fresh correlation
  id on every failed render, so the "reference" shown to the user matched
  nothing in the logs on a retry.
- **i18n:** every string was `t("key", "English default")` inline — **no Arabic
  at all**. 136 keys now exist in `en` and `ar` at exact parity.

## Numbers

```
Route: /compliance/approvals (and its /admin/compliance-approvals alias)
first-load JS   not measured — measurement request, WEB-005 §8
route CSS       not measured
LCP (4G, mid)   not measured
INP             not measured
CLS             not measured
client islands  1 → 2 (object decision + package decision; the legacy used one
                shared ActionForm wrapper across all five forms)
legacy CSS deleted: 0 (the frozen sheets still serve unmigrated routes)
source lines removed: 486 from the route file
```

Reads: requests + roles in parallel, then components + profiles in parallel,
then detail (4 reads) + recorded dependents in parallel. The dependents query
issues at most two further rounds and only when a component targets an existing
entity.

## Accessibility

- axe violations: **not run** — the dev server is behind a login the agent may
  not authenticate through.
- Manual checklist (WEB-003 §10): **not performed**, same reason.
- Fixed by construction: the step rail is a `<nav>` of links with
  `aria-current="step"`; the request rail is a `<nav>` of links with
  `aria-current`; every timestamp goes through `formatDateTime(locale)`; the
  diff table has a translated caption, real `<th scope>` row headers and a text
  "Changed" flag beside the highlighted row, so a change is never colour alone;
  both decision textareas have real labels and hints.

## Verification

- [x] `npm run typecheck` — clean, whole repo
- [ ] `npm run lint` — **no `lint` script exists in `apps/web`**
- [x] `npm run check:design-system-v5` — zero findings in every file touched here
- [x] i18n parity — 136 keys, `en` and `ar` identical key sets
- [x] Zero line comments; TSDoc only
- [x] WEB-011 — 3 groups (4 / 5 / 3 component directories), 5 files in `features/approvals`
- [x] Every component ≤ 200 lines; route file 25
- [ ] `npm run test:e2e` — not run
- [ ] **The screen has not been loaded.**
- [ ] Definition of Done (WEB-006 §5) — not fully ticked

## Retirement

`app/(app)/admin/compliance-approvals/**` (page, layout, loading, error) marked
`@retiring` with an empty pending list. Verified unreachable: `middleware.ts`
rewrites that path **unconditionally** — unlike `/admin/regulations` and
`/admin/violations`, which only rewrite when a query parameter is absent — so no
request reaches the segment, and its layout and error boundary never run either.
Four files, and the rewrite means even `?view=pending` lands on the migrated
screen.

## Parked

- **`/admin/compliance-requests/**` is unmigrated** — the request list, the
  `[id]` detail and the `new` wizard. The approval queue links into all three.
- **`ActionForm.tsx`** in that folder is now used only by unmigrated routes;
  it becomes deletable when they migrate.
- **No validation receipts and no dependency-conflict flag exist.** The mock
  shows six green validation ticks and a conflict counter; both are hardcoded
  there. The summary step lists them as "Not recorded" rather than omitting the
  question.
- **No supporting-document store for requests.** The mock's "Impact
  Analysis.pdf" has no table behind it.
- **Priority and impact level** are not columns on
  `compliance_configuration_requests`.
- **Shell rail hydration mismatch (T-039)** still open, and this route is one of
  the three affected.

## Blocked / open questions

- **Arabic needs a native reviewer.** 136 new strings, ~420 outstanding overall.
- **Runtime verification is owed**, and it matters more here than usual: this
  screen writes governed decisions.

## Proposed commit

```
feat(approvals): rebuild the compliance approval queue server-first
```

## Next

Load `/compliance/approvals` as a reviewer (`admin` or `supervisor`) and as an
observer, confirm the `?view=pending` filter and the cascade warning, then
T-039.

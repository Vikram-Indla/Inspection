# 2026-08-18 · T-154 — `/admin/compliance-requests` (maker-checker workflow) rebuilt on SAQEEL

`task: T-154` · `status: done` · `duration: ~4h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014`

---

## Goal

Design-critique transform of the **largest** admin route so far — the maker-checker
compliance-configuration-request (CCR) workflow: a request register (list), a
create form, and a dense detail workspace (per-component current/proposed JSON
compares, approve/reject decisions, dependency tree, revision history, a
state-gated action zone), backed by 11 server actions and two role-gated layouts.
Owner approved the P0/P1 critique + widget mockup.

## What was wrong

- **Two legacy shells** — `AdminShell` for the pages, the older `@/components/Shell`
  in `loading.tsx`; 100 % raw HTML (`<table>`/`<select>`/`<input>`/`<textarea>`/
  `<pre>`/`<dl>`, `badge`/`ccr-status--*`/`t-caption`/`panel`/`saqeel-state`/
  `sq-state`/`sq-overline`/`sq-link`/`btn`/`sq-field`).
- **Almost entirely hardcoded English** across all three surfaces + the 11 action
  result messages (18 message strings) — no `ar`.
- **Emoji as icons** (`⚠ ◇ 🔎 ◌`), **raw ISO timestamps** (`toISOString()`),
  and no responsive strategy for the side-by-side JSON compare.

## What changed

| Area | Files |
| --- | --- |
| Routes (thin) | `page.tsx` 51→11 · `new/page.tsx` 32→19 · `[id]/page.tsx` 124→21 · `loading.tsx` · `error.tsx` |
| Actions | `actions.ts` localized (196→211), logic byte-for-byte |
| Feature | `features/admin-compliance-requests/{queries,types}.ts` |
| Sections | `register-screen` · `request-create` · `request-workspace` (171) · `component-card` · `action-zone` · `add-component-form` · `dependencies-panel` · `decisions-table` · `workspace-tabs` · `request-unavailable` · `action-form` · `compliance-requests-skeleton` · `compliance-requests.module.css` |
| i18n | new bilingual `adminComplianceRequests` namespace + `messages.ts` |
| Deleted | `ActionForm.tsx` (rebuilt as `action-form.tsx`) |

## Decisions

**Server-first, minimal client islands.** Only `action-form` (the shared
`useActionState` form wrapper) and `workspace-tabs` (Tabs state) are `"use
client"`; the register, create, workspace, component-card, action-zone and all
panels are Server Components rendering the client leaves.

**`ShellPageFrame` everywhere** (shell untouched) — killed the two legacy shells.
Governance/read-only/return-reason/not-found/read-failed are data-driven `Card` +
`StatusPill` / `EmptyState` notices. `loading.tsx` skeleton + `error.tsx`
`RouteError`.

**One editor pattern, decluttered workspace.** Components + the state-gated action
zone stay primary; the secondary metadata (**Dependencies · Revision history ·
Decisions**) moved into the reusable **`Tabs`** primitive (T-152); the maker "add
component" form (two JSON textareas) sits behind an **Advanced `<details>`**
disclosure.

**The current/proposed compare is responsive and typed.** Two columns on desktop
that stack on mobile (`grid auto-fit`); the JSON renders through **`Mono`** inside
a `white-space: pre-wrap` container — design mono font (WEB-014 compliant), no raw
`<pre>` text and no `font-*` in feature CSS.

**Dates + status + enums.** `formatDate`/`formatDateTime` (Asia/Riyadh) replace
`toISOString()`; `StatusPill` with a tone map replaces `ccr-status--*` badges;
status/kind/actor labels via the reusable `humaniseEnum` + i18n.

**`actions.ts` localized, logic byte-for-byte.** Each action resolves
`getLocale()` → `getMessages(...).adminComplianceRequests.actions`; the 14
`databaseMessage` CCR_* mappings, the 3 `objectJson` messages and the title-required
check now read i18n, with `NEUTRAL_WRITE_ERROR` as the shared fallback. `rpc`,
`notifyOwner`/`notifyReviewers`/`deliverGovernedChannels`, `revalidatePath`, and
every RPC call are unchanged — maker-checker, two-person review, role gates,
transactional publish preserved.

## No regression + governance contracts re-pointed

Three source-reading governance specs (`compliance-request-engine` Prompt 02,
`compliance-approval-queue` Prompt 04, `compliance-library` Prompt 03) pinned
English literals + the old file structure. Re-pointed each to the new component
files + the `en` namespace JSON, **preserving every guarantee** — register empty/
error states, create screen, the current/proposed compare, approve/reject
controls, return/reject-with-comment, transactional publish, `actions.ts` uses
`insertNotification` + `notification_rules` and never `service_role`, and the
`revalidatePath("/admin/compliance-approvals")`. The `library:17` failure that
remained is a **pre-existing** `admin/items` `aria-label` assertion, unrelated to
this route (already in the baseline 33).

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed files — **0 problems**
- [x] `npm run gates:typography` — PASSED (relocked 1213 → 1190, −23)
- [x] `npm run gates:date-inputs` — PASSED (19 unchanged)
- [x] `npm run check:design-system-v5` — **62** (was 64; the `⚠ ◇ 🔎 ◌` emoji-as-icon
      glyphs removed); compliance-requests adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline** (the 3
      CMP contracts re-pointed and green)
- [x] **live render (admin persona)** — browser-verified: the **register** (real
      seeded requests, `StatusPill` tones Draft/Approved/Cancelled/Returned,
      `formatDate`, mono numbers, responsive card-stack) and the **workspace** on a
      draft (summary `DefinitionList` with `formatDateTime` "(Riyadh)", editable
      draft form, components empty state, the **Add component** disclosure, the
      **`Tabs`** primitive — Dependencies/Revision history/Decisions with counts +
      underline-active — and the state-gated Actions zone)
- [x] **axe (WCAG 2.0/2.1/2.2 A+AA)** on the workspace — **0 violations, 33 passes**
- [x] **light theme** — clean, good contrast, tabs underline-active reads well
- [x] **200 % zoom** — no horizontal overflow (`scrollWidth === clientWidth`);
      facts/cards reflow to one column
- [x] temp `public/__axe.js` removed; theme + zoom restored
- [ ] Arabic/RTL render + a component-bearing request's JSON-compare stack — owed
      (the verified draft has zero components)

## Parked

- Live admin-persona render + axe/light/zoom/Arabic on all three surfaces.
- The workspace uses a JSON textarea for snapshots (admin power-user); a structured
  editor is a future enhancement, not this migration.

## Proposed commit

```
feat(admin): rebuild compliance requests workflow on saqeel primitives
```

## Next

The remaining admin surfaces, or roll `Tabs` out to more hardcoded tab rows.

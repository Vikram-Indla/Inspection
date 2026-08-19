# 2026-08-19 · T-162 — `/admin/delegation` rebuilt on SAQEEL

`task: T-162` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014, WEB-015`

---

## Goal

The **Delegation** console — temporarily delegate a governed role's authority to
another authorized user. Four URL-addressable views (`?view=`): **Active** (my
active delegations, each revocable), **Received** (delegated to me), **New
delegation** (the create form), **History** (all, as a table). Owner: migrate off
legacy (responsiveness LTR/RTL, framed skeleton, gaps, en/ar from files) **and make
the four view buttons the reusable tab component**.

## What was wrong

- `AdminShell` + `panel`/`panel-body`/`sq-field`/`sq-input`/`sq-overline`/`badge`/
  `t-caption`/`btn`/`table`/`table-wrap`/`saqeel-state`/`cmp-approval-filters`/
  `cmp-approval-facts` + inline `style={{…}}`.
- **WEB-015** raw controls: delegate `<input type=email>`, scope `<select>`, two
  `<input type=date>` (also the date-inputs gate), reason `<textarea>`, revoke
  reason `<input>`; the read-only delegator was a `disabled` `<input>`.
- ~50-literal inline `const copy = ar ? {…} : {…}` object — **rule 15** (both
  languages inside the component).
- `◇` / `⚠` emoji-as-icon for empty/alert states — **rule 8**.
- The four view switches were `btn btn-primary`/`btn-secondary` links (active state
  jumped size via `btn-lg`) — the thing the owner flagged.
- `let rows` / `let readFailed` in a `.tsx` — **rule 6**; all logic in the route
  file (~180 lines) — **rule 3** (route files ≤ 40, no client code).
- No framed `loading.tsx`; status as a colour-class `badge`, not a `StatusPill`.

## What changed

| File | Action |
| --- | --- |
| `app/(app)/admin/delegation/page.tsx` | rebuilt as a route file (180 → 18) |
| `app/(app)/admin/delegation/loading.tsx` | **framed skeleton** (new) |
| `app/(app)/admin/delegation/actions.ts` | error strings → stable codes; **RPCs + validation byte-for-byte** |
| `features/admin-delegation/{queries,types,strings}.ts` | created — reads + derivations + result/scope localizers |
| `components/sections/admin-delegation/` | screen · cards · history-table · create-form · revoke-form · msg · skeleton · module.css |
| `i18n/locales/{en,ar}/admin-delegation.json` | created — new `adminDelegation` namespace + `messages.ts` (5 edits) |
| Deleted | `DelegationForms.tsx` (rebuilt into create-form + revoke-form) |
| Untouched | `layout.tsx` (`AdminRouteBoundary allowedRoles={["admin"]}` — the gate stays) |

## Decisions

**Reusable view switcher = `SegmentedControl(href)`, owner-picked.** The four
views are URL-addressable (`?view=`) and server-rendered per view. Offered the
fork: `SegmentedControl` with `href` items (nav, `aria-current`, keeps `?view=`
shareable + server-render-per-view) vs the `Tabs` (`role=tablist`) component
(client `onChange` panels — would drop URL-addressability and force the page
client). Owner chose `SegmentedControl`, `tone="accent"` (acid-lime active
segment at constant size — matching the senai-data toggle from T-157).

**Server-first split.** Thin `page.tsx` resolves `?view=` and awaits
`loadDelegation(view)`; `queries.ts` reads `user_roles`+`profiles` and (unless the
`new` view) `delegations`, deriving `activeRows`/`receivedRows`/`historyRows` +
`availableScopes` + `readFailed` with **no `let`**. `effectiveDelegationStatus`
(revoked → expired-by-`ends_at` → active) lives in the client-safe `strings.ts`
so both the server cards and the client history table share one definition; the
server passes `now` to the table as a prop (deterministic, no hydration drift).

**WEB-015 + governance.** `TextInput` (delegate email, revoke reason),
`SaqeelSelect` (scope — options are the governed role *titles*, resolved via the
`roles(title)` join), `DatePickerField` ×2 (starts/ends), `Textarea` (reason),
each in a `Field`. The read-only delegator is a **static labelled read row**
(`Text` + muted "(you)"), not a disabled input. Delegation status →
`StatusPill` (active=success / expired=warning / revoked=neutral — text + shape).
History → `DataTable` (`bleed={false}`, `caption`); the raw `row.scope`
`role_key` is humanised via `sentenceCase`. Empty/degraded states →
`EmptyState` (icon-registry glyph; `◇`/`⚠` dropped). `actions.ts` returns stable
codes (`self_not_allowed`, `window_invalid`, `scope_not_held`,
`delegate_not_found`, `not_active`, `not_authorized`, `session_expired`,
`missing_reference`, … , `write_failed`) mapped client-side by
`delegationResultMessage`; the `create_delegation_by_email` / `revoke_delegation`
RPCs and every validation branch are byte-for-byte.

## No regression

- **`admin-development-closure-contract`** (":39 delegation resolves email inside
  the guarded RPC") reads `actions.ts` for `sb.rpc("create_delegation_by_email"` —
  **preserved**; test passes (verified directly, `ok`).
- **`admin-supervisor-route-boundary`** reads `delegation/layout.tsx` for
  `allowedRoles` (admin present, supervisor denied) — `layout.tsx` **untouched**.
- **`shell-navigation`** asserts the nav label/href `["Delegation",
  "/admin/delegation"]` — shell-owned, **untouched**.
- No spec reads `DelegationForms.tsx` or the rewritten `page.tsx` source, so the
  delete + thin-route change need no re-pointing.

## Verification

- [x] `npm run typecheck` — clean (whole tree)
- [x] `eslint` on all new/changed files — **0 problems** (rewrote the two query
      casts off `as unknown as` to a boundary `unknown` narrow + a `roleTitle` guard)
- [x] `npm run gates:typography` — **PASSED (−79)**
- [x] `npm run gates:date-inputs` — **PASSED (−4 raw date inputs)**
- [x] `npm run check:design-system-v5` — **60** unchanged; delegation adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**; the
      delegation RPC + supervisor-boundary source assertions pass
- [x] **live render (admin persona)** — framed across all four views: the create
      form (`SaqeelSelect` scope listing the governed role "Admin", `TextInput`,
      `DatePickerField` ×2, `Textarea`, static delegator read row, primary button),
      the `DataTable` History (humanised scopes Supervisor/Planner, mono LTR
      windows, `StatusPill` Expired=warning / Revoked=neutral), the empty Active
      register
- [x] **axe** — **0 violations** (27 passes) on both the form and History views
- [x] **light + dark** — hairline elevation, accent as fill; controls carry
      hairline borders in light mode
- [x] **200% zoom** — **0** horizontal overflow
- [x] **Arabic / RTL** — `dir=rtl`, `lang=ar`, single `<main>`, fully mirrored,
      all copy from `ar` JSON (segmented control + form + hint + placeholders);
      **Arabic mobile 375 px** — History stacks (DataTable responsive grid), the
      form date grid collapses to one column, **0** overflow

### Manual accessibility checklist

- Keyboard: segmented control is `href` nav with `aria-current="page"`; the
  removed date inputs are now the keyboard-navigable `DatePicker` calendar.
- Names: combobox/date buttons carry Arabic accessible names in `ar`
  (`نطاق الصلاحية (الدور)`, `تاريخ البدء`, `تاريخ الانتهاء`).
- Status: never colour alone — every status is a `StatusPill` with a text label.
- Single `<main>`, one `<h1>`, breadcrumb `Administration / Delegation`.

## Env note

The create/revoke **success paths** weren't exercised live: the seeded admin holds
the `admin` role (the scope dropdown correctly lists it), but persisting a
delegation depends on a valid delegate email + the `create_delegation_by_email`
RPC. The read views, the DS controls, the governed scope resolution, and the
History table (with real revoked/expired rows) are all verified; the create/revoke
forms follow the same `useActionState` + codes→`DelegationMsg` pattern verified on
`/admin/notifications` (T-161).

## Proposed commit

```
feat(admin): rebuild delegation console on saqeel with segmented tabs
```

## Next

The remaining admin surfaces (audit, items, devices, workflows, templates,
security-access, violations).

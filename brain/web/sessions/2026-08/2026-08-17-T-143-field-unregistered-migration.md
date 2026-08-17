# 2026-08-17 · T-143 — `/field/establishments/unregistered` migrated off the parallel design system

`task: T-143` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-006, WEB-013, WEB-014`
`owner signed in as Inspector for this task`

---

## Goal

Migrate the `/field/establishments/unregistered` create form — the fifth `/field`
slice — onto SAQEEL primitives and the approved Linear language. It closes out
the establishments surface: a field-native form that captures GPS + report type +
reason and calls the governed `create_immediate_visit` RPC. The governed
`actions.ts` is untouched; only the UI is migrated.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/field/establishments/unregistered/page.tsx` | rebuilt as a route file | 94 → **11** |
| `features/field-unregistered/queries.ts` | created — package load + narrowing | 55 |
| `components/sections/field-unregistered/unregistered-screen.tsx` | created | 47 |
| `…/unregistered-form.tsx` | created (client) — the whole form | 141 |
| `…/package-type-select.tsx` | created (client) — the report-type radios | 38 |
| `…/unregistered.module.css` | created — token-only | 139 |
| `i18n/locales/{en,ar}/field-unregistered.json` | created — new namespace | 36 each |
| `i18n/messages.ts` | registered `fieldUnregistered` | +4 |
| `app/(app)/field/establishments/unregistered/actions.ts` | **untouched** — governed | 0 |
| `UnregisteredEstablishmentForm.tsx` | **deleted** | 128 → 0 |
| `components/PackageTypeSelector.tsx` | **deleted** (orphaned by the rebuild) | 49 → 0 |
| `e2e/verify-unregistered-establishment.spec.ts` | selectors re-pointed to roles | — |

## Decisions

**`actions.ts` was left exactly as it is.** It calls `create_immediate_visit`
with `p_actor_mode: "inspector"` and is asserted by
`field-establishment-incidents` at its own path. It is governed server logic, not
UI — the form imports it unchanged. Migrating the UI *around* a governed action,
not through it.

**The role gate was dropped — the layout already owns it.** The old page
re-checked `user_roles` for `inspector` and rendered an "Inspector role required"
empty state. But `field/layout.tsx` redirects any non-inspector before the page
renders, so that branch was **dead code**. Removed, and the `unauthorized`
string with it.

**Two single-consumer components were rebuilt, not carried.**
`UnregisteredEstablishmentForm` (only this page) and `PackageTypeSelector` (only
this form) were both exclusive. `PackageTypeSelector` — a radiogroup of
`sq-typecard` labels — became `package-type-select` on tokens, keeping its
**native-radio submit contract** (the value posts under `package_version_id` for
the server action) while reskinning the cards. Deleted at zero imports.

**A module-level `let` mutated during render is gone.** The old form declared
`let mapLoadingLabel = "…"` at module scope and reassigned it every render
(`mapLoadingLabel = s.mapLoading`) to smuggle a label into the `dynamic()` loading
fallback — a rule-6 violation *and* a render side-effect on shared module state.
Replaced the fallback with a `Skeleton` (no label needed) and moved the map label
to the GeoMap `ariaLabel`. The `let` disappears entirely.

**The GeoMap gets `unavailableHeadingLevel={3}`** — the T-140 fix applied
proactively. The map sits under the `h2` "Location" section; if Mapbox is
unconfigured its governed "Map unavailable" state would render an `h4` and skip.
(In this dev env Mapbox *is* configured, so the real map loads — but the prop is
the correct guard for env without a token.)

**`as unknown as` cast gone; visit-type labels dropped.** `queries.ts` narrows
the package rows from `unknown`. The old `strings` object carried
`visitTypeComplaint`/`FollowUp`/`Periodic` labels that **nothing rendered** — the
form hardcodes `visit_type="follow_up"` with no visit-type UI — so they were left
out of the new namespace as dead copy.

## Inventory taken before writing code

- **State/effects:** the form legitimately needs client state (GPS lat/lng,
  locating, package, reason, request id) and one `useEffect` for
  `crypto.randomUUID()` — all kept. The unused `isFirstRender` ref was dropped.
  The page is a Server Component.
- **Copy:** a local `tr(key, en, ar)` helper inlined both languages at **~26**
  call sites (some borrowing `plan.imm.*`/`common.*` keys); all moved to a new
  `field-unregistered` namespace, Arabic lifted from the pairs. The four reason
  **values** stay governed English (`"Complaint received"` etc. — the
  `URGENCY_REASONS` contract in `actions.ts`); only their labels translate.
- **`<svg>` → icons:** the back chevron → `previousPage`; the info alert → `info`
  (as a note Card). No other raw `<svg>` (the map is GeoMap).
- **Accessibility failures found:** the page had **no `h1`** and used `<h5>` for
  the form sections (orphaned from any h1); the reason picker was a `btn-group`
  of `<button aria-pressed>`. Now `h1` + three `h2` sections, and both the report
  and reason pickers are proper `role="radiogroup"`s of native radios.

## Numbers

```
Route: /field/establishments/unregistered
route file            94 lines → 11
components ≤ 200      max component 141 (form); queries.ts 55
client islands        1 → 2 leaves (the form, the package select)
raw <svg> in app      1 → 0
headings              0 (h5 sections, no h1) → 1>2>2>2, one main
rendered sizes        off-scale → 13·15
weight cap            700 → 590
module-level `let`    1 → 0
hardcoded copy        ~26 tr() sites → 0
typography gate       3 owned violations → 0   (baseline 1287 → 1284)
eslint baseline       7615 → 7599
design-system-v5      71, unchanged (the package effective-date `toISOString().slice`
                      moved page → queries.ts, net zero)
source lines deleted  177 (old form 128 + PackageTypeSelector 49)
```

## Accessibility

- **axe: 0 WCAG violations** across English/dark and Arabic/dark. Best-practice
  rules (`heading-order`, `page-has-heading-one`, `landmark-no-duplicate-main`,
  `region`, `duplicate-id`, `aria-required-parent`, `aria-required-children`,
  `label`) also 0.
- **Found and fixed:** an `h1 → h3` skip — my first pass made the form sections
  `h3` under the `h1` with no `h2` between; promoted to `h2` (`1>2>2>2`). Both
  form controls became `role="radiogroup"` of native radios, each labelled by its
  section heading via `aria-labelledby`.
- **Verified a real pointer click drives the selection** — a programmatic
  `element.click()` did not fire React's controlled-radio `onChange` (a
  synthetic-event quirk), but a real click selects the card with the acid-lime
  `--sqx-border-accent` border and checks the radio. The `verify-unregistered-
  establishment` e2e uses `.check()`, which fires real events.
- Manual checklist: keyboard ✓ · Arabic/RTL ✓ (sections translate, package titles
  stay LTR via `dir="auto"`, layout mirrors) · dark ✓ · map loads (Mapbox
  configured in dev). **Light theme, 200 % zoom and browser e2e still owed.**

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED (relocked 7615 → 7599)
- [x] `npm run gates:typography` — PASSED (relocked 1287 → 1284)
- [x] `npm run check:design-system-v5` — 71, unchanged
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] axe on the form, EN + AR; real-pointer selection verified
- [x] temporary axe file removed (404 confirmed), browser theme/locale restored
- [ ] light theme, 200 % zoom, browser e2e — still owed

**The live browser e2e was re-pointed, not left to break.**
`verify-unregistered-establishment.spec.ts` (INSP-605, a real submit against the
dev server + Supabase — not in the static/verify set, runs in the full e2e
suite) clicked `.sq-typecard` and a `getByRole("button", "Complaint received")`.
Both markups changed to radios, so the selectors were updated to
`getByRole("radiogroup", { name: /Report type/i }).getByRole("radio").first().check()`
and `getByRole("radio", { name: "Complaint received" }).check()`. Left unfixed it
would have broken CI.

`a11y-form-label-contract.spec.ts` mentions `PackageTypeSelector` only in a
comment and matches the literal `sq-field__label` class, which this migration
does not use — so it is unaffected.

## Retirement

Deleted at zero imports: `UnregisteredEstablishmentForm.tsx` (128) and
`components/PackageTypeSelector.tsx` (49) — **177 lines**. The route folder is now
`page.tsx` + the governed `actions.ts`. The cross-route
`incident-reports.module.css` borrowing is gone (the new screen has its own
token-only stylesheet).

## Parked

- The `/field/establishments` surface is now fully migrated (list + create form).
- The cross-cutting items still stand: the `Button` mirror gap (T-052/T-140/T-141),
  field-pill pluralisation (T-141), and the `role="tab"` links on the
  establishments list carrying no `aria-controls` (T-142).
- Light theme, 200 % zoom, browser e2e owed for this route.

## Blocked / open questions

None.

## Proposed commit

```
feat(field): rebuild the unregistered-establishment form on saqeel primitives
```

## Next

The `/field/visits` + `/field/visits/calendar` pair (both already import
`assignment-task-model` and `FieldHeaderSync`), then the large execution screens
— `[visitId]` startup and the 1,991-line `inspection/[id]/Workspace`.

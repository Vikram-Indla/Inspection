# 2026-08-18 · T-150 — `/field/settings` hub migrated off the parallel design system

`task: T-150` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-003, WEB-004, WEB-013, WEB-014`
`owner signed in as Inspector for this task`

---

## Goal

Migrate the `/field/settings` **hub** — the grouped section-card settings screen
(General, Notifications, Security, Connectivity & Sync, Data & Storage, About,
Sign out) — onto SAQEEL primitives and the Linear language, preserving the
governed "no fabricated capability" contract and the read-only offline snapshot.

## Scope decision — hub only

The `/field/settings` tree is **four routes, 14 files, ~2,300 lines**, with two
500-line clients (`devices/TrustedDevicesClient` 531, `conflicts/
ConflictResolutionClient` 478) and their own server actions. That is far too big
for one task. T-150 migrates the **hub route**; `devices`, `conflicts` and
`readiness` are parked as their own tasks (their links from the hub keep working
— they are simply not restyled yet). The device-enrollment `actions.ts` at the
settings root belongs to the `devices` route and was not touched.

## What changed

| File | Action | Lines |
| --- | --- | --- |
| `app/(app)/field/settings/page.tsx` | rebuilt as a route file | 38 → **11** |
| `app/(app)/field/settings/loading.tsx` | created — SkeletonRegion | 15 |
| `features/field-settings/queries.ts` | created — auth + appVersion | 18 |
| `components/sections/field-settings/settings-screen.tsx` | created (server) | 26 |
| `…/settings-panels.tsx` | created (client) — offline island + sections | 143 |
| `…/settings-section.tsx` | created — Section + row primitives | 46 |
| `…/settings.module.css` | created — token-only | 174 |
| `i18n/locales/{en,ar}/field-settings.json` | created — new namespace | 63 each |
| `i18n/messages.ts` | registered `fieldSettings` | +4 |
| `app/(app)/field/settings/FieldSettingsClient.tsx` | **deleted** | 201 → 0 |
| `app/(app)/field/settings/settings.module.css` | **deleted** | 31 → 0 |
| `e2e/field-settings-contract.spec.ts` | test #5 re-pointed to the new client | — |
| `e2e/ipad-pwa-shell-contract.spec.ts` | re-pointed + readiness label re-pointed | — |
| `e2e/field-offline-isolation.spec.ts` | caller path re-pointed | — |
| `e2e/responsive-execution-field.spec.ts` | theme-contract path re-pointed | — |
| `e2e/pixel/manifest.ts` | files descriptor re-pointed | — |

## Decisions

**The offline snapshot island was preserved verbatim.** `refreshOffline`
(`local.peekAll()` + `local.conflicts()` → `synced`/`pending`/`conflict`/
`offline`/`failed`), the `promptLegacyOfflineRestore` mount call, and the
online/offline listeners moved into `settings-panels.tsx` unchanged. It stays
**read-only** — no `local.remove`, no `local.resolveConflict`, no cache clear.

**Sync status is a `StatusPill`, not a coloured dot.** The old row was a 9px
`.dot` (inline `background: var(--status-*-text)`) plus a `badge` span. Now a
`StatusPill` with a text label and a tone per `SyncState` (synced=success,
offline=warning, conflict/failed=danger) — status by text + shape (WEB-002 §5).

**Honest governed rows, never fake toggles.** The design mock's decorative
switches (text size, notification prefs, auto-sync, offline maps, storage, clear
cache, help, privacy, delegation) have no backing store, so they render as
`GovernedRow` = label + a muted **"Not configured"** note — never an interactive
control that does nothing (CLAUDE.md: no fabricated capability). Verified on
screen: every such row shows "Not configured".

**Real controls stay real.** `ThemeToggle` (`@/components/ThemeToggle`) reused as
required by the contract — it owns the `<html data-theme>` write (WEB-012); given
a token `.themeButton` icon-button skin. The language switch keeps the genuine
`/locale?set=ar` / `/locale?set=en` links (now with the active locale marked
`aria-current`). Sign out is a real `<a href="/signout">` full navigation (not a
client `Link`), styled danger.

**No literal visual values, no `<svg>`.** The back and three row chevrons →
`previousPage` / `nextPage` registry icons (the chevron mirrors under RTL via
`--sqx-mirror`). Inline `style={{ width: 15, … }}`, the `var(--text-muted)` /
`var(--status-*-text)` legacy tokens and the `btn`/`t-caption`/`badge`/`seg`
legacy classes are all gone.

**Five specs re-pointed across the migration, guarantees preserved.** The gated
`field-settings-contract` **test #5** read `FieldSettingsClient.tsx` and pinned
the English literal `"Clear cache"` and the function name. Re-pointed to
`settings-panels.tsx`; the `"Clear cache"` guarantee is now asserted as
`copy.data.clearCache` **rendered as a governed row** plus the literal present in
`en/field-settings.json`, with the `.clear()`/`remove`/`resolveConflict` negative
checks intact — the governance (a non-action clear-cache row, read-only offline)
is unchanged, only its expression moved. `ipad-pwa-shell-contract` (readiness +
conflicts links; its `"Device readiness"` label re-pointed the same way),
`field-offline-isolation` (shared-accessor caller list), `responsive-execution-
field` (theme contract) and the pixel manifest all re-pointed to the new path.
Tests #1–4 and #6 of the settings contract read `actions.ts`/devices/migrations
and were untouched.

## Inventory taken before writing code

- **State/effects:** one client island — the offline snapshot (the sanctioned
  external-sync `useEffect` + online/offline listeners). Screen + route are
  Server Components.
- **Copy:** a local `copy(locale, en, ar)` helper inlined both languages at ~40
  sites; all moved to the `field-settings` namespace, Arabic lifted from the
  pairs.
- **`<svg>`/inline styles:** back chevron + 3 row chevrons → registry icons; the
  `style={{ width:15,… }}` chevrons, the `.dot` inline colour, and `flex/textAlign`
  inline styles removed.
- **Accessibility failures found:** the header title was a `FieldHeader` `<div>`
  (no `h1`); section labels were `<div>`s; the sync state leaned on a colour dot.
  Now `h1` (screen) `>` `h2` (six section labels), `StatusPill` for sync, and
  50px+ touch targets via `--sqx-touch-target`.

## Numbers

```
Route: /field/settings  (hub; devices/conflicts/readiness parked)
route file            38 → 11
components ≤ 200      max component 143 (settings-panels); queries.ts 18
client islands        1 → 1  (offline snapshot)
raw <svg>             4 → 0
inline visual literals ~6 → 0
duplicate <main>      0 → 0  (renders a div; shell owns main)
headings              0 → 1 (screen) / 6 × h2 (sections)
rendered sizes        off-scale → 13·15·20
weight cap            700 → 590
hardcoded copy        ~40 copy() sites → 0
typography gate       8 owned violations → 0   (baseline 1232 → 1224)
eslint baseline       7450 → 7423 (27 removed)
design-system-v5      64 → 64 (field-settings adds 0)
source lines deleted  232 (FieldSettingsClient 201 + old stylesheet 31)
specs re-pointed      5 (field-settings-contract #5, ipad-pwa-shell, field-offline-isolation, responsive-execution-field, pixel manifest)
```

## Accessibility

- **Browser-verified (English / dark, Inspector):** `h1` + six `h2` section
  headings, single `<main>` (shell-owned), the sync `StatusPill` renders "Synced"
  (green, with label), every governed row reads "Not configured", the theme
  icon-button, the active-marked language switch, chevron links, and the danger
  Sign out. No hydration warning. (Background console errors are the sandbox's
  Supabase token-refresh network failures — `ERR_INTERNET_DISCONNECTED` — not the
  page.)
- **Found and fixed:** the missing `h1`; the `<div>` section labels; the colour-
  only sync dot.
- Manual checklist: keyboard ✓ · Arabic/RTL — namespace complete, logical
  properties, chevron mirrors via `--sqx-mirror`, `dir="auto"` on labels · dark ✓.
  **axe, light theme, 200 % zoom, Arabic render still owed.**

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED (relocked 7450 → 7423, 27 removed)
- [x] `npm run gates:typography` — PASSED (relocked 1232 → 1224, 8 removed)
- [x] `npm run check:design-system-v5` — **64** (unchanged); field-settings adds **0**
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline** (all 5 re-points land; the settings-contract #5, ipad readiness, offline-isolation and theme tests pass)
- [x] runtime: `/field/settings` renders all six sections + sign out, single `<main>`, no page console errors
- [ ] axe, light theme, 200 % zoom, Arabic browser render — still owed

## Retirement

Deleted at zero imports: `FieldSettingsClient.tsx` (201), the old route-level
`settings.module.css` (31) — **232 lines**. The `settings/` folder is now
`page.tsx` + `loading.tsx` + the (unmigrated) `devices`/`conflicts`/`readiness`
sub-routes; the hub's logic lives in `features/field-settings/` and
`components/sections/field-settings/`.

## Parked

- **`/field/settings/devices`, `/conflicts`, `/readiness`** — the three sub-route
  screens (see the tracker PARKED block). Each is its own task; devices carries
  the mvp3 self-enrollment governance (`field-settings-contract` #1–4/#6).
- axe + light-theme + 200 % zoom + Arabic browser pass on the hub.

## Blocked / open questions

None.

## Proposed commit

```
feat(field): rebuild settings hub on saqeel primitives
```

## Next

The parked settings sub-routes, or the two large execution screens (`[visitId]`
startup, the 1,991-line `inspection/[id]/Workspace`).

# 2026-08-22 · T-179 — retire "Saqeel" everywhere a user can see it

`task: T-179` · `status: partial — slice A done, B/C/D scoped and parked` · `duration: 1h`
`rules applied: WEB-003, WEB-006, WEB-008, WEB-013, WEB-016`

---

## Goal

Manager-directed: "Saqeel" is banned as a name. Remove it from every surface a
user can see, hear or install.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `apps/web/public/manifest.json` | PWA name and short name renamed | unchanged |
| `apps/web/public/saqeel-favicon.svg` | `aria-label` renamed | unchanged |
| `apps/web/public/saqeel-wordmark-dark-mode.svg` | deleted | −1 file |
| `apps/web/public/saqeel-wordmark-light-mode.svg` | deleted | −1 file |
| `apps/web/public/saqeel-wordmark-dark.svg` | deleted | −1 file |
| `apps/web/public/saqeel-wordmark-light.svg` | deleted | −1 file |
| `apps/web/e2e/web-admin-f0-foundation.spec.ts` | re-pointed; stale since T-174 | −8 |

## Decisions

**T-174 did not finish the user-visible rename, and the miss was the worst one.**
`public/manifest.json` still read:

```
"name": "Saqeel Industrial Inspection Platform"
"short_name": "Saqeel"
```

That is the **PWA install prompt and the home-screen label on every inspector's
phone** — the single most-seen brand surface in the product, and the one the
field app is installed as. T-174's record claims it covered "metadata/PWA
title"; it covered `layout.tsx` metadata, not the manifest.

**Two smaller leaks in the same class.** `saqeel-favicon.svg` carried
`aria-label="SAQEEL"`, so a screen-reader user heard the banned name. Four
wordmark SVGs rendered a literal `<text>SAQEEL</text>` and `<text>صقيل</text>`.

**The wordmarks were dead, and deleting them cleared WEB-006 §4.** Referenced
only from a comment in `ShellClient.tsx`; not imported, not in the service
worker precache, not in the manifest. The only reader was a test fixture, and
that spec was stale anyway (below). Deleted rather than corrected — nothing
renders them and the app shell has used inline DOM text since WA-BRAND-r1.

**`web-admin-f0-foundation.spec.ts` was red before this task.** It asserted
`lang="en">SAQEEL</span>` and `lang="ar">صقيل</span>` in the app shell. The
shell itself has said `Inspection Platform` / `منصة التفتيش` since T-174 — the
spec was never updated. **This is the third stale spec T-174 left behind**
(T-175 fixed two in `saqeel-login-revamp.spec.ts`). A rename task that does not
sweep `e2e/` by source path leaves red tests that nobody attributes to it.

**Asset FILENAMES were deliberately not renamed.** `saqeel-favicon*.svg/png`
keep their names. A filename is not a brand — no user reads it — and
`public/sw.js` precaches `/saqeel-favicon.svg` by path. Renaming a precached
asset risks breaking the service worker for **already-installed field clients**,
which is a real regression on the surface that matters most. Not worth it for
zero reader benefit. Parked with that reasoning.

**The internal design-system rename was NOT started.** See below.

## Inventory taken before writing code

Measured the full blast radius before touching anything:

```
--sqx- token occurrences            5,425
sqx- class occurrences              5,467  (per-file count 64 after dedupe)
files importing components/saqeel     603
files mentioning saqeel (any)         995
asset files named saqeel-*              8
```

**995 files is not a 2-hour slice** (WEB-008), and the token prefix rename must
be atomic or the application loses all styling mid-migration. Split into four,
and only A was in scope for the ban the manager actually issued:

- **A — user-visible (DONE).** manifest, favicon accessible name, wordmark text.
- **B — filenames and comments (parked).** Mechanical, zero behaviour, but
  touches the service-worker precache; see Decisions.
- **C — `components/saqeel/` and 603 imports (parked).** Mechanical, enormous
  diff, no user benefit.
- **D — `--sqx-` / `.sqx-` prefix, ~10,900 occurrences (parked, needs a
  decision).** Highest regression risk in the repo. It also **contradicts
  CLAUDE.md's Design authority section and WEB-002 §2**, which mandate the
  `--sqx-` prefix precisely because `--sq-`/`.saqeel-` collide with the frozen
  legacy sheets. Doing D means amending both first, exactly as T-173 amended the
  palette rule. **That is a manager decision, not an agent one.**

Also found and NOT changed: `src/app/(app)/field/layout.tsx:30` loads
`/saqeel-ds/saqeel/styles.css` with a raw `<link>` on every field route — a
vendored stylesheet outside the design system. Out of scope; parked.

## Numbers

```
user-visible "Saqeel" before this task
  PWA install name + home-screen label      2 strings, every installed phone
  favicon accessible name                   1 aria-label
  wordmark rendered text                    4 assets, SAQEEL + صقيل
user-visible "Saqeel" after                 0
dead assets deleted                         4 files
stale spec assertions re-pointed            8 lines
remaining internal references                995 files (slices B/C/D)
```

## Accessibility

- The favicon's accessible name now reads "Inspection Platform" instead of
  "SAQEEL". This was a real defect: the accessible name is what a screen-reader
  user is told the app is called.
- axe-core: **not run** — no rendered surface changed, but stated as a gap.
- Manual: manifest verified as served — `curl localhost:3000/manifest.json`
  returns `"name": "Inspection Platform"`, `"short_name": "Inspection"`.

## Verification

- [x] `npm run typecheck` — 0 errors
- [x] `npm run gates` — typography, content and date-inputs all PASSED;
      `check:design-system-v5` fails on pre-existing debt, zero hits on this
      task's files. Not ticked as green.
- [x] Served manifest confirmed live
- [x] Zero user-visible SAQEEL remains — the only occurrence left in any shipped
      asset is inside an SVG **comment**, which is neither rendered nor announced
- [ ] `npm run test:e2e` — not run. `web-admin-f0-foundation.spec.ts` was red
      before this task and should now pass; **unproven, do not claim it.**

## Retirement

Deleted: four dead `saqeel-wordmark-*.svg` assets. WEB-006 §4 gate cleared —
zero imports, no dynamic reference, no precache entry, test fixture removed
first.

## Parked

- Slice B — rename `saqeel-*` asset files; must handle the `sw.js` precache path
  and existing installed clients.
- Slice C — rename `components/saqeel/` and 603 importing files.
- Slice D — rename the `--sqx-` / `.sqx-` prefix. **Blocked on a manager
  decision plus amendments to CLAUDE.md and WEB-002 §2.**
- `/saqeel-ds/saqeel/styles.css` loaded by raw `<link>` on every field route.
- A rename task must sweep `e2e/` by source path. T-174 left three stale specs.
- Arabic PWA name: `manifest.json` is single-locale. A localized manifest for
  Arabic home-screen labels does not exist.

## Blocked / open questions

Slice D changes the design system's token prefix repo-wide and contradicts two
binding documents. It needs an explicit decision before any agent starts it.

## Proposed commit

```
fix(brand): remove Saqeel from every user-visible surface
```

## Next

Manager decision on slice D, or another surface.

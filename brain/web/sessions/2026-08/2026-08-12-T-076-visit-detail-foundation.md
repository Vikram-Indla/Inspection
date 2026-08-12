# 2026-08-12 · T-076 — `/visits/[id]` foundation: Riyadh timestamps, narrowed reads, skeleton (slice 1 of 3)

`task: T-076` · `status: partial (i18n is slice 2, the visible screen is slice 3)` · `duration: ~2h`
`rules applied: WEB-000, WEB-001, WEB-002, WEB-005, WEB-006, WEB-008, WEB-011`

---

## Goal

Owner-reported: the visit detail screen is legacy with a legacy loading state.
Slice 1 takes correctness and the data layer; i18n is slice 2 and the visible
rebuild is slice 3.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `app/(app)/visits/[id]/page.tsx` | reads removed, timestamps corrected | **546 → 443** |
| `features/visits/detail/queries.ts` | created | 165 |
| `features/visits/detail/view.ts` | created | 173 |
| `features/visits/detail/shapes.ts` | created | 130 |
| `features/visits/detail/types.ts` | created | 75 |
| `components/visits/visit-detail-skeleton/**` | created | 65 + 23 |
| `app/(app)/visits/[id]/loading.tsx` | off the legacy `EmptyState` | 13 → 12 |
| `e2e/cd-027-visit-detail.spec.ts` | re-pointed to the feature modules | — |

## Decisions

**Every timestamp on a Saudi ministry record was rendering in UTC.** Twelve
`new Date(x).toISOString().slice(...)` call sites printed the visit window,
submission versions, plan dates, lifecycle, location, journey and audit times
**three hours early**. The screenshot that opened this task shows
`window 2026-08-06 09:00` for a window that starts at 12:00 Riyadh.

**The screen already disagreed with itself.** `cutoffDisplay` used
`Intl.DateTimeFormat` with `timeZone: "Asia/Riyadh"` — one correct timestamp
among twelve wrong ones, in the same component. The correct helper,
`formatDateTime(value, locale)`, has existed in `lib/dates.ts` throughout.

**A thirteenth site was the `riyadhToday()` defect this file already records.**
`const today = new Date().toISOString().slice(0, 10)` bounded the repackage
options, so a package version could be judged out of its effective window
**three hours before it actually was**. The rendered DOM now contains **zero**
`YYYY-MM-DD HH:MM` timestamps and every stamp carries `(Riyadh)`.

**The eight `as unknown as` casts were not cosmetic — three of them were lies.**
Moving the reads onto `readRows`/`readSingle` + a `Shape<T>` made the compiler
report what the casts had suppressed: `factories` and `package_versions.packages`
are **nullable** and the old code dereferenced both unconditionally. A visit whose
factory is hidden by RLS would have thrown a runtime `TypeError` inside a Server
Component. The factory name now falls back and the Factory 360 link renders only
when there is a factory to link to.

**`visit_packages.snapshot` is `Record<string, unknown>` and was being read as a
typed object.** It is an immutable JSON copy taken at link time, so its shape is
whatever was written then — four fields were read off it with no narrowing.
`snapshotText(snapshot, key)` narrows once and returns `string | null`.

**A spec that names a file rots when the behaviour moves — third instance.**
`cd-027-visit-detail.spec.ts` asserted `.limit(30)` and `createSignedUrl` against
`page.tsx` as one file, plus two negative assertions. `DETAIL_SOURCE` is now the
route **plus its feature modules**, the same shape `/operations`,
`/operations/live` and the exception board already use.

**One negative assertion had to get *narrower*, not wider.** Widening
"no raw provider text" to `/\.error\.message/` over the whole feature source
failed immediately: `queries.ts` logs provider messages to the **server console**
deliberately — that is the narrowing boundary reporting why a read failed. The
rule is that none of it reaches the rendered page, so the broad check stays on
`page.tsx` and only `vErr`/`attErr` are asserted across the modules.
**Check what an assertion is actually protecting before you generalise it.**

**The route file is still 443 lines, not ≤40, and that is deliberate.** Reaching
the cap needs ~240 lines of legacy JSX extracted into components — markup slice 3
rewrites on SAQEEL. Transcribing it twice would be churn with a real chance of
introducing a typo the compiler cannot see, so the cap moves to slice 3 where the
componentisation happens once. **Stated rather than quietly missed.**

## Inventory taken before writing code

- **State/effects:** none in the route; it is a Server Component. Untouched.
- **Reads:** 9 inline `sb.from()` calls plus 2 RPCs → **0** in the route.
- **Casts:** 8 `as unknown as` → **0**.
- **Literals:** none introduced.
- **`<svg>`:** none. The `…` glyph in the loading state is gone; `∅` in
  not-found and the ribbon's `▣ ● ⬡ ◇ ◆` remain — slice 3.
- **Accessibility:** unchanged in this slice. The duplicated `<h1>` under
  `?wa_route_base=planning`, and the five glyph tabs, are slice 3.

## Numbers

```
Route: /visits/[id]
route file            546 → 443 lines   (cap 40 — slice 3)
inline reads            9 → 0
RPC calls in route      2 → 0
`as unknown as`         8 → 0
UTC timestamp sites    13 → 0
rendered UTC stamps    all → none  (verified in the DOM)
design-system gate    3 utc-slice violations → 0
client islands          4 → 4  (unchanged: ActionBar, Attachments, NotesEditor, ribbon)
```

## Accessibility

- **axe: not run.** Owed.
- Manual checklist: keyboard — owed · screen reader — owed · 200% zoom — owed ·
  320 px — owed · Arabic/RTL — **slice 2** · dark — **verified rendering** ·
  light — owed · reduced motion — the skeleton honours it · greyscale — owed
- No accessibility defect fixed or introduced in this slice.

## Verification

- [x] `npm run typecheck` — clean
- [ ] `npm run lint` — no `lint` script exists
- [x] `npm run gates` — typography PASSED, zero new; **`visits/[id]` no longer
      appears in the design-system violation list** (was 3 × `utc-slice-date-format`)
- [x] **Every cd-027 source assertion verified by script** — `.limit(30)`,
      `createSignedUrl`, the five ribbon domains, the `neutral` import, and all
      four negative assertions.
- [x] **Rendered signed in on a real visit:** 5 tabs, a visible tabpanel, all
      seven anchors (`#config #inspection #packages #lifecycle #location
      #journey #audit`), no error or not-found state, and
      `window 11 Aug 2026, 06:00 (Riyadh) → 15 Aug 2026, 11:30 (Riyadh)`.
      **Zero `YYYY-MM-DD HH:MM` matches in the whole document.**
- [ ] `npm run test:e2e` — needs the seeded personas
- [ ] Definition of Done — not fully ticked

## Retirement

Nothing marked or deleted. `ActionBar`, `Attachments`, `NotesEditor`,
`DualStateRibbon`, `FocusScroll` and `neutral.ts` are slice 3's subject.
`actions.ts` (497 lines, the write layer) is untouched by design.

## Parked

- `page.tsx` still holds ~240 lines of legacy JSX and 42 comments.
- 187 `className` uses across the six route files; zero SAQEEL components.
- The `?wa_route_base=planning` preview renders the title twice — `Shell title`
  and an `<h1>` in a `page-header`.
- `enum.${x}` fallbacks print `x.replace(/_/g, " ")` — raw enum when the key is
  missing, the same defect class as T-073's exception board.

## Blocked / open questions

- **No new copy was authored, so nothing needs Arabic review yet.** Slice 2 ports
  the ~98 seeded `visit.*` rows out of four `ui_strings` migrations into the
  locale files — **existing reviewed Arabic, moved, not re-authored.**

## Proposed commit

```
refactor(visits): move visit detail onto a narrowed data layer
```

## Next

**Slice 2 — i18n.** Port the ~98 seeded `visit.*` Arabic rows into
`{en,ar}/visits.json`, then delete the `t(key, "English")` calls and the three
`locale === "ar"` ternaries.

**Slice 3 — the visible screen.** Route file to ≤40, SAQEEL throughout, the
ribbon's five glyphs removed, the actions promoted above the history, and the
five history panels consolidated into one card with four anchored sections
(owner ruling).

## Measurement request (WEB-005 §8 — for the human)

`/visits/[id]`, before and after the three slices: first-load JS, route CSS,
LCP, CLS.

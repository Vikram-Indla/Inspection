# 2026-08-17 · T-131 — one typeface across the legacy routes, and the Arabic defect it exposed

`task: T-131` · `status: done` · `duration: ~2h`
`rules applied: WEB-002, WEB-011, WEB-014 (and corrected WEB-014 §2.0)`

---

## Goal

Start the ~80 legacy routes onto the system. The tracker framed this as a route
sweep; measuring first found a cross-cutting move worth more than any single
route, in the shape of T-129.

## What changed

| File | Action |
| --- | --- |
| `app/tokens.css` | `--font-body` → `var(--sqx-font-sans)`, in both the root and the RTL block |
| `app/layout.tsx` | Inter loaded with `adjustFontFallback: false` |
| `rules/WEB-014` §2.0 | corrected — the claim written in T-129 was wrong |
| `e2e/design-foundation-contract.spec.ts` | font assertion re-pointed and strengthened |

Two token lines and one font option. That is the whole change, and it moves
every route the frozen sheets still style.

## Scope: the sweep was not a sweep

`tokens.css` holds **149 custom properties, 64 of which already alias
`--sqx-*`** and only 4 of which carry a raw value. So T-129's palette had
**already flowed through to the legacy routes** — colour was never the split.

The split was typography, and it was in two parts:

```
frozen legacy               approved language
--font-body  Plex only      --sqx-font-sans  Inter → Plex
--type-body  14px/400       body 15px/400
--type-display 28px/600     display 32px/510
```

Measured on `/factories` before the change: **122 nodes rendering Inter, 10
rendering Plex**, and those same 10 were the `14px` ones — precisely the
elements still styled by the frozen sheets. After: **132 of 132 Inter.**

**The size half was deliberately not done.** Mapping the frozen scale onto the
approved one means 17px → 24px headings and 22px → 32px titles across ~80
routes that cannot all be rendered here. That is a layout-affecting change and
it wants its own task with per-route measurement, not a bulk edit at the end of
this one. Recorded as T-132 with the numbers above.

## The defect this exposed, which I introduced in T-129

Extending the stack to the legacy routes made me measure Arabic, and Arabic was
**not rendering in Plex**:

```
as declared  49.81   ≡  Inter 48.77-ish      Plex 55.33
stack:  inter, "inter Fallback", plexArabic, "plexArabic Fallback", …
```

`next/font` synthesises an **`"<name> Fallback"`** face from a local system font
and inserts it directly after the real one. That synthetic face **does carry
Arabic**, so it captured every Arabic glyph before the chain ever reached Plex.

**Arabic has been rendering in a system face with the wrong metrics since T-129,
on every migrated route, while the font stack still named Plex.** Nothing caught
it: the stack read correctly, Latin was correct, the typography gate is about
declarations rather than rendering, and T-129's Arabic checks measured
letter-spacing and digits — not the typeface.

Fixed with `adjustFontFallback: false` on the Inter loader. Verified in both
scripts:

```
Arabic   as-declared 55.55  ≈  Plex 55.33      (Inter 48.77)
Latin    as-declared 101.61 ≡  Inter 101.61    (Plex 103.28)
stack:   inter, plexArabic, "plexArabic Fallback"
```

**WEB-014 §2.0 was corrected.** It claimed the two-typeface split "needs no
`[lang]` selector" — still true, but only because of a setting the rule did not
name. The rule now states that `adjustFontFallback: false` is load-bearing,
shows both measurements, and adds: *measure each script separately — Latin
passing tells you nothing about Arabic.*

## Numbers

```
/factories  families before   Inter 122 · Plex 10
            families after    Inter 132 · Plex 0   (Latin)
            Arabic before     49.81px  = system fallback
            Arabic after      55.55px  = Plex
            letter-spacing    0 non-zero under RTL (unchanged)
tokens.css  149 props · 64 already aliasing --sqx-* · 2 lines changed
```

## Verification

- [x] `npm run typecheck` — clean
- [x] `npm run lint` — PASSED, 104 below baseline
- [x] `npm run gates:typography` — PASSED, 115 below baseline
- [x] `npm run check:design-system-v5` — 76, unchanged
- [x] `npm run verify:dates` — 17 passed
- [x] `npm run test:static` — **408 passed / 33 failed — exact baseline**
- [x] Measured on `/factories` in English and Arabic, both scripts, by width
- [ ] axe, 320px, 200% zoom, browser e2e — **owed**

## Spec changes

`design-foundation-contract` pinned `--font-body: var(--font-plex-arabic`. The
assertion was **strengthened rather than swapped**: it now asserts the frozen
sheet defers to the design system, *and* that `--sqx-font-sans` names both the
self-hosted Inter and the self-hosted Plex. The original test's stated intent —
"one self-hosted bilingual metric system" — is better served than before, so the
guard was kept meaningful instead of being edited down to whatever shipped.

## Parked

- **T-132: the type-size repoint.** `--type-body` 14px → 15px, `--type-display`
  28px → 32px, `--type-heading-lg` 17px → 24px, `--type-title` 22px → 32px,
  weights 600/700 → 590. Layout-affecting on ~80 routes; needs measurement per
  route family, and the heading jumps want the owner's eye.
- `tokens.css` is nominally frozen (WEB-002 §2) and this task edited two lines
  of it. That is defensible — 64 of its declarations already alias `--sqx-*`,
  and aliasing shrinks the sheet's authority rather than growing it — but the
  rule's wording does not carve this out and should.

## Proposed commit

```
fix(fonts): unify the typeface across legacy routes and repair Arabic fallback
```

## Next

T-132, the type-size repoint, measured per route family. The size split is now
the last piece of the typography divide.

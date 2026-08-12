# 2026-08-12 · T-077 — `/visits/[id]` bilingual resources: 139 keys, and the scope I got wrong (slice 2 of 3)

`task: T-077` · `status: partial (the visible screen is slice 3)` · `duration: ~1.5h`
`rules applied: WEB-000, WEB-006, WEB-008, WEB-011, WEB-013`

---

## Goal

Move every `visit.*` string on the detail route out of TypeScript and into
`{en,ar}/visits.json` at asserted key parity.

## What changed

| File | Action | Lines / keys |
| --- | --- | --- |
| `i18n/locales/en/visits.json` | created | **139 keys** |
| `i18n/locales/ar/visits.json` | created | **139 keys** |
| `i18n/messages.ts` | `visits` namespace registered | — |
| `app/(app)/visits/[id]/page.tsx` | 142 `t()` + 3 `tr()` → `V.*` | 443 → 439 |
| `app/(app)/visits/[id]/loading.tsx` | reads the namespace | 12 → 13 |

## Decisions

**I scoped this slice wrong and said so before doing it.** T-076's record and the
tracker both described slice 2 as *"port the ~98 seeded `visit.*` Arabic rows —
existing reviewed Arabic, moved, not re-authored"*, and the owner approved that.
Cross-referencing key by key showed it was false:

```
visit.* keys used by this route : 139
  seeded with reviewed Arabic   :  21
  inline Arabic in the code     :   3
  NO Arabic anywhere            : 115
```

The 92 seeded `visit.*` keys are spread across **other visit surfaces** —
`spine`, `ledger`, `elig`, `outcome`, `list`, `map`, `ai`, `receipt` — which are
the visits board and its siblings, not the detail route. I had counted the prefix
and assumed coverage. Spot checks settled it: `visit.ribbon.heading`,
`visit.detail.configuration`, `visit.att.heading`, `visit.detail.planHeading` and
`visit.actions.returnBtn` are **none of them seeded**.

**Counting a prefix is not counting coverage.** `grep -c "'visit\."` returns a
number that looks like an answer and is not one. The check that mattered was
`used ∩ seeded`, per key.

So this was not a port; it was **115 newly authored Arabic strings** — the largest
Arabic authoring job in this programme, on its most governed screen. Raised, and
the owner ruled: author them, flagged for review.

**Nine engineering identifiers were shipping to users in both locales.**
`FLD-VIS-001`, `set_operational_state`, `(M8)` in English; `PLN-REQ-011`,
`M02-006`, `M02-006/008`, `M01-050`, `FLD-VIS-001`, `(M8)` in the **seeded,
reviewed** Arabic. This is exactly what
`20260731120000_simple_english_terminology_redo_ar_strings.sql` was written to
fix — its own notes read *"raw '(RLS)' was directly user-visible"* — and that pass
never reached these rows. Stripped from both locales; the sentences keep their
meaning and lose the ticket number. **Reviewed copy is not automatically clean
copy.**

**Typed resources turned a whole class of bug into a compile error.** 144 `V.*`
references type-checked on the **first** run: the namespace shape and the call
sites cannot drift, so a renamed key is now a build failure rather than a silent
English fallback on an Arabic screen. That is the property `t(key, "English")`
can never have — which is *why* 115 strings had gone missing without anything
failing.

**The 26 `enum.*` calls deliberately stayed on `t()`.** They resolve shared,
app-wide vocabulary from `ui_strings` (`planning_status`, `operational_state`,
`geofence_result`, review decisions) and are not this route's to own. They are
also the reason the Arabic screen still shows `pending_supervision`, `follow_up`
and `not started` — a real gap, but an app-wide one, recorded below rather than
forked into a private copy here.

## Inventory taken before writing code

- 139 `visit.*` keys across `page.tsx` (137) and `loading.tsx` (2).
- 3 `tr(key, en, ar)` bilingual ternaries — the WEB-013 banned pattern — now zero.
- 1 `locale === "ar"` left, and it was **not copy**: an `Intl.DateTimeFormat`
  locale selector duplicating `derived.cutoffDisplay`, which the view layer
  already computed. Deleted; the page now has **zero** locale ternaries.

## Numbers

```
Route: /visits/[id]
t("visit.*", "English")   142 → 0
tr(key, en, ar)             3 → 0
locale === "ar" ternaries   1 → 0   (the survivor was a formatter, not copy)
i18n keys in resources      0 → 139 per locale, parity asserted
strings with no Arabic    115 → 0
jargon identifiers in copy  9 → 0
route file                443 → 439 lines
```

## Accessibility

- **axe: not run.** Owed.
- **Arabic/RTL — verified rendering.** `dir=rtl`, `lang=ar`, Arabic-Indic dates
  with `(الرياض)`, and every heading, tab label, panel term, notes placeholder
  and empty-state sentence in Arabic.
- Everything else unchanged in this slice; the glyph tabs and the duplicated
  `<h1>` are slice 3.

## Verification

- [x] `npm run typecheck` — clean, first run
- [ ] `npm run lint` — no `lint` script exists
- [x] `npm run gates` — typography PASSED, zero new
- [x] **Key parity asserted by script — 139/139**, no orphan on either side
- [x] **Zero Latin prose in `ar/visits.json`** — the only Latin remaining is
      interpolation placeholders (`{state}`, `{cutoff}`, `{name}`, `{reason}`,
      `{id}`, `{factory}`, `{n}`, `{who}`), all verified intact
- [x] **Rendered signed in, both locales.** English: config, lifecycle, notes,
      15 `(Riyadh)` stamps, no jargon leak. Arabic: RTL, Arabic-Indic dates,
      Arabic headings and panel terms.
- [ ] `npm run test:e2e` — needs the seeded personas
- [ ] Definition of Done — not fully ticked

## Retirement

Nothing marked. The 21 seeded `visit.*` rows this route used are now **orphaned
in `ui_strings`** — still seeded, no longer read. They are not deleted here: other
visit surfaces read neighbouring keys from the same migrations, and pruning them
is its own task with its own blast radius.

## Parked

- **26 `enum.*` values render English on the Arabic screen** —
  `pending_supervision`, `follow_up`, `physical`, `not started`. App-wide
  vocabulary in `ui_strings`, not fixable inside one route.
- The 21 orphaned seeded rows above.
- `page.tsx` still holds ~240 lines of legacy JSX, 42 comments, 187 `className`
  uses across the route — slice 3.

## Blocked / open questions

- **115 newly authored Arabic strings need a native review** — the whole
  `visits` namespace except the 24 carried across. This is the largest Arabic
  review debt raised by a single task in this programme; it covers the ribbon,
  every management action, the attachments table and all four history sections.

## Proposed commit

```
feat(visits): move visit detail copy into bilingual resources
```

## Next

**Slice 3 — the visible screen.** Route file to ≤40, SAQEEL throughout, the
ribbon's five glyphs (`▣ ● ⬡ ◇ ◆`) removed, actions promoted above the history,
and the five history panels consolidated into one card with four anchored
sections (owner ruling).

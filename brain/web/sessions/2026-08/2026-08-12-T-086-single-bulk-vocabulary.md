# 2026-08-12 · T-086 — "one/multiple" → Single/Bulk, and where it actually was

`task: T-086` · `status: done` · `duration: 1h`
`rules applied: WEB-000 §9, WEB-006 §4, WEB-008, WEB-011, WEB-013`

---

## Goal

Replace the "one" / "multiple" method vocabulary with Single / Bulk so the three
planning methods are named consistently.

## What changed

| File | Action | Detail |
| --- | --- | --- |
| `app/(app)/factories/[id]/page.tsx` | fixed | `"Plan one visit"` → `"Plan a single visit"` |
| `app/(app)/field/factory-360/[id]/page.tsx` | fixed | `"Plan one visit"` → `"Plan a single visit"` |
| `app/(app)/factories/cr/[id]/page.tsx` | fixed | `"Plan single visit"` → `"Plan a single visit"` |
| `lib/factory360/arabic.ts` | fixed | `"تخطيط زيارة واحدة"` → `"تخطيط زيارة فردية"` |
| `e2e/cd-022-identity-lens.spec.ts` | re-pointed | asserted a string the code had **already** stopped rendering |
| `i18n/locales/en/planning.json` | deleted | dead `assistant.quick.*` (6 keys) |
| `i18n/locales/ar/planning.json` | deleted | the same 6 |

## Decisions

**The reported defect was not on `/planning`. It was on Factory 360.** Rendering
all three planning routes and scanning the output, every "one" on `/planning`,
`/planning/bulk` and `/planning/single` is an ordinary numeral in a correct
sentence — *"at least one criterion"*, *"one registered factory"*, *"create one
visit"*. The picker titles already read **Single Visit / Bulk Planning /
Immediate Visit**. Nothing there needed renaming.

**The live defect was one key with two different English labels.**
`f360.actions.planSingle` has **no entry in `en` or `ar` factories.json**, and
`getDict("en")` returns `{}` — so for these legacy `t(key, en)` call sites *the
English literal in the code is the rendered string*. Three call sites hardcoded
two different defaults, so the same button read **"Plan single visit"** on
`/factories/cr/[id]` and **"Plan one visit"** on `/factories/[id]` and
`/field/factory-360/[id]`.

**The governance message picked the wording, not taste.**
`features/planning-single/strings.ts:264` renders *"Only planning staff can use
**Plan a single visit**."* — a denial that **names the control**. A button and the
sentence naming it must match exactly, so all three call sites became
*"Plan a single visit"*. Any other choice would have made the denial reference a
control that does not exist by that name.

**A spec was already stale and would have failed.**
`cd-022-identity-lens.spec.ts:422` asserted `/Only planning staff can use Plan
one visit/i` while the source string has said *"Plan a single visit"* for some
time. **The rename had already happened in the code and the spec was never
updated** — found only because this task grepped the old wording. Re-pointed, not
dropped (T-062 protocol).

**Dead copy was deleted, not renamed.** `assistant.quick.planSingle`
("Plan one visit") and `assistant.quick.planBulk` ("Plan multiple visits") are
the literal strings reported — and they render nowhere. `PlanningAssistant`
receives `messages.assistant` but its `PlanningAssistantStrings` declares **four**
props (`aria`, `advisory`, `stripTitle`, `insightsEmptyTitle`) and renders only
those. Renaming text nothing displays is not a fix; the subtree went.

**Arabic was reused, not authored.** `تخطيط زيارة فردية` uses **فردية**, the word
already live in `methods.single` and `create.single.title`. The deleted
`methods.singleTitle` used a *different* word (`مفردة`); picking the dominant live
term keeps one Arabic vocabulary rather than preserving the rarer variant.

## Inventory taken before writing code

- 3 rendered planning routes scanned for `one|multiple` — all numerals, none a
  method name.
- 3 `f360.actions.planSingle` call sites, 2 distinct defaults, 0 locale entries.
- 1 in-code Arabic fallback map entry (`FACTORY360_AR_FALLBACK`).
- 1 stale spec assertion.
- 6 dead `assistant.quick.*` keys per locale.
- 2 dead manifest entries on landing/login (parked — see below).
- No state, effects, `<svg>` or markup changed.

## Numbers

```
Labels for one button        2 → 1   ("Plan a single visit" everywhere)
Dead i18n strings           12 → 0   (6 keys × 2 locales)
Stale spec assertions        1 → 0
Locale parity            1005 = 1005 keys, identical sets
English leaked into ar/      0 (asserted by script)
```

Rendered and verified on the dev server: the Factory 360 control reads
**"Plan a single visit"** with `href="/planning/single?cr=…&source=factory360"`
intact. `"Plan one visit"` returns **zero** matches across `src/` and `e2e/`.

## Accessibility

Label text only; no markup, roles or structure changed. The denial message and
the control it names now use identical wording, which is an improvement for
screen-reader users who hear the message and then look for the control.

## Verification

- [x] `npm run typecheck` — no error in any file this task touched (one
      pre-existing failure in `components/visits/visit-actions/visit-actions.tsx`,
      the concurrent ActionBar rework, not this diff)
- [ ] `npm run lint` — script does not exist (T-083)
- [x] `npm run gates:typography` — PASSED, 851, none new
- [x] Locale parity asserted by script — 1005 = 1005, identical
- [x] No English in `ar/planning.json` — asserted by script
- [x] Rendered on the dev server as a seeded Planner
- [ ] `npm run test:e2e` — not run; needs a production build. **The re-pointed
      `cd-022` assertion is the one that most wants it.**

## Retirement

`assistant.quick.*` deleted from both locales. The surrounding `assistant`
namespace is still **43 keys of which 4 render** — see Parked.

## Parked

1. **`assistant.*` is 47 keys and `PlanningAssistant` renders 4.** Two whole
   generations of quick-action strings sit dead in both locales, including exact
   duplicates (`assistant.quickTitle` and `assistant.quickActionsTitle` are both
   "Quick Actions"; `assistant.quickReviewReturned` and the deleted
   `assistant.quick.reviewReturned` were both "Review returned visits"). A dead
   copy sweep, not a rename.
2. **Two dead manifest entries still carry the old vocabulary** —
   `landing.persona.portal.desc` ("Plan multiple visits, plan one visit, …") and
   `login.portal.point1` ("Plan multiple visits, one visit, …") in
   `lib/i18n-keys.generated.ts`. **Neither key is referenced outside the
   manifest.** Left alone deliberately: the manifest feeds the `ui_strings`
   Arabic seeding step, so editing it changes a database sync, not a screen.
3. **The three Factory 360 screens cannot read the typed locale files at all.**
   They are wholly on the legacy `t(key, en)` system — **167, 152 and 115 call
   sites** — and `factories.json` has no `f360` subtree. Moving this one key into
   proper `en`/`ar` JSON means migrating those pages onto `getMessages`, which is
   T-020-scale work on route files of 522, 410 and 381 lines. **Raised, not
   filled** (WEB-002 §2).

## Blocked / open questions

**The owner asked for this copy to live in the respective JSON files, and for
these three screens that is currently impossible** without the migration in
Parked 3. The English now sits in a `t()` default and the Arabic in
`FACTORY360_AR_FALLBACK` — both WEB-013 "retiring legacy". This task made the
three labels *consistent*; it did not make them *compliant*. Stated, not quietly
missed.

## Proposed commit

```
fix(factories): name the single-visit action consistently across factory 360
```

## Next

`/planning/single` typography — 8 own violations across 5 modules, already
inventoried and confirmed to sit entirely on plain text (no control needs
`font: inherit`). Then T-084, `/planning/bulk/review`.

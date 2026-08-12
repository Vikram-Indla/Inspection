# 2026-08-12 · T-078 — repair the already-broken responsive spec

`task: T-078` · `status: partial — one spec repaired; the deletion-enabling re-pointing is not started` · `duration: 45m`
`rules applied: WEB-000, WEB-006 §4, WEB-008`

---

## Goal

Re-point the spec assertions that block deleting the three remaining orphan
trees. **The investigation found something more urgent first.**

## What changed

| File | Action |
| --- | --- |
| `e2e/responsive-dashboard-operations.spec.ts` | repaired two tests that throw at read time; live claims cross-referenced rather than duplicated |

## Decisions

**The suite is already broken, and not by anything in this programme's
deletions.** `responsive-dashboard-operations.spec.ts` reads two files that
T-070/T-071 deleted during the live-ops rebuild:

- `src/app/(app)/operations/live/live.module.css`
- `src/app/(app)/operations/live/LiveOps.tsx`

Its `read()` is a bare `readFileSync`, so **two tests throw before a single
assertion runs**. `git log` on the spec returns nothing — it was never touched
by that work. This is exactly the failure mode the other agent recorded in
T-070 ("a spec that names a file rots when the behaviour moves"); the same
rebuild that produced the lesson missed one of its own call sites.

**The live claims were already re-pointed — in a different spec.**
`web-admin-m3-operations.spec.ts:302-312` carries them, with the reasoning
attached: `live.module.css` had zero importers, its responsive and direction
claims moved onto the CSS that actually paints the route, and **the old
`[dir="rtl"]` override was deliberately not carried across because WEB-002 §6
forbids one** — the replacement asserts logical properties and no direction
override instead.

So the correct repair here was **not** to re-point a second copy. Duplicating a
claim in two specs makes both weaker: either can drift and the other still
passes. The live reads were removed with a comment naming the spec that now
owns the contract. **De-duplicating a re-pointed claim is not dropping it.**

**`providerFailed` and the locale contract did need re-pointing**, because they
are claims about the live *component*, not its stylesheet. `LiveOps.tsx` →
`components/operations/operations-live/operations-live.tsx`, verified to contain
both `providerFailed` and `locale: "en" | "ar"`.

**Every assertion was verified by script against the real files**, per T-070's
rule that a re-pointed assertion is checked, never eyeballed. 13/13 pass. The
one "MISSING" the verifier printed was its own regex catching the `"utf8"`
argument of `readFileSync` as a path.

**The dead dashboard tree is bigger than recorded.** `RevampStrategicView.tsx`
is imported **only** by `DashboardView.tsx`, which has zero importers — a second
closed dead pair, like the `assistant-view.ts` cycle in T-077. The tree is
therefore `DashboardView`, `DecisionCanvas`, `RegionalScope`, `BasisDrawer`,
`RevampStrategicView` and `dashboard.module.css`.

## Inventory taken before writing code

- Every `read()` path in the target spec checked for existence **first** — which
  is what surfaced the pre-existing breakage.
- `git log` on the spec, to establish the breakage was not from this programme.
- The replacement contract located in `web-admin-m3-operations.spec.ts` before
  writing a new one.
- Runtime importers re-checked for `RevampStrategicView` and `DashboardView`.

## Numbers

```
tests repaired                   2  (both were throwing at read time)
assertions script-verified   13/13  pass
spec files still blocking deletions   7
```

## Accessibility

Not applicable — no application code changed.

## Verification

- [x] `npm run typecheck` — clean (the `features/visits/detail/strings.ts`
      error in the tree is the concurrent `visits` work, not this task)
- [x] All `read()` targets in the repaired spec exist
- [x] All 13 literal assertions verified by script against the real files
- [ ] **The suite was not run** — needs a production build (WEB-005 §8). Script
      verification proves the substrings exist; it does not prove the tests pass.

## Retirement

No deletions. The three trees remain blocked.

## Parked — what the deletion-enabling work actually requires

**7 spec files hold assertions against files we want to delete.** Each claim has
to be traced to the shipped surface and re-pointed, per T-063's rule:
*re-point the assertion, do not delete it.*

| Blocked deletion | Specs to re-point |
| --- | --- |
| `DashboardView.tsx` (+ `RevampStrategicView`, `DecisionCanvas`, `RegionalScope`, `BasisDrawer`) | `execution-crossmodule-contract`, `insp-717-reports-index`, `responsive-dashboard-operations`, `wcag-inspector-field-audit` (comment only) |
| `dashboard.module.css` | `design-foundation-contract`, `responsive-dashboard-operations` |
| `FactoryList.tsx` | `factory360-cr-dossier-contract`, `ui-compliance-contract`, `terminology-regression` (comment only) |
| `factory-list.module.css` | `factory360-cr-dossier-contract` |
| `operations-details.tsx` | `web-admin-m3-operations` |

The assertions are **governance claims**, not cosmetics — e.g.
`"Compliance in approved inspections"`, `"approved inspections only"`,
`href="/reports"`, `"Open records"`. Each needs its equivalent located in
`strategic-view` / `operational-view` / the reports route before the old file
can go, and **some claims may no longer be the right claim** — the `[dir="rtl"]`
case above is the precedent.

This is a contract task, it wants a run of the suite to confirm, and it should
not be rushed alongside a deletion.

## Blockers

The deletion-enabling re-pointing is blocked on being able to run the e2e suite
to confirm the re-pointed assertions actually pass — a production build, which
is the human's (WEB-005 §8).

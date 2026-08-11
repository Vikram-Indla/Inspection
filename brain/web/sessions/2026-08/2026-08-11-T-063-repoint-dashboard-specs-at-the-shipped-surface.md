# 2026-08-11 · T-063 — re-point the dashboard specs at the shipped strategic surface

`task: T-063` · `status: done (suite not executed)` · `duration: 40m`
`rules applied: WEB-000, WEB-006, WEB-008, WEB-011`

---

## Goal

Fix the dashboard specs that assert a screen which no longer renders — copy from
the retired `RevampStrategicView` — so the suite tests the shipped surface
instead of failing on a component nothing imports.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `e2e/web-admin-m1-dashboard.spec.ts` | 2 static copy assertions → 2 registry-note + 2 copy assertions; 3 runtime assertions re-pointed | 3 → 6 (static), 3 → 3 (runtime) |
| `e2e/dashboard-business.spec.ts` | AI-panel heading and body re-pointed | 2 → 2 |
| `e2e/exec-hard-states.spec.ts` | bilingual provider-absence assertion re-pointed | 1 → 1 |

## Decisions

**The rot was in three files, not one.** The owner pointed at
`web-admin-m1-dashboard.spec.ts:200-215`; grepping the retired strings found the
same dead assertions in `dashboard-business.spec.ts:92-93` and
`exec-hard-states.spec.ts:103`. Fixing one and knowingly leaving two identical
failures would have left the suite red for the same reason it was red before.

**Two of the dead assertions were static, not runtime, and would have survived a
DOM-only fix.** `web-admin-m1-dashboard.spec.ts` reads source files as text, and
lines 139-144 asserted `en/dashboard.json` contains two sentences that live only
in `RevampStrategicView.tsx`. Verified with a byte count: `grep -c` over
`en/dashboard.json` returns **0** for both. **A spec that greps source is a spec
that can rot without the DOM changing.**

**Each assertion was re-pointed to where its claim actually lives now, not
deleted.**

| Retired assertion | The claim it protected | Where it lives in the shipped app |
| --- | --- | --- |
| `heading "Provider output withheld"` | generated output is withheld until a provider is configured | the brief strip's `h2` "Executive AI brief" plus its advisory pill and idle line |
| `/No generated claim is shown until a configured provider/` | no AI claim without evidence-linked output | `dashboard.executive.idle` and `STR-KPI-012`'s registry note (`evidence_refs`, "Disabled until configured") |
| `/No quarterly series is inferred/` | the violation time series is never inferred | `STR-KPI-003`'s registry note — "violations has NO issue-time column … cannot be produced without silently substituting submission time, which is prohibited" |

**The registry is the better home for the two governance claims.** They are
statements about what the platform refuses to compute, so asserting the immutable
registry note is stronger than asserting a sentence in a locale file that a
redesign can move. The copy assertions that remain (`executive.idle`,
`It does not attribute a cause`, `no governed annual target is configured`) are
about *reader-facing* honesty, which is exactly what a copy assertion should
cover.

**`exec-hard-states.spec.ts` stays bilingual.** Its whole point is that governed
absence reads as policy in both languages, so the replacement is
`/No brief has been generated|لم يُولَّد أي موجز/` — and the Arabic needle was
verified against `ar/dashboard.json` byte-for-byte rather than typed from memory.

## Inventory taken before writing code

- Grepped `Provider output withheld|No quarterly series|No generated claim` across
  all of `apps/web/e2e` — 3 files, 8 lines.
- Grepped for assertions on copy this sequence deleted (`trend.current`
  "{n} this period", `operational.priorities.title`) — none left except T-062's
  deliberate `toHaveCount(0)`.
- Confirmed `apps/web/tsconfig.json` includes `**/*.ts`, so `npm run typecheck`
  does cover the spec files these edits touch.

## Numbers

```
spec files repaired                     3
dead assertions removed                 6  (3 runtime, 2 static copy, 1 bilingual)
assertions added                        8  (2 registry-note, 3 copy, 3 runtime)
retired-copy references left in e2e     0
typecheck                               clean (e2e included)
```

Every asserted string was verified against its real source before the suite was
trusted — 13 automated checks, all passing:

- the four EN strings exist in `en/dashboard.json`, and the advisory pill's
  middot in the spec is **byte-identical** to the one in the locale file
- the Arabic needle exists in `ar/dashboard.json`
- `STR-KPI-003`'s note matches `/issue-?time/i`; `STR-KPI-012`'s matches
  `/evidence_refs/`
- no retired copy remains in any of the three specs

Then confirmed against the running dev server that each runtime target resolves
to exactly **one leaf element** — "Advisory only · human decides" (1),
"No brief has been generated for this scope yet." (1), the trend footnote in a
`card_description` paragraph — so `getByText` cannot raise a strict-mode
violation, and the three governed-absence words still render exactly.

## Accessibility

No product code changed; nothing to re-verify. The axe and 320 px passes owed
from T-060–T-062 remain owed.

## Verification

- [x] `npm run typecheck` — clean, and it does cover `e2e/**`
- [ ] `npm run lint` — script does not exist in this repo
- [x] `npm run gates` — unchanged (typography green, `check:design-system-v5` at
      the same 91 pre-existing findings)
- [ ] `npm run test:e2e` — **not executed.** These three specs need the seeded
      personas and the full Playwright suite. Every assertion was instead proved
      against its source and against the live DOM, which is stronger than a
      source read but is **not** a green suite.

**A measurement note for whoever runs the suite:** with the Browser pane
undisplayed the page does not composite, so `innerText` returns empty for
rendered nodes while `textContent` is unaffected. Three assertions looked absent
until re-checked with `textContent`. Playwright composites, so this is an
artifact of the inspection method, not of the specs — but do not conclude from an
`innerText` probe that a string is missing.

## Retirement

None. This task removes the last e2e dependency on `RevampStrategicView`'s copy,
which moves that file closer to deletion — its `@retiring` status and importer
count are unchanged, but nothing in the suite now pins its strings.

## Parked

1. **`RevampStrategicView.tsx` and `DashboardView.tsx` are now unreferenced by
   the dashboard specs.** Worth an import-graph check for deletion under
   WEB-006 §4, together with the dead `dashboard.module.css` T-058 routed to
   retirement.
2. Everything parked in T-061 and T-062 still stands.

## Blocked / open questions

None. The blocker T-060 raised and T-062 partly closed is now fully closed.

## Proposed commit

```
test(dashboard): repoint the strategic specs at the shipped surface
```

## Next

Run the owed axe and 320 px pass across T-060–T-063, or execute the e2e suite to
turn these eight verified assertions into a green gate.

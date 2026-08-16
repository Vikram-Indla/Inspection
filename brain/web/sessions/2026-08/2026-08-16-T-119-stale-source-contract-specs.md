# 2026-08-16 · T-119 — the specs were pinned to markup seven tasks had already deleted

`task: T-119` · `status: partial — source-contract half closed; browser half blocked on browsers and credentials` · `duration: 1h`
`rules applied: WEB-002, WEB-006, WEB-007, WEB-008, WEB-013`

---

## Goal

Close the e2e debt that T-111 … T-117 each recorded as owed.

## What changed

| File | Action | Lines before → after |
| --- | --- | --- |
| `apps/web/e2e/analytics-journey-contract.spec.ts` | rebuilt | 45 → 77 · 2 tests → 5 |
| `apps/web/e2e/platform-design-system-contract.spec.ts` | repaired | 2 failing tests → 0 |

## Decisions

**"E2E owed" was not one debt. It was three, and only one of them is about
tests being missing.**

```
browsers absent      npx playwright install never run — chromium-1228 has no binary
credentials absent   SAQEEL_TEST_PASSWORD and SAQEEL_TEST_<ROLE>_EMAIL unset
specs stale          source-text specs assert markup the rebuilds deleted
```

The first two are owner actions. The third is the one this task could close, and
it turned out to be the largest.

**The suite does not actually need a production build.** `playwright.config.ts`
runs `node .next/standalone/server.js`, and no standalone build exists — but
`reuseExistingServer` defaults on, so a running dev server on 127.0.0.1:3000 is
reused and no build is triggered. **This removes the assumption that e2e is
agent-forbidden under WEB-006 §3.** It is blocked on credentials, not on `build`.

**A re-point must assert the claim, not the spelling (T-063, T-078).**
`analytics-journey-contract.spec.ts` asserted `className="kpi-grid"`,
`className="panel kpi"`, `"Export · unavailable"` and
`<code className="id-code">{metric.trace}</code>` — every one deleted by T-111's
rebuild. Rather than delete the spec or transcribe the new markup, each ANL-S01
claim was traced to its new home:

```
truthful states     page.tsx resolveAnalytics · analytics-screen · loading.tsx · error.tsx
per-metric lineage  analytics-blocked.tsx:101   metric.trace
metric definitions  analytics-rates / analytics-counts   metric.definition
export unavailable  features/analytics/bottlenecks.ts    status "unavailable"
no live AI request  bottlenecks attentionQueueNote
```

**Two assertions are now stronger than what they replaced.** `export` and
`attentionQueue` are checked by **importing `ANALYTICS_BOTTLENECKS` and
asserting the data**, not by matching a string — a model assertion cannot drift
when markup changes. And a new test asserts **`en`/`ar` key-set equality** for
`analytics.json`, which nothing checked before (WEB-013).

**`global-error.tsx` is admitted to the raw-colour allowlist, not stripped.** It
renders its own `<html>` and `<body>` because it replaces the document when the
root layout itself threw, so no stylesheet is guaranteed to have loaded and no
`var(--sqx-*)` is guaranteed to resolve. That is the same argument that already
admits `layout.tsx`, and it is the only other such file in `src/**.tsx`.

## Inventory taken before writing code

Not a screen migration. Inventory was of the spec surface:

- **252 spec files**; **146 of them read source files as text** via `readFileSync`
- `playwright.static.config.ts` runs a hand-maintained allowlist of ~70 of those
  with no browser and no auth — **444 tests**
- baseline before this task: **35 failed · 405 passed · 4 skipped**
- specs referencing the routes T-111 … T-117 changed: 6 for `/analytics`,
  20 for `/operations`, 10 for `/dashboard`

## Numbers

```
playwright.static.config.ts    35 failed → 33 failed      405 passed → 407 passed
analytics-journey-contract     2 failed  →  0 failed        2 tests →   5 tests
platform-design-system         2 failed  →  0 failed
```

No route rendered differently, so there are no first-load JS, CSS or Web Vitals
numbers. One `.tsx` line changed in `src/` — none. All changes are in `e2e/`.

## Accessibility

Not applicable — no rendered surface changed. The axe debt of T-111 … T-117
remains owed and is unaffected by this task.

## Verification

- [x] `npm run typecheck` — exit 0
- [ ] `npm run lint` — ESLint absent (T-118)
- [ ] `npm run gates` — exit 1, pre-existing 77 findings, unchanged
- [x] `npm run test:static` — 407 passed, 33 failed (from 405 / 35)
- [ ] `npm run test:e2e` — blocked; see Blocked
- [ ] Definition of Done — not fully tickable; see T-118

## Retirement

Nothing marked or deleted.

## Parked

- **`platform-design-system-contract.spec.ts` failed on Windows for a reason
  unrelated to what it tests.** `path.relative` returns backslashes, so every
  comparison against a `"src/app/…"` literal missed. The guard **passed on Linux
  CI and failed on a Windows workstation**, in two separate tests. Fixed here
  with a `relativePosix` helper. Four other specs call `path.relative`; only this
  one compared the result to a forward-slash literal, but the pattern is worth a
  gate.
- **The remaining 33 static failures are older drift, not T-111 … T-117's.**
  Sampled four — `design-foundation-contract:112` expects
  `sb.from("factories").select("region")` in a shell query that now uses
  `cache`; `responsive-dashboard-operations:9` expects
  `BUSINESS_ROLE_KEYS.includes(role)`; `shell-f0-design-system:56` and
  `compliance-shared-shell:44` expect `className="panel"`. All predate the
  charting tasks. Not chased, per WEB-006 §1.

## Blocked / open questions

**The browser half of the debt cannot be run by an agent, for two reasons that
are both owner actions.**

1. **Playwright browsers are not installed** — `Executable doesn't exist at
   …ms-playwright\chromium-1228`. Closing this is `npx playwright install`, a
   ~150 MB download.
2. **Persona credentials are absent.** `e2e/personas.ts` resolves `password`
   from the environment and throws when unset; neither `SAQEEL_TEST_PASSWORD`
   nor any `SAQEEL_TEST_<ROLE>_EMAIL` is in `.env`, and there is no `.env.local`.
   Every spec in the `e2e` project depends on `auth.setup.ts`, so **the entire
   authenticated suite is unrunnable** until those are set. An agent must not
   handle these values.

Until both are done, the axe runs, the Arabic native reviews and the bundle
numbers owed by T-111 … T-117 stay owed.

## The structural finding

**146 of 252 specs assert the spelling of source files.** Every screen migration
that changes markup breaks the ones pinned to it, and nothing re-points them —
so the suite accumulates red as the redesign progresses, and the red is
indistinguishable from a real regression.

This is a **tax on the migration that is about to be scaled up**, not a
one-time cleanup. Before the next wave of screens, the question worth settling
is whether a source-text assertion is the right instrument at all: a spec that
asserts `className="kpi-grid"` proves nothing about what the user sees, and it
is precisely the class of assertion that T-063 and T-078 already retired twice.

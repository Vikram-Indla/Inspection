# CLAUDE-M3-VISUAL-EVIDENCE-MATRIX-009

Read-only execution packet. Bootstrap re-confirmed this session: `SAQEEL_OPERATING_SYSTEM.md` v2.0, `SAQEEL_REQUIREMENT_SCORECARD.yaml`, `ACTIVE_WORKTREE_LEASES.csv` — all read fresh. No application code, test, PR, branch, database, or live design modified.

## 0. Ownership reconciliation — unchanged, re-verified

`ACTIVE_WORKTREE_LEASES.csv` (fresh): same 6 rows as every prior check this session — `codex/m3-operations-reconciliation` (`REVIEW_ONLY`, PR #60, `PENDING_REVIEW`), `codex/shared-brand-regression` (`REVIEW_ONLY`, PR #61), `codex/orchestration-control-plane` (`CONTROL_WRITER`, coordination-only), `design-sync/discovery` (`HOLD`). No lease covers test infrastructure (`playwright.config.ts`, `auth.setup.ts`, `personas.ts`) or any M3 spec file. This packet does not run or change any test — it specifies the exact evidence matrix for whoever holds the eventual execution lease.

## 1. Auth-fixture blocker — architectural boundary proven, credential root cause NOT confirmed

**What is proven, by direct code inspection this session:**
- `apps/web/playwright.config.ts:31-35` — exactly **two** projects: `"setup"` (matches only `auth.setup.ts`) and `"e2e"` (matches every `*.spec.ts`, `dependencies: ["setup"]`).
- `apps/web/e2e/auth.setup.ts` — **one file**, one Playwright project, containing a loop that registers **five separate `setup(...)` tests**, one per persona in `apps/web/e2e/personas.ts` (`planner`, `inspector`, `reviewer`, `admin`, `ops`), each doing a real `/login` UI sign-in and capturing `storageState`.
- No 400-returning code exists anywhere in `apps/web/src/app/login/**` or `apps/web/src/middleware.ts` for this path.
- **Confirmed against Playwright's own dependency semantics**: `"e2e"` depends on the whole `"setup"` **project**, not on individual persona tests — so *any* one persona's login failure fails the entire `"setup"` project and blocks every spec in `"e2e"`, including every M3 Operations spec, none of which authenticate as `inspector`. This architectural blast radius is proven and does not depend on knowing why the inspector login fails.

**What is NOT proven — corrected from the prior revision:** the prior revision treated `personas.ts`'s comment *"G11 will rotate these [credentials]; update here when rotation lands"* as evidence the inspector password had already been rotated and gone stale. **That is a future-tense comment about a not-yet-applied rotation task — it does not itself prove today's credential state, and no live Supabase Auth response body or non-secret user-state check was captured this session to confirm it.** The correct, honest statement of the observed boundary:

> **Observed boundary**: `.codex-review/m3-baseline-test-results.md` records that the inspector authentication step "returned HTTP 400 and timed out waiting for `/field`" during a prior run. **The exact cause is unconfirmed.** Candidate causes, none eliminated by anything read this session: (a) stale/rotated password (the `personas.ts` comment names this as a *pending* task, not a completed one), (b) a disabled or altered account state for `inspector@mim.gov.sa` in the target Supabase project, (c) the test run targeting the wrong project/environment (credentials valid elsewhere, not there), (d) generic credential drift unrelated to the named G11 rotation.

**To call the credential root cause closed** (as distinct from the architectural blast-radius finding, which is closed) requires, from the actual approved non-production Supabase project, at minimum: (1) the exact HTTP status/response body from a fresh `/auth/v1/token?grant_type=password` call for `inspector@mim.gov.sa` against that project (e.g. `invalid_grant`/`invalid login credentials` vs. some other 400 body distinguishes "wrong password" from other causes), and (2) a non-secret user-state check (e.g. via the project's Auth admin listing — user exists, is confirmed, is not banned/disabled) — neither of which this read-only design-output session has the access or authorization to perform. This packet records the boundary and the required evidence to close it; it does not itself close it.

**Owning files**: `apps/web/e2e/auth.setup.ts` and `apps/web/playwright.config.ts` (test-infrastructure, not application code; not leased by any branch in §0). **The per-persona project split (below) is a test-isolation remedy for the architectural blast radius — it is not a fix for the credential root cause, and does not require knowing that root cause to be worth doing.** Split the single `"setup"` project into per-persona projects (e.g. `setup:ops`, `setup:planner`, `setup:inspector`, `setup:reviewer`, `setup:admin`, each `testMatch: /auth\.setup\.ts/` + a `grep: new RegExp(\`authenticate ${persona}\`)`), then let `"e2e"` — or a new, narrower `"e2e:m3"` project scoped to the M3 spec files — declare `dependencies: ["setup:ops", "setup:planner"]` only, the two personas M3 Operations specs actually use (confirmed: `web-admin-m3-operations.spec.ts`'s runtime tests use `{ page }`/`{ browser }` against `ops`/`planner`, never `inspector`). This isolates M3 certification from the *unconfirmed-cause* inspector gap; it is a test-infrastructure change, out of scope for this packet to perform (read-only), named exactly for whoever picks it up.

**Do not normalize the dependency-bypassed (`--no-deps`) run as certification** — restated as a hard rule for the review order in §8: that run is diagnostic evidence only; a certifying run must go through the real `"setup"`→`"e2e"` dependency chain (or the corrected per-persona chain once split) with a genuinely passing inspector login, or with the M3-specific dependency narrowed as above so the unconfirmed inspector gap no longer sits in that specific chain at all.

## 2. What can run now vs. what must wait for the provenance correction

| Coverage | Runnable now on PR #60 (`c48f71cc`) | Requires `13_CLAUDE-M3-MAP-PROVENANCE-CORRECTION-008` implemented first |
|---|---|---|
| A1 no-mutation, timestamp ordering, decision-time safety | Yes — already implemented and tested (`web-admin-m3-route-safety.spec.ts`) | — |
| Five KPI cards, both decision-blocked values | Yes — already implemented and tested | — |
| DSG-CMD-020 route guard (authorized/unauthorized) | Yes — already implemented | — |
| Two-view toggle (Operations Map / National Performance) | Yes — already implemented | — |
| No-route/no-ETA/no-animation-as-liveness on the live map | Yes — already implemented and tested | — |
| Three-tier map provenance (Last recorded GPS / Projected from assignment-schedule / Location unavailable) | **No** — not implemented on `c48f71cc` (confirmed this session's prior packet: single generic label, entities silently dropped) | Yes — this is exactly what `13_...` specifies |
| Tier-3 list-without-pin behavior | **No** | Yes |
| RTL real rendered proof (beyond the existing static CSS-string check) | Partially — the existing rendered pages (M3 design revision `WA-DES-033-C3`/`034-C3`) can be screenshotted now; the **application** RTL rendering has no real browser evidence yet either way | No dependency on the provenance fix specifically, but no evidence exists yet |
| Light/dark real rendered proof | **No evidence exists at all today** (confirmed prior review: zero dark/light test in either new spec file) | No dependency on the provenance fix, but must still be produced |

## 3. Required viewport / locale / theme matrix — with exact execution mechanics per axis (no CSS-class injection)

5 responsive viewports (`1200`, `1024`, `412`, `390`, `320`) × 2 directions (EN/LTR, AR/RTL) × 2 themes (light, dark) = **20 combinations**, applied to each of the 4 named surfaces (`/operations` Map view, `/operations` National Performance view, `/operations/live` normal, `/operations/live` wallboard) = **80 responsive screenshot targets**, before the three provenance-state variants (§4) are layered on top of the two `/operations/live`-family targets, and **before the separate 1440×900 design-parity reference capture (§5)**, which is outside this 80-target responsive set.

| Viewport | Width | Notes |
|---|---|---|
| 1200 | 1200×800 | Matches `/operations/live`'s own design-declared reference viewport exactly (`DESIGN_ROUTE_MAP.csv` row for WA-DES-034: `reference_viewport = 1200x800`, confirmed this session) — for `/operations/live` this width doubles as its §5 design-parity capture too |
| 1024 | 1024×768 | Named acceptance width, dense-desktop treatment |
| 412 | 412×915 | Mobile |
| 390 | 390×844 | Mobile — confirmed a distinct, separately-required state from 412 per the prior Codex critic pass on the rendered `WA-DES-033-C3`/`034-C3` design (`.codex-review/claude-revision-3-review.md`: "A second critic pass found that 390 pixels had been omitted as a distinct responsive state... Codex verified the Operations Live mobile state as `390×844 · Mobile · dark · EN/LTR`") |
| 320 | 320×568 | Mobile, small |

**Theme axis — exact mechanism, real toggle, not a CSS-class injection:** confirmed this session in `apps/web/src/components/ThemeToggle.tsx` — the real theme state lives in `localStorage["saqeel-theme"]` (`"light"` or `"dark"`) and is applied as `document.documentElement.setAttribute("data-theme", mode)`. Every screenshot in this matrix must be captured after: (1) driving the real `ThemeToggle` control (click, not a script-injected attribute) or setting `localStorage.setItem("saqeel-theme", "dark"|"light")` and reloading (equivalent to what `ThemeToggle`'s own re-apply-after-hydration effect does), and (2) asserting `page.locator("html").getAttribute("data-theme")` equals the intended value **before** the screenshot is taken. For `/operations/live` specifically, also assert the Mapbox style/preset actually switched (the live map's own `mapTheme`/`lightPreset` state, confirmed this session in `GeoMap.tsx`: `mapTheme === "dark" ? "night" : "day"`) — a dark-mode screenshot with a still-daytime basemap is a fail, not a pass.

**Direction axis — exact mechanism, real locale control, not a CSS-class injection:** two equivalent real paths, confirmed this session. (a) Interactive: use the real product locale control (`ShellClient.tsx`'s `languageHref` anchor — a link to the `/locale` route handler) and follow the resulting navigation. (b) Setup-time shortcut, identical to what `auth.setup.ts` itself already does: set the `locale` and `login_locale` cookies directly (`page.context().addCookies([{name:"locale",value:"ar"|"en",...}, {name:"login_locale",value:"ar"|"en",...}])`), then `page.reload()`. **Either path, the assertion is the same and mandatory before every screenshot**: `page.locator("html")` has `lang="ar"|"en"` **and** `dir="rtl"|"ltr"` — both attributes, not just one. No test in this matrix may substitute a manually-injected `class="rtl"` or an inline style for this real, cookie/control-driven state change.

## 4. States to cover per surface

| Surface | States |
|---|---|
| `/operations` Map view | route-authorized, route-unauthorized, loading, empty (RLS-scoped zero visible rows), read-error, Mapbox/provider failure, tier-1/2/3 provenance (post-correction), list/map selection, tier-3-list-without-pin, dialog open/focus-restore-on-close |
| `/operations` National Performance view | loading, empty, error, per-panel partial-source isolation (existing `loadErrors` pattern) |
| `/operations/live` normal | route-authorized, route-unauthorized, loading, RLS-empty, read-error, provider-failure (fails closed per `13_...`), no-positions, tier-1/2/3 provenance (post-correction), reduced-motion, freshness-policy-unconfigured note |
| `/operations/live` wallboard | same state set as normal, at the wallboard layout specifically (no auto-refresh-cadence display, per package Revision 3) |

Cross-cutting, every surface/state combination: keyboard-only navigation (tab order reaches every interactive element, visible focus ring), reduced motion (`prefers-reduced-motion: reduce` — pings/breathing animations off, no route animation exists to gate per the corrected spec), contrast (WCAG AA on text/status colors in both themes), text overflow (no KPI value, label, or list-row text clipped/truncated unexpectedly at any of the 5 widths), sidebar/header containment (no shell chrome overlap at 320/390/412), horizontal scrolling (none should exist on the page body — any wide content, e.g. tables, must scroll within its own container).

## 5. Acceptance-ID mapping — exact sponsor-visible evidence per row

| Acceptance | Evidence required |
|---|---|
| `WA-M3-AC-003` (visual parity, fixed design viewport, zero unapproved diff) | Two distinct, exact reference-viewport captures per `product-contract/web-admin-phase1/DESIGN_ROUTE_MAP.csv` (re-confirmed this session, not assumed): **WA-DES-033** (`SAQEEL Operations Center.dc.html`, sha `ea9dce0b775ba69eb1bea3ebe7a35c076de316c18f1b955b5b3d8a2e8c7988e1`) → `reference_viewport = 1440x900` for `/operations` (Map + National Performance views) — this is a **1440×900 reference-only capture, outside the 80-target responsive matrix in §3** (1440 is not one of the 5 responsive widths tested there). **WA-DES-034** (`SAQEEL Operations Live.dc.html`, sha `157b68c8ba4bbbdba4f61265b25ff98d097a810e5acb42f2aef67f4b4403452d`) → `reference_viewport = 1200x800` for `/operations/live`, which **is** already one of the 5 responsive widths (§3's `1200` row) — no separate capture needed for Live beyond that row. Both diffed against the accepted rendered revisions `WA-DES-033-C3`/`WA-DES-034-C3` (Revision 3, etags recorded in prior packets this session) — the stable accepted design evidence this comparison is against. |
| `WA-M3-AC-004` (EN/LTR + AR/RTL, 1024/412-390/320 reflow, keyboard/accessibility) | All 20 combinations in §3 for every surface in §2's "runnable now" row, plus keyboard/contrast/reduced-motion evidence from §4 |
| `WA-M3-AC-005` (protected backend/workflow/audit/version/maker-checker/adjacent-route regression) | Existing `web-admin-m3-route-safety.spec.ts` pass, plus a regression pass on adjacent routes (`/dashboard`, `/factories`, `/visits`) confirming no shared-shell/GeoMap regression from this PR's changes |
| `WA-M3-AC-006` (requirement/design/route IDs and evidence manifest complete and truthful) | This packet itself, cross-referenced against `03_REQUIRED_STATE_MATRIX.csv`'s row IDs and package Revision 3's screen IDs — no gap between what's claimed done and what has real evidence |

## 6. Exact commands, personas, seed fixtures

- **Certifying run** (once the per-persona setup split from §1 lands, or the inspector credential is fixed): `cd apps/web && npx playwright test e2e/web-admin-m3-operations.spec.ts e2e/web-admin-m3-route-safety.spec.ts --reporter=line` (full dependency chain, no bypass flag).
- **Diagnostic-only run** (current state, explicitly not certification): `cd apps/web && npx playwright test e2e/web-admin-m3-operations.spec.ts e2e/web-admin-m3-route-safety.spec.ts --project=e2e --no-deps --reporter=line` — usable today to sanity-check the existing assertions, but its pass must not be reported as `WA-M3-AC-003/004/005` closure.
- **Personas needed**: `ops` (primary Operations/leadership persona), `planner` (direct-route-authorization comparison persona, per the existing "planner direct-route access matches the accepted shared navigation contract" test). **`inspector` is not needed for any M3 Operations spec** — confirms §1's narrowing is safe.
- **Seed fixtures**: `07_CLAUDE-M3-SEED-IMPLEMENTATION-READINESS-002.md`'s `f8/a8/b8/c8/d8/e8` deterministic block (Active Visits/On the Way/Executing + 4 alert-source counts) for the KPI/queue evidence; the 3 map-provenance seed cases from that same packet (real `geo_events`, projected-only, location-unavailable) for §4's tier-1/2/3 screenshots, **available only after `13_...`'s implementation lands** (the seed cases assume the corrected query/derivation exists to render them distinctly).

## 7. Evidence filenames, pass/fail criteria, P0/P1 severity mapping

Naming convention: `m3-<surface>-<state>-<viewport>-<dir>-<theme>.png`, e.g. `m3-ops-map-tier1-1200-en-dark.png`, `m3-ops-live-wallboard-unauthorized-320-ar-light.png`. The §5 design-parity reference capture uses its own convention, `m3-<surface>-designparity-<viewport>.png`, e.g. `m3-ops-map-designparity-1440.png` (WA-DES-033, reference-only, outside the 80-target matrix).

| Finding class | Severity |
|---|---|
| Route/ETA/animation-as-liveness reappears | P0 (violates the accepted no-invention rule directly) |
| A1 mutating-GET regression reappears | P0 |
| Tier-3 entity silently dropped from the list (provenance correction not applied correctly) | P1 (already the classification carried from `11_...`) |
| RTL/light-dark evidence still missing after this matrix is run | P1 (already the classification carried from `11_...`) — closes only once real screenshots exist for all 20 combinations |
| Text overflow / horizontal scroll / focus-restoration failure at any single viewport | P2 unless it hides required information (e.g. an unavailable/decision-required label gets clipped — then P1) |
| Contrast below AA on non-critical decorative text | P3 |
| Contrast below AA on a status/decision label | P1 |

## 8. CI requirement, browser review order, sponsor handoff

- **CI requirement**: `gh pr checks 60` currently reports no CI configured. Recommend this matrix's certifying command (§6) become a required check on PR #60 before merge — not proposed as a config change here (out of scope, read-only), only named as the requirement.
- **Browser review order**: (1) confirm the per-persona setup split or credential fix lands and the certifying run's dependency chain is genuinely clean; (2) run the certifying command; (3) capture the §3/§4 screenshot matrix for the "runnable now" rows (§2); (4) once `13_...` lands, re-run for the three provenance tiers specifically; (5) full regression pass on adjacent routes (§5, `WA-M3-AC-005`).
- **Sponsor handoff**: present only the certifying run's results, never the `--no-deps` diagnostic run, as the acceptance evidence; state plainly which of the four named surfaces are fully evidenced today (none — provenance tiers and RTL/dark-light are both open) versus which remain open pending `13_...`'s implementation and this matrix's actual execution.

## 9. Scorecard — authoritative source only

`SAQEEL_REQUIREMENT_SCORECARD.yaml`, re-read fresh this session: `evidence_verified_complete: 0`, `active_evaluation: 39`, `completion_percentage: 0.0`, `confidence: PROVISIONAL`, `last_reconciled_utc: 2026-07-24T23:00:00Z` (unchanged since every prior check this session — no new reconciliation has occurred). This packet does not alter any of these numbers; it defines the evidence that would be needed to move them.

## 10. Disposition

No application code, test, PR, branch, database, or live design modified. This is the exact, ready-to-execute evidence matrix and root-cause finding for the auth-fixture blocker — execution itself is a separate, later lease.

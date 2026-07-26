# PKT-RESPONSIVE-CROSS-PLATFORM-QA-010 — technical evidence

Status: `TECHNICAL_PASS_WITH_OPEN_RELEASE_BLOCKERS`

Task: `TASK-SAQEEL-RESPONSIVE-REVAMP-001`

Branch: `revamp/cross-platform-qa`

Baseline: `03acb9a7e63b0cf44cd7f1d9995d3e81fa07bcba`

Verified: `2026-07-27T01:16:02+03:00`

## Outcome

The final migration vertical closes the inherited narrow-shell defects and
adds a reproducible Safari-family certification path:

- A closed mobile navigation drawer is now `visibility:hidden`,
  `pointer-events:none` and shadow-free. It cannot remain as a visible edge,
  receive a pointer hit or enter the focus order in either direction.
- Opening the drawer restores visibility, pointer behavior, the overlay shadow,
  the backdrop and the existing focus-trap/Escape-return behavior.
- At 560 CSS pixels and below, search reclaims a complete controls row and keeps
  a readable input. At 360 and below, date and region scopes stack into one
  column.
- Device-readiness status rows stack below 420 pixels so long English and Arabic
  measured-state labels no longer crush or overlap their explanatory copy.
- Playwright now has a dedicated WebKit project that does not inherit the
  Chromium launch channel or the Chromium-oriented setup dependency.
- The cross-platform contract exercises authenticated Inspector, Planner and
  Administrator states across the mandated eight-width continuum.

No business workflow, role, authorization rule, RLS policy, RPC, offline-state
engine, Web Push provider, database object or production data was changed.

## Browser and visual evidence

Automated engines:

- Google Chrome `150.0.7871.182`.
- Playwright WebKit `26.5` (`webkit-2336`).

Real browser smoke:

- Installed Safari `26.4` (`21624.1.16.11.4`).
- The local production build rendered the public sign-in route in dark mode.
- Arabic/RTL and English/LTR were each read from Safari's accessibility tree
  and visually captured after an actual locale switch.
- Login fields, password visibility control, keep-signed-in control,
  reset link, sign-in button and online/offline explanatory copy were present.
- No credentials were copied into Safari. Authenticated role-route coverage is
  supplied by the WebKit persona-state matrix, not represented as a real-Safari
  authenticated-session result.

Evidence directory:

`/Users/vikramindla/Desktop/Inspection Documentation/migration-evidence/cross-platform-qa/2026-07-27`

It contains 38 full-page PNGs:

- 18 Chrome images.
- 18 WebKit images.
- 2 real-Safari sign-in images.

Human review confirmed:

- no closed-drawer rail or shadow remains in LTR or RTL;
- the open drawer is fully inside the viewport and the backdrop is visible;
- 320-pixel search and scope controls remain readable;
- readiness status badges and notes reflow without collision;
- representative Inspector, Planner and Administrator pages retain content,
  direction and theme at all tested widths.

## Dedicated acceptance matrix

The same `cross-platform-responsive-qa.spec.ts` contract ran in Chrome and
WebKit.

Result:

- Chrome: `5 passed`, `0 failed` in approximately 1 minute.
- WebKit: `5 passed`, `0 failed` in approximately 1.1 minutes.

The route matrix is:

| Width | Persona | Route | Locale / direction | Theme |
| ---: | --- | --- | --- | --- |
| 320 | Inspector | `/field/settings/readiness` | English / LTR | light |
| 375 | Planner | `/dashboard` | Arabic / RTL | dark |
| 390 | Administrator | `/admin/access?view=roles` | English / LTR | dark |
| 768 | Inspector | `/field` | Arabic / RTL | light |
| 1024 | Planner | `/planning` | English / LTR | light |
| 1280 | Administrator | `/admin/access` | Arabic / RTL | dark |
| 1440 | Planner | `/operations` | English / LTR | dark |
| 1920 | Inspector | `/field/visits` | Arabic / RTL | light |

For every state:

- the route response was below HTTP 400;
- the session did not become an unauthorized login;
- `lang`, `dir` and theme matched the requested state;
- horizontal document overflow was at most one rounding pixel;
- the mobile/tablet drawer was hidden at widths at or below 1024.

The additional 320/375/390 shell loop covered both locales and asserted that
the menu, search, date scope, region scope and page actions stayed inside the
viewport. The closed/open loop checked computed visibility, pointer behavior,
shadow removal, edge hit-testing, overflow, drawer bounds, Escape focus return
and zero Axe violations.

## Protected regression

### Chromium

Result: `75 passed`, `0 skipped`, `0 failed` in approximately 4 minutes.

Coverage included:

- final cross-platform matrix;
- Administration/RBAC grants, server guards, refusal states and direct URLs;
- shared-shell navigation, role catalogue and route authorization;
- Field execution, Planner/Administrator negative access, keyboard and Axe;
- browser-delivery decoupling and no automatic service-worker control;
- user-scoped IndexedDB isolation and replay identity;
- immutable package integrity and stale-version behavior;
- deterministic outbox idempotency;
- loaded-workspace network interruption without a cold-shell claim.

### WebKit

Result: `33 passed`, `0 skipped`, `0 failed` in approximately 3.6 minutes.

Coverage included:

- final cross-platform matrix;
- Administration/RBAC and Arabic refusal;
- browser-delivery decoupling and measured readiness;
- Field unified-shell and authorization contracts;
- eight-width execution reflow, bilingual accessibility and offline
  interruption behavior.

The protected runs used the existing replaceable field test adapters for
browser-route verification. They are not presented as evidence of a live
external provider or production integration.

## Build and source verification

- `npm run typecheck` — PASS.
- `npm run build` — PASS with Next.js `15.5.21`; all 58 static-generation
  steps completed.
- The Playwright WebKit browser binary was installed from Playwright's managed
  browser distribution before WebKit certification.
- No VAPID secret, persona credential or session token was printed or added to
  Git.
- The ignored `.env`, `.env.local`, `node_modules` and persona-state links are
  not delivery artifacts.

## Acceptance disposition

| Acceptance | Result | Evidence |
| --- | --- | --- |
| Closed mobile drawer absent and non-interactive | PASS | Chrome/WebKit LTR+RTL computed style, hit test, focus and screenshots |
| Open drawer restored and keyboard operable | PASS | Bounds, backdrop, Escape focus return and screenshots |
| 320/375/390 topbar containment | PASS | EN/AR geometry loops; search width above 200px |
| Eight-width cross-vertical continuum | PASS | Authenticated Inspector/Planner/Admin Chrome+WebKit matrix |
| Locale, direction and themes | PASS | EN/AR, LTR/RTL, light/dark automated matrix |
| Accessibility | PASS | Zero Axe violations in the bilingual shell checks; protected keyboard suites pass |
| Protected authorization and offline regressions | PASS | Chromium 75/75; WebKit 33/33 |
| Real Safari public-browser smoke | PASS | Safari 26.4 EN/AR dark-mode sign-in evidence |
| Real Safari authenticated representative role routes | OPEN RELEASE EVIDENCE GAP | Covered in Playwright WebKit, not in an actual Safari authenticated session |
| Real submission / immutable end-to-end proof | BLOCKED BY DEC-032 | Platform-wide `submission_versions` digest trigger failure remains P0 |
| Live Web Push delivery | ENVIRONMENT-GATED | VAPID-dependent external delivery remains outside this UI/browser packet |
| Authoritative Arabic legal translation | GOVERNED HOLD | No legal meaning or unapproved translation was invented |

The packet is therefore a technical pass for the scoped browser migration, but
it is not recorded as final release acceptance. QA certification cannot claim
that every release P0/P1 row is evidenced while DEC-032 and the explicit
real-Safari authenticated-route evidence gap remain open.

## Rollback

Revert this packet's commit. The rollback removes only the shared-shell
responsive correction, narrow readiness reflow and cross-engine QA harness;
no data or schema rollback is required.

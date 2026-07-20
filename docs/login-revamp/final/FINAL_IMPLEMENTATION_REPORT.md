# Saqeel Login Revamp — Final Implementation Report

Date: 2026-07-20
Task: `TASK-DESIGN-SAQEEL-LOGIN-REVAMP-001`
Change: `CC-SAQEEL-LOGIN-REVAMP-001`
Screen: `SCR-PUB-010`
Branch: `feature/saqeel-login-revamp`
Baseline/current commit: `d53e09f7ee4018bf2046e36d95fe45df355b11a2`
Implementation state: uncommitted, not pushed, not merged, not deployed

## Outcome

The wordmark-protected login implementation is live locally at
`http://127.0.0.1:3000/login`. The exact repository `SaqeelMark` prism and Arabic
wordmark `صقيل | صناعي` remain the only lockup. The public authentication surface
now contains only Email, Password, the accessible visibility toggle, Sign In and
Forgot your password. National Single Sign-On, MIM Directory, Remember me,
provider separators and their reserved space are absent.

Dark mode retains the native approved atlas. Light mode uses a new dedicated
`1672×941` raster for the main image, lifted terrain and sidewall source. Both
assets preload in the DOM and theme switching changes visibility without reload.
No CSS filter, opacity film, blend mode or colored overlay creates the light
terrain.

## Changed implementation files

- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/login/SaudiIndustrialAtlas.tsx`
- `apps/web/src/app/login/login.css`
- `apps/web/public/brand/saudi-atlas/inspection-atlas-scene-base-v2-light.png`
- `apps/web/e2e/cd-001-v7-atlas.spec.ts`
- `apps/web/e2e/saqeel-login-revamp.spec.ts`
- `apps/web/e2e/saqeel-login-revamp-visual.spec.ts`
- login-only acceptance, evidence, governance and session records

`apps/web/src/app/login/SaqeelMark.tsx` is unchanged. Its SHA-256 is
`a9f61abfbb4b1614b55811abf7c8d903239f68511a4636cba23c684c89bb6cea`.

## Asset provenance and registration

- Stakeholder pack:
  `SAQEEL_LOGIN_WORDMARK_PROTECTED_CODEX_PACK.zip`
- Stakeholder pack SHA-256:
  `b960c12719bca2890f7cc86b6be483694fc06e9e33d3ba8e91a6900fcbd3d8af`
- Dark source SHA-256:
  `4e1d2cc36dbacf5e3dbb7d15fb7c1bbd93f1f9e521eb7ead5d7b6f687023a743`
- Light asset SHA-256:
  `3171c1cc3ce5f2486708933b8de0a7ed80e064f75d98b73d683fe3fc88655c1f`
- Generation method: built-in OpenAI image edit using the dark source as the
  edit target with geometry, facility, camera, crop and registration invariants.
- Validation: both images are exactly `1672×941`; gradient-edge cross-correlation
  resolves the best translation to `0px, 0px` with a normalized peak of
  `0.629846` after the palette/material transformation.

## Removed controls

- National Single Sign-On and Arabic equivalent
- MIM Directory
- Remember me
- Provider separator/wrapper and unused vertical space

Credential sign-in, neutral error handling, password reset anti-enumeration,
loading/disabled behavior, audit calls, autocomplete and `/launch` routing are
unchanged.

## Tint and token replacement

- Main and lifted rasters now switch between dedicated dark/light assets.
- Story event and active-stage accents changed from fixed
  `--ax-color-prism-magenta` to semantic `--ax-color-info`.
- Fixed purple atlas canvas/surface/text/muted/border tokens were replaced in
  login-only presentation with theme-responsive local aliases derived from the
  existing canvas, surface, text, secondary-text and border tokens.
- The protected prism retains its existing magenta-violet geometry and gradient.
- The atlas plane has no filter; the light raster has no filter; host overlays
  remain decorative and non-intercepting.

## Vehicle calculation

| Layer | Baseline | Implemented | Proof |
|---|---:|---:|---:|
| Main vehicle | `18×36` at `-9/-18` | `27×54` at `-13.5/-27` | exact `1.5×`, centered |
| Fallback box | `28×20` | `42×30` | exact `1.5×` |
| Fallback glyph | `18×12` | `27×18` | exact `1.5×` |

Duration remains 6 seconds; starts remain 0/2.5/5 seconds; route paths, spline,
rotation, endpoints, camera and story timing are unchanged.

## Protected-motion comparison

| Contract | Before | After |
|---|---|---|
| Five stages | `plan → travel → arrive → inspect → decide` | unchanged |
| Stage ends | `3/14/19/24/30s` | unchanged |
| Zone paths | five frozen SVG paths | unchanged |
| Terrain lift | `-33px`, `1.012`, 900ms cubic-bezier | unchanged |
| Sidewall | `-16px`, `1.004` | unchanged |
| Cavity | `+3px`, `.985` | unchanged |
| Camera | 1300px perspective, 8deg pitch, ±.7deg roll, 1.035 scale | unchanged |
| Readout | 540ms, 420ms delay | unchanged |
| Lock/toggle/Escape/keyboard | accepted behavior | unchanged; runtime PASS |
| Routes | three paths, 6s, 0/2.5/5s, spline `.32 .05 .2 1` | unchanged |

## Responsive, bilingual and accessibility results

- EN/AR × light/dark: PASS.
- Saudi geography, facilities and routes do not mirror in RTL: PASS.
- Exact viewports from 1920×1080 through 320×800: PASS with no page-level
  horizontal overflow.
- iPad controls: 48px target contract PASS.
- Mobile form-first order with the animated atlas below: PASS.
- 200%/400% CSS viewport-equivalent reflow: PASS; focus stays visible and no
  page overflow occurs.
- Exact browser-zoom automation remains unavailable in the current harness and
  requires final human/browser certification at 200% and 400%.
- Visible focus, password-toggle naming/state, alert semantics, reduced motion,
  language/direction attributes and broken-image fallback: PASS.

## Verification

- `npm run typecheck`: PASS.
- `npm run build`: PASS; Next.js compile/type validity checks pass.
- Package lint command: unavailable (`package.json` has no `lint` script and no
  local ESLint package); recorded as a tooling blocker, not claimed as PASS.
- Wordmark-protected acceptance: 7/7 PASS.
- Protected atlas/reset/negative-auth regression: 19/19 PASS.
- Visual/evidence harness: 2/2 PASS after correcting an evidence-only exact-name
  locator; the first failed attempt did not expose a product defect.
- `git diff --check`: PASS.
- Runtime console: no application errors observed in the in-app browser.
- Runtime assets and `/login`: HTTP 200 in the local production build.

## Evidence

- External evidence directory:
  `${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/saqeel-login-wordmark-protected-002/`
- Manifest:
  `${INSPECTION_DOCS_ROOT}/MANIFESTS/SAQEEL_LOGIN_WORDMARK_PROTECTED_002.json`
- Delivered: 26 PNG frames plus
  `protected-atlas-interaction.webm`, including four desktop language/theme
  states, iPad landscape/portrait, mobile, every story stage, every zone hover,
  a locked zone, no-reload theme switch, invalid credentials, password reset,
  Dispatch with 1.5× vehicles, and 200%/400% equivalents.

## Known blockers and honest status

- Sponsor visual acceptance is pending.
- Exact 200% and 400% browser zoom must receive final manual/browser-level
  certification; the automated equivalent reflow checks pass.
- The repository currently provides no lint command or ESLint dependency.
- Existing CD-001 asset-rights/official-geography release confirmation and
  qualified native-Arabic review remain human release gates.
- No commit, push, merge or deployment has been performed.

SAQEEL LOGIN REVAMP CONDITIONALLY COMPLETE — WORDMARK PRESERVED — LISTED BLOCKERS REMAIN

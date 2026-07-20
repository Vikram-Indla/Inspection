# Saqeel Login — Unified Surface Correction Report

Date: 2026-07-20
Task: `TASK-DESIGN-SAQEEL-LOGIN-REVAMP-001`
Change: `CC-SAQEEL-LOGIN-REVAMP-001` / sponsor correction 004
Screen: `SCR-PUB-010`
Branch: `feature/saqeel-login-revamp`
Baseline/current commit: `d53e09f7ee4018bf2046e36d95fe45df355b11a2`
State: uncommitted, not pushed, not merged, not deployed

## Outcome

The right hero is now one full-height atlas environment. The title/control row,
story event and five-stage rail are absolute overlays over the same environment
and consume no flow height. The former frame-card boundary and the rail's border,
background, radius and shadow are removed.

The stage event is editorial typography on the atmosphere—not a card. It has no
background, border, radius, blur or shadow. Its compact stage marker and balanced
statement sit in the top atmospheric zone with a restrained text shadow for
theme-safe legibility, leaving terrain, facilities and zone controls unobscured.
Following sponsor screenshot review, the statement is intentionally quiet:
`13px/18px` at weight `500`; its stage marker is `9px/13px` at weight `600`.
The former public statistics section, its heading, five cells, borders and layout
gap are removed from the component and string contract. The intentionally invoked
zone readout remains available.

The registered `1672×941` scene plane retains its aspect ratio and contains the
raster, zone surfaces, routes, vehicles, labels, lifted clips and hotspots. It is
not mirrored in Arabic. A 48px top/bottom tonal feather bridges the plane into the
full-frame pearl/cool-blue-grey or graphite/navy host atmosphere without moving
individual children or cropping the western/eastern facility clusters.

## Annotated before/after comparison

| Annotation | Before evidence | Corrected evidence | Verified change |
|---|---|---|---|
| A — top patch | `saqeel-login-wordmark-protected-002/desktop-light-en.png`, `desktop-dark-en.png` | `saqeel-login-one-unison-004/corrected-light-desktop.png`, `corrected-dark-desktop.png` | Separate top region removed; the full-height stage atmosphere continues behind the overlaid title and event. |
| B — bottom patch | same before frames | same corrected frames | Separate bottom region removed; the atlas environment continues behind the attached rail. |
| C — statistics strip | `saqeel-login-wordmark-protected-002/story-zones-light-en.png` | `saqeel-login-one-unison-004/zones-resting-light-en.png` | Public heading, five metric cells, borders and flow spacing removed; `.lg-story__summary` has zero runtime nodes. |
| D — unified environment | desktop before frames | desktop corrected frames | One full-height atmospheric surface; no nested frame or atlas/rail card. |
| E — form/hero alignment | desktop before frames | desktop corrected frames | Both rails share viewport top/bottom alignment and one subtle logical divider. |
| F — protected identity | every before frame | every corrected frame | Repository `SaqeelMark.tsx` hash and exact `صقيل | صناعي` wordmark are unchanged. |
| G — interaction registration | old zone/dispatch frames and WebM | `zone-east-hovered-light-en.png`, `zone-east-locked-light-en.png`, `dispatch-with-vehicles-light-en.png`, corrected WebM | Hover extraction, cavity, wall, lock, Escape, routes, labels and 1.5× vehicles remain registered to the scene. |

External evidence roots are beneath
`${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/`.
The manifest is `${INSPECTION_DOCS_ROOT}/MANIFESTS/SAQEEL_LOGIN_ONE_UNISON_004.json`.

The non-negotiable test is captured as `canvas-only-light-desktop.png` and
`canvas-only-dark-desktop.png`. Title, event and stage overlays are hidden in
those frames; the remaining right rail is still one uninterrupted full-height
atlas atmosphere with no structural header/footer containers or visible image
rectangle.

## Required 16-state evidence

1. Current light desktop — prior `desktop-light-en.png`.
2. Corrected light desktop — `corrected-light-desktop.png`.
3. Current dark desktop — prior `desktop-dark-en.png`.
4. Corrected dark desktop — `corrected-dark-desktop.png`.
5. Light iPad landscape — `ipad-landscape-light-en.png`.
6. Dark iPad landscape — `ipad-landscape-dark-en.png`.
7. Light iPad portrait — `ipad-portrait-light-en.png`.
8. Dark iPad portrait — `ipad-portrait-dark-en.png`.
9. Mobile light — `mobile-light-en.png`.
10. Mobile dark — `mobile-dark-en.png`.
11. Zones resting — `zones-resting-light-en.png`.
12. Zone hovered — `zone-east-hovered-light-en.png`.
13. Zone locked — `zone-east-locked-light-en.png`.
14. Dispatch with vehicles — `dispatch-with-vehicles-light-en.png`.
15. Arabic light — `arabic-light-desktop.png`.
16. Arabic dark — `arabic-dark-desktop.png`.

## Protected contracts

- Exact prism/wordmark source hash: `a9f61abfbb4b1614b55811abf7c8d903239f68511a4636cba23c684c89bb6cea`.
- Stage end times: `3/14/19/24/30s`, unchanged.
- Vehicle duration/stagger: `6s`, `0/2.5/5s`, unchanged.
- Vehicle geometry: `27×54`, fallback `42×30`, exactly baseline × 1.5.
- Lift: `-33px`, `1.012`, 900ms accepted cubic-bezier, unchanged.
- Sidewall/cavity: `-16px/1.004` and `+3px/.985`, unchanged.
- Camera: 1300px perspective, 8deg pitch, ±.7deg roll, 1.035 interaction scale, unchanged.
- Authentication, reset anti-enumeration, audit and `/launch` routing: unchanged.
- Public controls: Email, Password, visibility, Sign In and Forgot password only.

## Verification

- TypeScript: PASS.
- Production build: PASS.
- Login/atlas/reset/negative-auth regression: 27/27 PASS.
- Final screenshot/video evidence: 2/2 PASS.
- Event-statement contract: transparent background, zero border and zero box shadow — runtime PASS in light/dark and responsive states.
- Reduced event typography: typecheck/build PASS; story, structural and responsive focused checks 3/3 PASS.
- Exact responsive matrix from 1920×1080 through 320×800 plus 200%/400% equivalents: PASS with no page horizontal overflow.
- EN/AR, light/dark, keyboard, reduced motion, hover/lock/Escape: PASS.
- Runtime review at `http://127.0.0.1:3000/login?unison=5`: HTTP 200; no application console errors or hydration warnings observed.
- Repository lint remains unavailable because `apps/web/package.json` has no lint script or local ESLint dependency.

Sponsor visual acceptance, exact manual browser-zoom review, qualified native-Arabic review, and existing atlas rights/official-geography release confirmation remain human gates. No commit, push, merge or deployment was performed.

SAQEEL LOGIN UNIFIED SURFACE CORRECTION COMPLETE — READY FOR VISUAL REVIEW

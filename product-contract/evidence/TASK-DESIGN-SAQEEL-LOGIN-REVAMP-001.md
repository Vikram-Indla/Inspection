# TASK-DESIGN-SAQEEL-LOGIN-REVAMP-001 — Implementation Evidence

Date: 2026-07-20
Branch: `feature/saqeel-login-revamp`
Baseline: `setup/Inspection@d53e09f7ee4018bf2046e36d95fe45df355b11a2`
Screen: `SCR-PUB-010`
Change control: `CC-SAQEEL-LOGIN-REVAMP-001`

## Outcome

The final wordmark-protected sponsor override is implemented and engineering-
verified. Repository `SaqeelMark` geometry is unchanged and the exact Arabic
wordmark `صقيل | صناعي` remains the sole lockup. National Single Sign-On and
every secondary-auth wrapper are absent; `MVP3-HOLD-003` remains an internal
provider hold with no simulated authentication path.

Dark mode retains the native atlas. Light mode uses the dedicated pixel-
registered `inspection-atlas-scene-base-v2-light.png` for the main plane,
lifted terrain and sidewall source. Both assets are `1672×941`, edge registration
resolves to `0px,0px`, and no CSS filter/film/blend creates light mode. Credential
authentication and reset behavior are unchanged. Route vehicles remain exactly
`1.5×` baseline with no timing, path, easing, camera or stage change.

## Protected before/after comparison

| Contract | Baseline | Result |
|---|---|---|
| Zone surfaces | Five exact `ZONE_SURFACES` paths | Unchanged |
| Hover lift | 900ms cubic-bezier; terrain -33px/1.012; wall -16px/1.004; cavity +3px/.985 | Unchanged |
| Camera | 1050ms cubic-bezier; perspective 1300px; rotateX 8deg; rotateZ ±.7deg; scale 1.035 | Unchanged |
| Readout | 540ms with 420ms delay and identical zone content | Unchanged |
| Story | `plan/travel/arrive/inspect/decide`; stage ends 3/14/19/24/30s | Unchanged |
| Routes | Three exact paths; 6s; 0/2.5/5s starts; spline .32/.05/.2/1 | Unchanged |
| Primary vehicles | 18×36 at -9/-18 | 27×54 at -13.5/-27 — exact 1.5× |
| Fallback vehicle | 28×20 box; 18×12 glyph | 42×30 box; 27×18 glyph — exact 1.5× |
| Auth | `signInWithPassword`, neutral errors, reset anti-enumeration, audit, `/launch` | Unchanged |

## Verification

- `npm run typecheck` — PASS.
- `npm run build` — PASS with `.env.local`; `/login` remains dynamic.
- `cd-001-v7-atlas.spec.ts` — 13/13 PASS.
- `cd-002-reset.spec.ts` + `negative-auth.spec.ts` — 6/6 PASS.
- `saqeel-login-revamp.spec.ts` — 7/7 PASS.
- `saqeel-login-revamp-visual.spec.ts` — 2/2 PASS; 26 PNG frames and one WebM written.
- Unique functional product checks — 26/26 PASS.
- `git diff --check` — PASS.
- `npm run lint` — unavailable; the package defines no lint script and has no local ESLint dependency.

An initial browser run built before the isolated worktree had its local
environment link and therefore could not initialize Supabase client/reset
state. No authentication code was changed in response. Rebuilding with the
same repository `.env.local` produced the final 6/6 reset/negative-auth PASS.

## External evidence

Frames/video:
`${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/saqeel-login-wordmark-protected-002/`

Manifest:
`${INSPECTION_DOCS_ROOT}/MANIFESTS/SAQEEL_LOGIN_WORDMARK_PROTECTED_002.json`

Final stakeholder package SHA-256:
`b960c12719bca2890f7cc86b6be483694fc06e9e33d3ba8e91a6900fcbd3d8af`.
The package and reference images remain external and were not committed.

## Holds and boundaries

- `MVP3-HOLD-003`: external National SSO remains unavailable internally and is not exposed publicly.
- Existing CD-001 asset rights and official geographic confirmation remain
  release holds.
- Qualified native-Arabic review remains a human release gate.
- Exact browser-level 200%/400% zoom and repository lint tooling remain listed
  certification/tooling gaps; automated viewport-equivalent reflow passes.
- Sponsor visual acceptance is pending.
- No commit, push, merge, deployment, remote DDL or shared-data mutation was
  performed.

## Unified-surface correction 003

The sponsor's layout-only correction is implemented. `StoryPanel` no longer
defines or renders the illustrative summary or five public metric cells. The
event and five-stage rail remain absolute overlays inside the sole atlas frame.
The complete registered plane retains its aspect ratio; a 48px atmospheric
feather joins its top/bottom edges to the full-frame light/dark host surface,
so no child layer moves and no important facility is cropped. Zone-stage
boundaries use restrained semantic blue and remain absent at rest.

Final verification: typecheck PASS; production build PASS; login/atlas/reset/
negative-auth 27/27 PASS; corrected visual/video evidence 2/2 PASS. The required
16-state comparison and annotations are in
`docs/login-revamp/final/UNIFIED_SURFACE_CORRECTION_REPORT.md`; corrected external
evidence and checksums are in `SAQEEL_LOGIN_UNIFIED_SURFACE_003.json`. Sponsor
visual acceptance remains pending; no commit/push/merge/deploy occurred.

## One fade / one unison correction 004

The complete right rail is now the scene host: `.lg-story__frame` is absolute
at `inset:0`, while the title/control row, event and rail are positioned
overlays. Top and bottom gradients are pointer-inert pseudo-element fades, not
layout bands. The rail's independent border/background/radius/shadow shell is
removed. Login-scoped actions and story controls share semantic blue; protected
identity geometry is unchanged.

The mandatory overlay-hidden light/dark frames prove the underlying rail remains
one full-height canvas. Final verification remains typecheck/build PASS,
protected functional 27/27 PASS and visual/video 2/2 PASS. Evidence is under
`saqeel-login-one-unison-004/` with manifest
`SAQEEL_LOGIN_ONE_UNISON_004.json`. No commit/push/merge/deploy occurred.

## Event statement correction 005

The stage event no longer renders as a card. Its background, border, radius,
blur and box shadow are removed; stage marker and balanced sentence render as
pointer-inert typography in the top atlas atmosphere with theme-safe text
shadow. Content, `role=status`, timing and animation are unchanged. The image-3
stage rail is untouched. Typecheck/build PASS; protected functional 27/27 PASS;
refreshed visual/video evidence 2/2 PASS.

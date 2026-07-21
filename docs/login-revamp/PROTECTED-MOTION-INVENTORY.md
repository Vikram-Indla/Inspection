# Saqeel Login Revamp — Protected Motion Inventory

Task: `TASK-DESIGN-SAQEEL-LOGIN-REVAMP-001`
Screen: `SCR-PUB-010`
Contract: `CC-SAQEEL-LOGIN-REVAMP-001`
Baseline: `setup/Inspection@d53e09f7ee4018bf2046e36d95fe45df355b11a2`

This inventory freezes the accepted CD-001 atlas motion before implementation.
The source invariant test compares these exact contracts after the revamp. The
only authorized motion-layer delta is the visual vehicle dimensions and centered
offsets at exactly `baseline × 1.5`.

## Protected ownership

| Behavior | Source owner | Frozen contract |
|---|---|---|
| Zone hover/focus selection | `SaudiIndustrialAtlas.tsx` → `PublicSafeImageAtlas` and `ZoneLiftOverlay` | `onPointerEnter`/focus selects the same zone; pointer leave/blur restores unless locked. `ZONE_SURFACES` paths are immutable. |
| Hover lift/extrusion | `login.css` → `.lg-zone-lift__slab` | `900ms cubic-bezier(.16,.84,.25,1)` transform; `680ms ease` opacity; `820ms ease` filter. Terrain lifts `translateY(-33px) scale(1.012)`, wall lifts `translateY(-16px) scale(1.004)`, cavity settles `translateY(3px) scale(.985)`. |
| Zone click lock/reset | `SaudiIndustrialAtlas.tsx` → `ZoneLiftOverlay` | Click/Enter/Space toggles `lockedZone`; Escape clears lock/hover and restores the resting map. Same SVG path is the target. |
| Camera zoom/freeze/reveal | `login.css` and `StoryPanel.tsx` | Engaged plane uses `translate(...,-48%) perspective(1300px) rotateX(8deg) rotateZ(±.7deg) scale(1.035)` with `1050ms cubic-bezier(.16,.84,.25,1)`; atlas interaction pauses `createAtlasTimeline`; readout timing remains `540ms 420ms cubic-bezier(.16,.84,.25,1)`. |
| Story progression | `saudi-atlas-motion.ts`, `StoryPanel.tsx`, `saudi-atlas-locations.ts` | Scene order remains `plan → travel → arrive → inspect → decide`; stage ends remain `[3, 14, 19, 24, 30]` seconds; tab selection pauses autoplay and preserves RTL keyboard order without changing underlying stage order. |
| Route animation | `SaudiIndustrialAtlas.tsx` → `DISPATCH_ROUTES` and `JourneyOverlay` | Three path strings remain unchanged. Vehicle opacity keyframes remain `0;1;1;0`, `keyTimes=0;0.08;0.88;1`; motion remains `6s`, starts `0s/2.5s/5s`, `rotate=auto`, spline `0.32 0.05 0.2 1`. |
| Vehicle scale | `SaudiIndustrialAtlas.tsx` route `<image>` and generated fallback; `login.css` fallback box | Primary baseline `18×36` at `(-9,-18)` becomes `27×54` at `(-13.5,-27)`. Fallback baseline `28×20` box and `18×12` glyph become `42×30` and `27×18`. Center/contact anchor and route interpolation remain unchanged. |
| Reduced motion | `saudi-atlas-motion.ts`, `login.css` reduced-motion block | Autoplay does not start; stepped states remain understandable; terrain state snaps rather than animates. |

## Scene color boundary

Dark mode keeps the native approved raster
`/brand/saudi-atlas/inspection-atlas-scene-base-v2.png`. Light mode uses the
pixel-registered dedicated raster
`/brand/saudi-atlas/inspection-atlas-scene-base-v2-light.png`; the main plane,
lifted terrain and lifted sidewall all switch to the same theme source. The
rasters are both `1672×941`, and read-only edge registration resolves to a
`0px, 0px` translation. No CSS filter, opacity film, blend mode or overlay
creates the light terrain. Depth treatment on the cavity/sidewall and
non-material shadows remains part of the protected extrusion interaction.

All decorative host overlays must use `pointer-events: none`. Arabic may reverse
the page grid, control alignment and reading direction, but must never apply a
horizontal scale, image flip, geographic rotation or alternate route direction
to the atlas.

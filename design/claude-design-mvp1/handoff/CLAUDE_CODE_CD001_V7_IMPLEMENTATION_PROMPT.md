# Claude Code Implementation Prompt — CD-001 V7 Saudi Industrial Atlas

## Authority and outcome

Implement the sponsor-selected CD-001 direction in the existing Saqeel repository. This is a controlled implementation and runtime-validation slice on the existing branch `feat/cd-001-v7-atlas`; it is not permission to redesign authentication, implement CD-002/CD-003, deploy to production, or modify frozen product-contract artifacts.

The outcome is one premium, coherent public sign-in experience: the existing solid credential panel remains reliable and primary, while the story side becomes a layered, interactive Saudi Industrial Inspection Atlas. The sponsor has explicitly approved preserving the central visual composition of the supplied reference at `/Users/vikramindla/Downloads/inspection.png` as a public-safe derived PNG. Retain its dark 3D depth, recognizable industrial structures, inspectors, routes, geofence halos, Saudi zones/cities, landmarks, and inspection lifecycle. Remove its operational panels, statistics, update time, risk/compliance/violation/SLA/workload claims, red enforcement implications, and any suggestion of live data. The derived PNG is the visual foundation only; it must not be the sole interaction, accessibility, geographic-truth, or responsive layer.

Claude Design has reached its context limit and is closed. Its final artifact pack is `/Users/vikramindla/Downloads/# Saqeel MVP1 UIUX Revamp (1).zip`. Use the repository and this handoff as continuity authority. Do not require Claude Design chat history and do not open another design iteration for P2 findings.

## Mandatory read order

Read before editing:

1. `AGENTS.md`
2. `product-contract/00_START_HERE.md`
3. `product-contract/CURRENT_STATE.md`
4. `product-contract/GATE_STATUS.md`
5. `product-contract/execution/CURRENT_SLICE.yaml`
6. `product-contract/governance/DECISIONS_ACCEPTED_2026-07-12_SAQEEL.yaml`
7. `design/claude-design-mvp1/00_START_HERE.md`
8. `design/claude-design-mvp1/MANIFEST.yaml`
9. `design/claude-design-mvp1/handoff/FABLE_IMPLEMENTATION_HANDOFF.md`
10. `design/claude-design-mvp1/handoff/CD001_V7_PUBLIC_SAFE_PNG_AMENDMENT.md`
11. Current login source and tests listed below.

Inspect the working tree before editing. Preserve all pre-existing user changes. Do not reset, discard, or overwrite the two untracked atlas preparation files. Reconcile them into the implementation.

## Traceability

- Task: `TASK-DESIGN-CD001-V7-IMPLEMENTATION`
- Design prompt: `CD-001`
- Screen: `SCR-PUB-010`
- Storyboard: `SB02`
- Processes represented illustratively only: `P01`, `P06A`, `P07`, `P10`, `P12`
- Protected behavior: `ERR-AUTH-001`, `FND-003`, `RBAC-001..014`, server-side `/launch` routing, Supabase credential authentication, anti-enumeration password reset
- Engines referenced illustratively only: `ENG-02`, `ENG-04`, `ENG-08`, `ENG-12`
- UX blind spot: `UX-BS-009` demo credentials must be non-production only
- Baseline evidence: `G10-EV-002-login-v4-inspection-story.txt` and `${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/login-v4/`

## Current-state warning — resolve first

The branch is intentionally mid-slice. At handoff time:

- `apps/web/src/app/login/StoryMapInner.tsx` has a partial V7 layer-one refactor.
- `apps/web/src/app/login/saudi-atlas-locations.ts` and `saudi-atlas-motion.ts` are untracked preparation that must be preserved and reviewed.
- `StoryPanel.tsx` still calls the old `StoryMapInner` contract.
- `npm run typecheck` currently fails because `StoryMapLabels` was removed and `StoryPanel` still passes `labels` instead of the required `onReady` callback.

Fix this integration break as the first P0. Do not hide it with type suppression.

## Protected existing behavior — do not change

- One unified sign-in; no public persona selector.
- Credentials panel renders and works even when map tiles, images, JavaScript enhancement, or animation fail.
- Successful sign-in performs the existing hard navigation to `/launch`; roles are resolved server-side.
- Invalid authentication denies safely without mutation.
- Password reset remains anti-enumeration safe and retains audit behavior.
- Arabic/English, RTL/LTR, dark/light, theme toggle, focus visibility, and responsive behavior remain supported.
- All visual values use existing Saqeel/retired predecessor tokens. Do not introduce a second design system or raw colors in route/component CSS.
- The public page never implies live inspectors, live telemetry, actual factory status, actual risk, actual violations, actual SLA, or actual workload.

## Build the atlas as five layers

### Layer 1 — approved public-safe visual foundation and map truth

Use the approved public-safe derivative PNG as the default premium visual foundation. It must contain the central Saudi 3D terrain, industrial structures, inspectors, vehicles, landmarks, routes, geofence halos, zone orientation, and inspection story, but none of the original operational side/bottom panels or claims. Load it after the credential panel into a stable aspect-ratio frame with fixed dimensions and no layout shift.

Retain the existing Leaflet stack and bundled KSA boundary as an optional geographic/failure mode with correct attribution and verified public city/industrial-city coordinates. Never label the raster itself as a live or authoritative map. Do not draw another freehand outline and call it a real map.

Required orientation includes Riyadh, Jeddah, Makkah as a city label only, Madinah, Dammam, Jubail, Yanbu, Ras Al-Khair, Ha'il, Qassim/Buraidah, Jazan, Tabuk, Sakaka, Abha, and Najran where legible. Kingdom Centre may be a restrained Riyadh orientation silhouette; it is not a factory or inspection target. Do not use the Kaaba, Holy Mosque, or other religious imagery as industrial decoration.

### Layer 2 — premium industrial scene preservation

Place original, transparent, high-fidelity industrial structures at verified public industrial nodes. The intended sectors are Jubail petrochemical/process, Yanbu refining/port, Ras Al-Khair mining/metals, Riyadh pharma/clean assembly, Dammam fabrication/heavy manufacturing, Jeddah food/packaging, Qassim food production, Ha'il regional manufacturing, and Jazan downstream/logistics.

Use the sanitized, public-safe derivative as a runtime visual asset with fixed width/height and an explicit asset ID. Preserve the source and derived-asset provenance separately. The original unsanitized PNG must not ship on the public surface. Never use confidential factory likenesses or unlicensed third-party imagery. If rights for the source or derivative remain unconfirmed, record the gap as P1 and block production release—not controlled runtime review. Do not manufacture fake provenance.

Individual WebP/AVIF structure assets may progressively replace parts of the composite later, but their absence must not reduce the approved image to childish flat icons during this slice.

Inspectors, vehicles, and PPE must be credible in scale and context. Avoid cartoon people, clip-art factories, oversized landmarks, neon gaming aesthetics, and floating portal cards.

### Layer 3 — inspection storytelling

Create a restrained 14-second illustrative loop:

1. Plan in Riyadh.
2. Travel on a dotted route toward Jubail.
3. Arrive and pulse the sample geofence.
4. Inspect and capture illustrative evidence.
5. Review.
6. Decide and record.

Use status color plus icon/text, never color alone. The animation pauses when a dossier is open, while atlas controls hold focus, while the tab is hidden, and under user interaction. `prefers-reduced-motion` must produce a stable, fully understandable state with no automatic movement. Avoid particles, flashing, whole-map breathing, and constant competing pulses.

### Layer 4 — accessible interaction

Every industrial node is reachable by mouse, keyboard, and touch. Hover/focus shows a non-overlapping dossier; click/Enter/Space locks it; Escape closes it; touch uses a stable bottom sheet or equivalent. The dossier may contain only:

- location name;
- illustrative sector;
- illustrative inspection type;
- sample lifecycle stage;
- physical or virtual sample mode;
- persistent `SAMPLE / ILLUSTRATIVE — NO LIVE OPERATIONAL DATA` truth label.

Do not show numeric operational counts, percentages, risk grades, overdue items, violations, SLA breaches, named real factories, or staffing recommendations. Provide an accessible list alternative with the same nodes and stages. Do not bake essential text into images.

### Layer 5 — resilient composition

The credential panel stays visually calm and primary. On wide desktop, the atlas may own roughly two-thirds of the composition if the form remains comfortably readable. On constrained desktop/tablet, reduce scene density and preserve the lifecycle. On mobile, do not shrink the desktop atlas into illegibility: replace it with a compact story/list or focused carousel beneath the sign-in content.

Map tile failure, boundary failure, image failure, slow network, and reduced-data mode must preserve authentication and show an honest, attractive fallback without layout shift. Keep map attribution visible whenever tiles are shown.

## Exact code-disposition manifest

Inspect before editing, then update only where required:

| Path | Before | Required after |
|---|---|---|
| `apps/web/src/app/login/page.tsx` | V4 strings and public sign-in contract | V7 atlas labels/stages/dossier strings in EN/AR; auth contract unchanged |
| `apps/web/src/app/login/LoginClient.tsx` | Credential/reset/auth composition | Preserve behavior; connect revised story props only |
| `apps/web/src/app/login/StoryPanel.tsx` | V4 map plus four-card strip | Own atlas readiness/failure, lifecycle controls, accessible alternative, and revised responsive story composition |
| `apps/web/src/app/login/StoryMapInner.tsx` | Partial V7 Leaflet layer-one refactor | Compile-safe real-map owner with cleanup, theme re-init, attribution, failure callback, and context handoff |
| `apps/web/src/app/login/login.css` | V4 story/map styling | Cohesive V7 atlas, dossier, layers, motion, RTL, themes, responsive, focus, reduced-motion, failure styling using tokens only |
| `apps/web/src/app/login/saudi-atlas-locations.ts` | Untracked preparation | Reviewed data module; no false verification claims; source IDs/provenance linked |
| `apps/web/src/app/login/saudi-atlas-motion.ts` | Untracked preparation | Reviewed lifecycle controller with correct cleanup and pause/resume semantics |
| `apps/web/src/app/login/SaqeelHero.tsx` | Static fallback | Preserve or refine only as a truthful no-tile/no-image fallback; not the primary map |
| `apps/web/src/app/login/DemoAccess.tsx` | Demo identities visible | Preserve for non-production only; ensure production builds do not expose credentials (`UX-BS-009`) |
| `apps/web/src/app/tokens.css` or actual token authority | Existing Saqeel tokens | Add tokens only when a genuinely reusable semantic token is missing; no raw route colors |
| `apps/web/e2e/negative-auth.spec.ts` and auth setup/helper | V4 authentication regression | Continue to pass unchanged unless selectors require a minimal resilient update |

Expected new files, subject to repository verification:

- `apps/web/src/app/login/SaudiIndustrialAtlas.tsx`
- `apps/web/src/app/login/SaudiAtlasNode.tsx`
- `apps/web/src/app/login/SaudiAtlasDossier.tsx`
- `apps/web/e2e/login-atlas.spec.ts`
- `apps/web/public/brand/saudi-atlas/*` only for original approved assets
- `design/claude-design-mvp1/acceptance/SAUDI_ATLAS_REFERENCE_REGISTER_CD001.csv`
- `design/claude-design-mvp1/acceptance/SAUDI_ATLAS_ASSET_REGISTER_CD001.csv`
- `${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/login-v7-atlas/*` for implementation evidence only; do not alter frozen requirements

Do not silently choose different paths. If a proposed path is inappropriate, record the exact replacement and reason in the final file manifest.

## P0 acceptance gate

All must pass:

- TypeScript and production build are green.
- Authentication, reset, `/launch`, audit, and negative-auth behavior do not regress.
- Actual Leaflet tiles/boundary/labels render when available; attribution is visible.
- The page uses only the sanitized public-safe derivative, never the unsanitized source PNG.
- The derivative is not the clickable/accessibility layer; code-based hotspots, dossiers, labels, focus behavior, truth text, and list alternative sit above or beside it.
- The page contains no public operational risk/compliance/violation/SLA/workload metrics or live implication.
- Keyboard, touch, and pointer can open/lock/close node dossiers; focus never disappears or traps.
- Arabic/RTL and English/LTR are coherent in dark and light themes.
- Reduced motion, tile failure, boundary failure, and image failure retain an understandable page and working sign-in.
- No layout overflow or obscured sign-in at 1440x900, 1280x800, 1024x768, and 390x844.
- Demo credentials are absent from production mode.
- Existing G10 authentication/persona tests still pass.

## P1 acceptance gate

- Original 3D assets have recorded origin, rights, creator/source, file hash, and allowed use; missing assets remain explicitly pending.
- Public locations have reference URLs/source names and access dates; never claim coordinates are verified without the register.
- Atlas has an accessible list alternative and status is not color-only.
- Motion pauses correctly, respects reduced motion, and remains calm at common refresh rates.
- Tile/image loading avoids material layout shift and does not block the credential form.
- EN/AR copy has no clipped labels or overlapping dossier panels.
- Visual quality is recognizably industrial and premium, not a flat outline, portal-card collage, tourism map, or generic dashboard.

P2 observations may be recorded and deferred to the consolidated F7 critique; do not loop on P2 during this slice.

## Verification commands and evidence

Run from `apps/web`:

1. `npm run typecheck`
2. `npm run build`
3. Relevant Playwright login/negative-auth tests, then the full headless suite if credentials/environment are available.
4. A raw-color check proving route/component CSS uses tokens.

Capture before/after PNG evidence for dark/light × English/Arabic at desktop, constrained desktop/tablet, and mobile. Capture pointer dossier, keyboard dossier, reduced-motion, tile failure, and image-failure states. A screenshot proves appearance only; include test output and interaction evidence.

## Completion response

Return:

1. verdict: `READY_FOR_CD001_RUNTIME_REVIEW` or `BLOCKED_P0_P1`;
2. exact files added/changed with before/after purpose;
3. protected behaviors and their test evidence;
4. P0/P1 results and remaining P2 list;
5. visual evidence paths;
6. asset and geographic provenance registers;
7. commands run and exact results;
8. known limitations, especially any missing original 3D assets;
9. confirmation that CD-002/CD-003 and production deployment were not started.

Do not commit, push, merge, or deploy without explicit human approval. Do not claim design acceptance merely because the page compiles.

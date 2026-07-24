
## Field task map (`/field/map`) — corrections (2026-07-23)
Live-verified with inspector@mim.gov.sa on staging data.

- **Coordinate swap → Ukraine**: `map/page.tsx` built `center` as `[lng,lat]`; GeoMap's contract is `[lat,lng]` (it swaps internally for Mapbox). Fixed order + KSA_CENTER. Map now lands in KSA.
- **Map 300px tall**: flex `%`-height collapse. `FieldFullMap` now absolute-fills the flex wrapper → full-screen (840×777 verified).
- **KSA max-bounds**: added `maxBounds` (KSA bbox) to shared `GeoMap` so no map (web/admin/iPad) can pan off the Kingdom.
- **Mapbox attribution**: switched to compact ⓘ (license-required, cannot be removed). Default text line gone.
- **DS-themed popup**: re-skinned `.mapboxgl-popup-content` with SAQEEL tokens (field-scoped CSS) — was default white bubble.
- **Fixture pollution (user decision: filter out)**: new `src/lib/field/fixtures.ts` — `isTestFixtureEstablishment()` matches the universal Playwright signature (13-digit `${Date.now()}` epoch stamp in name/factory_code) + CD-0xx/G10- prefixes. Wired into home, my-tasks, drafts, map (post-fetch) and establishments (DB-level `imatch`, null-safe, counts stay correct: 55→52). Verified: no CD-0xx / G10 / PLN-J / Inspector-factory / Concurrent-identity fixtures remain.
- **"Always Al-Hofuf" framing**: map centered on `markers[0]`, cropping other-region pins. Added `fitMarkers` to GeoMap (fit-bounds, maxZoom 11) — task map now frames ALL assigned establishments. Verified: Riyadh (Al Watania Plastics, amber) + Al-Hofuf (Al Ahsa Beverage, green) both in frame.
- **Stale segment loader**: `field/loading.tsx` was old Shell + "Field dashboard" title flashing on every field nav → neutral DS centred indicator.

Typecheck: clean. Color-law: clean (tokens only).

- **Theme-aware basemap**: `GeoMap` now reads `data-theme` (MutationObserver) and applies the Mapbox Standard `lightPreset` (day/night) via `setConfigProperty`, with a `style.load` fallback so it never sticks on day. Verified light→day / dark→night live on toggle.

## Field DS-chrome conversion inventory (2026-07-23)
13 / 15 field routes now render SAQEEL DS chrome (FieldHeader, no global Shell):
Dashboard, My Tasks, Establishments, Establishment File (factory-360/[id]),
Notifications (list + **detail, this pass**), Global Search, Account, Settings,
Trusted Devices, Incident Reports, Map, Factory-360 resolver (**fallback, this pass**).

Remaining 2 = the inspection EXECUTION flow, still on old Shell:
- `/field/[visitId]` (Startup + PreExecution)
- `/field/inspection/[id]` (Workspace + FactoryVerification)
These drive the immutable-submit state machine and mix ax-*/DS classes in heavy
client components. Pixel-to-pixel here means porting the Inspection Form / Visit
Results / OCR Capture / Reports designs INTO those components — a dedicated,
state-machine-careful pass (presentation only, zero transition/guard changes),
deferred per the plan rather than rushed. Not marked done on a wrapper swap.

## Field Dashboard redesign + execution-flow DS + Arabic AI briefing (2026-07-23)
- **Execution flow → DS** (4 parallel agents, presentation-only, state machine untouched, all tsc-clean, zero ax-/bare-color): `[visitId]/Startup.tsx`+`page.tsx`, `[visitId]/PreExecution.tsx`, `inspection/[id]/Workspace.tsx`+`page.tsx`, `inspection/[id]/FactoryVerification.tsx`+`SignaturePad.tsx`. NOTE: agents used the converted-screen DS idiom, not a strict per-`.dc.html` pixel match — needs a stricter pixel pass + live inspection-journey verification.
- **Dashboard rebuilt** to SAQEEL Field Dashboard.dc.html: header (date pill, live Online pill, Sync-Now, Feedback, search, notifications), AI Daily Brief (mission + 4 real stats + honest "start here" recommendation), 2-col map + factory preview, Today's Schedule, Pending Attention (Returned/Drafts/Expired — real counts), Operational Insight strip (real, Daily Progress = completed÷today), Quick Actions rail. Ungoverned design values OMITTED per decision (Health Score, Est. Finish Time, SLA window, distance). Bottom nav kept at 5 tabs (Factory 360 stays contextual).
- **FieldHeaderSync** client island — real offline.ts wiring (navigator.onLine pill + processOutbox Sync-Now + real outbox pending count).
- **Arabic AI briefing** (user: everything Arabic in Arabic profile): `getOrGenerateBriefing`/`generateContextual` now locale-aware. Language directive injected INTO the Gemini prompt (context-JSON field was ignored). Dual-language cache stored as `{en,ar}` JSON in the existing `briefing_text` (no migration); self-heals a wrong-script cached entry; generates only the requested locale synchronously (other lazily). Verified: brief renders real Arabic in the Arabic profile.
- **Feedback route** `/field/feedback` + `20260723120000_field_feedback.sql` (RLS insert/select-own) + real submit action + DS Arabic form. Reads degrade gracefully until the migration is applied via the governed Management-API path (I cannot apply it from here).

Typecheck: clean across all of it. Color-law: clean (only comments mention #fff). Nothing committed.

## v9 new screens + Establishment File restyle + full verification (2026-07-23)
- **Establishment File** (`FactoryVerification`) restyled to the design: real Factory-360 snapshot (Risk 46/band, license, drafts/sync counts) with Health Score OMITTED; M04-102/103/106 source-vs-observed model INTACT; incident → real /field/incident-reports; product/material chips real; establishment-data form / exports Y/N / contacts / workforce / category chips built as PENDING-INTEGRATION scaffolding (badged "Pending integration", unpersisted, no Senaei write-back per FND-007). Verified live.
- **Travel** (new, `/field/[visitId]/travel`) — real GeoMap + watchPosition + /api/routing/eta + geofence(150m). Governance verified live: footer states "does not record arrival", Continue links to governed M04-004 check-in. Honest — states when GPS/routing unavailable.
- **Conflict Resolution** (new, `/field/settings/conflicts`) — real offline conflicts store (list/keep-server/keep-mine via existing outbox). **Bug found + fixed in verification:** agent's CSS module used top-level `:global(.cr-*)` → Next "selector not pure" build error → HTTP 500. Converted to proper local module classes; now renders (200, "No conflicts" empty state).
- **Feedback/QR scope REMOVED** entirely (route + migration + dashboard button) — was wrong (platform feedback). Digital signature already exists as the DEC-009/M04-197 representative-acknowledgement gate at inspection submit. Signed-copy-QR delivery held per user.
- Full verification: integrated `tsc` clean, zero bare colors across all field code, both new routes present. Live-checked: Conflict Resolution, Travel, Workspace+Establishment File, Drafts, Settings(+conflicts link), Startup(+travel link), Dashboard (Arabic AI brief). Nothing committed.

## ============ SESSION CHECKPOINT (2026-07-23, end) ============
Branch: feature/ipad-field-channel-delivery (worktree Inspection-ipad-field-delivery). ~60 files changed, NOTHING COMMITTED. Full `tsc --noEmit` clean; color-law + CSS-module `:global`-purity clean across field.

### Landed this session (app, uncommitted)
- Field map: KSA lat/lng-swap fix, full-height, KSA maxBounds, compact ⓘ attribution, DS-themed popup, fit-all-markers, theme-aware basemap (day/night).
- Fixture filter `src/lib/field/fixtures.ts` — now catches epoch(13-digit) + CD0*/G10-* codes/names + `Unregistered factory <hex>` + `F360 Runtime N`/`PLN-J`/`Inspector factory N`/`Concurrent identity`/literal `fixture`/`runtime N`. Wired into home/my-tasks/drafts/map (JS) + establishments (DB imatch).
- DS chrome conversions verified: notification detail, factory-360 resolver, field/loading.tsx.
- Execution flow → DS (presentation only, M04 source-vs-observed INTACT): Startup+PreExecution (`[visitId]`), Workspace+FactoryVerification (`inspection/[id]`). Startup screen POLISHED (quick-action cards + readiness checklist).
- NEW screens: Travel (`[visitId]/travel` — real GeoMap+watchPosition+/api/routing/eta+geofence; display-and-navigate only, does NOT own the M04-004 arrival gate) · Conflict Resolution (`settings/conflicts` — real offline conflicts store; FIXED a CSS-module `:global` purity 500) · QR stub (`/field/feedback` — placeholder QR + real linkage payload, O-15, dummy scan).
- Dashboard: rebuilt to design, real data only; added AI focus-note (real brief), Last-Inspection (real query), Open-Violations "—" (DEC-DASH-003, no lifecycle). Layout: map column 2fr + fills height. Greeting name (profile → عبدالله محمد القحطاني), region → الرياض.
- Arabic AI briefing: locale-aware dual-language cache + prompt language directive + self-heal; prompt rewritten for a RICHER multi-line brief (verified: 5 Arabic bullets w/ counts, type/region breakdown, named establishments, soonest windows).
- Minor: my-tasks no-source chips honest empty state; Workspace dropped false role=tab/aria-selected.

### DB (staging iiozvqntawxfwbgffzqu) changes via service role — DATA not code
- profiles(inspector@mim.gov.sa).full_name = "عبدالله محمد القحطاني", region = "الرياض".
- 6 of the inspector's visits re-dated to 2026-07-23 (08:30–16:00), 2 re-pointed to high-risk factories (F-1101 Riyadh Petrochem, F-1103 Najd Steel); operational_state mix. Done so the dashboard populates within the assignments 1000-row cap.
- inspector_briefing_cache cleared (regenerates fresh).

### OPEN / next session
1. Claude Design `.dc.html` sync — HELD (user picked "update .dc.html" then dismissed; .dc.html are interactive prototypes, non-1:1 mapping). Decide method next.
2. Assignments 1000-row cap (dashboard `field/page.tsx` `.order(created_at desc)`): inspector has 1000+ mostly-fixture assignments crowding real data. Durable fix = DB-level fixture exclusion or pagination. Perf-sensitive (G11). NOT done.
3. Design-only, NOT wired in app: Virtual Visit inspector screen; establishment photo-capture; audit-trail/status-history; chemical-materials detail fields; feedback stepped-survey; geofence dual-pin registered-vs-actual.
4. Nothing committed — needs review + your commit/PR call. Do NOT push/merge main.

# MIM Inspection — iPad Inspector App (Native SwiftUI) — Design Spec

**Date:** 2026-07-25
**Status:** Approved design → ready for implementation planning
**Author:** Claude (brainstorming session with Sikander)

---

## 1. Goal

Rebuild the **inspector flow** — currently delivered as a Next.js PWA (`apps/web`) — as a
**fully native iPadOS app in SwiftUI**. The app mirrors the architecture and patterns of the
existing `catalyst-ios` reference app, uses the canonical **Saqeel V5.1 design system**
(`design/saqeel-v5-final`), talks to the **same Supabase backend** as the PWA (direct Swift SDK,
same tables/RLS), and is **offline-first**.

Tab bar and header navigation are **native Swift** (explicit requirement).

## 2. Decisions (locked)

| Decision | Choice | Rationale |
|---|---|---|
| Screen implementation | **Fully native SwiftUI rebuild** | Best UX/performance/offline; matches catalyst-ios |
| Scope | **Full inspector flow** (all phases below) | Complete parity with PWA field channel |
| Backend | **Same Supabase, direct Swift SDK** | One source of truth; same tables/RLS as PWA |
| Offline store | **GRDB (SQLite)** | Battle-tested for offline outbox/sync; 1:1 mirror of PWA `lib/offline.ts`; safe for field-critical data. SwiftData rejected (immature for heavy background sync). |
| Maps | **MapKit** (native) | Replaces Mapbox/Leaflet from PWA |
| Navigation | Native `TabView` + custom native header | Explicit requirement |
| Platform | iPadOS 18, iPad-only, all orientations | Field device is iPad |
| Project gen | XcodeGen + SPM | Same as catalyst-ios |

## 3. Reference sources

- **Flow parity source (PWA):** `apps/web/src/app/(app)/field/**`, `apps/web/src/lib/offline.ts`,
  `apps/web/src/components/FieldTabs.tsx`
- **Design tokens (canonical):** `design/saqeel-v5-final/tokens/tokens.css`,
  `design/saqeel-v5-final/styles/components-*.css`, `design/saqeel-v5-final/v2/SAQEEL-V2-*.md`
- **Architecture template:** `/Users/sikanderahmad/Documents/mim/catalyst/catalyst-ios`
  (`Core/DesignSystem`, `Core/Components`, `CatalystApp/{Domain,Data,Infrastructure}`)

## 4. Architecture

Clean Architecture + MVVM stores, mirroring catalyst-ios:

- **Domain** — pure `Codable`/`Sendable` value types, no UI deps.
- **Data** — repository protocols + Supabase implementations + DTOs + **Offline** (GRDB outbox,
  local store, conflict resolver).
- **Presentation** — `@MainActor` `ObservableObject` feature stores (`@Published` state) + SwiftUI views.
- **Infrastructure** — `SupabaseClient` singleton, `LocationService` (CoreLocation/MapKit),
  `NetworkMonitor`, `Secrets.xcconfig`.
- **Core packages** — `DesignSystem` (tokens) and `Components` (reusable UI) as local SPM products.

### Module / folder structure
```
InspectionApp/
├── project.yml
├── Core/
│   ├── DesignSystem/     SaqeelColors, Typography, Spacing, Radius, Density, RTL, Adaptive
│   └── Components/       TabBar, Header, Button, Field, Lozenge, Card, StatusBadge, SignaturePad
├── InspectionApp/
│   ├── App/             @main, ThemeRoot, AuthGate
│   ├── Domain/          Visit, Inspection, ChecklistItem, Response, Evidence, Violation, ActionForm, FactoryCheck
│   ├── Data/
│   │   ├── Repositories/   Auth, Visit, Inspection, Evidence, Sync
│   │   ├── DTOs/
│   │   └── Offline/        Outbox, LocalStore (GRDB), ConflictResolver
│   ├── Infrastructure/  SupabaseClient, LocationService, NetworkMonitor, Secrets
│   └── Features/
│       ├── Auth/          Login
│       ├── Dashboard/     KPIs, attention rail, performance
│       ├── Visits/        Assignment list + filters
│       ├── Startup/       Readiness, Geofence map, Journey, pre-start confirmations
│       ├── Inspection/    Workspace: sections, evidence, violations, action forms, factory verify, signature, submit
│       ├── Factory360/    Search + detail
│       ├── Virtual/       Virtual sessions
│       └── Profile/       Settings, theme, language, logout
└── InspectionAppTests/    stub-repo unit tests per feature
```

## 5. Design system port (Saqeel V5.1 → Swift)

Translate `saqeel-v5-final/tokens/tokens.css` into Swift token enums/structs (catalyst pattern):

- **Colors** — light + dark schemes. Primary green `#176B52` / dark `#64C2A1`. Canvas, surface,
  text, semantic (success/warning/critical/info), borders, control-border, tints via mixing.
  Info blue (`#175CD3`) = links/information ONLY, never actions.
- **Typography** — bundle **IBM Plex Sans Arabic** (400/500/600/700). Semantic scale
  (display/title/heading/subheading/body/field 17px/caption/micro/metric/label/action). Tabular numerals.
- **Spacing** — 4px grid: 4/8/12/16/20/24/32/48.
- **Radius** — small 4 / standard 6 / large 8 / full 999 / input 6.
- **Density** — **field density: 52px control height, ≥52px touch targets** (iPad field default).
- **Status system** — lozenges are **glyph + label** (domain glyphs ▣ ● ◆ ▲ ⟳; semantic tones),
  never color alone.
- **RTL** — SwiftUI layout direction; Arabic-first font when `lang == ar`.
- **Motion** — 120ms fast / 200ms standard; respect Reduce Motion.

## 6. Navigation (native)

- **`TabView` (`.sidebarAdaptable`)** tinted saqeel green — tabs: **Dashboard · Visits · Virtual · Profile**.
  FAB overlay "Start next visit" (primary action).
- **Custom native header** (`InspectionHeader`, catalyst `CatalystHeader` pattern): title,
  **sync-state badge**, back/exit, notification bell.
- Each tab owns a `NavigationStack`; deep-link chain: Visit → Startup → Inspection Workspace.

## 7. Feature scope (screen parity with PWA)

- **Login** — Supabase email/password; role resolves to field channel.
- **Dashboard** — KPI chips (today / remaining / need-attention / progress / awaiting-approval /
  checklist-compliance), attention rail (returned + draft), personal performance, next-visit action bar.
- **Visits** — assignment list; search + filters (type/mode/region/status/window); status lozenges;
  open/start inspection.
- **Startup / Pre-Execution** — readiness gate + package snapshot; **MapKit geofence** (factory +
  radius + live GPS + distance); **journey** step progress + arrival auto-detect; pre-start
  confirmations (representative present, location confirmed); geofence override (reason + evidence +
  approval); arrival evidence; cancellation/return/location-correction requests where schema supports.
- **Inspection Workspace (core)** — context flags; checklist sections with completion %; response
  types (boolean/enum/text/numeric); guidance EN/AR; **evidence capture** (photo + annotator, video,
  document, comment) with lifecycle (archive/delete/supersede) and sync status; **action forms**;
  **violations & penalties** (auto-triggered + manual); **factory verification** fields;
  **validation/blocking**; **submission summary**; **signature pad** (PencilKit/Canvas); submit
  (online or queued offline). Resubmission = returned-sections-only edit + version increment.
- **Factory 360** — search by CR/license; factory detail (overview, history, violations, compliance).
- **Virtual** — session list + session workspace (shared checklist; video provider TBD).
- **Profile** — profile, theme toggle, language toggle (AR/EN), password, logout.

## 8. Offline-first (GRDB)

Mirror PWA `lib/offline.ts` semantics:

- **Local store** — cached visits/inspections/package definitions + draft responses in GRDB.
- **Outbox** ops: `response`, `evidence`, `submit`, `geo_checkin`, `geo_override_request`,
  `factory_check`, `action_form`.
- **Idempotency** — per-op `idempotency_key`; evidence dedup by `content_sha256`.
- **Conflict detection** — `baseline_updated_at` compare; conflicts stored explicitly (no silent
  overwrite); resolution UI: **Keep mine / Keep server**.
- **Replay** — `processOutbox()` on reconnect (`NetworkMonitor`), idempotent; failed ops surface
  retry affordance.
- **Sync-state indicators** — header badge: Synced / Offline / Pending / Syncing / Conflict / Failed.

## 9. Data model (Supabase, same as PWA)

Key tables consumed: `visits`, `inspections`, `checklist_responses`, `evidence`, `violations`,
`violation_codes`, `action_forms`, `submission_versions`, `reviews`, `assignments`, `profiles`,
`inspection_factory_checks`, `visit_preparations`, `visit_package_snapshots`,
`geo_override_requests`, `visit_location_corrections`, `engine_settings`. Repositories are
RLS-scoped (inspector sees own assignments/inspections).

## 10. Delivery phases

0. **Foundation** — XcodeGen project; DesignSystem port; Core Components (TabBar, Header, Button,
   Field, Lozenge, Card); Supabase client + Auth + Login. *Shell runs, login works.*
1. **Dashboard + Visits** — dashboard (KPIs/attention/performance) + visits list/filters (read-only).
2. **Inspection Workspace (core)** — checklist, evidence, violations, action forms, factory verify,
   signature, submit (online).
3. **Offline-first** — GRDB outbox, drafts, sync-state, conflict resolution; retrofit phases 1–2.
4. **Startup / Geofence / Journey** — readiness, MapKit geofence, GPS journey, arrival check-in,
   confirmations, overrides.
5. **Factory 360 + Virtual + Profile** — search/detail, virtual sessions, settings.

## 11. Testing

Repository protocols + stub injection; per-feature `@MainActor` store unit tests (catalyst pattern).
No UI tests initially.

## 12. Non-goals (this project)

- Admin / Planning / Operations / Review / Committee channels (inspector channel only; Review is a
  reviewer role and out of scope except where inspector sees "returned" state).
- Building a new backend or schema changes (reuse PWA Supabase).
- iPhone layout optimization (iPad-only target).

## 13. Open questions

- Virtual inspection video provider (Zoom/Teams/other) — deferred to Phase 5.
- Signature capture: PencilKit vs custom Canvas — decide in Phase 2.
- Bundle id / app name — proposed `com.mim.inspection` (confirm).

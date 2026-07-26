# iPad Inspector App — Progress

Native iPadOS (SwiftUI) rebuild of the inspector flow, mirroring `catalyst-ios`,
using the Saqeel V5.1 design system and the same Supabase backend as `apps/web`.
Lives under `apps/ipad/`. Branch: `setup/Inspection`.

Related docs:
- Design spec: [[docs/superpowers/specs/2026-07-25-ipad-inspector-native-design]]
- Phase 0 plan: [[docs/superpowers/plans/2026-07-25-ipad-inspector-phase0-foundation]]
- Phase 1 plan: [[docs/superpowers/plans/2026-07-25-ipad-inspector-phase1-dashboard-visits]]
- Follow-ups: [[apps/ipad/PHASE1-FOLLOWUPS]]
- Setup / how to run: [[apps/ipad/README]]

_Last updated: 2026-07-26 (Phase 2/3 complete)_

---

## Status at a glance

| Area | State |
|---|---|
| Phase 0 — Foundation (design system, components, login, tab shell) | ✅ Done |
| Phase 1 — Dashboard + Visits (live Supabase data) | ✅ Done |
| Design polish (real font, cards, status pills, segmented, login, KPIs) | ✅ Done |
| Phase 2/3 — Inspection Workspace + Offline-first (GRDB drafts/outbox/sync, checklist/evidence/signature/submit) | ✅ Done |
| Phase 4 — Geofence · Phase 5 — Factory360/Virtual/Profile | ⬜ Not started |

Runs end-to-end against the **real Supabase backend**: login → dashboard → visits with live data.

---

## What's built

**Architecture** (Clean Architecture + MVVM, mirrors catalyst-ios)
- `Core/` SPM package: `DesignSystem` (Saqeel tokens) + `Components` (reusable UI)
- App target `InspectionApp`: `Domain` → `Data` (repositories, DTOs) → `Features` (`@MainActor` stores + SwiftUI views), `Infrastructure` (Supabase, secrets)
- XcodeGen project, iPadOS 18, iPad-only, `com.mim.inspection`

**Phase 0** — Saqeel design tokens in Swift (colours light/dark, typography, spacing, radius, 52px field density), core components (Button, Field, Card, StatusLozenge, TabBar, Header), Supabase auth, Login + native 4-tab shell (Dashboard · Visits · Virtual · Profile).

**Phase 1** — Domain models + safe enums, `VisitRow` DTO (PostgREST embed decode), `VisitRepository`/`ProfileRepository` (Supabase + stubs), pure `DashboardKPIs` + `VisitFilter`, `@MainActor` stores, and the Dashboard (KPI cards + attention rail), Visits (counted segmented filter + cards), and Profile (identity + sign out) screens.

**Design polish** — bundled the real **IBM Plex Sans Arabic** font (converted from the design-system woff2, weights normalised), custom **SaqeelSegmented** control, **StatusPill** (colour dot + label), reference-matched **VisitCard** (mono code, bold name, subtitle, status pills, dates), tone-aware **KPI cards**, branded **Login**, and a header with a date subtitle. Matched against the design reference `design/saqeel/screens/png/tablet-field-offline_en_light_834x1000.png`.

**Phase 2/3 — Inspection Workspace + Offline-first** (commits `eef6006..3fd92ab`, 102 tests). GRDB `OfflineStore` (drafts/packages/outbox/conflicts) + `SyncEngine` (replay evidence→response→submit, response conflict detection, idempotent submit) mirroring the PWA `lib/offline.ts`. Workspace domain models + DTOs (schema-verbatim), `WorkspaceRepository` + `SupabaseSyncGateway`, `@MainActor WorkspaceStore` (answer autosave → GRDB draft + outbox → sync; submit snapshot keyed by item code), checklist UI (`WorkspaceView`/`ChecklistItemView` with segmented/text/date controls), photo evidence capture (CryptoKit sha, outbox → Storage), PencilKit signature + submit, and Visits→Workspace navigation (`@StateObject`-owned `WorkspaceScreen`, not-started placeholder, header sync badge). Built via subagent-driven TDD with per-task review + a final whole-slice review; the final review caught and fixed two runtime-critical schema mismatches (`item_rules` object shape; evidence `content_sha256`/`inspection_id`).

---

## Live-integration fixes (found while wiring the real backend)

1. **Auth session persistence** — Keychain (SDK default) fails silently in unsigned builds → session lost on relaunch. Now uses a UserDefaults-backed `AuthLocalStorage` in DEBUG (Keychain in signed release).
2. **`permission denied for function has_planning_capability`** — the `visits` RLS calls a planning-capability function; the `authenticated` role lacked EXECUTE on the live DB. Fixed by running the migration's declared `GRANT` in Supabase.
3. **`statement timeout`** — unbounded ordered scan over the large assigned-visit set with per-row RLS. Now an unordered `limit(50)` page (~4s, under the timeout).
4. **Timestamp decode** — real rows carry mixed fractional-second precision (`.225` / `.22` / none); strict ISO8601 rejected 2-digit fractions. Decoder now strips fractional seconds.
5. **Inspections embed shape** — `visits→inspections` is to-one (unique `visit_id`), so PostgREST returns a single object, not an array. DTO fixed.

---

## Known limitations / next up

- **Visits are an unordered 50-row page.** Ordered + filtered server-side queries hit the shared DB's statement_timeout because `has_planning_capability` is slow per row. **Proper fix is backend**: mark the function `STABLE` / optimise the RLS / add an index, then the app can order + paginate. Until then KPIs reflect only the fetched page (often 0 "today" given seed data).
- Real IBM Plex **Arabic-script** faces not yet bundled (Latin subset only) — fine for the English UI, needed for full RTL.
- `onOpen` on a visit is a no-op — navigation into Startup/Workspace arrives in Phase 2/4.

**Recommended next:** Phase 2 (Inspection Workspace) — the core checklist/evidence/signature/submit flow — and, in parallel, the backend RLS-perf fix so Visits/KPIs can be ordered and complete.

---

## How to run

See [[apps/ipad/README]]. In short: put real Supabase creds in the gitignored
`apps/ipad/InspectionApp/Config/Secrets.local.xcconfig`, then
`cd apps/ipad && xcodegen generate && xcodebuild ... -destination 'platform=iOS Simulator,name=iPad mini (A17 Pro)'`.
Test inspector account: `inspector@mim.gov.sa`.

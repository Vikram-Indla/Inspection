# G5 Architecture, Data, API, Integration & Environment — AS-BUILT

**Project:** MIM Inspection Platform MVP1
**Gate:** G5 (record shows PASS 2026-07-11; this revision regenerates the evidence against the *current* repository, not the greenfield snapshot the original PASS was based on)
**Regenerated:** 2026-07-12, during G10-VERIFICATION-PLAYWRIGHT
**Supersedes:** the 2026-07-11 version of this file, whose headline claim ("no application code exists") is **false as of this revision** — see §0.

---

## 0. Method & headline finding

The original G5 report (2026-07-11) was written against a repository containing **only the product contract**, before `apps/web/` existed, and concluded "nothing to reverse-engineer." That premise no longer holds. This revision was built by reading the **actual current repository**: `apps/web/src` (98 files), `supabase/migrations/*.sql` (16 files, 1,025 lines), `apps/web/package.json`, and `apps/web/e2e/`.

**Headline:** the repository now contains a **working Next.js 15 / React 19 application** wired to a **live Supabase project**, covering 29 built route directories, 34 database tables, RLS policies, audit triggers, three SECURITY DEFINER guarded-transition functions, an offline outbox/sync layer, bilingual (EN/AR) UI strings, and one Playwright spec file. `GATE_STATUS.md` records G0–G9 as PASS and DEC-001..010 as sponsor-accepted (`DECISIONS_ACCEPTED_2026-07-11.yaml`, status `ACCEPTED_INTERIM`, deliberately not written into the frozen `decision_register.csv` pending change-control `CC-DEC-001`). This document does not dispute those gate records; it re-derives the architecture facts under them and separately re-verifies whether the four P0 integrity defects raised in `docs/G5_EXTERNAL_ASSESSMENT_RECONCILIATION.md` (2026-07-12) are still present in code, since a gate PASS is not itself evidence that a specific line of code changed.

---

## 1. Repository architecture (as-built)

| Aspect | Finding |
|---|---|
| App code | **Present** — `apps/web/src` (Next.js App Router), 29 `page.tsx` route directories, `src/lib/`, `src/components/` |
| Stack / framework | **Decided and built**: Next.js `^15.1.0`, React `^19.0.0`, TypeScript `^5.7.0` — matches DEC-010's `web_admin: "Next.js / React / TypeScript"` |
| Package manifest | `apps/web/package.json` — scripts: `dev`, `build`, `start`, `typecheck`. **`test` script absent**; `@playwright/test ^1.61.1` is a devDependency and `apps/web/playwright.config.ts` + `apps/web/e2e/negative-auth.spec.ts` exist, but no `npm test`/`npm run e2e` script wraps it — the G10 exit criterion (Playwright suite) exists as one spec file, not yet the described golden-journey/offline-drill/persona-tour/negative-path suite. |
| Routes / API handlers | 29 built route directories + Next.js server actions (`actions.ts` files) per route; no separate `/api` handler tree found — mutations go through server actions calling the Supabase client directly |
| DB migrations | 16 files in `supabase/migrations/`, `0001`–`0014` sequential, plus **two files both numbered `0015`** (`0015_w1_field_home.sql`, `0015_w1_journey_state.sql`) — see §14 for this as an open housekeeping item |
| Tests / CI | 1 Playwright spec (`negative-auth.spec.ts`); no CI workflow file found in this pass; no unit/integration test files found outside `e2e/` |
| Reusable components | `src/components/` exists (e.g. `GeoMap`, `Shell`, `FieldTabs`, `PwaRegister`) — the "build shared layer first" recommendation from the 2026-07-11 report was followed for shell/nav/offline, partially for workflow (see §5) |
| Present (unchanged) | `product-contract/**`, `docs/**`, `.claude/**` |

**Actual source layout** (confirmed, not inferred):
```
apps/web/src/app/{admin,factories,field,launch,login,operations,planning,reviews,virtual,visits}/  -> channels + shared web surfaces
apps/web/src/lib/            -> supabase client (browser+server), offline outbox, i18n
apps/web/src/components/     -> Shell, FieldTabs, GeoMap, PwaRegister
apps/web/e2e/                -> Playwright (1 spec: negative-auth)
supabase/migrations/         -> 16 SQL files, sequential + one duplicate-numbered pair (0015)
```

---

## 2. Channels, personas, modules — unchanged from contract, now realized

- **4 channels built:** Admin (`/admin/*`, 9 sub-routes), Web Portal (`/planning/*`, `/visits/*`, `/reviews/*`, `/factories/*`, `/operations`), iPad/Field (`/field`, `/field/[visitId]`, `/field/inspection/[id]`), Virtual (`/virtual`, `/virtual/[id]`). A `/launch` role router and `/login` sit outside the four channels as shared entry.
- **8 human personas** (`domain/personas.yaml`) — role-routed via `/launch`: `inspector→/field`, `reviewer→/reviews`, `planner→/planning`, `ops`/`leadership→/operations`, fallback `/admin`. Confirms `STORYBOARD_STATUS.md`'s SB02 "verified live" claim; this reconciles and closes the earlier external-assessment conflict (finding #6, "every login routes to Admin") — **that finding does not reproduce**; a working role router exists.
- **12 system/engine personas (ENG-01..12)** — build status per engine in §5.

---

## 3. Stack & backend — DECIDED (was: candidate)

Per `DECISIONS_ACCEPTED_2026-07-11.yaml` DEC-010, and confirmed present in code:

1. **Frontend:** Next.js 15 / React 19 / TypeScript — confirmed in `package.json`.
2. **Backend:** Supabase (Postgres + Auth + Storage + Realtime), RLS enforcing the RBAC matrix — confirmed: `@supabase/ssr`, `@supabase/supabase-js`, `src/lib/supabase.ts` (browser client), `src/lib/supabase-server.ts` (server client), 34 tables with RLS policies in the migrations.
3. **iPad offline-first:** PWA (IndexedDB + service-worker outbox, idempotent replay) — confirmed: `src/lib/offline.ts` implements `local.enqueue`/`processOutbox`/conflict detection; `src/components/PwaRegister.tsx` registers a service worker; `apps/web/public/manifest.json` defines `start_url: "/field"`, `display: "standalone"`.
4. **Region:** DEC-010 records the Seoul (`ap-northeast-2`) → Frankfurt (`eu-central-1`) migration as **RECOMMENDED-ACCEPTED, not yet executed** ("migrate ... BEFORE any data load"). No evidence in this pass that the migration has run — **still an open production blocker**, tracked in §14.

---

## 4. End-to-end process spine (13 phases) — unchanged, now channel-mapped to real routes

| Phase | Title | Built route(s) |
|---|---|---|
| P00 | Pre-Day-0 Configuration | `/admin/regulations`, `/admin/items`, `/admin/packages`, `/admin/violations`, `/admin/workflows`, `/admin/risk`, `/admin/gis`, `/admin/access`, `/admin/localization` |
| P01–P03 | Targeting, Planning, Publish | `/planning`, `/planning/bulk`, `/planning/single`, `/planning/immediate` |
| P04–P05 | Startup Pack, Execution Mode Gate | `/field`, `/field/[visitId]` (Startup.tsx) |
| P06A | Physical Journey & Check-In | `/field/[visitId]` (journey/check-in logic), `set_operational_state()` DB function |
| P06B | Virtual Session & Verification | `/virtual`, `/virtual/[id]` (Room.tsx, OTP) |
| P07–P09 | Execution, Evidence, Submission | `/field/inspection/[id]` (Workspace.tsx) |
| P10–P11 | Review, Return, Correction | `/reviews`, `/reviews/[id]` |
| P12 | Factory 360 & Ops Update | `/factories/[id]`, `/operations` |

No canonical phase is entirely unbuilt. Depth/completeness within each phase is not re-certified here (that is G7/G9's job, already recorded PASS) — this section only confirms **which routes exist**, per the actual filesystem.

---

## 5. Services / engines (ENG-01..12) — build status against actual code

| Engine | Contract responsibility | As-built evidence | Status |
|---|---|---|---|
| ENG-01 Regulatory & Compliance | Published rules & item semantics | `/admin/regulations`, `/admin/items`, `regulations`/`regulation_clauses` tables, maker-checker trigger `guard_publish_requires_approver` | **Built** |
| ENG-02 Form & Package | Versioned packages/sections/questions | `/admin/packages`, `DraftEditor.tsx`, `package_versions` table, `guard_published_package` trigger (blocks edits to published) | **Built** |
| ENG-03 Workflow | Allowed states, transitions, guards, side effects | **Partially built.** `set_operational_state()` (0015) is a real SECURITY DEFINER guard enforcing the legal `new/prepared→on_the_way→arrived→executing` legs for `visits.operational_state`, idempotent, RBAC-009-checked. `expire_lapsed_visits()` (0015) is a second canonical, guarded transition for plan expiry. **But** `planning_status`, `inspections.status`, and `reviews` decisions are still written by direct `.update({status: ...})` calls in `visits/[id]/actions.ts`, `planning/bulk/actions.ts`, `planning/single/actions.ts`, `operations/actions.ts`, `reviews/[id]/actions.ts`, and `lib/offline.ts` — no equivalent guarded function wraps these. **Not uniformly centralized**; the pattern exists for one state machine, not all of them. |
| ENG-04 Risk Foundation | Score inputs, band, version, explainability | DEC-001 weights accepted (weighted-sum, 5 factors, versioned). `risk_band`/`risk_score` referenced in `visits/[id]/page.tsx`, `admin/gis/GisStudio.tsx`, `planning/bulk/BulkForm.tsx`. Runtime scoring engine implementation (vs. static display of a config value) not traced end-to-end in this pass. | **Config accepted; runtime computation depth unverified** |
| ENG-05 Assignment | Auto/manual assignment, availability, conflicts | `assignments` table, manual assignment write confirmed (`visits/[id]/actions.ts:97`); auto-assignment/conflict-detection logic not located in this pass | **Partially built** |
| ENG-06 GIS/Geofence/Telemetry | Location, route, ETA, arrival, geofence, override | `Startup.tsx` geofence distance check (`distM`), `geo_events` table with `altitude_m`/`speed_mps`/`heading_deg`/`device_occurred_at` (0015), `admin/gis` config surface. **Contains the confirmed GPS-fallback defect** — see §11. | **Built, with an open P0 integrity defect** |
| ENG-07 Evidence & Media | Rules, linkage, metadata, integrity | `evidence` table, `attachPhoto()` in `Workspace.tsx` computes SHA-256 (`sha256b64`) at capture. DEC-006 accepted formats include photo/video/document/voice-note; **built capture path is photo-only** (`accept="image/*"`) — video/document/voice-note capture not found in this pass. Malware scanning (DEC-006: "on upload, storage-side") not confirmed as wired (Supabase Storage config not inspected — requires project access this session doesn't have). | **Partially built; policy ahead of implementation** |
| ENG-08 Violation & Penalty | Configured mappings consumed at runtime | `/admin/violations` config UI, `violation_codes`/`penalty_mappings` tables and inserts (`admin/violations/actions.ts`). Runtime instance-generation (non-compliant response → actual `violations` row insert during/after review) not traced end-to-end in this pass — **same gap flagged in the 2026-07-12 external-assessment reconciliation (EXT-11), still unverified**. | **Config built; runtime generation unverified** |
| ENG-09 Review & Version | Immutable versions, return scope, comparison, decisions | `submission_versions`, `reviews` tables; `guard_submitted_inspection` and `guard_decided_review` triggers block mutation of submitted/decided rows at the DB layer — this is real immutability enforcement, not just an app-layer flag. `/reviews/[id]` compare/decide UI built. | **Built** |
| ENG-10 Offline Sync | Local package, autosave, retry, conflict | `src/lib/offline.ts`: `local.enqueue`, `processOutbox`, `local.conflicts()`, conflict resolution UI in `Workspace.tsx`. **Contains the confirmed false-submitted-state defect** — see §11. | **Built, with an open P0 integrity defect** |
| ENG-11 Notification & SLA | Assignment/change/appointment/submission/return/exception events | `notifications` table, recipient-scoped RLS (`notif_own`, `notif_update_recipient` in 0015), mark-read/handled states. DEC-003 SLA calendar accepted (business hours, escalation tiers) — SLA **timer/escalation runtime enforcement** not located in this pass (config values exist; a scheduled job or trigger enforcing breach escalation was not found in the 16 migrations). | **Notification delivery built; SLA enforcement unverified** |
| ENG-12 Audit & Traceability | Actor/time/before-after/version/source-requirement/evidence trail | `audit_row_change()` trigger applied to all tables via a loop (`0002_rbac_audit.sql`), `block_audit_mutation()` (0005) makes `audit_events` append-only at the DB layer — genuine immutable audit trail, not app-enforced. | **Built** |

---

## 6. Routes / surface inventory — actual vs. canonical

| Channel | Canonical (contract) | Built (filesystem) |
|---|---|---|
| Admin Portal | 14 | 10 directories (`/admin` + 9 sub-routes, incl. `/admin/localization` which is not in the original 14-route canonical count) |
| Web Portal | 13 | 11 directories (`/planning`+3, `/visits`+1, `/reviews`+1, `/factories`+1, `/operations`) |
| iPad | 8 | 3 directories (`/field`, `/field/[visitId]`, `/field/inspection/[id]`) |
| Virtual | 3 | 2 directories (`/virtual`, `/virtual/[id]`) |
| **Total** | **38** | **29 (39 rows incl. header in `screen_route_catalogue.csv`; 26+3 non-`page.tsx` shared routes = 29 built directories)** |

**This gap is unchanged from the prior report and from the 2026-07-12 external-assessment reconciliation (EXT-03).** `GATE_STATUS.md` records G9 as "0 missing / 0 partial rows" against the **493-row AC ledger** (`product-contract/evidence/AC_LEDGER.csv`, 494 lines incl. header), which evidently treats multiple canonical `SCR-*` screen IDs as satisfied by tabs/sections *within* a single built route (e.g. `/admin` likely serves several `SCR-ADM-0xx` IDs via internal navigation, not one route per ID). **No `screen_id → route` equivalence document was found in this repository** to make that consolidation auditable. This is a genuine gap between "G9 says 0 missing" and "no artifact proves the mapping" — recommend producing the equivalence map as a G10/G11 evidence item rather than treating the AC ledger's row-count alone as proof.

---

## 7. Data model — as-built

- **34 tables** in `supabase/migrations/*.sql` (vs. the contract's ~11 core objects described narratively) — full list: `action_forms, assignments, audit_events, checklist_responses, config_versions, engine_settings, evidence, factories, factory_documents, factory_representatives, findings, geo_events, inspection_items, inspections, journey_sessions, notifications, package_versions, packages, penalty_mappings, profiles, regulation_clauses, regulations, reviews, roles, submission_versions, ui_string_revisions, ui_strings, user_roles, violation_codes, violations, virtual_participants, virtual_sessions, visit_plans, visits`.
- **Audit:** every table gets an `audit_row_change()` trigger (loop in `0002_rbac_audit.sql`); `audit_events` is append-only via `block_audit_mutation()` (0005) — **CLAUDE.md's "every mutation audited" and "never edit an immutable submitted version" hard rules are enforced at the database layer for audit rows and for submitted inspections/decided reviews (`guard_submitted_inspection`, `guard_decided_review`)**, not merely by app-layer convention.
- **State machines:** two confirmed SECURITY DEFINER guarded transitions exist (`set_operational_state`, `expire_lapsed_visits`, both in migration `0015_w1_journey_state.sql`/`0015_w1_field_home.sql`) — these are the first real instances of the "canonical transition service" the original G5 report said must be built before feature screens (§13 of the prior version). They cover 2 of the ~9 state machines named in the contract (`visits.operational_state`, `visits.planning_status` expiry leg). The remaining state machines (`inspections.status`, `reviews` decision, `visit_plans.status` publish, offline queue) are still mutated by direct, RLS-gated `.update()` calls from server actions, not by an equivalent guarded function.
- **Offline queue status model:** `Workspace.tsx` still sets a local `submitted` boolean synchronously on enqueue, before `processOutbox` confirms server acknowledgement (unchanged from the 2026-07-12 reconciliation's finding — see §11).

---

## 8. Security / RBAC — as-built

`domain/rbac_matrix.csv` (14 RBAC contracts, unchanged) is implemented via Postgres RLS across all 34 tables, with `has_role()`/`has_any_role()`/`is_assigned_inspector()` helper functions (`0001`, `0002`). Confirmed **unchanged** from the 2026-07-12 external-assessment reconciliation:

- `reviews_insert` (`0002_rbac_audit.sql:75`): `has_any_role(array['reviewer','ops']) or auth.uid() is not null` — the `or auth.uid() is not null` clause still makes the role check meaningless; **any authenticated user can insert a `reviews` row.**
- `vp_rw` (`0002_rbac_audit.sql:81`): `for all using (auth.uid() is not null)` on `virtual_participants` — **any authenticated user can read/write/delete any participant row**, contradicting RBAC-014 ("Own appointment/session only").
- `vs_read` (`0002_rbac_audit.sql:78`): any authenticated user can read any `virtual_sessions` row.

New in this revision, and a genuine improvement: `0015_w1_field_home.sql`'s `notif_update_recipient` policy correctly scopes notification updates to `recipient = auth.uid() or has_role('ops')` — a correctly-scoped policy pattern that the three items above should be brought in line with.

---

## 9. Error / recovery contracts — unchanged (17), partially exercised

`governance/error_catalogue.csv` unchanged. Confirmed still bypassed: the "weak GPS" error path in `Startup.tsx` is unreachable for the no-signal case because a synthetic reading is substituted instead of triggering it (§11). The other 16 contracts were not individually re-walked in this pass.

---

## 10. Integrations — DECIDED (was: all decision-gated), wiring status

| Integration | Decision (accepted) | Wiring status in code |
|---|---|---|
| Risk engine/model | DEC-001: weighted-sum, 5 factors, versioned | Config accepted; runtime scoring computation not traced end-to-end (§5 ENG-04) |
| Maps / GIS provider | DEC-008: Google Maps Platform (primary), MapLibre+OSM (offline) | `react-leaflet`/`leaflet` present in `package.json` — this is **not** Google Maps or MapLibre; the accepted decision and the actual dependency **disagree**. Flagged as a gap for G11. |
| OTP / identity verification | DEC-007: SMS via Unifonic primary, Twilio fallback, adapter abstraction | `vp_request_otp`/`vp_verify_otp` DB functions exist (0009); `Room.tsx` still renders `otpInfo[p.id].dev_code` directly in the UI — **provider is not wired; dev-code display remains live**, matching the still-open EXT-13 finding |
| Digital acknowledgement | DEC-009: drawn signature + name + role + timestamp + geotag, refusal path | **Not built as decided.** `Workspace.tsx` submit() still hardcodes `{ name: "Factory representative", signed: true, ts }` — no drawn signature, no role, no geotag, no refusal path found. Matches still-open EXT-12/EXT-12B. |
| Evidence storage/scanning/retention | DEC-006: photo/video/doc/voice-note, SHA-256 at sync, malware scan on upload, 10yr retention | SHA-256 hashing confirmed (`sha256b64` in `attachPhoto`); photo-only capture; malware scanning and retention enforcement not confirmed in this pass |
| Notification + SLA calendar | DEC-003: business-hours calendar, SLA tiers, escalation | Notification delivery built; SLA timer/escalation enforcement not located (§5 ENG-11) |
| Virtual video session provider | Not in DEC-005/007 scope explicitly | No video provider integration found in `virtual/[id]/Room.tsx` beyond the OTP participant-verification flow — session appears to be a verification/evidence room, not a live video call; confirm against DEC-005's accepted scope (`"virtual session join"` is listed, video-call mechanics are not itemized) |
| Offline sync backend | DEC-010 stack: Supabase + IndexedDB outbox | Built (`lib/offline.ts`) |

**Net:** decisions are made; several integrations are built to a *different* choice than what was decided (maps provider) or not yet built to the decided spec (acknowledgement, OTP provider, evidence types). This is a decision-vs-implementation drift that G11 hardening should close, not a re-opening of the decisions themselves.

---

## 11. Confirmed-still-open P0 integrity defects (re-verified this pass)

Per the 2026-07-12 external-assessment reconciliation, re-checked against the current tree:

1. **Fake GPS fallback — still present.** `Startup.tsx` `checkIn()`: on `pos === null`, substitutes `official_lat + 0.0005` / `official_lng + 0.0002` and `acc = 4.2`. The inline comment now reads `// demo fallback: 60m from official pin, good accuracy — surfaced in the log (M04-049)` — i.e. it has since been tied to a requirement ID (M04-049) and is logged to the UI's activity log, but **the underlying behavior (fabricating a passing GPS reading instead of blocking/erroring) is unchanged.**
2. **Offline-submit false state — still present.** `Workspace.tsx` `submit()`: `setSubmitted(true)` still fires synchronously on local enqueue, before `processOutbox` confirms server acknowledgement. `acknowledgement` object is still the hardcoded literal, not decision-compliant (§10).
3. **Broad RLS — still present, unchanged.** `reviews_insert`, `vp_rw`, `vs_read` policies are byte-for-byte identical to the 2026-07-12 finding.
4. **Workflow bypass — partially remediated.** `set_operational_state()` and `expire_lapsed_visits()` are new, real, guarded transition functions (0015) — genuine progress. But `inspections.status`, `reviews` decisions, and `visit_plans`/`visits.planning_status` publish are still mutated by direct `.update()` calls with no equivalent guard function. **Not closed; partially closed.**

None of these four are re-classified as fixed. G9's "0 missing / 0 partial" build-completion claim and these four still-open integrity defects are not contradictory — build-completeness (does the feature exist) and integrity-correctness (is the feature's implementation safe) are different axes, and this document only speaks to the latter.

---

## 12. Non-functional targets — DECIDED (was: OPEN)

DEC-010 accepted: 99.5%/99.0% availability, API p95 500ms read/1000ms write, dashboard load 3s, 500 users/150 field inspectors concurrency, RTO 4h/RPO 15min, offline package 200MB target/500MB max. **No load test, latency measurement, or DR drill evidence was found in this pass** — these are targets, not yet measured-and-passing evidence. This is a G11/G12 evidence gap, not a G5 architecture gap.

---

## 13. Environments

| Item | Finding (re-verified where possible) |
|---|---|
| Inspection Supabase project | `iiozvqntawxfwbgffzqu` — status not re-pinged this session; prior finding was LIVE |
| Region | Still recorded as Seoul (`ap-northeast-2`) per DEC-010's own text; Frankfurt migration is "RECOMMENDED-ACCEPTED," **not confirmed executed** — no migration evidence found. Open G11 item, not G5. |
| Schema access | Not attempted this session — Supabase MCP tools require authentication not available in this non-interactive session |
| `.env` in repo | Not re-checked this pass; prior finding was none (correct) |

---

## 14. New housekeeping items surfaced by this regeneration

1. **Duplicate migration numbering:** `0015_w1_field_home.sql` and `0015_w1_journey_state.sql` share the number `0015`. One file's header comment says "NOT applied here — orchestrator applies," suggesting a deliberate staging mechanism outside plain sequential `supabase migration up` — worth confirming this doesn't cause an ordering ambiguity in a fresh environment.
2. **Maps provider drift:** DEC-008 accepted Google Maps Platform + MapLibre; code uses `leaflet`/`react-leaflet` (OSM-based, not MapLibre, not Google Maps). Needs reconciliation — either DEC-008 should be revised or the dependency should change.
3. **No `screen_id → route` equivalence artifact** exists to substantiate G9's "0 missing" claim against the 38-canonical-route contract, despite 29 routes being built. Recommend producing this before G5/G9 evidence is cited externally.
4. **`package.json` has no `test` script** despite `@playwright/test` being installed and one spec existing — the G10 exit criterion ("Playwright headless suite... passes") is not yet runnable via a single documented command.

---

## 15. Readiness verdict

- **Architecture is built**, not merely specified — this is the primary correction to the 2026-07-11 version of this document.
- **Stack, NFR targets, and all 10 DEC-* domains have sponsor-accepted interim values** (`DECISIONS_ACCEPTED_2026-07-11.yaml`), though the frozen `decision_register.csv` correctly still shows all 10 as `Open` pending formal change-control (`CC-DEC-001`) — **this is intentional, not a defect.**
- **Four P0 integrity defects identified in the 2026-07-12 external-assessment reconciliation are re-confirmed present in the current code**, with one (workflow-transition bypass) partially remediated via two new guarded DB functions. **G10/G11 evidence should not be considered complete until these are fixed-and-retested or formally logged as signed, time-boxed waivers** — per CLAUDE.md, they may not be silently treated as closed by gate-level PASS records that were not scoped to re-check them line-by-line.
- **Decision-vs-implementation drift exists** on maps provider, digital acknowledgement, and OTP provider — decisions are made, code doesn't yet match them.
- Next controlled activity per the active G10 slice: complete the Playwright suite (golden journey, offline drill, persona tours, negative paths) — and this document recommends the suite explicitly exercise the four still-open P0 paths (weak/absent GPS, offline submit before sync, cross-role review/virtual-participant access, and the `inspections.status`/`reviews`/`visit_plans` transition paths that lack a guard function) so their status is machine-verified rather than re-asserted by hand next time.

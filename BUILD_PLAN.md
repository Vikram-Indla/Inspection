# MIM Inspection Platform — Build Plan (real delivery)

Authorized 2026-07-11 (HUMAN_APPROVALS.yaml: G5 PASS · G6 accepted · build authorized).
Stack per DEC-010: Next.js/React/TS (`apps/web`) · offline-first PWA for iPad · Supabase (Postgres/Auth/Storage/Realtime, RLS = RBAC matrix). Design authority: `design/astryx/*` — every screen implements its frame 1:1. Acceptance contract non-negotiable: each slice certifies against its AC rows + EV proofs before "done".

## Phases to completion (9 build slices after today's B1 start)

| Slice | Scope | Certifies |
|---|---|---|
| **B1 ✓ COMPLETE (2026-07-11)** | Migrations 0001–0004 LIVE (30 tables, 54 policies, 44 triggers incl. immutability guards + append-only audit), contract seed (SBC-801, 5 items, published PKG-FS, violation/penalty mappings, 4 factories), 5 role-scoped users, auth (middleware+login), live screens: /admin, /admin/regulations, /planning, /visits. Smoke-tested: middleware redirect ✓ login ✓ RLS (planner sees 4 factories, anon sees 0) ✓ | FND-001/002/003 live; EV-001 base |
| **B2 ✓ COMPLETE (2026-07-11)** | Live admin screens: overview, regulations, items, packages (designer read + governed publish), violations/penalties, workflows (published config v4), Risk Studio (editable, risk_owner-gated), GIS Studio, access matrix. Migration 0006: package maker-checker + approver-required trigger. Evidence B2-EV-001: draft→self-approve-blocked→distinct-approver-publish→immutable, full flow via public API with real users, auto-audited | M09 config surfaces + EV-002 chain proven |
| **B3 ✓ COMPLETE (2026-07-11)** | Golden slice executed on production (B3-EV-001): planner published visit on PKG-FS v2026.08 → journey + geofence check-in inside 150m/±4.2m with gis version stamped → 4 responses → FS-101 NC auto-fired V-FS-09/mapping v3/P-014 + mandatory photo (sha256) + blocking action form → immutable v1 + acknowledgement → duplicate retry 409 (idempotency) → post-submit edit blocked → reviewer returned exact scope [s1] → decided-review edit blocked → correction → immutable v2 → approved → Factory 360 truth query. 4 role-scoped users, public API only, 37 audit events auto-captured. /reviews screen shows it live | EV-003/005/007/008 chains proven; EV-006 (offline) lands in B5 |
| B4 | Web channel complete: planning (bulk/single/immediate), visit management, Factory 360 (SCR-WEB-100..210,400) | M01+M02+M07 118 ACs |
| B5 | iPad PWA offline-first: service-worker outbox, IndexedDB drafts, idempotent replay, conflict resolver, package cache (SCR-IPAD-600..670) | M03+M04 238 ACs, EV-006 |
| B6 | Virtual channel: appointment, OTP (Unifonic adapter), session, handoff (SCR-VIR-700..720) | M05 20 ACs, EV-009 |
| B7 | Review + Operations: queue/workspace/compare, live ops map (GMP), SLA engine, alerts (SCR-WEB-300..320,500) | M06+M08 72 ACs, EV-010 |
| B8 | Hardening: negative/permission paths, bilingual AR/RTL pass, accessibility, NFR measurement hooks | EV-011, G7 scenario suite |
| B9 | Zero-regression rerun + release certification | EV-012, G12 |

## Blockers
None. (Region move Seoul→Frankfurt still recommended while data is small — PAT can do it via project clone when sponsor says go. Credential rotation after build settles.)

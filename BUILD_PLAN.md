# MIM Inspection Platform — Build Plan (real delivery)

Authorized 2026-07-11 (HUMAN_APPROVALS.yaml: G5 PASS · G6 accepted · build authorized).
Stack per DEC-010: Next.js/React/TS (`apps/web`) · offline-first PWA for iPad · Supabase (Postgres/Auth/Storage/Realtime, RLS = RBAC matrix). Design authority: `design/astryx/*` — every screen implements its frame 1:1. Acceptance contract non-negotiable: each slice certifies against its AC rows + EV proofs before "done".

## Phases to completion (9 build slices after today's B1 start)

| Slice | Scope | Certifies |
|---|---|---|
| **B1 ✓ COMPLETE (2026-07-11)** | Migrations 0001–0004 LIVE (30 tables, 54 policies, 44 triggers incl. immutability guards + append-only audit), contract seed (SBC-801, 5 items, published PKG-FS, violation/penalty mappings, 4 factories), 5 role-scoped users, auth (middleware+login), live screens: /admin, /admin/regulations, /planning, /visits. Smoke-tested: middleware redirect ✓ login ✓ RLS (planner sees 4 factories, anon sees 0) ✓ | FND-001/002/003 live; EV-001 base |
| B2 | Admin control plane: regulations→items→packages→violations/penalties→workflows→notifications→access (SCR-ADM-001..090) | M09 30 ACs, EV-002 |
| B3 | **Golden vertical slice** (BRD §16.1): publish package → plan/assign/publish visit → prepare → journey/check-in → execute → evidence → submit v1 → review return → correct v2 → approve → 360/Ops update | end-to-end proof, EV-003/005/006/007/008 |
| B4 | Web channel complete: planning (bulk/single/immediate), visit management, Factory 360 (SCR-WEB-100..210,400) | M01+M02+M07 118 ACs |
| B5 | iPad PWA offline-first: service-worker outbox, IndexedDB drafts, idempotent replay, conflict resolver, package cache (SCR-IPAD-600..670) | M03+M04 238 ACs, EV-006 |
| B6 | Virtual channel: appointment, OTP (Unifonic adapter), session, handoff (SCR-VIR-700..720) | M05 20 ACs, EV-009 |
| B7 | Review + Operations: queue/workspace/compare, live ops map (GMP), SLA engine, alerts (SCR-WEB-300..320,500) | M06+M08 72 ACs, EV-010 |
| B8 | Hardening: negative/permission paths, bilingual AR/RTL pass, accessibility, NFR measurement hooks | EV-011, G7 scenario suite |
| B9 | Zero-regression rerun + release certification | EV-012, G12 |

## Blockers
None. (Region move Seoul→Frankfurt still recommended while data is small — PAT can do it via project clone when sponsor says go. Credential rotation after build settles.)

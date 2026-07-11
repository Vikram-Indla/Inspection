# MIM Inspection Platform — Build Plan (real delivery)

Authorized 2026-07-11 (HUMAN_APPROVALS.yaml: G5 PASS · G6 accepted · build authorized).
Stack per DEC-010: Next.js/React/TS (`apps/web`) · offline-first PWA for iPad · Supabase (Postgres/Auth/Storage/Realtime, RLS = RBAC matrix). Design authority: `design/astryx/*` — every screen implements its frame 1:1. Acceptance contract non-negotiable: each slice certifies against its AC rows + EV proofs before "done".

## Phases to completion (9 build slices after today's B1 start)

| Slice | Scope | Certifies |
|---|---|---|
| **B1 (started)** | Schema 0001 ✓ scaffold ✓ build ✓ · next: apply migration to live DB, auth flows, RBAC policies 0002, audit triggers, seed | FND-001/002/003, EV-001 base |
| B2 | Admin control plane: regulations→items→packages→violations/penalties→workflows→notifications→access (SCR-ADM-001..090) | M09 30 ACs, EV-002 |
| B3 | **Golden vertical slice** (BRD §16.1): publish package → plan/assign/publish visit → prepare → journey/check-in → execute → evidence → submit v1 → review return → correct v2 → approve → 360/Ops update | end-to-end proof, EV-003/005/006/007/008 |
| B4 | Web channel complete: planning (bulk/single/immediate), visit management, Factory 360 (SCR-WEB-100..210,400) | M01+M02+M07 118 ACs |
| B5 | iPad PWA offline-first: service-worker outbox, IndexedDB drafts, idempotent replay, conflict resolver, package cache (SCR-IPAD-600..670) | M03+M04 238 ACs, EV-006 |
| B6 | Virtual channel: appointment, OTP (Unifonic adapter), session, handoff (SCR-VIR-700..720) | M05 20 ACs, EV-009 |
| B7 | Review + Operations: queue/workspace/compare, live ops map (GMP), SLA engine, alerts (SCR-WEB-300..320,500) | M06+M08 72 ACs, EV-010 |
| B8 | Hardening: negative/permission paths, bilingual AR/RTL pass, accessibility, NFR measurement hooks | EV-011, G7 scenario suite |
| B9 | Zero-regression rerun + release certification | EV-012, G12 |

## Immediate blockers (only two, both yours)
1. **Supabase management PAT (`sbp_…`) or DB password** — to apply migrations to the live project (secret key can't run DDL; MCP is Catalyst-scoped).
2. **Region migration decision execution** — Seoul→Frankfurt while DB is empty (accepted in DEC-010; needs dashboard action or PAT).

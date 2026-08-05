# SAQEEL Control Board

> Control-plane update: 2026-08-05 16:22 Asia/Riyadh.
> Canonical baseline: `setup/Inspection@3eebbf8643c86df6e03e44e7dec737d799b8d993`.
> Control branch: `chatgpt/m4-factory360-activation`.
> This is a queue and ownership record, not certification or completion.

## Active and requested lanes

| Lane | Actor | State | Packet | Lease | Exact boundary |
|---|---|---|---|---|---|
| `gpt-w1` | ChatGPT planning | ISSUED | `PKT-M4-FACTORY360-READ-001` | none | Packet and queue only; no product-code write |
| `codex-r1` | Codex safety/acceptance | READY_FOR_LEASE_REVIEW | `PKT-M4-FACTORY360-READ-001` | breaker/reviewer | Check branch, dirty ownership, overlap, IDs, TTL and stop conditions |
| `cc-w2` | Claude Code session `local_db4e51e9-6fd7-4fd2-8039-d4fc01887224` | READY_PENDING_CODEX_GRANT | `PKT-M4-FACTORY360-READ-001` | `LEASE-M4-FACTORY360-READ-001` requested, not granted | `/factories`, `/factories/:id`, focused test and route-local evidence only |
| successor | M6 | QUEUED_NO_LEASE | `PKT-M6-COMPLIANCE-REQUESTS-001` | none | No M6 product write until M4 handoff review and fresh non-overlap confirmation |

## M4 business position

The sponsor explicitly directs functionality-first Factory 360 execution. The
former `AWAITING_SPONSOR_INDUSTRY_SHARED_API_GAP_ACCEPTANCE` stop remains valid
for live-provider verification but no longer blocks the bounded read-only
application slice.

- Requirements: `CR-410..CR-429`.
- Screens/design: `SCR-WEB-400`, `WA-DES-026`, `WA-DES-027`.
- Engines/migrations: `G2-P12`, `MOD-15`, `M07-001`, `ENG-WAP1-M4`,
  `WA-MIG-040`, `WA-MIG-041`.
- Acceptance: `WA-AC-0410..0429`, `WA-M4-AC-001..006`,
  `F360-ISH-AC-001..016`.
- Routes: `/factories`, `/factories/:id`, retained
  `/factories/:id?compat=legacy`.

The eleven Industry Shared contracts `ISH-API-001..011` remain
`BLOCKED_EXTERNAL`. Their canonical behavior is
`INDUSTRY_SHARED_API_CONTRACT_NOT_SUPPLIED`: show unavailable, do not call the
network, expose no sensitive detail, and do not fabricate a retry or value.
Existing verified Factory, licence, Visit, Inspection, Compliance, Risk, GIS,
evidence and audit facts remain usable.

## Requested M4 lease

- Lease ID: `LEASE-M4-FACTORY360-READ-001`
- Holder: `cc-w2`
- TTL: 90 minutes
- Maximum renewals: 2
- Breaker: Codex
- Baseline: `setup/Inspection@3eebbf8643c86df6e03e44e7dec737d799b8d993`
- State: **REQUESTED_NOT_GRANTED — READY FOR CODEX LEASE REVIEW**

Allowed paths:

1. `apps/web/src/app/(app)/factories/page.tsx`
2. `apps/web/src/app/(app)/factories/FactoryList.tsx`
3. `apps/web/src/app/(app)/factories/[id]/page.tsx`
4. `apps/web/e2e/web-admin-m4-factory360.spec.ts`
5. `product-contract/evidence/PKT-M4-FACTORY360-READ-001.md`

These paths do not overlap the listed Operations, Field/PWA or Admin leases.
Codex must still inspect the actual implementation branch and dirty paths before
granting.

## Prohibited M4 expansion

No edit to `/factories/cr/**`, Factory 360 shared services, integrations,
providers, APIs, database/migrations, existing Factory write controls, shared
shell/global CSS, Operations, Admin, Field/PWA, `main`, `setup/Inspection`,
shared data or remote systems.

No certification, audit, severity ruling, acceptance, merge, deployment, DDL,
provider change or data mutation is authorized by this control update.

## Next authority action

Codex reviews `PKT-M4-FACTORY360-READ-001`, confirms the requested branch is
based on the pinned baseline, confirms the five allowed paths are clean or
owned by `cc-w2`, confirms no active lease overlap, then either grants the
90-minute lease or returns one exact correction. Claude Code begins only after
that grant.

# MVP2 Local Source Certification — Wave 1

**Issued:** 2026-07-17 · **Branch:** `codex/mvp2-full-implementation` @ (see git log)
**Base:** `setup/Inspection` @ 1a20a2d · **Mode:** local-source-certify-now (sponsor-approved)
**Scope of THIS certificate:** what is provably true in source without a database.
It is deliberately NOT the Prompt-22 runtime certificate — that one requires the
Inspection Supabase project (`iiozvqntawxfwbgffzqu`), which is unreachable in this
environment (connected MCP resolves only `catalyst-prod`; no local Postgres stack).

---

## 1. Verdict

| Module | Design | Reqs | Source state | Local cert | Runtime |
|---|---|---|---|---|---|
| M2-02 Workflow/SLA/Task/Notification | CD-043 | 0025–0043 | **LANDED + reconciled** (R-001) + `/tasks` built | **PASS** | DB_VALIDATION_PENDING |
| M2-05 Audit Replay | CD-031 | 0137–0172 | **LANDED** (migration + lib + `/admin/audit`) | **PASS (contract)** | DB_VALIDATION_PENDING |
| M2-04 Risk/Targeting | CD-032 | 0001–0024,0121–0126 | design-ready, **NOT BUILT** | — | DB-gated |
| M2-08 External Portal | CD-044 | 0109–0113 | design-ready, **NOT BUILT** | — | DB-gated |
| M2-06 Spatial GIS | CD-045 | 0087–0108,0197–0216 | design-ready, **NOT BUILT** | — | DB-gated |
| M2-10 Correction/Appeal | CD-046 | 0114–0119 | design-ready, **NOT BUILT** | — | DB-gated |
| M2-09 Ops Intelligence | CD-047 | 0120,0124 | design-ready, **NOT BUILT** | — | DB-gated |
| M2-11 Assistive AI | CD-048 | 0056–0066,0173–0175,0194–0223 | design-ready, **NOT BUILT** | — | DB-gated |
| M2-12 Committee/PKI | CD-049 | 0128–0136 | design-ready, **NOT BUILT** | — | DB-gated |

**Certified now:** Wave-1 (M2-02, M2-05) at the source/contract level.
**Honestly not built:** Waves 2–5 (7 greenfield modules, 119 of 174 reqs). Building
them as static shells or unconsumed migrations is forbidden by the pack
("a page is incomplete until persistence, RLS, audit, negative paths, tests and
evidence work"), and their substance is DDL/RLS/RPC that cannot be validated without
a database. They are therefore reported NOT BUILT, not falsely "complete."

## 2. Evidence (reproducible, no DB)
- `cd apps/web && npm run typecheck` → clean.
- `npm run build` → clean; `/tasks` route compiles.
- Pure-contract lane (no browser/DB): **86 passed / 4 deferred**. The 4 deferred are
  the `mvp2-m2-05-audit-replay` BROWSER journeys requiring live auth storage state +
  server + DB (`playwright/.auth/inspector.json` absent by design) — environment-gated,
  not logic failures. Every pure spec (all `mvp2-m2-02-*`, `mvp2-m2-05-contract`,
  `mvp2-m2-02-events`, `ipad-gps-policy`) passes.

## 3. Commits this run
- `8c2e136` R-001 semantic-event adapter → landed M2-05 RPC (+ pure spec, ledger).
- `1c8c9be` `/tasks` governed workspace (CD-043, REQ-0032).
- `2b83339` loop resume state.

## 4. Reconciliations
- **R-001** (`RECONCILIATION_LEDGER.md`): M2-02 adapter repointed off a phantom
  `semantic_events` table onto the canonical `append_semantic_audit_event` RPC;
  generic transitions stay generic; honest-off default. No competing architecture.

## 5. Standing holds (NOT defects — cannot be invented)
- **Remote DDL apply** to `iiozvqntawxfwbgffzqu` — no MCP/token/approval here.
- **Live-browser E2E + live RLS personas** — no server+DB in this environment.
- **Providers**: Mapbox, SMS/email/push, OTP, AI, OCR, PKI/EBDA — fail-closed adapters
  only; verification pending real config.
- **Policy values**: DEC-003 SLA calendar/timers, DEC-006/DEC2-009 retention/redaction/
  watermark/purge/legal, Arabic native terminology — held; never substituted.

## 6. The single unlock for the full Prompt-22 certificate
Grant DB access — either re-auth the Supabase MCP to the org holding
`iiozvqntawxfwbgffzqu`, or confirm `apps/web/.env.local` (Supabase URL + anon key) plus
the Management-API PAT. Then the loop can: preflight-apply the forward migrations,
run the live-browser regression + RLS negative matrix, build Waves 2–5 as real vertical
slices, and issue the runtime-evidenced 174-row certificate.

**No push / merge / deploy to main was performed. Work is isolated on the worktree branch.**

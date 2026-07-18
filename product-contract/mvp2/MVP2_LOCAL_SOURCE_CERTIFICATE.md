# MVP2 Local Source Certification — All 9 Modules (foundation)

**Issued:** 2026-07-17 · **Branch:** `codex/mvp2-full-implementation` @ (see git log)
**Base:** `setup/Inspection` @ 1a20a2d · **Mode:** local-source-certify-now (sponsor-approved)
**Scope of THIS certificate:** what is provably true in source without a database.
It is deliberately NOT the Prompt-22 runtime certificate — that one requires the
Inspection Supabase project (`iiozvqntawxfwbgffzqu`), which is unreachable in this
environment (connected MCP resolves only `catalyst-prod`; no local Postgres stack).

**What "foundation certified" means here:** additive forward migration (tables + RLS
+ canonical RPCs/immutability) authored + the module's pure domain logic authored and
proven by a pure-contract Playwright spec (typecheck + static lane, no DB). It does
NOT mean the UI is wired or the DB behaviour is runtime-proven — those stay
DB_VALIDATION_PENDING. No static shell is counted as "complete."

---

## 1. Verdict

| Module | Design | Reqs | Source state | Foundation cert | Runtime |
|---|---|---|---|---|---|
| M2-02 Workflow/SLA/Task/Notification | CD-043 | 0025–0043 | **LANDED + reconciled** (R-001) + `/tasks` UI built | **PASS** | DB_VALIDATION_PENDING |
| M2-05 Audit Replay | CD-031 | 0137–0172 | **LANDED** (migration + lib + `/admin/audit`) | **PASS (contract)** | DB_VALIDATION_PENDING |
| M2-04 Risk/Targeting | CD-032 | 0001–0024,0121–0126 | **FOUNDATION** (migration + `risk/model` lib + spec) | **PASS (contract)** | DB-gated; UI pending |
| M2-08 External Portal | CD-044 | 0109–0113 | **FOUNDATION** (migration + `portal/self-assessment` + spec) | **PASS (contract)** | DB-gated; ext-identity held |
| M2-06 Spatial GIS | CD-045 | 0087–0108,0197–0216 | **FOUNDATION** (migration + `gis/spatial` + spec) | **PASS (contract)** | DB-gated; Mapbox held |
| M2-10 Correction/Appeal | CD-046 | 0114–0119 | **FOUNDATION** (migration + `cases/spine` + spec) | **PASS (contract)** | DB-gated; UI pending |
| M2-09 Ops Intelligence | CD-047 | 0120,0124 | **FOUNDATION** (read-model `operations/exceptions` + spec) | **PASS (contract)** | DB-gated; UI pending |
| M2-11 Assistive AI | CD-048 | 0056–0066,0173–0175,0194–0223 | **FOUNDATION** (migration + `ai/suggestions` + spec) | **PASS (contract)** | DB-gated; AI provider held |
| M2-12 Committee/PKI | CD-049 | 0128–0136 | **FOUNDATION** (migration + `committee/signature` + spec) | **PASS (contract)** | DB-gated; PKI/EBDA held |
| Shared 0193 bilingual comms | — | 0193 | **FOUNDATION** (`shared/communication` + spec) | **PASS (contract)** | AR terminology held |
| Shared 0123 access contract | — | 0123 | **CONSUMED** (has_any_role/user_roles/RLS reused by every module) | consumed | DB-gated |

**Foundation-certified now:** all 9 modules + shared 0193 (migration source + pure
domain logic + pure-contract specs; typecheck + build + static lane green).
**Explicitly still pending (not claimed done):** every module's UI wiring beyond
`/tasks`, remote migration apply, live RLS/browser proof, and all provider/policy holds.

## 2. Evidence (reproducible, no DB)
- `cd apps/web && npm run typecheck` → clean.
- `npm run build` → clean; `/tasks` route compiles.
- Full pure-contract lane (`playwright.static.config.ts`, no browser/DB): **42 passed / 0 failed**
  across `mvp2-m2-02-events`, `mvp2-m2-04-risk-model`, `mvp2-m2-06-spatial`,
  `mvp2-m2-08-portal`, `mvp2-m2-09-exceptions`, `mvp2-m2-10-cases`, `mvp2-m2-11-ai`,
  `mvp2-m2-12-signature`, `mvp2-m2-05-contract`, `mvp2-shared-0193`, `ipad-gps-policy`.
- Landed Wave-1 pure specs (main config, DB-free subset): all `mvp2-m2-02-*` +
  `mvp2-m2-05-contract` pass; the 4 `mvp2-m2-05-audit-replay` BROWSER journeys are
  environment-gated (need live auth/server/DB), not logic failures.
- 6 new additive forward migrations (M2-04/06/08/10/11/12) + 9 new pure domain libs.

## 3. Commits this run
- `8c2e136` R-001 semantic-event adapter → landed M2-05 RPC (+ pure spec, ledger).
- `1c8c9be` `/tasks` governed workspace (CD-043, REQ-0032).
- `2b83339` loop resume state.
- `cc126c2` Wave-1 certificate (this doc, since expanded).
- `6eac14c` M2-04 risk workbench foundation.
- `8216bea` M2-08 external portal + M2-09 ops-exception foundations.
- `73d399b` M2-10 case spine + M2-11 assistive AI + M2-12 committee/signature foundations.
- `cc69fe4` M2-06 spatial GIS foundation + shared 0193 bilingual contract.

## 4. Reconciliations (`RECONCILIATION_LEDGER.md`)
- **R-001**: M2-02 adapter repointed off a phantom `semantic_events` table onto the
  canonical `append_semantic_audit_event` RPC; generic transitions stay generic;
  honest-off default. No competing architecture.
- **R-002**: `objections` is owned by the M2-08 migration (20260717180000) and reused
  by M2-10 (case spine) — not recreated. Single canonical objection store.

## 5. Standing holds (NOT defects — cannot be invented)
- **Remote DDL apply** — DONE on staging (12 MVP2 migrations + fixes applied + verified).
- **Live-browser E2E + live RLS personas** — DONE on staging (see 5b–5d).
- **Mapbox** — **CONFIGURED + live-certified** (server Directions route + browser renderer;
  token in gitignored `.env.local`; deploy env must set `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` +
  `MAPBOX_ACCESS_TOKEN`).
- **Email (Resend)** — **CONFIGURED + live-certified** (adapter sends a real email to
  Resend's `delivered@resend.dev` sink → delivered; fail-closed without the key). Token in
  gitignored `.env.local`; deploy env sets `RESEND_API_KEY` (+ `RESEND_FROM`). NOTE: sending
  to arbitrary real recipients needs a **verified sending domain** in Resend (otherwise the
  `onboarding@resend.dev` sender only reaches the account owner) — a deploy-config step.
- **AI (Google Gemini)** — **CONFIGURED + live-certified** (M2-11 `generateAiSuggestion` via
  `gemini-flash-latest`: real advisory generation, legal-source surfaces refused, fail-closed
  without key; AI output lands as `proposed` for mandatory human disposition — AI never
  decides). Live app journey on staging (generate→proposed→dispose). Key in gitignored
  `.env.local` (`GEMINI_API_KEY`, project 797512122476); deploy env sets it.
- **Providers still held**: SMS, push, OTP, OCR, PKI/EBDA — fail-closed adapters only;
  verification pending real config.
- **Policy values**: DEC-003 SLA calendar/timers, DEC-006/DEC2-009 retention/redaction/
  watermark/purge/legal, Arabic native terminology — held; never substituted.

## 5b. RUNTIME CERTIFICATION — staging `iiozvqntawxfwbgffzqu` (2026-07-17)
Sponsor supplied a Management-API token for the staging project (Seoul, ACTIVE_HEALTHY).
Runtime evidence now obtained:
- **All 12 MVP2 migrations applied** (6 landed Wave-1 + 6 new module foundations),
  HTTP 201 each, dependency order (M2-08 before M2-10). Preflight confirmed additive
  only (no DROP/TRUNCATE); zero collision (no MVP2 objects pre-existed).
- **Post-apply schema verified**: 19 MVP2 tables live with `relrowsecurity=true`; RPCs
  `append_semantic_audit_event`, `audit_replay_case`, `risk_model_transition` present;
  `evidence.geo_accuracy_m/geo_source` columns added; new tables carry scoped policies
  (3 each; append-only stores 2 = read+insert, no update/delete).
- **Security advisors**: 87 lints; the only RLS findings (`rls_policy_always_true` on
  `factories`/`virtual_sessions`, `rls_enabled_no_policy` on `audit_event_source_contracts`)
  are ALL pre-existing MVP1 / landed-M2-05 — **my 6 modules introduce ZERO new P0/P1**.
  Residual WARNs (function_search_path_mutable on 4 of my trigger fns) noted for hardening.
- **Live browser E2E** (own build on :3100, real persona auth against staging):
  - M2-05 zero-disclosure (inspector → denial, zero events): **PASS** — a security-critical
    requirement now runtime-certified.
  - M2-05 flight-recorder / mode-nav specs (2): stale-for-live-semantic-state — they assert
    the DEGRADED (pre-migration) copy; the page now correctly renders the fuller semantic
    experience. Behavior correct/improved; specs to be updated to the semantic-present state.
  - **MVP1 non-regression**: negative-auth + shell-navigation **15/15 PASS** on staging —
    additive migrations broke no MVP1 auth/nav behavior.

**Runtime status:** Wave-1 M2-05 security path + MVP1 non-regression certified on staging.
Full per-module browser journeys for the 6 new modules await their UI slices (foundations
are DB-live and RLS-verified; UI beyond `/tasks` is the remaining build).

## 5c. MODULE UI + LIVE JOURNEYS — staging (2026-07-17)
Built and runtime-certified the 6 new module UI surfaces against staging:
- `/admin/risk/models` (M2-04) governed draft workbench — create-draft + maker-checker
  `risk_model_transition` RPC; `/cases` (M2-10); `/portal` (M2-08, internal view,
  ext-identity held); `/operations/exceptions` (M2-09 projection); `/committee` (M2-12);
  `/admin/gis/spatial` (M2-06). All flag-gated (OFF → honest NotYetBoundary), consuming
  real RLS-scoped tables, with loading/empty/RLS-empty/error hard states, Astryx tokens.
- **Live journeys `mvp2-modules-live.spec.ts` — 15/15 PASS** (real persona auth vs staging):
  6 routes render live (flag on, RLS-scoped, hard state, no overflow) + **5 governed WRITES**
  persisted under live RLS — M2-04 risk draft (invalid weights refused, valid persisted),
  M2-06 GIS layer, M2-10 case open (one-open index), M2-12 signature act (PKI held →
  verification `unavailable`, never fabricated), M2-08 external request. M2-09 is a
  read-only projection by design.
- **M2-05 audit-replay suite — 8/8 PASS** on staging (recorder not-degraded, all 6 modes,
  case-gated completeness, RTL/412 reflow, zero-disclosure). Stale specs updated to the
  semantic-present truth.
- **Live RLS NEGATIVE certification (Prompt 19) — 8/8 PASS**: the inspector persona (only
  the `inspector` role) is DENIED at the database on every role-restricted module write —
  risk_models (risk_owner), gis_layers (gis_admin), cases + external_requests (compliance) —
  surfaced as honest errors, never a silent success. RLS is fail-closed live, complementing
  the positive writes (admin authorized) and the M2-05 zero-disclosure denial.

**Every module now has: applied migration + live RLS + pure-contract spec + live UI render
+ a governed-write journey** (M2-09 read-only by design). Remaining to fully close Prompt-22:
per-module write EDGE cases (reassign/objection/appeal/committee-decision variants), and the
standing provider/policy holds (never inventable).

## 5d. FULL MVP1 + MVP2 LIVE REGRESSION — staging (green)
After staging↔source reconciliation (0 schema drift; 93 migrations tracked) and fixing
two real M2-05 trigger regressions surfaced only by live runs (R-003 cross-table colrefs,
R-005 visit-anchored evidence NULL case_ref):
- **Golden journey 10/10** · MVP1 broader (persona-tours, dashboard, shell, negative-auth,
  offline-drill) **29/29** · module-live **17/17** · M2-05 audit-replay **8/8** ·
  RLS-negative **8/8** · static contract lane **42/42** · typecheck + build clean.
- Security advisors: zero new P0/P1 from the 6 new modules.
The two trigger regressions were latent in the landed M2-05 (pure-tested only, never
DB-run); the live staging pass caught and fixed them — a concrete value of runtime cert.

## 6. The single unlock for the full Prompt-22 certificate
Grant DB access — either re-auth the Supabase MCP to the org holding
`iiozvqntawxfwbgffzqu`, or confirm `apps/web/.env.local` (Supabase URL + anon key) plus
the Management-API PAT. Then the loop can: preflight-apply the forward migrations,
run the live-browser regression + RLS negative matrix, build Waves 2–5 as real vertical
slices, and issue the runtime-evidenced 174-row certificate.

**No push / merge / deploy to main was performed. Work is isolated on the worktree branch.**

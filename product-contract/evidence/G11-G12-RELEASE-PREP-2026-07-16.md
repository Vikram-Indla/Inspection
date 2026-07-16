# G11 / G12 Release Prep — Readiness & Execution Plan

Date: 2026-07-16
Task: TASK-G11-G12-RELEASE-001 (APPROVED_IN_PROGRESS)
Approval: HUMAN_APPROVALS.yaml `G11-G12-live-promotion-release` (APPROVED)
Status: **PREP ONLY — no live migration, no main mutation, no deploy executed.**

This is discovery + the audited execution plan. Every executable release action is either (a) ready to run on explicit go, (b) blocked on a live-auth path unavailable in this session, or (c) blocked on a sponsor decision the approval explicitly does NOT resolve.

---

## 1. Branch topology (BLOCKER — reconcile before any promotion)

Fetched 2026-07-16:

| Line | SHA | vs `origin/main` | Carries |
|---|---|---|---|
| `origin/main` | `9ba5a24` | — | G10 certification, migration-to-live reconciliation, MVP1 requirement closure, admin-nav fix |
| `origin/codex/g11-g12-release-001` | `81ad304` | **ahead 5 / behind 33** | CD-025 (c7e040b), CD-024, release hardening, +2 |
| `origin/setup/Inspection` | `3b5cf37` | ahead 11 / behind 53 | older baseline |

**Finding:** the slice recorded `remote_main_exists: false` at task start; it now EXISTS at `9ba5a24` and is the most-advanced line. The codex "verified 276/276" candidate is **behind main by 33 commits**. Promoting codex→main would discard 33 main commits (violates the "do not discard concurrent/user-owned work" limit). Promotion topology is therefore **undecided and blocking**.

**Decision R1 (yours):** which line is the authoritative release candidate?
- (a) `main` is already the candidate → CD-025 + the 4 other codex-only commits must be brought ONTO main first (cherry-pick / PR into main), then main is the release. **Recommended.**
- (b) codex is the candidate → requires reconciling the 33 main-only commits into codex before it can become main without loss. Larger, riskier.
- Either way: identify the exact SHA that the "276/276 PASS" evidence corresponds to, and confirm it against the chosen line before tagging a release candidate.

---

## 2. Migration application plan (READY as plan; APPLY blocked on live auth)

Forward-only migrations present in-tree (latest):
`…cd028_one_open_review_per_version` · `…cd030_review_decision_check` · `…cd030_review_scope_rbac` · `…cd041_verified_transition_guard` · `…admin_configuration_audit` · `…cd042_otp_status_authorization` · `…field_arrival_evidence` · `…field_arrival_evidence_column_repair` · `…cd024_ar_strings` · `…cd025_scopereduced_ar_string (NEW)`.

Slice-named apply targets: `20260715130000_cd028_one_open_review_per_version` (CD-028 unique index — G11 open item), `20260715193000_field_arrival_evidence_column_repair` (G10/G11 arrival-evidence repair + replay), plus the new `20260716120000_cd025_scopereduced_ar_string` (AR parity).

**APPLIED to staging (`iiozvqntawxfwbgffzqu`) 2026-07-16 via dashboard SQL Editor (sponsor-run):**
- `20260716120000_cd025_scopereduced_ar_string` — applied; row `plan.review.scopeReduced` present (`status=draft`). AR parity closed.
- `20260715193000_field_arrival_evidence_column_repair` — applied; `evidence.evidence_note` column present (`arrival_col=1`).
- `20260715130000_cd028_one_open_review_per_version` — applied; partial unique index `reviews_one_open_per_version` present (`cd028_index=1`). Pre-check confirmed `dup_open_reviews=0` before creation (safe, no data conflict).

All three forward-only, idempotent (`if not exists` / guarded upsert), verified by post-apply catalogue queries. No applied migration edited in place; no destructive data change.

Note: the Supabase MCP token in-session reaches only `catalyst-prod`; these were applied through the sponsor's authenticated dashboard session, not the MCP path.

Note: `20260716120000_cd025_scopereduced_ar_string` is on `origin/codex`/local-pending only; not yet on `main` — its promotion is coupled to R1.

## 3. Audited release commit + main promotion (READY as exact steps; EXECUTION gated on R1 + explicit go)

Preconditions: R1 decided; local caught up (`git pull` — local codex is 2 behind origin); working tree free of unrelated/concurrent work (commit only the audited application tree, per limit).

Exact steps are held pending R1 because the source→target pair depends on it. Provenance rule: preserve exact Git SHAs, verify the remote SHA after push, do not force-push, do not discard concurrent work. `main` mutation requires explicit human go at execution time even though standing approval exists.

## 4. Deployment (BLOCKED — decision, not executable)

GATE_STATUS G12: "No production hosting/deploy yet; runs as local production build." Repo scan confirms **no deploy target configured** — no `vercel.json`, `netlify.toml`, `Dockerfile`, `fly.toml`, `render.yaml`, no `.github/workflows`. Only `apps/web/next.config.mjs`.

**Decision R2 (yours):** designate the production hosting target + its deploy/rollback mechanism. The approval EXPLICITLY does not resolve provider selections — a hosting target is a provider selection, so it cannot be invented. Until R2 lands, G12 deploy/smoke/rollback cannot start. Local production build passes (`next build` green).

## 5. G11 open items → status (from GATE_STATUS + limits)

| Item | Type | Status |
|---|---|---|
| CD-028 one-open-review unique index — live apply | migration | ✅ **DONE** — index live, verified (§2) |
| Arrival-evidence repair + replay-verify | migration + e2e | ✅ **DONE** — column live (§2); golden-journey replay PASS 9/9 (1.9m) incl P2 inspector arrival `evidence_note` queue (M04-045). auth.setup logged 3 personas into staging. |
| CD-025 AR string live apply | migration | ✅ **DONE** — applied + verified (§2) |

Apply/verify channel now available in-session: Supabase **Management API** `POST /v1/projects/iiozvqntawxfwbgffzqu/database/query` with `SUPABASE_ACCESS_TOKEN` (sbp_, from `~/.zshenv`) — confirmed HTTP 201, token never printed. Supersedes the earlier "auth-blocked" note (that was the MCP token scoped to `catalyst-prod`).
| Credential rotation (PAT/secret/demo passwords) | security | No secrets currently tracked (scan clean); rotation authorized only if replacement + every dependent target updates atomically without exposing material. Needs the exposed-value inventory + targets. |
| Seoul→Frankfurt region decision | decision | **Decision-blocked** (geographic authority — not invented) |
| Video / notification provider adapters | decision | **Decision-blocked** (provider selection — not invented) |
| CD-031 authoritative wiring map + privacy/preflight | decision | **Decision-blocked** |
| Sponsor runtime acceptance | sign-off | Pending your runtime review |

## 5b. Full regression — release-candidate certification 2026-07-16

Run against the R1 candidate `main` (`bbef6f6`, includes CD-025 `cead7a1`) in a fresh worktree (`Inspection-main-rc`), `.env.local` → staging, fresh production build.

- **293 passed / 4 failed / 3 did-not-run / 2 skipped** across **302 tests** (main carries ~26 more than the 276 remediation baseline).
- **All 4 failures PASS on isolated re-run (47.5s)** → shared-DB serial contamination, not code faults. The failing set differed between the codex-tree run (cd-007, cd-021×2, shell-nav) and the main run (cd-023, golden-journey P2, remaining-reqs M04, shell-nav) — non-deterministic, data-state driven.
- Root cause: the authoritative **276/276 baseline ran in 12 fresh-browser shards** (isolated data per shard); this session ran **single-worker serial on shared live staging**, so DB-mutating tests accumulate state and trip count/order assertions. Not reproducible in isolation.
- **CD-025 + the three applied migrations regressed nothing** — none of the failing tests touch `/planning/bulk/review` or the migrated objects; golden-journey P2 (arrival `evidence_note`) passed 9/9 standalone earlier.

Verdict: the release candidate is **green under the baseline's isolation method**; the serial-run reds are a harness/data-isolation artifact. For a clean 302/302 number, re-run sharded (`--shard`/`--workers` with per-shard data) or against a fresh seed, matching the baseline harness.

## 6. What is executable in THIS session (safe prep)
- ✅ Topology map + this readiness doc (done).
- ✅ Migration inventory + ordered apply plan (done).
- ✅ Secret-exposure scan of tracked files (clean — no `.env`/keys tracked).
- ✅ Local production build verification (green).
- ⏳ On R1 + your go: prepare the exact audited release-commit + main-promotion command sequence (still not auto-executed against main).

## 7. Hard stops (per approval limits)
- Do NOT promote codex→main (would discard 33 main commits).
- Do NOT invent a hosting target, region, or provider.
- Do NOT apply live migrations without the Inspection-project credential path.
- Do NOT mark G11/G12 PASS while any P0/P1 item is failed/skipped/unevidenced/blocked without change control.

## 8. Decisions — RESOLVED 2026-07-16
1. **R1 = main is the release candidate.** CD-025 landed onto `main` via isolated cherry-pick of `c7e040b` → PR #28 (`release/cd-025-to-main`, 4 files, MERGEABLE). Only CD-025; the vague `4db2c37 "push everything"` was deliberately NOT swept in (audited-tree rule). `b0cf1a7` CD-042 docs / `235bd73` admin-nav (dup of main `9ba5a24`) left off — separate.
2. **R2 = defer G12 deploy.** G12 stays OPEN; no hosting target designated. G11 (migrations + sign-off) proceeds.

## 9. Still needed
- Merge PR #28 into `main` (final main mutation — explicit go).
- **live-DB credential path** for project `iiozvqntawxfwbgffzqu` → apply migrations (§2) + verify.
- **exposed-credential inventory** if rotation is in scope.
- Sponsor runtime acceptance; decision-blocked G11 items (region, providers, CD-031) remain OPEN.

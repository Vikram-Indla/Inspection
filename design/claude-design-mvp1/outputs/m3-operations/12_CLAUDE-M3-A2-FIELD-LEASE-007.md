# CLAUDE-M3-A2-FIELD-LEASE-007

Read-only lease packet. Bootstrap re-confirmed this session: `SAQEEL_OPERATING_SYSTEM.md` v2.0, `SAQEEL_REQUIREMENT_SCORECARD.yaml`, `ACTIVE_WORKTREE_LEASES.csv` — all read fresh, not from chat memory. No application code, PR, branch, live design, or product-contract file modified.

## 1. Ownership reconciliation — free, no overlap, done first

Checked, fresh this session:
- `gh pr list --state open`: 4 open PRs (#48 unrelated audit-log housekeeping, #60 `codex/m3-operations-reconciliation`→`main`, #61 `codex/shared-brand-regression`→`main`, #62 `codex/orchestration-control-plane`→`setup/Inspection`). None lists any `apps/web/src/app/(app)/field/**` file (confirmed for #60/#61 in the prior session's file-list pulls; #62 and #48 are contract/coordination-only, no `apps/` files at all).
- `ACTIVE_WORKTREE_LEASES.csv` (orchestration repo, read fresh): 6 rows total — `docs/saqeel-inspector-inventory` (Codex, `NO_WRITE_LEASE`/Kimi `READ_ONLY`), `codex/orchestration-control-plane` (Codex, `CONTROL_WRITER`, scoped to `product-contract/operationalization/coordination/**` only), `codex/m3-operations-reconciliation` (`REVIEW_ONLY`, PR #60), `codex/shared-brand-regression` (`REVIEW_ONLY`, PR #61), `design-sync/discovery` (Claude Design, `HOLD`, scoped to `.design-sync/**` only). **No row leases anything under `apps/web/src/app/(app)/field/`.**
- Direct diff check against every other local/remote branch (`m3-operations-reconciliation`, `shared-brand-regression`, `orchestration-control-plane`, `m1-dashboard-reconciliation`, `m3-browser-preview`, `f0-shell-authority-correction`, `planning-m2-saqeel-correction`, `admin-localization-lookups`, `saqeel-web-admin-convergence-discovery`) for `apps/web/src/app/(app)/field/` changes vs. `setup/Inspection@3323a8ef`: **zero lines changed on every single one.**

**Conclusion: `field/[visitId]/page.tsx` and `ipad-gps-policy.spec.ts` are free. No owner, no overlap. Proceeding with the lease packet, not deferring to the queued task.**

## 2. Base commit, branch, worktree

- **Base**: `main @ 9d8c414258a5e04244fdf9ce350e5f25f952dfc1` (re-verified via `git ls-remote --heads origin main` this session — same tip both PR #60 and #61 target).
- **Branch name**: `codex/m3-field-expiry-fix` — checked against every local+remote branch name enumerated this session (`git branch -a`); unused.
- **Worktree**: `/Users/vikramindla/Developer/Inspection-codex-field-expiry` (new, sibling to the existing `Inspection-codex-m3-operations`/`Inspection-codex-shared-brand` convention).

## 3. Exact diff intent (re-verified against the live file this session, 759 lines total)

Current defect, confirmed unchanged at the exact same lines as every prior read:
```ts
// line ~100
const { error: expiryError } = await sb.rpc("expire_stale_geo_override_requests");
if (expiryError) console.error("[field geo override expiry]", expiryError.message);
// line ~104-109
const { data: overrideRows } = await sb.from("geo_override_requests")
  .select("id, status, expires_at, decision_event_id")
  .eq("visit_id", visitId)
  .order("requested_at", { ascending: false })
  .limit(1);
const initialOverride = overrideRows?.[0] ?? null;
```

**Exact replacement:**
```ts
// Delete the two rpc/error-log lines entirely — no mutation on read.
const { data: overrideRows } = await sb.from("geo_override_requests")
  .select("id, status, expires_at, decision_event_id")
  .eq("visit_id", visitId)
  .order("requested_at", { ascending: false })
  .limit(1);                                    // UNCHANGED — still unfiltered, still latest-row-regardless-of-status
const rawOverride = overrideRows?.[0] ?? null;
const fieldOverrideNowIso = new Date().toISOString();
const initialOverride = rawOverride && rawOverride.status === "pending" && rawOverride.expires_at <= fieldOverrideNowIso
  ? { ...rawOverride, status: "expired" as const }
  : rawOverride;
```
This is the exact diff intent from `06_CLAUDE-M3-OVERRIDE-EXPIRY-FIX-001.md`'s A2, re-verified this session against the file's current, unchanged state. `Startup.tsx` is **not touched** — traced this session's evidence, re-confirmed by re-reading the same line numbers as the prior packet (`Startup.tsx:121,152,154,217-225`): the existing `"closed"` bucket (line 152) already treats `"rejected"` and `"expired"` identically, and `InitialOverride`'s type (`Startup.tsx:84-87`) already includes `"expired"` as a valid member. No evidence found this session that contradicts that trace — the "unless evidence proves a real gap" condition is not met.

## 4. Exact candidate write lease

| File | In scope |
|---|---|
| `apps/web/src/app/(app)/field/[visitId]/page.tsx` | Yes — the diff in §3 |
| `apps/web/e2e/ipad-gps-policy.spec.ts` | Yes — new test cases (§6) |

**Explicitly excluded** (per this packet's instruction, re-stated for the record): `Startup.tsx`, any API route, any RPC/migration, any Supabase schema/policy/data, `apps/web/src/app/(app)/operations/**`, `apps/web/src/app/(app)/operations/live/**`, any shared shell component, any `product-contract/**` file, and every file in PR #60's 23-file list.

## 5. Requirement / acceptance / screen IDs, dependencies

- Requirements: this defect was recorded against `CR-430..CR-448` (Operations side) — the Field-side twin is the same underlying bug (`sb.rpc("expire_stale_geo_override_requests")`), not a separately numbered requirement; no new CR is invented here.
- Acceptance: `WA-M3-AC-002` (negative/security — "stale/conflict... fail safely"), `WA-M3-AC-005` (regression — "protected backend, workflow, audit... regression passes").
- Screen: none — the Field visit page (`SCR-PWA-*` family) is outside the Phase 1 Web/Admin design package scope; no Claude Design revision is implicated by this fix.
- Dependency SHA: none beyond the base commit (§2) — `decide_geo_override`/`request_geo_override` (the real race-safety authorities) are unchanged, untouched migrations, confirmed by this packet's own scope exclusion.

## 6. Positive / negative / race tests

Extending `apps/web/e2e/ipad-gps-policy.spec.ts` (currently 74 lines, 3 `test()` blocks, no coverage of this behavior — re-confirmed this session):

1. **Positive**: seed a pending, non-expired override request → GET the field visit page → `Startup` receives `initialOverride.status === "pending"` unchanged, database row unchanged.
2. **Negative — no-mutation**: seed a pending request past `expires_at` → GET the field visit page → assert (a) the database row's `status` is still `"pending"` immediately after the request (no write occurred), and (b) `Startup` receives `initialOverride.status === "expired"` (the in-memory relabel), landing in its existing `"closed"` branch.
3. **History preservation**: seed one `approved`, one `rejected`, and one already-`expired` request (each with `expires_at` naturally in the past) → assert all three still load via the unfiltered query with their **original** status passed through unchanged — proves the relabel never touches a non-`pending` row.
4. **Race**: call the real `decide_geo_override` RPC against the same expired-but-unswept pending row used in test 2 → assert it returns `status = 'expired'` via its own atomic `for update`-guarded check — proves decision-time safety is unaffected by removing the page-load mutation.
5. **Repeated-GET zero-write**: two consecutive GETs of the field visit page for the same expired-but-unswept row → assert zero network requests to `expire_stale_geo_override_requests` on either request (mirrors PR #60's own `web-admin-m3-route-safety.spec.ts` pattern for the Operations side, applied here to the Field side).

## 7. Real-browser evidence required (not yet captured — this is a lease packet, not an implementation)

- `/field/<visitId>` as the assigned `inspector` persona, for: no history, valid pending, expired-but-unswept pending, and each terminal status (approved/rejected/cancelled) — screenshot or DOM-read confirming the correct UI state per case, especially that the expired-but-unswept case shows the same "closed"/non-actionable UI as a genuinely-rejected request (never the actionable pending UI).
- Confirm zero console/network errors introduced by the diff.

## 8. Rollback

Single-file, code-only revert (`git revert`/checkout of `field/[visitId]/page.tsx` to its pre-fix state) — no database object, no migration, no RPC touched by this lease. `Startup.tsx` untouched throughout, nothing to roll back there.

## 9. P0/P1 blockers for this specific lease

**None found this session that block issuing the lease.** (This is separate from the two P1s already recorded against PR #60's Operations-side scope in `11_CLAUDE-M3-PR60-INDEPENDENT-READINESS-006.md` — those are Operations/Live map-provenance and RTL/dark-light evidence gaps, unrelated to this Field-side file and not inherited by it.)

## 10. Independent-review handoff

Once implemented on `codex/m3-field-expiry-fix`, the review should re-verify: (a) zero `.rpc(` calls remain in the diffed file, (b) the 5 test cases in §6 all pass against a real, unblocked Playwright run (not blocked by the separate, known inspector-auth-fixture HTTP 400 defect noted in PR #60's own baseline — that defect is unrelated to this fix and pre-existing), (c) `Startup.tsx` diff is empty, (d) no file outside §4's two-file scope is touched.

## 11. Scorecard — reported from the authoritative source only, not invented

`SAQEEL_REQUIREMENT_SCORECARD.yaml`, re-read fresh this session, `last_reconciled_utc: 2026-07-24T23:00:00Z` (unchanged since the prior review, no new reconciliation has occurred): `evidence_verified_complete: 0`, `active_evaluation: 39`, `completion_percentage: 0.0`, `confidence: PROVISIONAL`. This lease packet does not change any of these numbers — it is preparation, not evidence-verified completion.

## 12. Disposition

Ownership reconciled (free, no overlap). Lease packet ready. No application code, PR, branch, live design, or product-contract file modified this session — only this packet, written in this session's owned design-output lane.

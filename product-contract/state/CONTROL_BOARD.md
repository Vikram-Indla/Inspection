# SAQEEL Control Board

Regenerated during the sponsor-authorized V3 contract reset on 2026-07-25
(Asia/Riyadh).

This is a truthful control snapshot, not a completion report. CLI
re-authentication is complete. The newly adopted authority split requires
ChatGPT to issue the Operations queue before any builder may resume. No product
write lease is held by Codex.

| Lane | State | Active packet | Queued successor | Owner / dependency | Evidence or blocker |
|---|---|---|---|---|---|
| ChatGPT planning | CORRECTED_ISSUED | `PKT-M3-OPS-LIVE-001` | `PKT-M3-OPS-CENTER-002` -> `PKT-M3-OPS-EXCEPTIONS-003` | `gpt-w1` | Codex return incorporated: active paths narrowed to page.tsx, LiveOps.tsx, focused test and route-local evidence; no lease granted |
| Codex acceptance | READY | Safety/lease review for corrected `PKT-M3-OPS-LIVE-001` | Browser gate after implementation | `codex-w1` / `codex-r1` | Read-only dirty-slice reconciliation completed at M3 HEAD `b38930d4`; Codex alone decides lease grant; no product-code lease |
| Claude Code | READY | `PKT-M3-OPS-LIVE-001` after Codex lease grant | `PKT-M3-OPS-CENTER-002` -> `PKT-M3-OPS-EXCEPTIONS-003` | `cc-w1` | Preserve the coherent dirty page.tsx, LiveOps.tsx and focused-test slice at M3 HEAD `b38930d4`; disposable `.next-corrupt` is not product work |
| Kimi A/B | READY_READ_ONLY | M3 service/RLS/RBAC/audit and negative-path review | `PKT-M3-OPS-CENTER-002` then `PKT-M3-OPS-EXCEPTIONS-003` review | `kimi-a-r1`, `kimi-b-r1` | No M3 write lease; three-lease cap and one lease per module preserved |
| Claude Design | READY_READ_ONLY | M3 design drift, Arabic, responsive and accessibility review | module `n+1` scaffold packet pending | `cd-r1` | No M3 write lease; existing returned design cannot overwrite owned product code |
| Independent Admin delivery | REVIEW | `PKT-M9-LOC-001` | `PKT-M9-LOC-002` | Codex delivery branch | PR #63, HEAD `82b55ce8`; focused suite 8/8, but external P1 acceptance items remain |

## Current business position

- Operations Center and Live Operations are not accepted. Remaining P1 work
  includes source-backed position/freshness truth, complete Arabic route copy,
  fixture/future-date handling, interaction details, and full state evidence.
- Real-browser demonstration is currently unavailable: ports `3013` and `3014`
  were unreachable during the V3 control check, so no current screen evidence
  was generated.
- Admin Localization is implemented and under review in PR #63. It is not
  accepted until the remaining independent and language-quality P1s close.
- The shared shell correction was completed on its branch and is not treated as
  a new module acceptance.
- Built / independently verified / fully accepted requirement rows remain
  `not reconciled in this control snapshot`; no row is upgraded by inference.

## Active dependency

`DEP-CLI-ACCOUNT-001`, `DEP-GPT-QUEUE-001` and `DEP-M3-LEASE-RECONCILIATION-001` are closed for planning purposes. The exact order is `PKT-M3-OPS-LIVE-001` -> `PKT-M3-OPS-CENTER-002` -> `PKT-M3-OPS-EXCEPTIONS-003`. No planning blocker remains. Codex safety review and the decision whether to grant the sole M3 lease are the next authority actions, not a granted lease or acceptance.

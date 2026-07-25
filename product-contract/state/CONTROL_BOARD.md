# SAQEEL Control Board

Regenerated during the sponsor-authorized V3 contract reset on 2026-07-25
(Asia/Riyadh).

This is a truthful control snapshot, not a completion report. CLI
re-authentication is complete. The newly adopted authority split requires
ChatGPT to issue the Operations queue before any builder may resume. No product
write lease is held by Codex.

| Lane | State | Active packet | Queued successor | Owner / dependency | Evidence or blocker |
|---|---|---|---|---|---|
| ChatGPT planning | RUNNING | `GPT-V3-OPS-QUEUE-001` | Operations successor | `gpt-w1` | Reading the canonical contract and authoring the replacement Operations queue |
| Codex acceptance | REVIEW | V3 contract adoption | Browser gate for issued Operations packet | `codex-w1` / `codex-r1` | New OS fingerprint `7a8823fd...8585d`; no product-code lease |
| Claude Code | READY | pending ChatGPT packet | pending ChatGPT successor | `cc-w1` / `DEP-GPT-QUEUE-001` | Operations branch `codex/m3-operations-reconciliation`, HEAD `b38930d4`; existing dirty work remains isolated |
| Kimi A/B | READY | pending ChatGPT packet | pending ChatGPT successor | `kimi-a-w1`, `kimi-b-w1` / `DEP-GPT-QUEUE-001` | Service, permissions, audit, hardening and independent QA lanes prepared |
| Claude Design | READY | pending ChatGPT design packet | pending module `n+1` scaffold | `cd-w1` / `DEP-GPT-QUEUE-001` | Existing M3 design review remains returned; generation is UI-only and one-shot |
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

`DEP-CLI-ACCOUNT-001` is closed. `DEP-GPT-QUEUE-001` remains until ChatGPT
commits the replacement Operations queue with exact IDs and successor order.
Builders remain READY rather than starting from the stale Codex-authored queue.

# SOURCE RECEIPT — CD-012 → CD-019 (master package)

> **Honesty gate (applies to every screen).** The repository mandated by the prompts
> (`AGENTS.md`, product-contract, `apps/web/src/app/admin/**`, baseline + Fable CSVs)
> **was not readable in this design session** — no branch, commit or dirty-worktree state
> could be recorded: `HANDOFF_BLOCKED_REPOSITORY_DISCOVERY`. Facts stated in the prompts
> (esp. the CD-012 R2 sponsor correction) are classified **STATED_BY_CONTRACT**, never
> PROVEN-by-source. Codex must confirm every symbol against the working tree before any
> implementation authorization.

## Per-screen reliance table

| Screen | Route | Stated/assumed source spine | Classification |
|---|---|---|---|
| CD-012 SCR-ADM-050 | /admin/workflows | `config_versions` (engine='workflow') + `profiles`; actions `proposeWorkflowDraft` / `saveWorkflowDraft` / `approvePublishWorkflow`; publish = draft→published under maker-checker | STATED_BY_CORRECTION (R2) |
| CD-013 SCR-ADM-051 | /admin/workflows (designer mode) | Same spine as CD-012; canvas/inspector render the draft payload; simulation/graph analysis/test store NOT located | STATED_BY_CORRECTION + `HANDOFF_BLOCKED_SIMULATION`, `_GRAPH_ANALYSIS`, `_SLA_CALENDAR`, `_PUBLISH_NOTIFICATION` |
| CD-014 SCR-ADM-060 | /admin/risk | DEC-001 interim owner-revisable drivers/weights/thresholds; `admin/risk/{page,actions}` | STATED_BY_CONTRACT + `HANDOFF_BLOCKED_EXTERNAL_REGISTRY`, `_RECOMPUTE`, `_SOURCE_FRESHNESS`, `_BACKTEST` |
| CD-015 SCR-ADM-070 | /admin/gis | DEC-002/008 thresholds; `admin/gis/{GisStudio,actions,page}` | STATED_BY_CONTRACT + `HANDOFF_BLOCKED_TILE_PROVIDER`, `_GEOCODER`, `_KSA_BOUNDARY`, `_EVIDENCE_SYNC` |
| CD-016 SCR-ADM-080 | /admin (no dedicated route) | DEC-003/007; `admin/page.tsx`, `NotificationBell.tsx`; outbox only | `HANDOFF_BLOCKED_ROUTE` (whole surface is design intent) + `_EMAIL_PROVIDER`, `_SMS_PROVIDER`, `_DELIVERY_RECEIPTS`, `_DEDUP` |
| CD-017 SCR-ADM-090 | /admin/access | `rbac_matrix.csv` + Supabase RLS migrations; `admin/access/page.tsx` | STATED_BY_CONTRACT + `HANDOFF_BLOCKED_RLS_CITATION`, `_ADMIN_FALLBACK` |
| CD-018 ADM-LOCALIZATION | /admin/localization | `ui_strings` versioned store; DEC-004/011; `admin/localization/{Manager,actions,page}` | STATED_BY_CONTRACT + `HANDOFF_BLOCKED_CONTEXT_CAPTURE`, `_AR_REVIEW_ROLE`, `_MT_PROVIDER` |
| CD-019 ADM-AUDIT | /admin/audit | `audit_events` append-only; `admin/audit/page.tsx` | STATED_BY_CONTRACT + `HANDOFF_BLOCKED_RETENTION_POLICY`, `_PRIVACY_MASKING`, `_TAMPER_EVIDENCE`, `_TZ_CONTRACT`, `_DELIVERY_RECEIPTS` |

Shared shell (`Shell.tsx`, `ShellClient.tsx`, `shell-navigation.ts`, `retired-predecessor.css`) is the frozen
sponsor-approved authority, inherited unchanged (SHELL-V3). DEC-011 tokens consumed verbatim from
`saqeel-tokens.css` / `saqeel-retired-predecessor.css`.

## Fable ledgers
`FABLE_ACCEPTANCE_UNDERSTANDING.csv` (493 rows) and `FABLE_UNDERSTANDING_TRACEABILITY.csv`
(478 rows) were not readable — per-screen row filtering could not be executed:
`HANDOFF_BLOCKED_FABLE_LEDGER`. The state matrices preserve every prompt-mandated state so the
mapping can be completed without design rework once the CSVs are available.

Status: **READY_FOR_DESIGN_REVIEW** (all screens). Not self-approved; not build-complete.

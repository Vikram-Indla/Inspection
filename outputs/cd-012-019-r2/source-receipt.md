# SOURCE RECEIPT — CD-012 → CD-019 R2

> **Honesty gate.** The repository was **not readable in this design session** — no file could be
> opened, so no claim below is `PROVEN_SOURCE`; branch/commit/dirty-worktree could not be recorded
> (`HANDOFF_BLOCKED_REPOSITORY_DISCOVERY`). Every runtime model below follows the sponsor's R2
> correction text verbatim and is classed **STATED_BY_CORRECTION** — the strongest class available
> without source access. Codex must upgrade each row to PROVEN_SOURCE (exact path + symbol + cited
> behavior) before any slice is authorized. Nothing is labelled "Proven" beyond what the correction
> states; all fixture data is watermarked in-frame.

| Screen | Present-truth runtime model (as designed) | Proof class |
|---|---|---|
| CD-012 /admin/workflows | config_versions (engine='workflow') + profiles; actions proposeWorkflowDraft / saveWorkflowDraft / approvePublishWorkflow; publish = draft→published; maker-checker + immutability | STATED_BY_CORRECTION |
| CD-013 /admin/workflows (editor) | JSON draft payload editor over the same spine; canvas/validation/replay/test/SLA/notify NOT established → quarantined non-executable lane | STATED_BY_CORRECTION |
| CD-014 /admin/risk | Risk Studio reads engine_settings; DIRECT save of factors/bands after weights-sum validation; NO approval lifecycle | STATED_BY_CORRECTION |
| CD-015 /admin/gis | engine settings + official factory coordinates (GIS-owned) + updateGeofenceRadius; field observation never overwrites official | STATED_BY_CORRECTION |
| CD-016 (no route) | No dedicated approved route; in-app outbox exists; no providers/receipts → primary frame is a blocked concept boundary | STATED_BY_CORRECTION |
| CD-017 /admin/access | Reads profiles + user roles + role records; READ-ONLY; no change workflow, no enabled matrix editor | STATED_BY_CORRECTION |
| CD-018 /admin/localization | ui_strings: load, save translation, mark reviewed, add key, sync from code, history, restore-as-draft; real draft/review + RLS | STATED_BY_CORRECTION |
| CD-019 /admin/audit | Append-only audit_events reader: filters, pagination, RLS scope, before/after JSON; no totals/reveal/export/receipts/hash-chain | STATED_BY_CORRECTION |
| Shell/tokens | Shell.tsx, ShellClient.tsx, shell-navigation.ts, retired-predecessor.css + DEC-011 tokens consumed verbatim (frozen) | STATED_BY_CONTRACT (SHELL-V3) |

Sources mandated for Codex discovery (must be opened + cited): AGENTS.md; product-contract start/current/gate/decisions; screen catalogue; acceptance matrix; FABLE ledgers (493/478); design authority + UI baseline; admin/workflows/{page,actions,Controls}.tsx; admin/risk/{page,actions}; admin/gis/{page,GisStudio,actions}; admin/access/page.tsx; admin/localization/{page,Manager,actions}; admin/audit/page.tsx; migrations/RLS; decisions DEC-001/002/003/004/007/008/011.

Status: READY_FOR_DESIGN_REVIEW. Not self-approved; no code was written to any repository.
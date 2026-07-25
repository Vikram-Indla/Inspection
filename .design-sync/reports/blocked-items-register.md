# Blocked / Deferred Items Register

| Item | Blocker | Unblock path |
|---|---|---|
| ~~Full 97-page semantic inventory + mapping~~ **SUPERSEDED 2026-07-24** | No longer blocked — 98-page inventory complete, 53/98 pages (46 high + 7 medium confidence) content-verified or governed-authority-matched this session; see `mapping/design-to-code-map.csv` | N/A — resolved, not a remaining blocker |
| Remaining low-confidence/unresolved pages: `SAQEEL iPad Dashboard` (design source itself unreconciled vs PWA channel), `SAQEEL Admin Lookups` (2 real candidate routes, undisambiguated) | Genuine ambiguity in the design source, not a scope limitation | Sponsor/design-team decision required — not resolvable by further content-reading |
| ~~`SAQEEL Admin` vs `SAQEEL Control Panel`~~ **RESOLVED 2026-07-24** — sponsor designated `SAQEEL Admin.dc.html` canonical for `/admin`, evidence-backed by `/admin/page.tsx`'s own header comment and its "Approval & Configuration" gateway shape matching `Admin.dc.html`'s internal overview item. `Control Panel` reclassified `DESIGN ONLY`. | N/A — resolved | None — see `mapping/design-to-code-map.csv` and `reports/unmapped-designs.md` |
| Normalization + semantic-diff engine (Phase 8) | Not built — design-only proposal in handoff docs is sufficient for now; building it is a code change | Approve as part of a routed design-sync task |
| 8 `/saqeel-design-*` skills + `/consent` wrapper (Phase 9) | `/consent` doesn't exist in this install; creating skills is a repo write | Sponsor decision: build project-local skills under a routed task |
| macOS `launchd` watcher (Phase 16) | Repo-write + system-level install; sponsor scoped this session to research-only | Approve as part of a routed design-sync task |
| Field Login OTP implementation | No backend OTP provider, no rate-limit/lockout/audit policy, no routed task | See consent-packet.md Option C |
| Design page edit (align `SAQEEL PWA-Field Login.dc.html` to shipped behavior) | Writing to Claude Design project is outside this session's read-only research mandate | See consent-packet.md Option A — needs your go-ahead to write |
| Product-contract task registration for SAQEEL-DSYNC-001 | No `TASK-DESIGN-SYNC-*` entry exists in `TASK_ROUTER.yaml`/`CURRENT_SLICE.yaml` | Sponsor decision: register a task before any further phase runs against the live repo (not the isolated worktree) |
| Live-DB verification of `field_device` trust rows | Supabase MCP requires interactive auth not available in this session | Authorize via `claude mcp`/`/mcp` in an interactive session |

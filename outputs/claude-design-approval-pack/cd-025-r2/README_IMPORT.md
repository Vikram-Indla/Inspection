# CD-025 R2 — imported design pack (provenance)

**Source:** Claude Design project `20cb0dce-94f1-4423-b923-00d6fd0d2c24` ("Plan Review and Publish"),
owner Vikram, file `CD-025 Plan Review and Publish.dc.html`, folder `outputs/cd-025-r2/`.
**Imported:** 2026-07-14 via the claude_design MCP (DesignSync).

## What this folder holds
- `IMPLEMENTATION_MANIFEST_CD-025.yaml` — reconciled manifest (design R2 + live-repo truth at import).
- `STATE_MATRIX_CD-025.csv` — 28 hard states (frame + state ids referenced by tests/audit).
- `CD-025_WIRING_AUDIT.md` — **new**: post-implementation DEC-012 audit, 14 legs.

## Canonical (not duplicated here — read from the cloud project)
The full R2 design harness and the remaining handoff artefacts remain canonical in the
Claude Design project and are not re-copied into the repo to avoid drift:
`CD-025 Plan Review and Publish.dc.html` (+ `.standalone.html`), `cd25-stage.js`, `cd25-annot.js`,
`WIRING_MAP_CD-025.csv`, `COMPONENT_MAP_CD-025.csv`, `ACCEPTANCE_CHECKLIST_CD-025.md`,
`RESEARCH_PROVENANCE_CD-025.md`, `CLAUDE_CODE_HANDOFF_CD-025.md`, the named-frame PNG exports,
and `saqeel-tokens.css` / `saqeel-astryx.css` (verbatim copies of the repo's own
`apps/web/src/app/tokens.css` / `astryx.css` — the repo files are authoritative).

## Baseline reconciliation (why the design's blockers mostly cleared)
The R2 design was grounded at `setup/Inspection`, where there was no atomic publish RPC, no
`validated` plan state, and no governed review route. The repo has since moved AHEAD: the
route, the `validated` transition and the atomic `publish_bulk_plan` (returning `plan_id`) are
all LIVE, and automatic assignment is first-available-in-window (not round-robin). Current
evidence won over the snapshot, per the handoff's binding instruction.

## Implementation (branch `feat/cd-025-plan-review-publish`)
See the manifest `implemented:` block. Route `/planning/bulk/review` was upgraded from the
basic CD-021 review step into the CD-025 staged workspace (Publish Consequence Ledger,
ReadinessRail, ScopeReductionControl, PublishActionBar), truthful assignment copy, plan-id
capture with an optional read-only plan link, and the `validateBulkPlan` readiness preview.
`main` was not touched; nothing merged or pushed.

# DO NOT EXECUTE UNTIL SPONSOR DESIGN APPROVAL AND INDEPENDENT CODEX WIRING AUDIT
# CLAUDE_CODE_IMPLEMENTATION_PROMPT_CD-031.md — R3
implementation_authorized: false

You are Claude Code. Implement the sponsor-approved slice of CD-031 / SCR-WEB-400 / P12 — Factory 360 (/factories/:id).

## 0. Stop conditions
- Baseline is main; sources were read this session but not independently resolved (BASELINE_REVERIFY_REQUIRED). If local main differs, STOP and report. Do not use setup/Inspection.
- The working tree is dirty with unrelated user work. Preserve it. Do NOT commit/push/merge/deploy/reset/clean/stash or modify main/branches, migrations, data, tests, contract files or Git history.
- If sponsor design approval or the independent Codex wiring audit is not recorded, STOP.

## 1. Read first
Approved design CD-031 Factory 360.dc.html and every file in outputs/cd-031-r3/. Re-read runtime truth: factories/[id]/page.tsx, Controls.tsx, actions.ts, loading.tsx, the factory list route, Shell.tsx, ShellClient.tsx, shell-navigation.ts, astryx.css, tokens.css, and factory/risk/document/audit migrations. Record branch/commit/dirty state.

## 2. Implement only the approved slice
- Build the provenance-led dossier and the Spatial Case Timeline (source-labelled, list-equivalent, keyboard-operable, reduced-motion safe) linking location/inspection/finding/review/risk. Never fabricate a spatial path, boundary or causal link.
- Keep identity + workforce read-only from source; keep per-section query isolation so one failure is a section banner, not a whole-record failure.
- Show map, boundary, coordinate-conflict, risk-driver breakdown and document preview as explicitly unavailable (HANDOFF_BLOCKED_MAP/_BOUNDARY/_COORDINATE_CONFLICT/_RISK_DRIVERS/_DOCUMENT_VIEWER). Do not add a map provider, boundary polygon, driver gauge or document viewer unless separately approved.
- Preserve add controls (document/rep/product/material + rep activation); do not present an offered mutation as universally allowed — product/material writes are RLS-restricted to planner/ops/compliance_admin (0017); mask sections by role rather than inventing permissions (HANDOFF_BLOCKED_ROLE).
- Implement all hard states, Arabic/RTL, dark/light, 1440/1024/412, semantic tables/lists, focus order, role=status/alert, reduced-motion. Every section-navigation pill (.cd-secitem) must be >=48x48px in desktop, Arabic RTL and 412px narrow layouts, with separated labels, boundaries, selected state and visible keyboard focus.

## 3. Do NOT invent
A map/provider/boundary/geofence result, a risk-driver breakdown or recalculation, a document viewer/signed URL/custody retrieval, a data-freshness threshold, leadership aggregation or contact-privacy permissions, or any RLS/audit behaviour not proven in source.

## 4. Evidence
Create apps/web/e2e/cd-031-factory-360.spec.ts (does not exist — write it; do not claim it passes before writing). Cover the timeline (keyboard + unavailable elements), provenance/freshness, per-section service failure isolation, map/boundary unavailable, coordinate conflict, role masking, high-risk, document-preview unavailable, no-history, not-found, Arabic/RTL, theme, 1024/412. Then an independent Codex wiring audit across all 18 legs per WIRING_MAP_CD-031.csv; any unproven map/boundary/risk-driver/viewer/role leg stays HANDOFF_BLOCKED. Report path-by-path diffs.

## 5. Prohibited
Inventing backend/policy behaviour; commit/push/merge/deploy/main changes without separate authorization; drawing a fabricated map/boundary/causal link; collapsing the dossier on one section failure; a CRM card wall or decorative risk gauge.

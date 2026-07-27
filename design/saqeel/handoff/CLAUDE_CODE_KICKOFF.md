# CLAUDE CODE KICKOFF — SAQEEL Inspection migration

Paste this into Claude Code on a fresh branch of `Vikram-Indla/Inspection` (branch: `feat/saqeel-design-system`), after running `/design-sync` against the published **SAQEEL Inspection Design System**, or with `SAQEEL-Inspection-Design-System-v1.0.zip` unpacked at the repo root under `design/saqeel/`.

---

You are implementing the SAQEEL Inspection Design System across this repository, replacing retired predecessor entirely. The design system is the sole visual authority — invent nothing.

AUTHORITY
- Tokens: design/saqeel/tokens/ (tokens.css compiled sheet, tokens.json + split JSONs). Semantic names only; no raw hex in product code.
- Components: design/saqeel/component-source/ — implementation REFERENCE (React JSX + .d.ts contracts). Re-implement in this repo's stack keeping names, props, variants and states exactly.
- Specs: design/saqeel/{foundations,patterns,ipad,components}/ — binding.
- Acceptance references: design/saqeel/screens/ (HTML canonical, PNG reference).
- Migration map with owner-resolved decisions: design/saqeel/handoff/RETIRED PREDECESSOR_MIGRATION_TEMPLATE.md. The new spec supersedes ALL retired predecessor decisions (16px body minimum, 44–52px blanket controls, retired input font input freeze, retired mono font, steel-blue dark primary — all retired; log supersessions in the product decision register).

SEQUENCE (design/saqeel/handoff/IMPLEMENTATION_SEQUENCE.md)
Start with step 1 ONLY, as one PR:
1. Replace apps/web/src/app/tokens.css content with the SAQEEL token sheet (map --legacy-* consumers via the token table in the migration map; keep the data-theme mechanism and ThemeScript).
2. Swap fonts: IBM Plex Sans / IBM Plex Sans Arabic / IBM Plex Mono; remove retired input font + retired mono font loads.
3. Rewrite the four design-contract Playwright specs (design-foundation-contract, platform-design-system-contract, ui-compliance-contract, inspector-shell-uplift) to assert SAQEEL tokens — same PR, or CI blocks.
Then proceed step-by-step (primitives → shell → nav → forms → grid → map chrome → inspection/signature components → pages), one PR per step, verifying each against screens/ in EN+AR × light+dark × desktop+iPad before the next.

GUARDRAILS (unchanged behaviour)
Business workflows, routes, data fields/meanings, permissions/RBAC/RLS, validation, map engine + zone-hover lift, search/filter/save/submission behaviour, API contracts, DB, audit, notifications, the login Cinematic Atlas (out of scope), offline-first logic.

DEFINITION OF DONE per view
Renders in all four modes; no retired predecessor imports; no raw hex/font declarations; focus ring on every interactive element; status vocabulary = the 10 canonical roles; touch targets ≥44px on field surfaces.

FINAL GATE (step 12–13)
Delete apps/web/src/app/retired-predecessor.css, legacy tokens, design/retired-predecessor/, outputs/cd-* styling packs, MIM_Inspection_Meta_retired predecessor_Fable_Pack. Then repo-wide grep `legacy-|retired-predecessor|retired input font|retired-mono|Barlow` must return zero product-code hits, and the QA matrices (VISUAL / RESPONSIVE / ACCESSIBILITY) must pass.

FIRST ACTION
Inventory every `--legacy-*` consumer and `.legacy-*` usage (file + count), confirm it maps to a row in the migration map, and report any unmapped usage BEFORE writing code. If any visual decision is missing from the design system, stop and escalate to Claude Design — do not invent.

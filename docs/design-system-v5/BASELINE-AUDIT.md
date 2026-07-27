# Baseline Audit — Saqeel V5.1 (Wave 0)

Findings from reading the production CSS import graph and grepping the app before making any change.

## CSS architecture
- `apps/web/src/app/tokens.css` (161 lines, V1 pre-change) — single source of raw values, already disciplined (no raw hex anywhere else in the codebase's CSS — `retired-predecessor.css` consumes `var(--legacy-*)` exclusively). This is a materially better starting point than the master prompt's "1,000+ line legacy stylesheet with no token discipline" assumption.
- `apps/web/src/app/retired-predecessor.css` (1,314 lines) — one monolithic component library, organized into clearly-marked sections (CORE: BUTTONS/INPUTS/STATUS/OVERLAYS/FEEDBACK, ENTERPRISE: APP STRUCTURE/DATA TABLE/PROCESS/DOMAIN, UTILITIES) plus ~450 lines of screen-specific selectors appended by slice (`cd-*`, `lv-*`, `ar-*`, `ccr-*`, `cmp-*`, `lz-*`, `rk-*`, `nya-*`). A literal 14-file layer split (per the master prompt's Wave 1 §5.2) was evaluated and **deliberately not done** — the interdependency and screen-specific tail make that a high-risk, low-value mechanical split versus fixing the actual substance defects (typography, color, loading state, search icon). Recorded here as a considered scope decision, not an oversight.

## V1 defects confirmed present (pre-fix)
- Dark-theme primary was blue (`#78AEDA`), doubling as both brand and information color — confirmed exactly the bug the ChatGPT review chain flagged.
- `--legacy-radius-input: 12px` (generic capsule fields).
- Field labels and button/tab/segmented/pagination text all used `--legacy-text-body-strong` (600 16px) — no distinct 14/20 label/action scale existed, so labels read as headings and buttons looked oversized.
- `.legacy-btn.is-loading` set `color: transparent`, hiding the label entirely during a pending action (the "anonymous blue rectangle" bug).
- `.legacy-search::before` rendered a generated Unicode `⌕` character, not an SVG icon.
- No shared `Modal`/`Tabs` React component existed — 4 files hand-rolled `.legacy-modal` markup with no focus trap/restore; `role="tab"` usages had no roving-tabindex/keyboard behavior.
- 50 files used `toISOString().slice(...)` for date formatting; several `dt()` helpers called `Intl.DateTimeFormat("ar-SA", {dateStyle:"medium"})` with no explicit `calendar`, which silently defaults to **Hijri** (islamic-umalqura) — a real, previously-unnoticed correctness bug, not a cosmetic one.
- No automated guardrail existed to prevent any of the above from being reintroduced.

## What did *not* match the ChatGPT critique screenshots
The multi-round ChatGPT critique (toolbar with "Publish version / Cancel / View audit / Delete draft" side by side, a heavy "Board/Table/Map" segmented control, "Overview/Evidence/Audit trail" tabs) was checked against the actual live Visit Planning review workspace (`apps/web/src/app/planning/bulk/review/ReviewClient.tsx`). **That exact toolbar does not exist in the live app** — the real component already has a single prominent Publish action, a blocker-first corrections flow, and no permanent danger button. The critiqued screenshots were of the **design-system HTML mockup** (`design/saqeel-v5-final/patterns/web/visit-planning.html`), not the shipped application. This matters for scoping Wave 5: the live app's actual component discipline is materially better than the mockup screenshot suggested, so Wave 5 work should be a targeted audit against the corrected V5.1 patterns rather than a search for a specific toolbar that isn't there.

## Routes inventoried (for Wave 4-8 planning)
Full production build (`npm run build`) enumerates ~80 routes across `/admin/*` (26), `/planning/*` (9), `/field/*` (5), `/visits/*` (5), `/operations/*` (3), plus dashboard, reports, reviews, factories, cases, committee, portal, virtual, evidence-ocr, incident-reports, tasks, profile. See the build output in this session's log for the exact list; not duplicated here to avoid drift from the live route table.

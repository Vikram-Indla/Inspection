# D9 — Engineering Handoff (design → build)

Effective after G6 Approval 3, this design output becomes visual implementation authority (Meta-Astryx pack rule). Build remains blocked until G8 PASS; this document tells engineering exactly what they inherit.

## 1. Token pipeline
- **Single source:** `design/astryx/tokens.css` — the only file allowed to contain raw color/size values. Build step should transform it (or mirror it) into the app's token layer; components must consume `var(--ax-*)` only. Tints derive via `color-mix()` from the approved 11-color palette — do not bake derived hexes.
- Fonts: license + bundle Inter and IBM Plex Sans Arabic (pages ship with system fallbacks deliberately; no external fetches).

## 2. Component inventory → implementation notes
- Core + enterprise components: `astryx.css` (D1 pages are the visual spec; every state variant shown is contractual, incl. the 12 mandatory screen states, 6 sync states, 5-domain status taxonomy with glyphs).
- Layer files: `d2/admin.css` (3-pane control plane, publish pipeline, dependency checks), `d3/web.css` (wizard rail, dossier grid, conflict/inspector rows), `d4/ipad.css` (field shell, ≥48px targets, ≥16px text, status strip, section rail, response cards).
- Demo JS (`*.js`) is design chrome only — NOT product code. The `data-screen`/state-switcher mechanism is a review tool; real screens derive state from runtime.
- All layout uses CSS logical properties — keep it; RTL then costs `dir="rtl"` + font switch only.

## 3. Per-screen acceptance matrix
`FABLE_UNDERSTANDING_TRACEABILITY.csv` (493 rows) is the build order-book: requirement → phase → storyboard → channel → screens → states → transitions → behavior → AC → evidence → errors. Each frame's contract footer repeats its slice inline. QA certifies against `FABLE_ACCEPTANCE_UNDERSTANDING.csv` anatomy + EV-001..012 minimum proofs — screenshots alone insufficient for permissions/audit/versioning/offline/config-consumption (contract rule).

## 4. Non-negotiable runtime behaviors the design encodes (do not weaken)
Engine-driven config (never hardcode checklists/violations/workflow) · canonical transitions only, guards visible · submitted/published/decision/audit immutability · selective unlock · Version N+1 always · idempotent retries (publish/check-in/submit/decision) · explicit conflict resolution, never silent overwrite · evidence linkage mandatory + custody metadata · official/planner/observed location provenance · per-widget fault isolation · freshness always visible, stale never live · location privacy (active journey only) · least privilege + audited denials.

## 5. Blocked inputs engineering must receive before their slices
DEC-001 risk model · DEC-002 GIS thresholds/retention · DEC-003 SLA calendar · DEC-004 Arabic scope · DEC-005 factory-facing boundary · DEC-006 evidence policy (+hash on/off) · DEC-007 OTP provider · DEC-008 maps provider · DEC-009 signature scope · DEC-010 NFR targets + stack freeze · Supabase secret key/PAT for schema reconciliation · video session provider.

## 6. Build sequence (contract-fixed)
Fable-loop order 0–11 (Build Contract §3): shared foundation first (identity/RBAC, ENG-03 workflow, ENG-12 audit, ENG-10 offline, ENG-11 notifications) → admin engines → golden vertical slice (BRD §16.1) → full channel scope → acceptance/negative paths → UI/UX certification vs these frames (EV-011) → zero-regression rerun → release certification. Tests reference requirement + acceptance IDs (`.claude/rules/tests.md`).

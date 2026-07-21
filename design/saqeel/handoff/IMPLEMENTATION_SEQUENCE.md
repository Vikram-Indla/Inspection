# IMPLEMENTATION_SEQUENCE (safe order)
1 Tokens (tokens.css/json → CSS vars + Tailwind map; rewrite the 4 design-contract Playwright specs in the SAME PR)
2 Fonts (IBM Plex Sans/Arabic/Mono; purge Barlow, Space Grotesk, JetBrains)
3 Shared primitives (Button, Field/Input family, StatusBadge, panel, ExceptionMark)
4 Application shell (Sidebar/TopBar/layout; keep role-scoped nav + RLS scopes intact)
5 Navigation (PageHeader, Breadcrumb, Tabs, Steps)
6 Forms (Field system, validation, ChecklistQuestion, drafts/save status)
7 Data grid (register first; port column defs + saved views)
8 Map controls (chrome only — engine, zone-lift, geofences untouched)
9 Inspection + signature components (Spine, EvidenceStack, Sync/Diff/Immutable)
10 Representative pages to match /screens
11 Remaining pages by module
12 Astryx removal (delete ax tokens/css, design/astryx, historical packs; grep gate: ax-|astryx|Space Grotesk|JetBrains|Barlow = 0 product hits)
13 Final verification (VISUAL/RESPONSIVE/ACCESSIBILITY QA matrices × four modes × desktop+iPad)
Never mix Astryx and SAQEEL styling in one view beyond a single release.

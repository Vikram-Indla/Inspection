# Page Coverage — Saqeel V5.1

## Coverage model
Two layers of coverage exist and must not be conflated:

1. **Cascaded coverage** (token + `astryx.css` component fixes) — applies automatically to *every* page that uses the shared component library, since it's one CSS entry point. This means the dark-primary color fix, label/action typography fix, loading-button fix, and search-icon fix are live on all ~80 routes right now, verified by the production build succeeding and the served CSS containing the new token values (see IMPLEMENTATION-INDEX.md verification section).
2. **Per-page structural coverage** (date formatting, action hierarchy, density, shell) — only applies to the specific files touched.

## Per-page structural coverage (this session)

| Route | Cascaded (tokens/CSS) | Date service | Notes |
|---|---|---|---|
| All ~80 routes | ✅ | — | Via `tokens.css` + `astryx.css`. |
| `/reports/inspection/[id]` | ✅ | ✅ | Official report `dt()`/`d10()` fixed — highest-priority per spec (§7). |
| `/dashboard` | ✅ | ✅ | Refresh timestamp, GPS-override and audit-timeline columns. |
| `/factories/[id]` | ✅ | ✅ | 14 sites; legacy factory dossier. |
| `/factories/cr/[id]` | ✅ | ✅ | Governed CR-centred dossier; also fixed the Hijri-default bug. |
| `/field/factory-360/[id]` | ✅ | ✅ | Same Hijri-default fix, field channel. |
| `/visits/[id]` | ✅ | ✅ | 7 sites, consolidated onto existing `fmt()`. |
| `/operations` | ✅ | ✅ | 5 sites; SLA deadline, notification, geo-timeline columns. |
| `/reviews/[id]` | ✅ | ✅ | 4 sites; ack signature timestamp, evidence timeline. |
| `/planning/bulk/review` | ✅ | — | Audited for the critiqued toolbar pattern — not present in the live component (see BASELINE-AUDIT.md); no fix needed there. |
| Everything else (~65 routes: `/admin/*`, `/field/[visitId]`, `/planning/*` besides review, `/visits/calendar`, `/visits/map`, `/portal`, `/cases`, `/committee`, `/virtual/*`, etc.) | ✅ | ❌ not swept | ~64 remaining `toISOString().slice()` display sites across ~40 files, per `scripts/check-design-system-v5.mjs`. Several are in `*/actions.ts` server-action files and need individual triage (display vs DB-write) before touching — see CHANGED-FILE-INVENTORY.md. |

## Wave 4-8 page-level work not started
Shell/navigation restructure (Wave 4), full iPad/field sweep (Wave 6), full admin density sweep (Wave 7), and the report/print 5-layer rebuild beyond the date fix (Wave 8) were not started this session. These are the largest remaining items and are explicitly listed as open in FINAL-IMPLEMENTATION-REPORT.md rather than claimed done.

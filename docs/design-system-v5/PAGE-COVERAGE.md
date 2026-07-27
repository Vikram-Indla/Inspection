# Page Coverage — Saqeel V5.1

## Coverage model
Two layers of coverage exist and must not be conflated:

1. **Cascaded coverage** (token + `retired-predecessor.css` component fixes) — applies automatically to *every* page that uses the shared component library, since it's one CSS entry point. This means the dark-primary color fix, label/action typography fix, loading-button fix, and search-icon fix are live on all ~80 routes right now, verified by the production build succeeding and the served CSS containing the new token values (see IMPLEMENTATION-INDEX.md verification section).
2. **Per-page structural coverage** (date formatting, action hierarchy, density, shell) — only applies to the specific files touched.

## Per-page structural coverage (this session)

| Route | Cascaded (tokens/CSS) | Date service | Notes |
|---|---|---|---|
| All ~80 routes | ✅ | — | Via `tokens.css` + `retired-predecessor.css`. |
| `/reports/inspection/[id]` | ✅ | ✅ | Official report `dt()`/`d10()` fixed — highest-priority per spec (§7). |
| `/dashboard` | ✅ | ✅ | Refresh timestamp, GPS-override and audit-timeline columns. |
| `/factories/[id]` | ✅ | ✅ | 14 sites; legacy factory dossier. |
| `/factories/cr/[id]` | ✅ | ✅ | Governed CR-centred dossier; also fixed the Hijri-default bug. |
| `/field/factory-360/[id]` | ✅ | ✅ | Same Hijri-default fix, field channel. |
| `/visits/[id]` | ✅ | ✅ | 7 sites, consolidated onto existing `fmt()`. |
| `/operations` | ✅ | ✅ | 5 sites; SLA deadline, notification, geo-timeline columns. |
| `/reviews/[id]` | ✅ | ✅ | 4 sites; ack signature timestamp, evidence timeline. |
| `/planning/bulk/review` | ✅ | — | Audited for the critiqued toolbar pattern — not present in the live component (see BASELINE-AUDIT.md); no fix needed there. |
| All ~80 routes | ✅ | ✅ | **Updated**: the date-format sweep is now complete across every route — guardrail's utc-slice-date-format rule is at 0 real findings (every remaining match was individually verified as a legitimate non-display exception: HTML date-input wiring, DB-write fields, Postgrest comparison variables, calendar-key helpers). One real bug found and fixed along the way: `visits/workload`'s week-bucket grid used raw-UTC day-of-week instead of Riyadh-local. |
| All ~80 routes | ✅ | — | **Emoji icons**: every `emoji-as-icon` guardrail finding fixed — 55 files, ~85 call sites, 21 new SVG icons added to `app/icons.tsx`. Guardrail: 0 findings total (dates + emoji), down from 305 at branch start. |
| `/admin/*` (26 routes) | ✅ | ✅ | **Density**: content area (not shared nav/topbar chrome) now auto-adopts the compact 36/40px control ladder via `ShellClient`, keyed off the existing `current` route prop — no admin page file was touched for this. |

## Wave 4-8 page-level work remaining
Shell/navigation Wave 4 responsive/RTL/dark-mode visual verification, Wave 6's iPad-specific Split-View/Pencil/offline-visual-state pass (existing field-density modifier usage was verified already correct, not a gap), and the report/print 5-layer rebuild + print-fixture tests beyond the date fix (Wave 8) remain open. These are the largest remaining items and are explicitly listed as open in FINAL-IMPLEMENTATION-REPORT.md rather than claimed done.

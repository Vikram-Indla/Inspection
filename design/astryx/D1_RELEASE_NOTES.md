# Wave D1 Release — MIM Astryx Foundations & Component Authority

**Status: READY_FOR_REVIEW** (maps to `02_APPROVAL_SEQUENCE.md` Approval 1 — Astryx Foundation). Not self-approved. No product screen designed in this wave.

**Binding constraints honored:** Mobbin excluded (not called, cited or used). Historical archives used as provenance only. Meta-Astryx pack applied as design direction only — nothing here is design authority until G6 Approval 1. No unresolved decision value invented; every gated value is rendered as a config-driven placeholder labeled with its DEC ID.

**Medium:** Fable-native coded design authority — self-contained, clickable HTML/CSS/JS, versioned in-repo. No external fetches (fonts noted for licensing/bundling at build). Raw color/size values exist in exactly one file (`tokens.css`); all components consume tokens (MVP1-FND-010 discipline applied to design).

---

## Frame locations (open in any browser)

| Frame | File | Contents |
|---|---|---|
| D1-F01 | `design/astryx/D1-01_foundation.html` | Colour (approved palette + derivation rules + contrast), typography EN/AR semantic scale, spacing/radius/elevation/control metrics, desktop 12-col + iPad 8-col grids, RTL rules with live toggle, accessibility rules |
| D1-F02 | `design/astryx/D1-02_components-core.html` | Buttons (primary/secondary/subtle/danger/icon/split/field-48px; hover/focus/active/disabled/loading), inputs (default/hint/invalid/read-only/disabled/search/select/date/number/textarea), checkbox/radio/switch/segmented/tabs, **5-domain status taxonomy**, version badge, banners (info/warning/critical/success/**immutable**), toast, tooltip, menu (guard-disabled items), confirmation modal (danger + mandatory reason), audit drawer, skeleton/empty/error/unauthorized states |
| D1-F03 | `design/astryx/D1-03_components-enterprise.html` | App shell + page header (multi-domain status + version + freshness), breadcrumb, command/filter bar, saved views, KPI cards (trace-to-records), data table (sort/select/bulk bar/per-row failure), stepper, validation summary (blockers + deep links), immutable banner + version diff, **12 mandatory screen states** incl. interactive degraded-widget and 6-state sync chip, **conflict resolver** (two-sided, explicit resolution), map panel (official/observed pins, geofence, freshness, provider-abstract), visit card (field 48px actions), evidence gallery (linked/unsynced/quarantined/uploading), rule builder (AND/OR), workflow canvas (states/guards/terminal/simulate contract) |
| Infrastructure | `design/astryx/tokens.css`, `astryx.css`, `astryx.js` | Single token source; component library (logical properties → native RTL); demo behaviors only |

## Completed IDs (D1 scope)

- **Astryx pack component authority:** all “Core components” and all “Enterprise components” listed in `00_DESIGN_SYSTEM_DECISION.md` have a designed, stateful primitive. Coverage note: date/time + number render via native controls styled by `.ax-input` (dedicated picker design deferred to first consuming screen wave); combobox = search+menu composition, dedicated variant deferred likewise. Both tracked below as D2–D4 obligations, not omissions of D1 intent.
- **Foundation requirements advanced by D1:** MVP1-FND-002 (5-domain status taxonomy, glyph+label), FND-003 (audit timeline/drawer, no edit affordance), FND-005/006 (sync chip 6 states; loading buttons as idempotent-retry affordance), FND-007 (official/observed pin provenance), FND-008 (evidence card custody metadata + linkage chip), FND-010 (single token source), FND-011 (contrast, focus rings, ≥48px field targets, no colour-only meaning, reduced motion), FND-012 (widget fault-isolation frame, live simulation), FND-013 (freshness chrome: live/stale/dead). *(Advanced = design pattern exists; acceptance still requires runtime evidence at build gates.)*
- **Mandatory screen-state patterns:** all 12 (loading, empty, populated, validation, unauthorized, read-only/immutable, stale, degraded, offline, syncing, conflict, success) exist as reusable components.
- **Design exclusions verified:** no Material/Atlassian/shadcn defaults, no gradients/glassmorphism, no decorative dashboards, no consumer-social patterns.

## Missing IDs (deliberately not in D1 — next waves)

- All 38 product screens SCR-ADM/WEB/IPAD/VIR-* → waves D2–D7.
- All 478 requirement rows + AC rows → covered per wave; D1 completes zero product requirements by design.
- Golden screens + wired journeys → D8 territory per approval sequence (Approval 2/3).
- Dedicated date-picker, combobox-with-listbox, file-drop variants → first consuming wave (D2 admin forms).
- Arabic full-surface variants → D8, gated by DEC-004.

## Blocked IDs (decision-gated; rendered as labeled placeholders, no values invented)

| Blocked | Gate | D1 treatment |
|---|---|---|
| Risk band names/thresholds | DEC-001 | risk fields disabled + “blocked until DEC-001”; band dd shows “—” |
| Geofence radius/accuracy values | DEC-002 | ring + accuracy chip shown, values presented as config-driven |
| SLA timers/calendar | DEC-003 | SLA KPI rendered stale-labeled, “values gated by DEC-003” |
| Arabic scope | DEC-004 | RTL live-toggle + AR type preview only; no bilingual commitment |
| Evidence size/format limits | DEC-006 | rejection card cites ERR-EVD-002 + “limits = DEC-006” |
| Map provider | DEC-008 | provider-abstraction watermark on map panel |
| Signature/PKI | DEC-009 | acknowledgement-only pattern reserved; no signature UI |
| Priority list values | REF-005 (Decision) | select placeholder cites REF-005 |

## Open questions for reviewer (named, not invented)

1. Confirm coded-HTML as the D1 review medium (Figma migration optional post-approval; pack said “create in Fable”).
2. Approve `color-mix()` tint derivation rule as the official method for tonal ramps from the approved 11-color palette (alternative: hand-picked hex ramp — would add new raw values).
3. Approve status-domain glyph set (▣ ● ◆ ▲ ⟳) or supply preferred iconography before D2 consumes it everywhere.
4. Inter/IBM Plex Sans Arabic licensing/bundling owner at build (pages currently use system fallbacks).
5. FABLE_OPEN_QUESTIONS.yaml items stand — esp. CONF-002 (Mobbin wording change control) and DEC-004 before D8.

## Acceptance coverage statement

D1 creates zero product-requirement acceptance claims. It establishes the visual/interaction preconditions that EV-011 (visual acceptance: no tiny text, no clipping, consistent system) and MVP1-FND-011 will be tested against. Traceability of every D1 pattern to its contract source is annotated inline on the frames (blue annotation blocks cite requirement/STM/ERR/EV/DEC IDs).

## Wave audit against approved CSVs

- `FABLE_UNDERSTANDING_TRACEABILITY.csv`: 0 of 493 rows claimable by a foundation wave — correct by definition; screen-bearing waves D2–D7 will claim rows and re-audit.
- Component demand profile in `FABLE_TECHNICAL_DESIGN_IMPACT.md` §3: **all 10 demanded pattern families have a D1 primitive** (table+filters+bulk, designer canvas, map panel, wizard/stepper+blockers, evidence gallery/viewer, diff, timeline/audit, SLA/risk queue chrome, verification stepper via stepper+banner composition, readiness checklist via choice+validation composition).

**Next wave on approval:** D2 Admin control plane (SCR-ADM-001..090; M09 rows MVP1-M09-001..030; AC-0449..0478; storyboards SB03/SB13/SB18).

— READY_FOR_REVIEW

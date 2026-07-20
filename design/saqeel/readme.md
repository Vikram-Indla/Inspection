# SAQEEL Inspection Design System

An original design system for a Saudi national inspection and regulatory platform, built to replace the existing **Astryx** implementation. It serves three audiences at once: field inspectors (dense, fast, touch-capable), supervisors (review and approval), and executive/government stakeholders (credible, quiet, premium).

**References, not identities:** Industry supplied the structural discipline (grid rhythm, compact controls, data-table architecture); Nocturne informed dark-mode surface layering, elevation and selection contrast only. Neither system's visual identity (Barlow / steel blueprint marks; purple / glow) survives here.

## Design principles

1. **Quiet confidence** — authority comes from hierarchy, alignment and restraint, not decoration.
2. **Colour means something** — emerald is interaction; status colours are semantics; nothing is tinted for looks.
3. **Density with dignity** — operational screens are compact but never cramped; whitespace is purposeful, not generous.
4. **Two languages, one system** — Arabic is composed intentionally (own leading, no letter-spacing, LTR-embedded identifiers), never mirrored mechanically.
5. **Dark mode is designed, not derived** — layered charcoal surfaces with edge-based elevation.

## Visual foundations

- **Canvas** — warm neutral `--surface-canvas` (#f4f3f0 light / #17191d dark); crisp white primary surfaces; deep graphite navigation (`--nav-*`) in *both* themes.
- **Accent** — one restrained emerald (`--action-primary` #115c44 light / #2e9e77 dark). Hover darkens in light mode, lightens in dark mode. Soft accent (`--accent-soft`) marks selection.
- **Status semantics** — critical, major, warning, compliant, informational, pending, draft, on-hold, completed, disabled. Each has base / soft / text-on-soft in both themes. Status is always colour + label (or icon), never colour alone.
- **Type** — IBM Plex Sans (EN), IBM Plex Sans Arabic (AR), IBM Plex Mono strictly for identifiers (inspection IDs, permits, coordinates, asset numbers). Weights: 400 content, 500 labels/controls, 600 headings/values, 700 hero metrics only. Role scale in `tokens/typography.css` (`--type-*`, `.t-*` utilities).
- **Borders over shadows** — 1px `--border-subtle`/`--border-strong` do the structural work; shadows (`--shadow-xs…lg`) reserved for genuinely floating layers. Dark-mode shadows are edge + ambient darkness.
- **Radii** — 2–6px. Small on purpose: controls 3px, panels 4px, modals 6px. No pills except avatars/markers/switches.
- **Motion** — 120–260ms, one standard easing, functional only (state changes, drawers). `prefers-reduced-motion` collapses all of it.
- **Density** — comfortable default; `[data-density="compact"]` tightens controls and grid rows (44px → 34px).
- **Icons** — Lucide, stroke 1.5, 16–17px in controls. Directional icons flip under RTL via `data-directional`.
- **Imagery** — evidence photography is shown honestly (no duotone, no tint); thumbnails square, 3px radius, hairline border.
- **Maps are workspace** — never tint the basemap; controls float on `--map-panel`; zones use `--map-zone-*`; markers are status-coloured with white keylines.

## Content fundamentals

- Sentence case everywhere, including buttons and column headers. No exclamation marks, no emoji.
- Verbs lead actions: "Assign inspector", "Submit for review", "Reject with reason".
- Identifiers rendered in mono with a stable format: `INS-2026-004821`, `PRM-88213`, coordinates as `24.7136° N, 46.6753° E`.
- Dates: `12 Jul 2026` (EN) / `١٢ يوليو ٢٠٢٦` or `12 يوليو 2026` (AR, Latin digits acceptable and preferred for cross-referencing).
- Empty states state what is absent and the one next action.

## RTL rules

- Everything is built with CSS logical properties; `dir="rtl"` on `<html>` flips the layout.
- Arabic sets the Arabic-first font stack and taller leading automatically (`[dir="rtl"]` in `tokens/typography.css`).
- `letter-spacing: 0` under RTL — tracked Arabic is broken Arabic.
- Identifiers, coordinates and phone numbers remain LTR (`.id-code`, `.t-mono` embed `direction: ltr`).
- Directional icons (chevrons, arrows meaning forward/back) flip; status icons and numbers never flip.
- Numerals: Latin digits by default for operational cross-referencing; tabular-nums everywhere data aligns.

## Status semantics (fixed meanings)

| Token | Meaning |
| --- | --- |
| `critical` | Immediate-danger finding / overdue-critical |
| `major` | Major violation, escalation |
| `warning` | Approaching due date, attention needed |
| `compliant` | Passed / conforming |
| `info` | Neutral informational |
| `pending` | Awaiting action by someone else |
| `draft` | Unsubmitted work |
| `onhold` | Deliberately paused |
| `completed` | Closed, terminal |
| `disabled` | Inactive entity |

## Accessibility (WCAG 2.2 AA)

Text tokens ≥ 4.5:1 on their surfaces; `--focus-ring` visible on every interactive element (`:focus-visible`, 2px, offset 2); touch targets ≥ 44px on field surfaces; status = colour + text; dialogs trap focus and return it; tables use real `<th scope>`; form errors are associated via `aria-describedby`; reduced motion honoured globally.

## Index

- `styles.css` — the entry point (imports everything below).
- `tokens/` — `fonts.css`, `colors.css` (light + dark), `typography.css`, `layout.css` (spacing, radius, motion, density, z).
- `components.css` — the CSS component layer all JSX components consume.
- `guidelines/` — foundation specimen cards (Design System tab).
- `components/` — reusable JSX primitives: `actions/`, `inputs/`, `navigation/`, `feedback/`, `data/`, `grid/` (Inspection Data Grid), `inspection/`, `map/`, `signature/` (SAQEEL signatures: GeoWorkspace, StatusSpine, EvidenceStack, ExceptionRail).
- `ui_kits/inspection/` — representative high-fidelity screens (light, dark, RTL, tablet).
- `handoff/` — 21-artifact Claude Code package: DESIGN_PRINCIPLES, DESIGN_SYSTEM_OVERVIEW, TOKENS_REFERENCE + tokens.json + tokens.css, TYPOGRAPHY_SPEC, COMPONENT_CATALOG, COMPONENT_API_CONTRACT, RTL / DARK_MODE / RESPONSIVE / ACCESSIBILITY / MAP_SYSTEM / DATA_GRID / FORM_SYSTEM specs, INSPECTION_PATTERNS (signatures), VISUAL_QA_MATRIX, FOUR_MODE_PARITY_MATRIX, CLAUDE_CODE_HANDOFF, ASTRYX_MIGRATION_TEMPLATE (deliberately empty of assumptions), KNOWN_LIMITATIONS.
- `SKILL.md` — agent-skill entry point.

## Signature patterns (original to SAQEEL)

Geospatial Command Workspace · Inspection Status Spine · Evidence Stack · Operational Exception Rail · Field-to-Command Continuity — see `handoff/INSPECTION_PATTERNS.md` and `components/signature/`.

## Intentional additions

No source codebase was attached; the component inventory follows the commissioning brief (dated Jul 2026) rather than a discovered library. The Astryx migration matrix in `handoff/astryx-migration.md` is keyed by pattern name and must be reconciled against the real Astryx exports at implementation time.

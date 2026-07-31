# SAQEEL Figma — developer handoff

Everything a developer needs to build from the Figma file, and the honest limits of what
the file proves. Start here.

File: `ML2PNwfShlQM2k44MvSEw5`, page `— SCREENS —` unless stated otherwise.

## What is in the file

| Section / page | Holds | Count |
|---|---|---|
| `SCREENS — EN · Light` | every screen, populated happy path | 29 frames |
| `SCREENS — EN · Dark` | the same, dark colour mode | 29 |
| `SCREENS — AR · RTL` | the same, mirrored, Arabic where approved | 29 |
| `SCREENS — AR · RTL · Dark` | both | 29 |
| `SCREENS — STATES · EN · Light` | every declared state | **73** |
| `SCREENS — OVERLAYS · EN · Light` | dialog, drawer, toast, menu, column manager, tooltip, each over a real screen | 6 |
| `SCREENS — 1024 · EN · Light` | the 1024 breakpoint: shell collapsed, rail off-canvas, plus a drawer-open frame | 17 |
| page `Admin Shell` | the 14 admin screens on the `ad-*` shell | 14 |
| pages `Foundations: *` | colour, type, spacing, radius, effects | — |
| component pages | Button, Badge, Form Controls, Table, Nav, Overlay, State, Map, Domain: Inspection | — |

Governed coverage: **30/30 in-scope screens**, **103/103 screen-states** — 30 default
frames plus the 73 states. **212 frames, 10,668 component instances** in total.

## Read these next

| File | What it answers |
|---|---|
| `SCREEN-SPEC.md` | per screen: route, personas, permission rule, mandatory regions, primary actions, every state and its frame name, requirement weight |
| `component-map.json` | Figma component → React import path under `components/saqeel/` |
| `KNOWN-DEFECTS.md` | the 2 open defects, and why the Planning table is *meant* to clip |
| `../traceability/COVERAGE-STATISTICS-2026-07-31.md` | requirement → screen coverage, computed |
| `../i18n/TRANSLATION-PACKET-2026-07-31.csv` | the 213 strings still needing Arabic |

## Frame naming

`<screen_id> — <name> — <route> — <section>`, e.g.
`SCR-WEB-150 — Plan Review & Publish — /planning/[id]/review — EN · Light`.

State frames end `— STATE: <state>`. Overlay frames begin `OVERLAY: <kind> — over <id>`.

Three suffixes carry a warning:

- `— DUPLICATE of SCR-…` — an older frame for a screen that has a governed frame
  elsewhere. Build from the governed one.
- `— NO CATALOGUE ROW` — the frame exists but no governed screen requires it. Do not
  build it without asking; it may be scope that was never approved.
- frames with no `SCR-` prefix at all are legacy and unverified.

## Prototype flows

Six journeys are wired click-through, startable from their first frame:
Bulk planning · Single visit · Immediate visit · Visit lifecycle · Level 2 review ·
Virtual inspection. 17 connections.

The trigger is the whole frame, not a specific button — enough to walk a journey, not a
statement about which control navigates. Do not infer interaction design from it.

## Responsive

**Two widths are drawn: 1280 and 1024.** Section `SCREENS — 1024 · EN · Light` holds the
16 screen-id frames at 1024 with the rail removed, plus one drawer-open frame showing
where the nav goes.

That is the breakpoint that changes structure: `saqeel-runtime.css:1073` collapses
`.sq-shell` to a single column and translates `.sq-shell__nav` fully off-canvas at
`max-width: 1024px` **or any `pointer: coarse` device** — so an iPad Pro in landscape,
wider than 1024, still gets the drawer.

Below 1024 nothing else is drawn. The CSS remains authoritative for every other
breakpoint; do not infer them from the frames.

Breakpoints that actually change layout, from `saqeel-components.css` and
`saqeel-runtime.css`:

| Width | What changes |
|---|---|
| 1440 | `.sq-f360` factory-360 grid |
| 1180 | `.kpi-grid` drops to 2 columns |
| 1099 | shell scope, `.cd-grid` and its side rail |
| 1024 | `.sq-shell` collapses; also triggered by `pointer: coarse` |
| 1023 | `.sq-execution__tablewrap` |
| 960 / 959 | `.rv-library`; account identity in the rail |
| 900 / 899 | review workspace grid, timeline, approval facts |
| 834 | factory 360, execution day columns |
| 800 | reference body and fields |
| 760 | planning filter toolbar |
| 700 | planning create-method grid |
| 640 | compare table, ribbon, trace nodes |
| 600 | risk section nav |
| 560 | execution days and rows, page-head topbar, field page, authority chips |
| 480 | `.cd-nodes` |
| 420 | `.saqeel-state` |

Note `1024px` also fires on `pointer: coarse`, so a touch device gets the collapsed shell
regardless of width.

## Limits — what this file does NOT prove

1. **AR frames are detached.** 983 instances against 2,265 in EN. Figma has no RTL
   direction property, so mirroring required flattening instances to reorder children — a
   component edit does not reach them. This is a Figma limitation, not a choice.

   It is no longer manual work: `../tooling/regenerate-ar-sections.js` rebuilds both AR
   sections from EN · Light deterministically — detach, reverse horizontal stacks, flip
   cross-axis alignment and inline padding, translate from `ar-index.json`, re-place the
   notification badge, set dark modes. Edit a component, run it, AR is correct again.
2. **Arabic is partial** — **78% across the AR section**, 213 strings still outstanding
   after mining every approved source in the repo. Those render English. See the
   translation packet; nothing was machine-translated.
3. **States are single-region.** A state frame shows the state block in the content
   region, not every surrounding control in its disabled or loading form.
4. **Two open defects**, both cosmetic, in `KNOWN-DEFECTS.md`.
5. **Jira is not the source here.** Coverage is measured against the governed catalogue
   because Jira is unreachable from this environment. If Jira holds screens the catalogue
   does not, this file will not know about them.

## Governance that overrides the picture

From `CLAUDE.md`, and they win over anything a frame appears to show:

- No new CSS, no new tokens. Every element uses a class that already exists in
  `saqeel-components.css`. A missing class is a design-system change request.
- Status is text plus shape, never colour alone.
- RTL through logical properties only — never `left`/`right`.
- Arabic lives in the i18n layer, never inside a component.
- Never invent a governed value — no risk weight, penalty, SLA or threshold. Absent data
  renders *Not configured* / *Unavailable* / *Insufficient evidence*.

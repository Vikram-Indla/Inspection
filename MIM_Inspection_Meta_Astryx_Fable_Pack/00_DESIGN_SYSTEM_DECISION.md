# MIM Inspection Platform — Design System Decision

## Decision

Use **MIM Astryx**, a project-owned **Meta-inspired enterprise design system**.

Do not tell Fable merely to “use Meta.” Meta does not provide this project with a complete, public, implementation-ready component system and Figma library. “Meta” is therefore the design direction; **MIM Astryx is the executable design system**.

This decision replaces the earlier idea of treating design as a small preflight for each isolated slice. The product requires one coherent visual and interaction authority before Fable expands the screens.

## What “Meta-inspired” means

MIM Astryx must feel:

- calm, human and immediately understandable;
- visually light but operationally powerful;
- spacious enough for decision-making, without wasting screen area;
- direct, responsive and optimistic;
- highly legible under field conditions;
- consistent across Admin, Web, Operations, iPad and Arabic RTL.

It must not look like Facebook, Instagram or a consumer social application. It must translate Meta-like clarity, rounded geometry, progressive disclosure and fast feedback into a serious government inspection platform.

## Foundation

### Typography

- English: **Inter**
- Arabic: **IBM Plex Sans Arabic**
- Use a shared semantic scale rather than screen-specific font sizes.
- Minimum body size: 14 px on desktop; 16 px for field-critical iPad content.
- Use tabular numerals for KPIs, dates, coordinates, timers and SLAs.

### Colour

- Primary: Astryx Cobalt `#0866FF`
- Primary hover: `#0757D9`
- Canvas: `#F5F7FA`
- Surface: `#FFFFFF`
- Strong text: `#101828`
- Secondary text: `#475467`
- Border: `#D0D5DD`
- Success: `#12B76A`
- Warning: `#F79009`
- Critical: `#D92D20`
- Information: `#2E90FA`

Semantic colours must never be the only carrier of meaning.

### Geometry and density

- Base spacing unit: 4 px
- Standard rhythm: 8 / 12 / 16 / 24 / 32 / 48
- Small radius: 8 px
- Standard card/input radius: 12 px
- Large panel/modal radius: 16 px
- Desktop control height: 40–44 px
- Field/iPad touch target: minimum 48 px
- Shadows: restrained; borders and tonal surfaces should carry most hierarchy.

### Layout

- Persistent application shell.
- Clear page title, context, status and primary action.
- Full-width operational workspaces where the task requires data density.
- Side panels for context, properties, audit and detail—not unnecessary page navigation.
- Responsive desktop, laptop and tablet layouts.
- RTL must be native, using logical layout and mirrored directional behaviour.

## Component authority

Fable must create one reusable component library before producing final screens.

### Core components

Button, icon button, split button, link, text input, search, textarea, number input, date/time input, select, combobox, checkbox, radio, switch, segmented control, tabs, badge, status lozenge, avatar, tooltip, popover, menu, toast, banner, modal, drawer, skeleton, empty state, error state and degraded-service state.

### Enterprise components

Application shell, page header, breadcrumb, command bar, filter bar, KPI card, data table, bulk-action bar, saved view, stepper, timeline, activity feed, audit drawer, version badge, permission state, rule builder, form/package designer, workflow canvas, map panel, visit card, evidence gallery, evidence viewer, offline/sync indicator, conflict resolver, validation summary and immutable/read-only banner.

## Mandatory product patterns

1. **Admin control plane:** list → draft → configure → validate → compare → maker-checker approval → publish → immutable version.
2. **Planning:** select method/factory → configure → assign → resolve conflict → review → publish.
3. **Field execution:** assignment → readiness → journey/check-in → inspection wizard → evidence/finding/action → validation → immutable submission.
4. **Review:** queue → read-only submission → decision → exact return scope → version comparison → approval.
5. **Operations:** live status → alerts → map/list → drilldown → timeline → governed action.
6. **Offline:** visible network and sync state, durable local work, safe retry, explicit conflict—never silent overwrite.

## Non-negotiable states

Every screen must include, where relevant:

- loading;
- empty;
- populated;
- validation failure;
- unauthorized;
- read-only/immutable;
- stale data;
- degraded service;
- offline;
- syncing;
- conflict;
- success confirmation.

## Design exclusions

Do not use:

- default Material appearance;
- Atlassian-like dense visual treatment;
- generic shadcn styling without Astryx tokens;
- excessive gradients, glassmorphism or decorative dashboards;
- giant cards where tables or structured workspaces are needed;
- desktop pages compressed into an iPad viewport;
- inconsistent one-off components;
- mock interactions with no defined states.

## Authority path

All product requirements, journeys and screen context are already available at:

`/Users/vikramindla/Documents/GitHub/Inspection/Requirements`

Fable must read them as input. It must not rewrite or reproduce the requirement documentation.

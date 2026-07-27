# Class contract — extracted from the approved design

Generated from `design/final-cut/saqeel-revamp.html` by walking the rendered DOM.
This is **evidence, not description**. Every line below is a real element in the approved design.

Use this instead of inspecting the design file yourself. If something here disagrees with the
running design, the design wins — re-extract rather than guess.

---

## The complete class vocabulary

The entire application uses **35 classes**. There are no others. If you write markup that needs a
class not on this list, you have gone off-contract — stop and report it.

**Layout shell**
`sq-shell__nav` · `sq-shell__groups` · `sq-shell__collapse` · `sq-shell__main` ·
`sq-content` · `sq-pagehead` · `sq-topbar-row` · `sq-nav-icon`

**Navigation**
`sidebar-group` · `nav-item` · `nav-item-child` · `nav-label` · `nav-subgroup`

**Containers**
`panel` · `tabs` · `seg` · `seg-opt`

**Controls**
`btn` · `btn-primary` · `btn-secondary` · `btn-ghost` · `btn-danger` · `btn-icon` · `btn-sm` ·
`input` · `input-affix` · `select` · `textarea` · `field` · `filter-chip`

**Status and data**
`badge` + modifiers (`badge-compliant` `badge-critical` `badge-warning` `badge-major`
`badge-draft` `badge-pending` `badge-completed` `badge-info` `badge-success` `badge-review`
`badge-plan` `badge-ops`) · `id-code` · `tl-meta` · `avatar` · `alert` `alert-immutable` ·
`steps` · `timeline` · `kpi` `kpi-grid` · `grid-toolbar` · `map-panel`

All of these already exist in `apps/web/src/app/saqeel-components.css`. **None were invented.**

---

## Shell — side rail

Route: `apps/web/src/app/(app)/layout.tsx`

```
aside.sq-shell__nav
  button.sq-shell__collapse
  div.sq-shell__groups
    div.sidebar-group                     ← Overview
      button.nav-item
        span.sq-nav-icon
        span.nav-label                    "Dashboard"
      button.nav-item                     "Operations Center"
      button.nav-item                     "Factory 360"
    div.sidebar-group                     ← Operations
      button.nav-item                     "Planning"
      button.nav-item                     "Inspection ›"   (chevron group)
      div.nav-subgroup
        button.nav-item.nav-item-child    "Execution"
        button.nav-item.nav-item-child    "Review & Approval"
          span.badge.badge-critical       "9"
    div.sidebar-group                     ← Compliance
      button.nav-item                     "Compliance Library"
      button.nav-item                     "Approval Queue"
        span.badge.badge-critical         "3"
      button.nav-item                     "Enforcement Library"
    div.sidebar-group                     ← Insights
      button.nav-item                     "Analytics"
  button.nav-item                         ← Administration, PINNED below the scroll region
    span.sq-nav-icon
    span.nav-label
```

Note: Administration sits **outside** `.sq-shell__groups` — that is what pins it to the footer.

## Shell — topbar

```
header.sq-pagehead
  div.sq-topbar-row
    button.btn.btn-secondary.btn-icon     ← drawer toggle (narrow widths)
    div.input-affix
      input.input                         ← "Search factory, CR, license, inspection"
    button.btn.btn-secondary              "Last 30 days"
    button.btn.btn-secondary              "All regions"
    div.seg                               ← language, a segmented control
      button.seg-opt                      "EN"
      button.seg-opt                      "ع"
    button.btn.btn-secondary.btn-icon     ← theme
    button.btn.btn-secondary.btn-icon     ← notifications (badge child)
    button.btn.btn-icon                   ← AI
    span.avatar                           "MA"
```

---

## Dashboard — `/dashboard`

```
main.sq-content
  div.seg
    button.seg-opt                        "Strategic view"
    button.seg-opt                        "Operational view"
  h2                                      "National performance"
  article.panel × 3                       ← KPI cards, each with h3 + button.btn.btn-secondary
  section.panel                           "Compliance performance explorer"
    div.seg                               ← 4 lenses: Region / City / Sector / Authority
      button.seg-opt × 4
  h2                                      "Strategic intervention"
  article.panel × 3
  section.panel                           "Enforcement action trend"
    button.btn.btn-secondary              "Open Enforcement Library"
  section.panel                           ← Executive AI brief
    span.tl-meta                          "Generated 6 min ago · Gemini provider"
    span.badge.badge-completed            "3 evidence links"
    button.btn.btn-ghost                  "Open the evidence"
```

## Operations Center — `/operations`

```
main.sq-content
  div.seg
    button.seg-opt                        "Operations map"
    button.seg-opt                        "National performance"
  span.tl-meta                            "Live positions · last ping 42s ago"
  section.map-panel                       ← Mapbox mounts inside
    div.sq-map__legend
    nav.breadcrumb > ul.breadcrumb
      button.btn.btn-ghost                "Saudi Arabia"
    span.sq-map__provider
  h2                                      "Operational summary"
  div.kpi-grid
    article.panel.kpi × 5
      span.sq-kpi__value
      button.btn.btn-ghost
  section.panel                           "Live operational exceptions"
    span.tl-meta                          "Recomputed every 60s"
    span.badge.badge-pending.badge-critical / .badge-warning
    button.btn.btn-secondary              ← per exception
```

## Factory 360 — `/factory-360`

Three columns: portfolio (left) · workspace (centre) · AI assistant (right).

```
main.sq-content
  section.panel                           ← CR portfolio
  button.panel × n                        ← licence cards, each with 2 status badges
  section.panel                           ← factory header
    h2
    span.badge.badge-draft                "Opened from"
    span.badge.badge-pending              "Reason ·"
    button.btn                            "Create inspection"
    button.btn.btn-secondary              "View on map"
    button.btn.btn-secondary              "Export PDF"
  section.panel × n                       ← collapsible content sections
  section.panel                           ← AI assistant
    span.badge.badge-completed            "Contextual"
    span.tl-meta                          "2 minutes ago"
```

## Planning — `/planning`

```
main.sq-content
  div.sq-topbar-row > h1                  "Planning"
  div.grid-toolbar
    button.btn.btn-secondary              "Refresh" / "Export" / "Saved views"
    span.sq-toolbar__spacer
    button.btn                            "Create visit ▾"
  section.panel                           ← AI recommendations
    span.badge.badge-completed            "92% confidence"
    span.tl-meta                          "Generated 4 min ago"
    div.panel × 4                         ← each: button.btn.btn-secondary "Plan" + btn-ghost "Review"
    button.btn.btn-secondary × 6          ← buckets, each with span.badge count
  div.grid-toolbar
    div.input-affix > input.input
    button.filter-chip × 5
    span.sq-toolbar__spacer
    button.btn.btn-secondary
  button.panel × n                        ← visit rows, 2 badges each
```

## Execution — `/execution`

```
main.sq-content
  section.panel
    div.seg
      button.seg-opt                      "Week" / "Month"
  div.seg
    button.seg-opt                        "My inspections" / "All inspections" / "Live map"
  span.tl-meta                            "Tracking updates every 30s"
  div.grid-toolbar
    div.input-affix > input.input
    button.filter-chip × 6
  button.panel × n                        ← visit rows: badge-draft + badge-ops
```

## Review & Approval — `/reviews`

```
main.sq-content
  div.panel                               ← queue filters
    div.seg
      button.seg-opt × 5                  ← Submitted / In review / Returned / Approved / Rejected
    div.input-affix > input.input
    select.select × 2
  div.panel                               ← queue list
    span.id-code                          ← per row
    span.badge.badge-warning / .badge-critical  ← 2 per row
  div.panel                               ← record header
    span.id-code
    span.badge.badge-info
    button.btn.btn-secondary.btn-sm       "Open Factory 360"
    button.btn.btn-secondary.btn-sm       "Inspection report PDF"
  div.tabs
    button.tab.is-active > span.tab-count
    button.tab × 6 > span.tab-count
  div.panel                               ← decision
    button.btn.btn-primary                "Approve inspection"
    button.btn.btn-secondary              "Return for correction"
    button.btn.btn-danger                 "Reject inspection"
  div.alert.alert-immutable
```

## Compliance Library — `/compliance`

```
main.sq-content
  div.input-affix > input.input           ← global search
  span.badge × 5                          ← authority counts
  div.grid-toolbar
    div.input-affix > input.input
    button.filter-chip                    "Status" / "Inspection type"
    button.btn                            "Create"
  button.panel × n                        ← regulation rows: badge-plan + id-code
  section.panel                           ← regulation workspace
    button.btn.btn-secondary              "View request" / "Modify through request" / "Add to favourites"
    div.alert.alert-immutable
    div.tabs                              ← 6 tabs
```

## Approval Queue — `/compliance/approvals`

```
main.sq-content
  span.badge.badge-completed / .badge-pending.badge-warning   ← per object
  ol.steps                                ← review sequence
  section.panel × 3                       ← list · workspace · decision rail
    button.btn                            "Approve configuration request"
    button.btn.btn-secondary              "Return package"
    button.btn.btn-danger                 "Reject package"
    textarea.textarea                     ← mandatory comment
  section.panel > ul.timeline
```

## Enforcement Library — `/enforcement-library`

```
main.sq-content
  div.grid-toolbar
    div.input-affix > input.input
    button.filter-chip                    "Status" / "Date range" / "Region"
    span.sq-toolbar__spacer
    button.btn.btn-secondary              "Export"
  button.panel × n                        ← enforcement rows, badge-review + tone
```

## Analytics — `/analytics`

```
main.sq-content
  h1                                      "Analytics"
  span.badge.badge-draft                  "Representative design fixtures"
  button.btn.btn-secondary.btn-sm         "Export · unavailable"
  div.panel                               ← filter bar
    label.field > select.select  × 6
    label.field > input.input
    button.btn.btn-primary.btn-sm         "Apply"
    button.btn.btn-ghost.btn-sm           "Reset"
  div.tabs
  div.panel × n                           ← metric panels, each with btn-ghost "i"
    span.badge.badge-pending              ← when not configured
  div.panel                               ← lens explorer
    div.seg > button.seg-opt × 4
  div.panel                               ← bottleneck rows
    span.badge.badge-critical / .badge-major / .badge-warning
    button.btn.btn-ghost.btn-sm           "View records"
```

## Administration — `/admin/*`

Six hubs, one pattern: `h1` + breadcrumb, `div.grid-toolbar` with `input-affix` and `filter-chip`,
then `button.panel` record rows with `badge` status. Same anatomy as Enforcement Library.

---

## How to use this

1. Find your screen above.
2. Build that structure with those classes.
3. Write no CSS. Every class already exists in `saqeel-components.css`.
4. If you need a class not listed in the vocabulary, **stop and report it** — that is a
   design-system change request, not a page-level fix.

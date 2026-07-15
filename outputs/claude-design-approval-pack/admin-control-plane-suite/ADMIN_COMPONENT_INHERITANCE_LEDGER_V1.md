# Saqeel Admin Control Plane — Component Inheritance Ledger V1

## Disposition vocabulary

- `FREEZE`: inherited exactly; the Admin suite may not redesign it.
- `PRESERVE`: reuse existing responsibility and behavior; page composition may consume it.
- `REFINE_IN_DESIGN`: a page-specific design may propose a change, subject to manifest, review, and later authorization.
- `DESIGN_HISTORY_ONLY`: inspect for lessons; do not treat as runtime or current visual authority.
- `HANDOFF_BLOCKED`: no implementation target is claimed until the missing contract/runtime leg is resolved.

## Global and shared inheritance

| Family / component | Current source | Disposition | Protected responsibility | CD-004 rule |
|---|---|---|---|---|
| Authenticated shell server wrapper | `apps/web/src/components/Shell.tsx` | FREEZE | Authenticated identity, role query, localized shell strings, server-role-scoped navigation | Compose page content inside it; do not change role/nav behavior |
| Shell interaction layer | `apps/web/src/components/ShellClient.tsx` | FREEZE | Desktop collapse, mobile drawer, search, focus/Escape, topbar | No page-specific shell variant |
| Shell navigation contract | `apps/web/src/lib/shell-navigation.ts` | FREEZE | Real role-visible destinations and hidden unsupported tabs | Preserve `/admin` as Approval & Configuration; no new destination |
| Notification bell | `apps/web/src/components/NotificationBell.tsx` | FREEZE | RLS-scoped notification rows, polling, read receipt, provider-pending truth | Do not turn bell state into Admin engine-health evidence |
| Theme and semantic tokens | `apps/web/src/app/tokens.css` | FREEZE | Saqeel color, type, spacing, radii, motion, elevation, focus | All proposed values resolve through existing or explicitly proposed semantic tokens |
| Shared component grammar | `apps/web/src/app/astryx.css` | PRESERVE | Buttons, surfaces, tables, banners, lozenges, versions, loading, state, freshness, widgets | Reuse semantics; do not copy prototype-specific Admin CSS blindly |
| Localization runtime | `apps/web/src/lib/i18n.ts` and generated keys | PRESERVE | English/Arabic strings and document locale behavior | Propose exact new keys only in handoff; no hard-coded production copy |
| Audit browser route | `apps/web/src/app/admin/audit/page.tsx` | PRESERVE | RLS-scoped append-only audit browsing | CD-004 may link to it; no embedded editable audit control |

## CD-004 current route inventory

| Component / responsibility | Current source | Disposition | Verified current behavior | Design constraint |
|---|---|---|---|---|
| Admin home route | `apps/web/src/app/admin/page.tsx` | REFINE_IN_DESIGN | Server-renders counts, engine versions/update times, regulation/audit links | Candidate implementation path; exact imports and query behavior must be mapped |
| KPI row | `.ax-kpi-row`, `.ax-kpi` in shared CSS | REFINE_IN_DESIGN | Equal count cards | Do not retain a generic equal-card wall if it fails the 30-second decision |
| Engine settings table | `.ax-tablewrap`, `.ax-table`, `.ax-version` | PRESERVE/REFINE_IN_DESIGN | Shows engine key, version label, updated timestamp | Timestamp is provenance, not a health/stale verdict |
| Live database lozenge | page-local composition | REFINE_IN_DESIGN | Static success label | Must not imply every parallel query or provider is healthy |
| Regulation link | `/admin/regulations` | PRESERVE | Real governed destination | Keep role/action truth; no inline regulation editing on home |
| Audit link | `/admin/audit` | PRESERVE | Real governed destination | Preserve append-only/read-only meaning |
| Query aggregation | page-local `Promise.all` | REFINE_IN_DESIGN | Six reads; query errors not interpreted; null counts displayed as zero | Design explicit per-source unavailable/partial states; implementation remains later |
| Direct-route authorization | middleware + page + RLS policies | HANDOFF_BLOCKED | Authentication exists; Admin-family route guard is not proven | Design denial state, but do not claim it is wired |

## Admin family components to inherit or establish through design

These are design families, not authorized code components.

| Family | Inherited basis | CD-004 use | Later-CD use | Rule |
|---|---|---|---|---|
| Governed page header | Shared shell title/context and page-head grammar | Configuration scope, source timestamp, safe primary action | All Admin screens | No duplicate global topbar |
| Version identity | `.ax-version`, mono identifiers | Engine/config version provenance | Regulations, packages, workflows, risk, GIS | Never hide draft/published/locked identity |
| Lifecycle status | `.ax-lozenge` with text/icon/color | Verified lifecycle only | All publishable objects | Do not normalize unlike lifecycles into false equivalence |
| Source/freshness label | `.ax-freshness` grammar | Source and last-updated fact | All external/config sources | No stale state without a governed threshold; use `last updated` or `verification unavailable` |
| Partial-service container | `.ax-widget` + `.ax-state` + banner grammar | Isolate one failed query | All Admin engines | Preserve other verified content and provide retry context |
| Dependency/validation ledger | Astryx Admin design history | Design-only if backed by exact data | Package/workflow/risk/GIS | Every row names source and blocking authority; otherwise `HANDOFF_BLOCKED` |
| Maker-checker chain | Package/workflow current pages | Show only where author/approver data and rule exist | Regulations, packages, workflows, enforcement | Never generalize distinct approver to every object |
| Immutable audit timeline | Audit route and shared timeline grammar | Recent verified events or route link | All Admin engines | No editable event, no UI-only immutability claim |
| Runtime-consumption evidence | Product contract + later detailed screens | `HANDOFF_BLOCKED` unless exact query exists | Package/workflow/config consumers | Counts/claims require runtime source and evidence |

## Design history boundary

`design/astryx/d2/**` is `DESIGN_HISTORY_ONLY`. It demonstrates useful control-plane concepts, state breadth, and domain language, but its Admin home contains values and assertions that are not automatically current runtime truth, including draft-age thresholds, engine-health verdicts, provider failures, approval counts, runtime-consumption counts, and generalized maker-checker behavior. Claude Design must verify every adopted element against current code and contract.

## One-pattern novelty allocation

For CD-004, only one new page-specific signature pattern may be selected after the three-hypothesis comparison. Everything else must be assembled from inherited Saqeel shell, surfaces, tables/lists, status, version, source/freshness, banner, state, audit, and action patterns.

## Candidate exact-path handoff boundary

The minimum candidate path is `apps/web/src/app/admin/page.tsx`. A future manifest may add exact existing shared/localization/test paths only after import and runtime discovery. It may not name a directory as a file change, invent a component filename, edit the frozen shell, or treat `design/astryx/d2/admin.css` as production CSS.

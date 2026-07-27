# SAQEEL-ADMIN-CORE-001 — Administration Revamp delivery evidence

Date: 2026-07-27

Branch: `codex/admin-core-revamp`

Base checkpoint: `b91b89051ba6a4f719b21a0be2baccbbcef7c26b`

## Delivered under `LEASE-SAQEEL-ADMIN-CORE-001`

| Source frame | Canonical destination | Route | Evidence hook |
|---|---|---|---|
| 19 | Users & Roles | `/admin/access` | `frame-19-admin-users-roles` |
| 20 | Lookup Management | `/admin/localization` | `frame-20-admin-lookup-management` |
| 21 | Risk Configuration | `/admin/risk` | `frame-21-admin-risk-configuration` |
| 22 | Survey Configuration | `/admin/packages` | `frame-22-admin-survey-configuration` |
| 24 | Integration Management | `/admin/integrations` | `frame-24-admin-integration-management` |

The common Administration destination frame reproduces the supplied title,
breadcrumb, three-metric strip, tabs, governance gate, main work area and
right governance rail using the exact F0 shell tokens. It reflows below 1200px,
supports EN/LTR and AR/RTL, and keeps prototype-only figures out of the live
product. Each destination retains its existing Supabase reads, RLS visibility,
guarded actions, immutable-version rules, audit behavior, and explicit
unavailable/empty/error states.

The shared F0 shell already contains exactly the six pinned source destinations.
The focused browser contract verifies the six labels and canonical hrefs without
editing the shared navigation.

## Explicit sixth-destination collision

Source frame 23, Notification Configuration (`/admin/notifications`), is not
owned by this lease. `product-contract/execution/CURRENT_SLICE.yaml` grants:

- lines 189–203: `LEASE-SAQEEL-ADMIN-CORE-001`, holder `codex`, with
  `apps/web/src/app/(app)/admin/** (excluding paths leased to other cards)`;
- lines 204–215: `LEASE-SAQEEL-ADMIN-PLATFORM-001`, card `admin-platform`,
  holder `kimi`;
- line 212: exclusive path
  `apps/web/src/app/(app)/admin/notifications/**`.

No Notification source file was changed. Its exact pinned navigation entry
remains present and was verified. Frame 23 must be delivered by the
`admin-platform` holder or transferred through change control.

## Verification

- `npm run typecheck` — PASS.
- `npm run build` — PASS; 59 static pages generated and all five dynamic routes
  present in the production route manifest.
- Focused real-session Playwright run — 8 PASS / 1 harness-selector failure:
  all five owned live routes; exactly six pinned links; EN/AR at 1440, 1024,
  412, 390 and 320; anonymous redirect. The remaining product state rendered
  correctly, but the assertion selected both the refusal panel and Next.js
  route announcer. The selector was narrowed to `section.sq-access-refusal`;
  the long authenticated suite was not rerun by explicit instruction.
- In-app browser session check found no already-open authenticated tab. No login
  bypass, authentication weakening, or additional seeded-login attempt was used.

The first Playwright attempt was invalid because the production bundle had been
built before the worktree received its gitignored environment links. Rebuilding
with the governed environment loaded resolved authentication; that superseded
attempt is not completion evidence.

## Governed record-drawer follow-up

The five owned record-bearing destinations now share the source-design drawer
contract from `Saqeel Revamp.dc.html` lines 2047–2064:

- activating a real record row/card opens an accessible modal drawer;
- Record, Governance and Audit groups contain only RLS-visible row facts and
  existing governed rules;
- Edit through request links to an existing guarded edit/request boundary when
  one exists and otherwise remains visibly unavailable with the truthful reason;
- View activity log links to the existing read-only `/admin/audit` route using
  the real record identifier, without inventing an actor, event or timestamp;
- Close, backdrop activation and Escape dismiss the drawer, focus is trapped
  while open, and focus returns to the activating record;
- logical CSS properties, inherited tokens and a `min(420px, 92vw)` width cover
  LTR/RTL, light/dark and narrow layouts.

Focused Playwright assertions cover Enter/Space activation, all three groups,
the governed links, Escape, focus return, Arabic RTL, dark theme and narrow
overflow across `/admin/access`, `/admin/localization`, `/admin/risk`,
`/admin/packages` and `/admin/integrations`. The one bounded execution attempt
on port 3041 stopped at the harness precondition because
`SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL` was absent; no product assertion executed
and no credential or bypass was fabricated. A direct Chrome navigation against
this worktree on `127.0.0.1:3040` verified that protected `/admin/access`
redirects to the real `/login` boundary. There was no already-authenticated
browser session available for a protected-row demonstration.

## Pinned Administration navigation parity correction

The Product Owner rejected the duplicate-chevron and icon-heavy pinned
Administration presentation. The app was compared directly with:

- `Saqeel Revamp.dc.html` lines 108–130 and 2398–2452;
- rendered source frames `18-administration-expanded-nav.png`,
  `44-rail-collapsed-68px.png` and `45-rail-expanded-248px.png`;
- the source design-system `admin` glyph in `_ds_bundle.js` lines 863–866.

Read-only design-quality review `/root/admin_nav_design_review` produced 22
scored recommendations. The retained no-functionality-loss top ten were:
compact expand-row suppression (25/25), effective collapse state (24/25),
label-only Admin children (25/25), recovered label width (25/25), the source
single chevron (25/25), exact RTL rotations (25/25), collapsed-parent chevron
suppression (25/25), active-descendant parent styling (24/25), moving the
active stripe from child to parent (24/25), and source parent-row geometry
(24/25). The source design was correct, so no Claude Design revision was
requested; the implementation was corrected to match it.

The shared shell now:

- treats compact/mobile navigation as expanded even when a collapsed desktop
  preference is persisted;
- keeps one persistent brand-header width control in both desktop rail states;
- renders the source shield-plus Administration glyph and one rotating `›`;
- renders all six Administration children as indented label-only rows;
- places the logical active stripe on the pinned parent while the active child
  keeps the source tint/weight without a second stripe;
- preserves every destination, href, guard, refusal boundary, button/ARIA
  semantics, focus behavior, EN/AR RTL behavior and token-only theming.

Authenticated Chrome evidence on `127.0.0.1:3040/admin/integrations` measured:
compact drawer `expand-row` display `none`; one visible Administration
chevron; zero child icons on all six links; no label overflow
(`scrollWidth === clientWidth` for every link); active parent logical border;
and active-child pseudo-indicator display `none`. The real integration registry
and its RLS-visible records remained present throughout the visual check.

Verification: `npm run typecheck` PASS; production `npm run build` PASS with
59/59 static pages; focused non-credential pinned-Administration contract
1/1 PASS. The complete shared-shell source file remains 18/20 because two
pre-existing role-catalogue expectations fail outside this presentation
change; the focused Administration navigation contracts pass.

### Persistent collapse/expand recovery decision

The Product Owner then demonstrated that the source design's split-control
pattern can strand a user after collapse: collapse lives in the brand header
while recovery is detached into the Administration footer. Read-only review
`/root/rail_expand_design_review` produced 28 recommendations and approved a
deliberate usability correction to that source pattern.

The retained top-ten decision removes only the footer recovery row and keeps
the existing brand-header button mounted through both desktop states. At 248px
it remains a 32px inline-end collapse control. At 68px it is centered beneath
the 36px brand mark with a 6px gap and reverses direction to communicate
expansion. Direction is logical in EN/LTR and AR/RTL; localized
Collapse/Expand text is reused for both `aria-label` and `title`; the control
now declares `aria-controls="saqeel-primary-nav"`; and the existing
`saqeel-shell-collapsed` preference remains unchanged. Keeping one DOM button
also preserves keyboard focus across the state transition.

At the compact/coarse-pointer breakpoint the width control remains hidden and
the existing 44px Close button is the sole drawer control. Authenticated Chrome
at the available 756px viewport measured compact state true, collapse display
`none`, and Close display `grid`. The fixed Chrome surface could not be resized
above the desktop breakpoint, so desktop recovery is evidenced by the focused
one-control/68px/RTL source contract rather than claimed as a browser exercise.
All six Administration destinations, permissions, refusal boundaries and
active-route behavior remain unchanged.

## Pre-existing Control Panel checkpoint evidence

This Revamp evidence is additive. The checkpoint inherited from `b91b8905`
already established the following Control Panel contract and remains valid:

- Card/task: `admin-core` / `SAQEEL-BOARD-DELIVERY-001`.
- Requirements: `CR-449..CR-478`.
- Acceptance: `WA-M9-AC-001..006`, `WA-M10-AC-001..006`.
- Designs: `admin/SAQEEL Admin.dc.html`,
  `admin/SAQEEL Control Panel.dc.html`.
- DEC-037 assigns the 24-card Control Panel gateway to `/admin` and preserves
  `/admin/operations` as the System Operations control plane.
- The gateway and destination reads are real RLS-scoped configuration facts;
  append-only oversight surfaces do not invent create/edit/retire operations.
- `/admin/execution` and `/admin/dashboard-config` mount inside the
  authenticated shell.
- The gateway reports the Admin persona’s enabled families instead of the
  retired false `You can act in none` summary.

The 24-card gateway operation map remains:

| Control Panel card | Runtime | Contract disposition |
|---|---|---|
| Users | `/admin/access` | Guarded role/capability assignment; no invented user provisioning |
| Roles | `/admin/access?view=roles` | Governed capability grant/revoke |
| Security & Access Review | `/admin/security-access` | Read-only oversight |
| Inspection Rules | `/admin/regulations` | Draft, publish, deactivate, attachment and audit operations |
| Inspection Items | `/admin/items` | Create, edit, activate/deactivate and usage checks |
| Inspection Forms | `/admin/packages` | Draft, preview, validate and immutable publish |
| Violations & Penalties | `/admin/violations` | Governed code/mapping lifecycle |
| Risk Settings | `/admin/risk` | Governed save plus versioned model lifecycle |
| AI Insights | `/ai/suggestions` | Advisory surface |
| Dashboard KPIs | `/admin/dashboard-config` | `admin-kpi` owned; policy-held targets fail closed |
| Workflow Settings | `/admin/workflows` | Versioned propose/edit/publish/retire/rollback |
| Execution Settings | `/admin/execution` | Guarded execution-policy saves |
| Notification Settings | `/admin/notifications` | `admin-platform` owned governed rule lifecycle |
| Map Settings | `/admin/gis` | Governed geofence settings and spatial layers |
| System Connections | `/admin/integrations` | Governed endpoint/dependency truth |
| Trusted Devices | `/admin/devices` | Read-only device oversight |
| Awaiting Approval | `/admin/compliance-approvals` | Maker-checker queue |
| Configuration Requests | `/admin/compliance-requests` | Governed request lifecycle |
| Activity Log | `/admin/audit` | Append-only oversight |
| System Operations | `/admin/operations` | Error retry and feature-flag checks |
| Language & Translations | `/admin/localization` | Revisioned localization lifecycle |
| Issue Multiple Violations | `/admin/bulk-violations` | Guarded permanent issuance |
| Enforcement Recommendations | `/admin/enforcement-recommendations` | Guarded human decision |
| Violation Cases | `/enforcement` | Enforcement-owned case lifecycle |

That checkpoint established route, shell, responsive, bilingual,
permission-summary, representative navigation, console and anonymous-access
behavior. It did not claim measured pixel parity or complete requirement-level
certification for `CR-449..CR-478`; those remain bounded by their named visual
and acceptance evidence.

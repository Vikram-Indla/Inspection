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

# SAQEEL-ADMIN-CORE-001 — Control Panel core audit

## Scope and authority

- Card: `admin-core`
- Task: `SAQEEL-BOARD-DELIVERY-001`
- Requirements: `CR-449..CR-478`
- Acceptance: `WA-M9-AC-001..006`, `WA-M10-AC-001..006`
- Designs: `admin/SAQEEL Admin.dc.html`, `admin/SAQEEL Control Panel.dc.html`
- Runtime routes: `/admin`, `/admin/operations`, and the control-panel
  destinations listed below
- Persona: seeded Admin carrying `compliance_admin`, `form_admin`, `gis_admin`,
  `risk_owner`, `security_admin`, and `workflow_admin`

## Discovery verdict

| Lane | Board claim | Evidenced verdict |
| --- | ---: | --- |
| Design | 60 | Not eligible to rise. The Control Panel design contains 24 cards, not the board label's 21. `DESIGN_ROUTE_MAP.csv` assigns that gateway design to `/admin/operations`, but `/admin/operations` is the real resilience/error/feature-flag control plane. `/admin` remains the older Configuration Evidence Spine. This routing conflict requires Product Owner resolution. |
| Code | 95 | Route inventory exists. All 23 admin destinations exercised by the shared shell return under the seeded Admin persona. The false `/admin` act-scope summary and the shellless `/admin/execution` route were repaired. |
| Wiring | 85 | The gateway reads real RLS-scoped configuration facts. Registry mutation coverage exists for the governed mutable families below. Oversight surfaces remain read-only by contract. Full `CR-449..CR-478` certification is not claimed while the design-route conflict remains. |

## Control Panel card and operation audit

The design contains 24 cards. “Create / add-row / add-endpoint / edit / retire”
applies only to mutable registries. Applying it to an append-only audit log,
approval queue, error queue, or advisory surface would invent prohibited
mutations.

| Design card | Runtime | Operation disposition |
| --- | --- | --- |
| Users | `/admin/access` | Existing identities are assigned/revoked roles and capabilities through guarded RPCs. User provisioning is not invented. |
| Roles | `/admin/access?view=roles` | Capability grant/revoke is implemented; no unsupported role-definition creation is claimed. |
| Security & Access Review | `/admin/security-access` | Read-only oversight surface. |
| Inspection Rules | `/admin/regulations` | Create, add clause, edit draft, publish, deactivate, attachment and audit operations. |
| Inspection Items | `/admin/items` | Create, edit, activate/deactivate and usage checks. |
| Inspection Forms | `/admin/packages` | Create draft, edit definition, preview, validate, publish immutable version and deactivate. |
| Violations & Penalties | `/admin/violations` | Create/deactivate/publish violation codes and create/publish penalty mappings. |
| Risk Settings | `/admin/risk` | Governed settings save plus versioned risk-model draft/transition. Policy-held values remain unconfigured. |
| AI Insights | `/ai/suggestions` | Advisory surface; human disposition is outside this card. |
| Dashboard KPIs | `/admin/dashboard-config` | Owned by `admin-kpi`; policy-held targets remain fail-closed. |
| Workflow Settings | `/admin/workflows` | Propose, edit, publish, retire and rollback versioned workflows. |
| Execution Settings | `/admin/execution` | Guarded saves for capacity, visit modes, reasons, GIS, evidence and offline policy. |
| Notification Settings | `/admin/notifications` | Create, test, publish and deactivate rules. |
| Map Settings | `/admin/gis` | Update governed geofence settings and create spatial layers. |
| System Connections | `/admin/integrations` | Governed endpoint registry and fail-closed dependency truth; undocumented endpoints are not invented. |
| Trusted Devices | `/admin/devices` | Read-only device oversight; trust/revoke behavior is owned by the device card. |
| Awaiting Approval | `/admin/compliance-approvals` | Maker-checker queue; decisions execute through the request workspace. |
| Configuration Requests | `/admin/compliance-requests` | Create/edit components and dependencies, submit, revise, decide, return, reject, cancel and publish. |
| Activity Log | `/admin/audit` | Append-only oversight; create/edit/retire is prohibited. |
| System Operations | `/admin/operations` | Error retry and feature-flag checker actions; retention/backup objectives remain policy-held. |
| Language & Translations | `/admin/localization` | Add, edit, review, synchronize, inspect history and restore revisions. |
| Issue Multiple Violations | `/admin/bulk-violations` | Guarded permanent-write issuance. |
| Enforcement Recommendations | `/admin/enforcement-recommendations` | Guarded human decision. |
| Violation Cases | `/enforcement` | Case lifecycle is owned by the enforcement card. |

## Runtime evidence

- `npm run typecheck` — PASS after the current changes.
- `admin-core-orchestrator.spec.ts`:
  - real seeded Admin login;
  - all 23 shared-shell admin destinations return below HTTP 400;
  - all destinations render inside the authenticated shell;
  - no captured console or page errors;
  - `/admin` reports the enabled families instead of the false
    `You can act in none`;
  - anonymous `/admin` access redirects to login;
  - `/admin` and `/admin/operations` pass EN/LTR and AR/RTL at
    `1440×900`, `1024×768`, `412×915`, `390×844`, and `320×800`;
  - horizontal overflow is at most one pixel at every matrix point.

## Corrections made

1. `/admin` now resolves the current `administration` navigation group and
   lists only enabled destinations.
2. `/admin/execution` now mounts inside the authenticated shared shell.
3. The Package designer preview child has a stable key; the route sweep no
   longer emits the React missing-key warning.
4. The focused test uses accessible current login controls instead of retired
   `#email` / `#pw` selectors and does not depend on a pre-generated inspector
   storage state.

## Open blocker

`WA-M9-AC-003` / `WA-M10-AC-003` cannot be certified until the Product Owner
resolves whether `SAQEEL Control Panel.dc.html` governs `/admin` (the gateway
its content describes) or `/admin/operations` (the current route-map row).
No board lane is raised and no route is overwritten while those authorities
contradict one another.

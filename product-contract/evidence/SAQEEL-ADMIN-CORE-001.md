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
| Design | 60 | The section and operation audits are complete. DEC-036 resolves the discovered authority conflict: the 24-card Control Panel design governs `/admin`; `/admin/operations` remains the System Operations control plane. Pixel parity is not claimed by this audit, so the design percentage is not raised. |
| Code | 95 | The 24-card gateway is implemented above the existing Configuration Evidence Spine. All 23 admin destinations exercised by the shared shell return under the seeded Admin persona. The false `/admin` act-scope summary, shellless `/admin/execution`, and shellless `/admin/dashboard-config` route were repaired. |
| Wiring | 85 | Every gateway card links to its governed runtime destination and representative cross-card routes were exercised. The gateway reads real RLS-scoped configuration facts. Registry mutation coverage exists for the governed mutable families below; oversight surfaces remain read-only by contract. Full `CR-449..CR-478` certification is not inferred from route coverage alone. |

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
  - the Control Panel renders exactly 24 governed cards;
  - representative cards navigate to AI Insights, Dashboard KPIs,
    Configuration Requests, and Violation Cases;
  - `/admin` reports the enabled families instead of the false
    `You can act in none`;
  - anonymous `/admin` access redirects to login;
  - `/admin` and `/admin/operations` pass EN/LTR and AR/RTL at
    `1440×900`, `1024×768`, `412×915`, `390×844`, and `320×800`;
  - horizontal overflow is at most one pixel at every matrix point.

The post-consolidation suite additionally covers:

- the seven authorization-filtered admin hubs;
- equality between the authorized rail destinations and the `Ctrl/Cmd+K`
  command-palette results;
- absence of an unauthorized Dashboard result from the palette;
- direct reachability of every destination projected by the authorized
  discovery registry;
- palette focus entry, Escape dismissal, and trigger-focus restoration;
- honest empty states plus device-local, per-user favorite persistence;
- the added `768×1024` EN/LTR and AR/RTL matrix point;
- mobile hub drill-in with localized Back, plus drawer Escape dismissal and
  focus restoration in both languages.

The repository's governed credential loader is used by the suite:
`SAQEEL_TEST_PASSWORD` and `SAQEEL_TEST_COMPLIANCE_ADMIN_EMAIL` may come from
the process, `apps/web/.env.local`, `apps/web/.env`, or `E2E_ENV_FILE`.
An existing generated session may instead be supplied read-only through
`SAQEEL_TEST_ADMIN_STORAGE_STATE`. Credentials and session values are not
committed or printed. The canonical checkout environment available during
this audit contained Supabase connectivity but no `SAQEEL_TEST_*` persona
settings. Its existing generated Admin state was attempted but was no longer
accepted by the application, so the new signed-in assertions remain pending
rerun rather than being reported as passed. Typecheck, 15
source/authorization tests, and the anonymous gateway test passed.

## Corrections made

1. `/admin` now resolves the current `administration` navigation group and
   lists only enabled destinations.
2. `/admin/execution` now mounts inside the authenticated shared shell.
3. `/admin/dashboard-config` now mounts inside the authenticated shared shell.
4. The Package designer preview child has a stable key; the route sweep no
   longer emits the React missing-key warning.
5. DEC-036 assigns the gateway design to `/admin` and preserves
   `/admin/operations` as System Operations.
6. `/admin` now renders the bilingual, role-aware 24-card Control Panel
   gateway while retaining the evidence spine below it.
7. The focused test uses accessible current login controls instead of retired
   `#email` / `#pw` selectors and does not depend on a pre-generated inspector
   storage state.
8. The shared navigation is now a least-privilege projection: destinations
   without a matching assigned role are absent from the DOM instead of exposed
   as enabled business links or disabled administration links.
9. Admin-only personas no longer receive Dashboard, Operations Center,
   Factory 360, Planning, Execution, Review & Approval, or the business
   compliance rail.
10. The Administration group opens by default when it is the persona's only
    navigation group, and the former separately pinned/hanging admin rail is
    folded into the single navigation flow.
11. Desktop navigation participates in the document scroll instead of owning a
    nested scrollbar; the bounded mobile drawer retains its own necessary
    scroll region.
12. Admin routes suppress global factory/visit search and inapplicable
    date/region controls. AI appears only when the resolved navigation grants
    it. Theme, notifications, account and language controls remain available.
13. The gateway removes the long read-timestamp sentence from the title row,
    retaining only a concise partial-source warning when one is real.
14. The 24 control areas now use a compact three-column desktop, two-column
    tablet and one-column mobile launch grid with reduced card height, clearer
    section rhythm, logical-property RTL support and restrained interaction
    feedback.
15. Administration discovery is organized into seven role-filtered hubs backed
    by the same authorization registry as the rail and command palette.
16. `Ctrl/Cmd+K` opens an authorized-only bilingual admin command palette with
    result-count announcements, Escape handling and focus restoration.
17. The Control Panel exposes a deliberate “View all authorized tools” path so
    consolidation does not remove functionality or deep-link reachability.
18. Favorites and recent areas are capped at five, namespaced per authenticated
    user, filtered against the current authorization set, and explicitly
    described as device-local rather than authoritative server activity.
19. Empty favorites and recents remain honest; no activity is invented.
20. “Needs attention” reports only observed configuration-read failures and
    explicitly avoids presenting a platform-health verdict.

## Design critique consolidation

The Product Owner supplied three runtime screenshots and required a minimum
20-change critique. Claude Design project
`5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61` was updated through Computer Use with
an admin-only shared chrome generator and a channel-wide page sweep. The
consolidated implementation contract is:

1. Exact-role destination projection.
2. No unauthorized locked or disabled navigation disclosure.
3. No business groups in an admin-only rail.
4. One Administration group, open when it is the only group.
5. No separately pinned bottom rail.
6. One desktop document scrollbar.
7. A bounded, dismissible mobile drawer.
8. No admin-global factory/visit search.
9. No inapplicable date control.
10. No inapplicable region control.
11. No AI entry without an explicit grant.
12. Compact single-row admin utilities.
13. Concise title row without provenance prose.
14. Partial-source state only when a failure exists.
15. Three-column desktop control grid.
16. Two-column tablet grid.
17. One-column phone grid.
18. Reduced card height and padding.
19. Consistent low-elevation surfaces.
20. Clear hover and focus-visible feedback.
21. Bilingual primary/secondary labels.
22. Logical-property EN/LTR and AR/RTL parity.
23. Responsive intro and section rhythm.
24. Preserved evidence spine and real-data semantics.
25. Shared empty/error/unauthorized-state treatment without invented data.
26. Route guards, RLS, workflow guards and append-only audit remain the
    enforcement authority.

## Certification boundary

DEC-036 removes the route-authority blocker. Earlier evidence established
route, shell, responsive, bilingual, permission-summary, representative
navigation, console, and anonymous-access behavior. The consolidated source
and authorization contracts pass, but this revision is not recertified as
100% until the signed-in suite above runs with an externally supplied seeded
persona. It also does not claim measured pixel parity or complete
requirement-level certification for `CR-449..CR-478`; those require their
named visual and acceptance evidence rather than a percentage inferred from
this focused suite.

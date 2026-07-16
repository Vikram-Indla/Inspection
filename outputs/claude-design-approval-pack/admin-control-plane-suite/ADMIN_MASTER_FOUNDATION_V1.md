# Saqeel Admin Control Plane — Master Foundation V1

## Authority and boundary

- Task: `TASK-DESIGN-ADMIN-SUITE-001`
- Lane: design-only, parallel to the active Web programme
- Scope: `CD-004..CD-019`, delivered as eight gated chapters
- First active chapter: `CD-004 / SCR-ADM-001 /admin`
- Implementation authorization: **absent**
- Allowed repository writes: `outputs/claude-design-approval-pack/admin-control-plane-suite/**` only
- Frozen dependency: the sponsor-accepted shared Saqeel shell

This foundation governs prompt construction and design review. It does not authorize application code, migrations, runtime data changes, Git operations, global contract edits, or implementation claims.

## Suite structure

| Chapter | CDs | Family purpose | Gate before next chapter |
|---|---|---|---|
| 1 | CD-004 | Admin foundation and control-plane home | R1 design, mandatory independent review, correction, R2, sponsor decision |
| 2 | CD-005–006 | Regulation governance | Chapter 1 gate complete |
| 3 | CD-007–009 | Inspection definition | Chapter 2 gate complete |
| 4 | CD-010–011 | Enforcement governance | Chapter 3 gate complete |
| 5 | CD-012–013–016 | Workflow and operational rules | CD-016 route/provider/SLA truth reconciled or explicitly blocked |
| 6 | CD-014 | Risk configuration | No invented model, factor, weight, threshold, or owner |
| 7 | CD-015 | GIS and geofence studio | No invented provider, geometry, threshold, retention, or override policy |
| 8 | CD-017–019 | Platform governance | CD-018/CD-019 acceptance addenda approved before visual generation |

No later chapter is generated before the preceding chapter completes its mandatory review and correction cycle.

## Product and design identity

- Product: Saqeel — `صقيل | صناعي`
- Default experience: Arabic-first full-document RTL
- Themes: equal-fidelity dark and light modes
- Type: Space Grotesk for English, IBM Plex Sans Arabic for Arabic, JetBrains Mono for identifiers and operational telemetry
- Visual values: semantic tokens from `apps/web/src/app/tokens.css`; no raw values in a proposed implementation handoff
- Status: text, icon/shape, position, and color; never color alone
- Tone: calm operational density, exact governance language, no decorative command-centre theatre

The Admin family is a control plane, not a CRUD collection and not a generic KPI dashboard. Every view must expose enough version, lifecycle, dependency, authority, impact, audit, source, and runtime-consumption context to support a safe decision.

## Frozen shell boundary

The following are inherited and must not be redesigned by any Admin chapter:

- `apps/web/src/components/Shell.tsx`
- `apps/web/src/components/ShellClient.tsx`
- `apps/web/src/lib/shell-navigation.ts`
- shared shell styles in `apps/web/src/app/astryx.css`
- server-rendered role-scoped navigation
- grouped Control plane navigation
- sticky topbar, navigation search, account identity, theme, language, notifications, sign-out
- accessible desktop collapse and mobile drawer focus/Escape behavior
- Arabic-first document direction

Navigation visibility is a convenience layer, not authorization. RLS, grants, route guards, canonical transitions, immutability, and audit remain the enforcement and evidence layers.

Unsupported Analytics, Lookup Management, Notification Configuration, Integration Management, and AI destinations remain hidden. A design may not add a placeholder route.

## Admin governance model

The suite should make this conceptual lifecycle legible where the repository proves it:

`Draft → Validate → Approve → Publish/Effective → Locked runtime version → Audit/runtime evidence`

This is a governance model, not a claim that every current Admin object already implements the same lifecycle:

- `config_versions` has the shared `config_status` model and maker-checker fields.
- `package_versions` supports draft/published/locked behavior, distinct approver enforcement, and published-definition immutability.
- regulations currently expose status but do not prove the same distinct-approver workflow as packages.
- `engine_settings` is currently updated directly by authorized roles and audited; the current UI does not prove a draft/approval/publish workflow for each setting.
- the control-plane home is read-only and currently performs no validation, approval, or publish action.

Designs must show these differences. They must not generalize maker-checker, effective dates, locks, validation, or runtime consumption across engines without exact evidence.

## CD-004 runtime truth baseline

The current `/admin` route reads:

- `engine_settings`: `engine`, `version_label`, `updated_at`
- exact counts for regulations, inspection items, published package versions, violation codes, and audit events
- localized labels via `useT()`
- authenticated identity and role-scoped navigation through the shared shell

The current route does **not** prove:

- a governed engine-health result
- an approval queue or approval-age/overdue policy
- dependency warnings or publish blockers across every engine
- runtime-consumption counts or a runtime version map
- engine ownership
- a stale threshold or service-level target
- provider reachability or outbound notification delivery
- a direct-route Admin-family authorization guard
- independent failure semantics for each parallel query

The page currently renders a null count as zero and does not inspect query errors. A redesigned partial-failure state must distinguish `unavailable` from a legitimate zero result. It must never infer platform-wide failure from one unavailable source.

The catalogue requires an unauthorized state, but current middleware checks authentication only, current tests intentionally permit cross-channel `/admin` rendering, and the route has no explicit Admin-family guard. The design may specify a safe unauthorized state, but its implementation/wiring leg remains `HANDOFF_BLOCKED` until route authorization is reconciled.

## Control-plane information grammar

Every Admin screen should answer, as applicable:

1. What governed object am I seeing?
2. Which version and lifecycle state is authoritative?
3. Who may act, and what segregation rule applies?
4. Which dependency or validation result blocks progress?
5. What downstream inspection behavior could change?
6. What is published/locked versus still editable?
7. What source and timestamp support the displayed fact?
8. What audit evidence exists?
9. What is unavailable, unresolved, or provider-pending?
10. What is the next safe action?

For CD-004, the page-specific design challenge is to reduce the 30-second decision: **what can harm tomorrow’s inspections, what requires attention, and what is merely unavailable?**

## Signature-pattern rule

Each CD may introduce no more than one screen-specific signature interaction. CD-004 may explore a `configuration health spine` only if it:

- links a governed lifecycle to evidence rather than decoration;
- reduces decision time or prevents an unsafe action;
- uses only verified or explicitly unavailable facts;
- remains operable by keyboard and in Arabic RTL;
- degrades to a semantic list/table at constrained width;
- does not duplicate or redesign the shell.

Three equal-fidelity hypotheses must be compared at the primary decision zone before the signature is selected.

## State and evidence discipline

Every CD owns its full state matrix. For CD-004 this includes populated, loading, first-use empty, validation/publish-blocked context, unauthorized, read-only, stale/unverified, degraded/partial-source failure, and recovery. Offline and sync-conflict are not applicable to the current server-rendered Admin home unless runtime discovery proves otherwise.

Real current runtime values are preferred. If design fixtures are necessary, they must be visibly labelled `DESIGN FIXTURE — NOT RUNTIME EVIDENCE` and may not introduce policy values, deadlines, thresholds, legal assertions, provider success, or business results.

## Acceptance and traceability baseline

Chapter 1 must trace:

- Process: `P00`
- Storyboards: `SB03`, `SB13`, `SB18`
- Screen: `SCR-ADM-001`
- Requirements: `MVP1-M09-001..030` as the gateway coverage set
- Foundation guards: `MVP1-FND-001`, `003`, `004`, `010..013`, `015`
- RBAC: `RBAC-001..006`
- Errors: `ERR-PUB-001`, `ERR-AUTH-001`
- Source acceptance: `AC-0449..0478`
- Design acceptance: `DSG-001`, `DSG-SHELL-001`, `DSG-A11Y-001`, `DSG-CODE-001`
- Visual evidence: `EV-DESIGN-001`

CD-004 is an overview/gateway. It must not pretend to complete the detailed behavior owned by CD-005..CD-019.

## Mandatory chapter cycle

1. Repository and contract discovery
2. Route/object/lifecycle/backend-truth memo
3. Three equal-fidelity decision-zone hypotheses
4. Claude Design R1 and deterministic handoff package
5. Mandatory independent Codex design review
6. One consolidated P0/P1 correction prompt
7. Claude Design R2
8. Sponsor approval or block
9. Independent wiring audit
10. Separate explicit implementation authorization

Design approval is not implementation authorization. No Admin Claude Code prompt is executable until steps 5–10 are satisfied and a clean dedicated worktree/branch is assigned.

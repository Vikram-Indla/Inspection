# Saqeel Shared Shell and Business-Tab Contract V1

## Authority and scope

Sponsor approved this reconciliation on 2026-07-13 from the business-team reference `/Users/vikramindla/Downloads/saqeel.html`. The reference supplies information architecture and interaction intent; the product contract, accepted CD-001 Saqeel baseline, RBAC matrix, implemented routes, and runtime data remain authoritative.

Implementation authority: `TASK-WEB-SHELL-001`.

The authenticated Web/Admin shell is implemented by:

- `apps/web/src/components/Shell.tsx` — authenticated server component, `getUser`, RLS-scoped role lookup, localization and safe identity props.
- `apps/web/src/lib/shell-navigation.ts` — deterministic role-to-route mapping.
- `apps/web/src/components/ShellClient.tsx` — grouped disclosures, desktop collapse, mobile drawer/focus behavior, navigation search, theme, language, notifications, account and sign-out.
- `apps/web/src/app/retired-predecessor.css` — accepted Saqeel token-based shell styling, responsive behavior and RTL.

The field/iPad and external virtual-participant channels retain their own constrained navigation semantics. They must not become reduced desktop portals.

## Business tab disposition

| Business input tab | Disposition | Governed destination | Visible to | Design/runtime rule |
|---|---|---|---|---|
| Dashboard | Wired | `/dashboard` | Operations User; Leadership | Sponsor-authorized, source-backed Strategic and Operational views under `TASK-WEB-DASHBOARD-002`. Governed formulas expose denominators; absent targets/policies render truthful unavailable states. |
| Operations Center | Wired | `/operations` with live map at `/operations/live` | Operations User; Leadership | Detailed monitoring workspace plus authenticated national live view. Projected positions remain truthfully labelled and are never presented as real GPS. |
| Factory 360 | Wired | `/factories` and `/factories/:id` | Planner; Inspector; Reviewer; Operations; Leadership | Registry entry routes to governed dossiers. Source freshness and partial-service states remain mandatory. |
| Planning | Wired | `/planning` | Planner | Bulk, single and immediate methods remain real route destinations. |
| Inspection | Group only | Child destinations below | Role-dependent | Information-architecture group; not a fake route. |
| Inspection Execution | Wired | `/field` | Inspector | Dedicated field channel; the desktop shell does not replace field tabs or offline/sync truth. |
| Visit Management | Wired governed addition | `/visits` | Planner; Operations User | Required catalogue workspace represented explicitly even though the reference grouped it differently. |
| Virtual Inspections | Wired governed addition | `/virtual` | Inspector/internal participant | External factory representatives must never receive internal shell navigation. |
| Review & Approval | Wired | `/reviews` | Level 2 Reviewer | Immutable evidence-led review route. No inspector-content edits. |
| Compliance Library | Wired | `/admin/regulations` | Compliance Admin | Versioned regulations; published versions remain immutable. |
| Approval Queue | Consolidated | `/admin` | Any granted admin-family role | Existing control-plane home owns pending approvals and configuration health. No duplicate route is invented. |
| Enforcement | Renamed and wired | `/admin/violations` | Compliance Admin | “Enforcement Library”; violation/penalty logical modes remain governed and consolidated. |
| Analytics | Hidden / blocked | None | None | No governed route or approved KPI/semantic contract. Do not add a placeholder. |
| Administration | Group only | Role-scoped children | Granted admin-family roles | Group is separated visually and server filtered. It is not itself an authority grant. |
| Users & Roles | Wired | `/admin/access` | Security Admin | Role matrix and segregation controls. UI visibility never replaces RLS. |
| Lookup Management | Hidden / blocked | None | None | No dedicated governed route in the current catalogue/runtime. |
| Risk Configuration | Wired | `/admin/risk` | Risk Owner | MVP1 constrained configuration only; no invented weights, thresholds or scoring. |
| Survey Configuration | Renamed and wired | `/admin/packages` | Form Admin; Compliance Admin | “Packages & Surveys”; reuses the governed Package & Form Designer rather than inventing a survey engine. |
| Notification Configuration | Hidden pending governed surface | None in shell | None | `SCR-ADM-080` remains consolidated/gap. Bell behavior remains available; provider/rule configuration is not falsely claimed. |
| Integration Management | Hidden / blocked | None | None | No dedicated governed route or adapter-management contract. |
| AI Assistant | Removed | None | None | Phase 2 AI notes never authorize an MVP1 assistant, recommendation or fabricated insight. |
| AI recommendations / briefs | Removed | None | None | No generated findings, insights or recommendations without an approved engine and provenance. |

## Mandatory shell behavior

- Arabic is the fresh-session default; `<html lang="ar" dir="rtl">` applies to the entire document.
- Desktop sidebar is physically on the right in RTL and on the left in LTR.
- Navigation groups and items are composed server-side from RLS-scoped `user_roles`.
- Links are real Next.js destinations; no `javascript:` links or fake content switching.
- Unsupported destinations are omitted, not rendered as disabled promises.
- Desktop collapse preserves accessible names and never clips labels into the workspace.
- Mobile uses a modal drawer with backdrop, explicit close, focus entry, focus containment, Escape dismissal and focus restoration.
- Topbar preserves navigation search, theme, notifications, safe own-account identity, language and sign-out. On `/dashboard`, the approved page-owned topbar replaces navigation search with RLS-scoped factory/visit/inspection search plus dashboard date/region filters; shell actions remain unchanged.
- Date, region and business filters remain page-specific. Dashboard filters declare their exact scope and must not imply they affect other routes.
- Dark and light themes use accepted magenta-violet Saqeel tokens and typography; the retired green/reference fonts are prohibited.
- Navigation is usability, not authorization. RLS, canonical guards, state transitions, immutability and audit remain the security boundary.

## Evidence

- TypeScript typecheck: PASS.
- Next.js production build: PASS.
- Targeted shell/dashboard suite: PASS 16/16.
- Complete application regression: PASS 50/50 after dashboard integration.
- Visual evidence: `${INSPECTION_DOCS_ROOT}/07_TEST_EVIDENCE_AND_SCREENSHOTS/product-contract/evidence/screens/shell-v1/`.
- Runtime defect corrected during review: persisted desktop collapse plus Arabic mobile initially left the RTL drawer off-canvas; corrected before documentation closure.

Sponsor runtime review remains required before declaring the shell visually accepted for release.

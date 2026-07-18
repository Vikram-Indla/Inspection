# Saqeel UI Revamp/Uplift — Governed Sponsor and Inspector Record

Task: `TASK-DESIGN-INSPECTOR-SHELL-UPLIFT-002`
Change: `CC-DESIGN-INSPECTOR-SHELL-UPLIFT-002`
Branch: `codex/inspector-shell-uplift-002`
Sponsor decision: approved 2026-07-18
Status: implementation and evidence in progress

This is the single human-readable findings, decision, implementation and release-gate
record for the UI uplift. Machine-readable acceptance and evidence remain in the product
contract. It does not replace the source requirements or design authority.

## Governing decision

1. Shell A — expanded, labelled contextual navigation — is the governed default.
2. Shell B — the compact icon rail — is a reversible user preference, never the forced default.
3. The inspector experience is the priority: assignment, readiness, arrival, execution,
   evidence and submission must be understandable over a four-to-five-hour shift.
4. Inputs, textareas, selects and navigation-search geometry and behavior are unchanged.
5. Cinematic Atlas v0.8 remains isolated to login and cannot influence authenticated UI.
6. Production compliance cannot be claimed until WCAG, DGA/Platforms Code, native
   Arabic/RTL and observed inspector-endurance gates are evidenced.

## Why A is superior to B

| Decision factor | Shell A | Shell B | Disposition |
|---|---|---|---|
| Long-session cognition | Labels remain visible; recognition replaces recall. | Icons and tooltips increase memory demand. | A default |
| WCAG usability | Larger labelled targets and clearer current location. | Can conform technically but is less forgiving. | A default |
| DGA/digital journey | Explicit, consistent and beneficiary-centred navigation. | Appropriate only after orientation. | A default |
| Saudi premium quality | Arabic-first, restrained and institutionally credible. | Efficient but resembles generic global SaaS. | A default |
| RTL | Mirrored structure retains language and context. | Mirrored icons remain more ambiguous without labels. | A default |
| Canvas efficiency | Uses more width but reduces navigation mistakes. | Frees width for expert dashboards. | B optional |

## Inspector scenario and five governed page experiences

| Experience | Screen | Current route | Uplift purpose |
|---|---|---|---|
| Assignments | `SCR-IPAD-600` | `/field` | Put next work, urgency, offline readiness and notifications before analytics. |
| Startup readiness | `SCR-IPAD-610` | `/field/:visitId` | Keep identity, package readiness, device status and mode eligibility visible. |
| Journey and check-in | `SCR-IPAD-620` | `/field/:visitId` | Make location freshness, geofence, exception and recovery explicit. |
| Inspection execution | `SCR-IPAD-630` | `/field/inspection/:id` | Maintain section, progress, sync and next action during interruptions. |
| Evidence/findings | `SCR-IPAD-640/650` | consolidated workspace modes | Preserve custody, rule consequences and recovery without visual overload. |
| Submit/returned correction | `SCR-IPAD-660/670` | consolidated workspace modes | Surface blockers and immutable consequences before submission. |

This slice changes shared inspector navigation priority, the `/field` assignment
composition and its local task bar. It does not redesign the deeper workflow screens;
those remain separate page-specific slices under the same rules.

## Twenty-four ratcheted UI parameters

| # | Parameter | Governed direction |
|---:|---|---|
| 1 | Default shell | Expanded labelled navigation on first use. |
| 2 | Compact mode | User-selected and persisted; full labels restored on mobile drawer. |
| 3 | Role priority | Inspector field work appears before secondary command destinations. |
| 4 | Navigation label | Human task language: “My assignments”, not implementation language. |
| 5 | Navigation overflow | No horizontal navigation scrollbar at any supported width. |
| 6 | Body typography | 16/24 minimum; 17/26 for field-critical content. |
| 7 | Font weight | 400 body, 500 labels/headings, 600 only for short decisive emphasis. |
| 8 | Italics | Prohibited in authenticated operational UI. |
| 9 | Arabic type | IBM Plex Sans Arabic with true Arabic copy and bidi isolation for IDs. |
| 10 | Touch target | 48px preferred for field tasks; never below WCAG minimum. |
| 11 | Field task bar | Restrained rectangular actions; no floating circular or game-like FAB. |
| 12 | Primary action | One visible labelled next action in the local task bar. |
| 13 | Sign-out | Remains in the responsive account control; not repeated as primary field nav. |
| 14 | Assignment priority | My assignments and next visit precede performance analytics. |
| 15 | Notifications | Secondary to active work; icon, count and row meaning remain accessible. |
| 16 | Surfaces | Neutral canvas and dividers; cards only for real containment. |
| 17 | Borders | Restrained semantic separation; no ornamental outlines. |
| 18 | Radius | 4/6/8px hierarchy; pills limited to compact status. |
| 19 | Dark mode | Neutral low-glare surfaces; no cinematic black, glow or saturated wash. |
| 20 | Status | Text and icon accompany color; sync truth remains explicit. |
| 21 | RTL | Logical properties, mirrored structure, correct chevrons and stable numeric data. |
| 22 | Focus | Visible focus and focus-not-obscured with persistent field chrome. |
| 23 | Responsive identity | Name/role compact progressively without clipping or horizontal overflow. |
| 24 | Frozen text entry | Computed input/select/textarea/search contract must remain identical. |

## Production-defense indicators

### Already evidenced

- Government foundation acceptance: 30/30 passed.
- Foundation contract suite: 6/6 passed.
- Shared shell runtime suite: 9/9 passed.
- Light/dark, expanded/collapsed and Arabic mobile shell evidence captured.
- Transparent prism, bounded notification control and responsive account behavior passed.

These prove the implemented foundation and shell contract. They do not certify every
application page or the production environment.

### Mandatory release gates

1. **WCAG:** full-page WCAG 2.2 AA verification, plus a documented Saudi-government
   WCAG 2.0 AAA gap assessment; keyboard, assistive technology, 200% zoom, 320px reflow,
   focus, status and target-size evidence.
2. **DGA/Platforms Code:** component and journey mapping to the national reference and
   Digital Experience Maturity criteria; formal organizational review where required.
3. **Arabic/RTL:** native linguistic review, mixed-direction identifiers, reading order,
   screen reader, responsive and theme parity across every critical journey.
4. **Inspector endurance:** observed morning and night sessions measuring task completion,
   error, recovery, fatigue, navigation recall and interruption resumption.

Until all four are closed, sponsor language is “foundation and shell internally verified;
production compliance certification pending.”

## Implementation sequence

1. Prioritize the inspector’s field-work navigation without removing accepted destinations.
2. Replace the legacy raised field FAB with a labelled, restrained task bar.
3. Put assignments and notifications before secondary analytics on `/field`.
4. Preserve routes, RLS, offline, workflow, evidence and immutable submission behavior.
5. Add exact source tests for default/optional shell state, RTL, target sizes, absence of
   legacy FAB styling, frozen text-entry contract and Atlas isolation.
6. Capture paired light/dark and English/Arabic frames at field desktop/iPad/narrow sizes.
7. Record evidence honestly and keep external release gates open.

## Do-not-touch boundaries

- No schema, migration, RLS, workflow, audit, provider or production-data change.
- No route invention and no removal of accepted route access.
- No input, textarea, select or search geometry/behavior change.
- No Cinematic Atlas or login-token change.
- No remote DDL, deployment, push, merge or modification of main.
- No production compliance claim without executed evidence.

## Current implementation findings

- The shared shell already defaults to expanded and persists compact mode only after a user
  chooses it. This is preserved and tested.
- Inspector navigation currently presents Command before Inspection; the uplift must put
  field work first while retaining the accepted Command destinations below it.
- The inspector route label “Inspection Execution” is system language; “My assignments” is
  the correct task label for the inspector-only destination.
- `/field` currently shows KPI charts before the work queue and repeats navigation in a
  fixed bottom bar with a raised circular arrow. This increases visual competition and has
  the game-like quality rejected by the sponsor.
- The revised field task bar must retain the existing destinations and “Start next visit”
  behavior while removing the floating treatment and redundant sign-out destination.

## Completion rule

The implementation slice can close only after focused and protected regression tests pass,
paired visual evidence is reviewed, no frozen text-entry or Atlas change exists, and the four
production compliance gates remain explicitly open unless separately evidenced.

## Platform-wide promotion decision — 2026-07-18

The sponsor expanded the approved implementation from inspector-only to the complete
Inspection platform and authorized main integration and push. The resulting source audit
covers every page entry and all current roles:

- The root layout applies the bilingual type, semantic tokens, theme and document direction
  to all routes.
- Every working authenticated page uses the shared shell. Seven non-shell source files are
  named exceptions only: redirects, access/reset, print and a delegated route.
- Admin, planning, operations, dashboard/leadership, reviewer, factory, portal, virtual and
  field experiences therefore inherit the same foundation.
- A permanent 25-check platform contract prevents future MVP modules from adding a new font,
  raw authenticated palette, cinematic styling or an ungoverned working shell.
- Field/admin GIS and Operations maps now share one semantic renderer palette; the remaining
  purple operations-map treatment has been removed.

Sponsor-facing conclusion: the design system is platform-wide by inheritance, while page-level
journey criticism can continue as separate controlled improvements. Source integration is
ready; production compliance remains conditional on the four mandatory release gates above.

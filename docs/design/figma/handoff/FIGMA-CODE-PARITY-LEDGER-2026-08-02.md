# Inspection Figma ↔ Implementation Final Parity — ledger

Read-only inventory pass, 2026-08-02, then bounded repair pass same day. Cross-checks
git log (60 commits) + docs against current repo state — `status/saqeel-status.json` is
stale (SB-r28, 2026-07-26) and must not be trusted directly; several of its `pending[]`
entries were closed by same-day commits below.

Task authority: `TASK-FIGMA-APPLICATION-PARITY-20260802`, gate override by Product Owner
(Vikram) to unblock `broad_implementation_allowed` for this task only.

**Terminology note on "node ID":** the live design authority named by
`status/saqeel-status.json`'s `designPage` field is the Claude Design `.dc.html` mockups
in project `SAQEEL Design System` (`5e8154ad-aa9e-4e3d-9b7a-c66ca020bd61`), not literal
Figma frames. There is no numeric Figma node for these — "node ID" below means
`<file path> § <state key>` (e.g. `web/SAQEEL Factories.dc.html § sEmpty`).

## Repair pass — 2026-08-02, in progress (this is INTERIM, not a completion claim)

**`web/SAQEEL Factories.dc.html` (SCR-WEB-400) — DONE.** Etag `1785696842892681`.
- Fixed stray `Factory identity records sync from the national source ().` → removed
  the empty parenthetical. Verified against shipped copy: `apps/web/src/app/(app)/factories/page.tsx:86`
  has no parenthetical or source-id at all. **Correction to the board's own pending note**:
  it claimed the missing value was "(M07-002)" — that string is actually the Factory 360
  *dossier* identity heading (`apps/web/src/app/(app)/factories/[id]/page.tsx:204`), a
  different screen. Did not propagate that error into the fix.
- Added the 4 missing hard states (loading / error / empty / unauthorized) behind a new
  "State" segmented control, reusing the `.ax-state` / `.skel` / critical-banner patterns
  already established in `web/SAQEEL States System.dc.html` — no new CSS. Copy is verbatim
  from `page.tsx`, `loading.tsx`, `Factory360ErrorState.tsx`.
- **NOT done**: nav-rail AR/RTL. A governed AR nav table exists
  (`apps/web/src/lib/shell-navigation.ts:130`) but its item set doesn't 1:1 match this
  dc.html's richer legacy nav (extra items like "Inspection Rules", "Reference Lists" that
  don't exist in the current shell). Translating the nav wholesale here would either invent
  AR copy for ungoverned items or ship a half-translated nav. This is the pre-existing
  structural item `GAP-ANALYSIS.md` already named ("AR regeneration ... one pass, after
  structural work settles") — blocked on that, not skipped.

**`web/SAQEEL Factory 360.dc.html` (dossier, `[id]` route) — DONE.** Etag `1785697400389847`.
- Not-found state added (whole-dossier `sc-if`, `.ax-state` pattern): "Factory not found" /
  "Factory registration not found or not available to you.", verbatim
  `apps/web/src/app/(app)/factories/[id]/page.tsx:96-100`.
- Per-section degraded state added to the 4 sections backed by independently-failable
  source queries (health/risk, inspection history, case timeline, documents): "This source
  section is degraded; other sections remain available." / AR "هذا القسم من المصدر متدهور؛
  تظل الأقسام الأخرى متاحة.", verbatim `f360.section.degraded` from
  `apps/web/src/app/(app)/factories/cr/[id]/page.tsx`.
- Tag-balance verified (div 80/80, sc-if 10/10, section/svg/table/aside counts unchanged
  from before-edit). Nav sidebar byte-identical: 32/32 nav items, 73/73 SVG icon paths.

**`web/SAQEEL Planning Supervision.dc.html` (task item 2, Supervisor persona) — DONE.**
New file, etag `1785697631636165`. Planner and Supervisor share almost every screen
(role-gated buttons/KPIs only); the one screen with zero prior design coverage anywhere
is `/planning/supervision` (`apps/web/src/app/(app)/planning/supervision/page.tsx` +
`SupervisionQueue.tsx`). Built EN·Light + EN·Dark (single frame, runtime theme toggle,
matching the `SAQEEL Factories.dc.html` convention) with a Content/Empty/Denied/Unavailable
state toggle, verbatim copy: title "Supervision queue"; denied ⛔ "Supervisor access
required" / "Only Supervisors can approve, return, or reject submitted visits."; unavailable
⚠ "Supervision data not available" / "We couldn't load the queue. Nothing was changed.";
empty "No visit is awaiting supervision."; card fields Factory/Visit type/Window/Submitted,
"Final Inspector", "— select Inspector", "Decision note (optional/required)", buttons
"Approve & release"/"Return to Planner"/"Reject". **AR blocked**: this route has zero
registered translations anywhere in the codebase (verified by grep) — it is English-only
in the live app itself, so no AR·RTL variant was built; this is a real app gap, not a
design-authority gap, and no Arabic copy was invented to paper over it. One new page-local
CSS block (`.sv-facts`) was added and independently verified to be a byte-identical rename
of the existing `.rv-facts` pattern already in `web/SAQEEL Review and Approval.dc.html` —
not a new visual language.

**27 Inspector AR/RTL/Dark states (task item 3) — SCOPE CORRECTED, partially done.**
The originally-cited "27 states" (Figma file `ML2PNwfShlQM2k44MvSEw5`, section `311:...`,
`SCR-IPAD-*` naming) were reclassified **"Source/Reference — non-delivery"** by a
Coordinator ruling on 2026-08-01. Building AR/RTL/Dark there would target a non-canonical
set. The real canonical delivery target is section `148:6893` (`SCR-FLD-*` naming) in the
same Figma file, where only 2 of 8 planned screens are built at all (EN·Light only):
**SCR-FLD-600** (`345:42242`, route `/field/my-tasks`) and **SCR-FLD-630** (`345:42290`,
route `/field/inspection/[id]`).
- **Dark — DONE** for both: new nodes `683:52` (SCR-FLD-600 Dark) and `683:106825`
  (SCR-FLD-630 Dark), built via `clone()` + Color-collection variable-mode override
  (`VariableCollectionId:3:2`, mode `3:1`), the same mechanism every other Light/Dark pair
  in this file already uses — not manual recoloring. Screenshot-verified, no clipped text,
  correct contrast. A pre-write safety check confirmed no active/non-closed claim by
  another agent on this section (the one real collision on record concerns the *other*,
  reclassified `SCR-IPAD-*` section, not this one).
- **AR·RTL — DONE** for both: node `672:92338` (SCR-FLD-600 AR, completed an existing
  incomplete RTL-mirrored stub rather than duplicating it) and `674:2` (SCR-FLD-630 AR),
  in section `148:6895`. RTL mechanism copied and verified against the established Dashboard
  AR pair (`95:12029` vs EN·Light `21:2`): outer frame stays `layoutMode: HORIZONTAL` with
  children *reordered* (no coordinate flipping), every text node font-swapped to Noto Sans
  Arabic with `textAlignHorizontal: RIGHT`. Real strings cited to source: "مهامي"
  (`field.myTasks.title`, `my-tasks/page.tsx:350`), "غير مُهيّأ" (`common.notConfigured`,
  reused verbatim from 3 admin routes), "متزامنة" (`field.ws.evReview.statusSynced`,
  `inspection/[id]/page.tsx:641`), "تنفيذ التفتيش" (reused from `execution/RevampExecutionWorkspace.tsx:205`,
  the real field route has no static title string of its own). **Genuine untranslated-string
  gaps left in English, confirmed by grep, not invented**: "Pending" status badge
  (`StatusBadge.tsx:21`), "Penalty proposed" (`InspectionCard.tsx:26`), "Add note"/"Evidence"
  (`ChecklistQuestion.tsx:74,79`), "2 evidence items" (`FindingCard.tsx:53`), plus several
  DB-sourced dynamic strings (`inspection_items.title`, `enum.*`) unresolvable from static
  source. One real bug caught and fixed mid-build: SCR-FLD-630's title node had a stale
  1216px width inside a 1032px frame — right-aligning pushed it off-canvas; resized to 968px
  before re-applying alignment. Structural diff confirms both AR frames match their EN
  source exactly (63 descendant nodes each, 27 FRAME/13 TEXT/19 INSTANCE/4 VECTOR), no
  orphaned nodes, no off-canvas text, screenshots confirm correct Arabic rendering (no tofu).
**SCR-FLD-610/620/640/650/660/670 Dark + AR·RTL — DONE, all 6 screens, 12 builds.** Built
sequentially (collision-risk discipline maintained). Dark nodes: 610=`709:378`,
620=`710:39`, 640=`712:2`, 650=`714:2`, 660=`716:39`, 670=`718:39`. AR·RTL nodes:
610=`719:31`, 620=`724:81`, 640=`730:81`, 650=`735:81`, 660=`738:110`, 670=`741:81`. Real
Arabic strings sourced and cited per screen from the actual route files (not translated
in bulk from a template) — e.g. `field.travel.*` had full inline `tr(key,en,ar)` copy
available; `field.start.*` mostly resolves from a live `ui_strings` Supabase table not
queryable offline, reported as a genuine app gap rather than invented. Untranslated
strings named per screen in each build's own report, not fabricated anywhere.

4 real bugs caught and fixed mid-build across these 12: SAQEEL wordmark clipped on 610's
AR frame (root-caused to a mis-sized `sq-shell__brand-name` on 620's build, fixed
proactively from then on); an auto-layout FILL/HUG feedback loop on 640's AR frame that
collapsed a text column to 1-character-per-line (fixed by pinning width to FIXED).

**Dark-mode defect repair — DONE.** 3 defects surfaced during the Dark builds (readyRow
checkboxes on 610, 9 unbound white fills on 660, 5 on 670) were root-caused and fixed at
source: all were per-frame redundant unbound literal-white fills sitting on top of an
already-correctly-bound ancestor panel (`surface-primary`), not a shared master-component
bug — confirmed by checking the `Checkbox` master component's own fill, which was already
correctly variable-bound. Fixed by binding the affected frames to the existing
`surface-canvas`/`surface-sunken` variables (or clearing the redundant fill so the bound
ancestor shows through) — **no new tokens invented**. Applied to Light source, Dark clone,
AND AR·RTL clone for all 3 screens (66 node mutations total), since Figma's `clone()`
produces independent nodes that don't inherit a source-frame fix automatically. One fix
(670's `draft-icon`) turned out to correct a subtle pre-existing Light-mode defect too
(pure white `#fff` instead of the file's real `surface-sunken` ~`#E9EEF2`) — not purely a
Dark-mode issue as first assumed.

**Flagged, not fixed — same pattern found on 5 other screens** (`SCR-FLD-600/620/630/640/650`):
21 more unbound top-level literal-white frames, identical root cause, would take the same
`surface-canvas` binding. Out of scope for this repair pass (only the 3 screens with
reported defects were touched); recorded here as an exact, named follow-up rather than
silently left for someone to re-discover.

**Remaining for full closure of the Inspector stream**: AR·RTL·Dark (the fourth combo) for
all 8 SCR-FLD screens — not attempted, large scope.

**SCR-FLD-610/620/640/650/660/670 — DONE, EN·Light, all 6 remaining canonical screens.**
Section `148:6893` now holds all 8 planned `SCR-FLD-6xx` contracts. Built sequentially
(one agent at a time, not parallel) given the documented concurrent-edit collision risk
in this file (`CONCURRENT-EDIT-COLLISION-2026-08-01.md`) — that doc's collision concerned
a different, unrelated section (`305:40149`), confirmed by each agent before writing.
- **610 — Startup Pack** (`692:2`), route `/field/[visitId]`, from `Startup.tsx`.
- **620 — Journey & Check-In** (`696:229`), route `/field/[visitId]/travel`, from
  `TravelClient.tsx`. Correctly built display-only — no check-in button added, since the
  source code explicitly never records arrival on this screen (that's `Startup.tsx`'s job).
- **640 — Evidence Capture** (`697:94502`) — has **no dedicated route**; correctly built
  and labeled as a sub-panel of `/field/inspection/[id]` (via `Workspace.tsx`'s
  `OcrEvidenceCapture` + `EvidenceReview.tsx`), not given an invented standalone URL.
- **650 — Findings** (`699:2`), route `/field/inspection/[id]/results` — route exists in
  the app but is **unreachable** (no nav entry point, the same PO-blocked item from the
  original audit). Frame name explicitly flags this ("route exists, unreachable — no entry
  point"); governed-empty lookup selects (competent department, document type) correctly
  render "Not configured" rather than invented options.
- **660 — Pre-Submit & Submission** (`702:107785`), route `/field/inspection/[id]/statement`
  — verified this is actually a **post-submission report view** ("Visit Statement report"),
  not an active pre-submit confirmation step (the route redirects away unless
  `status === "submitted"`). Built accurately as the report it is; kept the governed
  contract name but did not invent a pre-submit review UI that doesn't exist.
- **670 — Returned Correction** (`704:95056`), route `/field/drafts`, from
  `FieldDraftList.tsx` — confirmed there is **no distinct correction workflow**; "returned"
  is just one sync-status badge state among general drafts. Built the real drafts list,
  did not invent a specialized correction UI.

Each build reused existing Figma library components (`Badge`, `Panel`, `ConnectivityBanner`,
`Button`, `AnswerBar`, `EvidenceAttachment`/`EvidenceGallery`/`ValidationGate`/`SyncQueueSummary`)
before drawing anything fresh, and every fresh element uses the same bound design-system
variables as existing cards — no new colors/tokens introduced. Two real bugs were caught
and fixed mid-build (off-canvas RTL title on 630's AR variant, clipped badge text on 660)
rather than shipped broken. Content is representative/illustrative (matches the SCR-FLD-600/630
precedent of using real component instances with plausible fixture data), not yet asserted
as pixel parity with the shipped app.

**Remaining for full closure of this stream**: Dark + AR·RTL for the 6 newly-built screens,
and the AR·RTL·Dark combination for all 8 SCR-FLD screens. Not attempted this pass — large
scope, will not be started blind without the same sequential, source-verified discipline
used above.

**Re-audit across widths/languages/themes (task item 4) — IN PROGRESS.** Live-rendered
`web/SAQEEL Factories.dc.html` via `render_preview` + Chrome at 1280px: all 4 new states
(Loading/Error/Empty/Unauthorized) confirmed rendering correctly with exact shipped copy.
Attempted 1024px/720px and Light-theme captures did not actually vary in this pass (viewport
and theme stayed constant across `resize_window` calls — a tooling gap in this session, not
verified evidence of a real responsive/theme defect) — flagged honestly rather than reported
as passed. Re-audit of Factory 360.dc.html, Planning Supervision.dc.html, and the two SCR-FLD
Figma screens not yet performed.

This ledger is explicitly **interim** per the task instruction: parity is not being
reported complete. See sections below for the full open-item inventory, in the stated
dependency order (Factories → Factory 360 → Planner/Supervisor → Inspector AR states →
re-audit).

## 0. Upstream dependency check

**Codex "Inspector Establishment Routes Closure"** — CLOSED, verified.
`docs/design/figma/traceability/INSPECTOR-DELINK-FINAL-2026-08-02.json`:
`delink_verdict: "DELINK PASS"`, `missing_items: []`, `equivalence_failures: []`,
`/ipad` literal route count zero. Superseded an earlier FAIL pass. Nothing to
re-verify beyond an optional live spot-check; not duplicated by this ledger.

## 1. Admin

| Item | Status | Evidence |
|---|---|---|
| Risk/delegation wiring | DONE | `83871ecb`; `apps/web/src/app/(app)/admin/{risk,delegation}` exist and have live components |
| Figma has no real admin UI (6 `/admin/*` frames render RBAC-refusal only) | OPEN — structural | `GAP-ANALYSIS.md`. Admin canon is `designs/admin/*.dc.html` per project memory, not Figma. **Successor: Figma admin generation is out of scope for a code-parity pass — needs its own task against `designs/admin/` as source, not Figma.** |
| `admin-data` Senaei write-back missing (FND-007) | OPEN | board (unverified vs today's commits) — backend wiring, not a code-parity/markup item |
| `admin-geo` dual-pin view not built | OPEN | board — needs design confirmation of dual-pin interaction, no such pattern in current markup |
| `admin-platform` audit retention ungoverned | OPEN | governed-value gap — **no invented retention period**, renders "Not configured" per rule 10 until PO sets it |
| `admin-kpi` / `admin-builders` / `admin-exec` | UNVERIFIED | never pixel-diffed against `.dc.html` — **successor: dedicated pixel-diff pass, admin canon only** |

## 2. Planner / Supervisor (Planning, Visits, Reviews, Cases, Compliance)

| Item | Status | Evidence |
|---|---|---|
| Planning coverage map | DONE | `52291719 feat(planning): integrate compliant coverage map` |
| Planner tasks / supervision gaps | DONE | `feae1b41 feat(planning): close planner task and supervision gaps` |
| `visits` M2-VS-002 hash-mismatch | OPEN | board — needs verification against today's commits, not touched by this pass |
| `reviews` decision-panel not pixel-diffed | OPEN | never diffed — successor pass needed |
| `factories` — Figma frame is **behind** the shipped route (route implements 6 hard states the `.dc.html` doesn't draw) | OPEN — **repair Figma, not code**, per task rule 3 | `GAP-ANALYSIS.md`. Needs Figma edit with before/after node evidence — separate task, Figma MCP available |
| `m6-*` (compliance requests/library/enforcement/committee) — RPC binding placeholders, SLA values ungoverned, signature-transport unconfirmed live | OPEN | governed-value + backend-wiring gaps, not markup gaps |
| Planner/Supervisor personas | OPEN — **not modeled in Figma at all** | Only Inspector and Admin exist as persona views. Real structural gap; needs Figma persona-view generation before any parity check is possible |

## 3. Inspector (field channel)

| Item | Status | Evidence |
|---|---|---|
| 8 governed contracts (SCR-IPAD-600…670), EN Light/Dark + AR·RTL, 1024px | DONE | `INSPECTOR-FRAME-REGISTER-2026-08-01.md` |
| Video journey wiring | DONE | `dc21ddae feat(virtual): connect inspector video journey` |
| `/field/completed` PostgREST embed shape | DONE | `129558b1` |
| `/field/inspection/[id]/results` (Findings & Actions) | OPEN — unreachable, no entry point in app | `INSPECTOR-JOURNEY-CONTRACT-COMPLETE.md`. Route exists, screen governed, nothing links to it. **Product decision needed: where does the entry point live** — not specified in Figma either. Successor: PO decision, then wire nav. |
| `/field/settings/readiness` | OPEN — same unreachable-route issue | same doc |
| `SCR-IPAD-640` Evidence Capture has no dedicated route (lives inside `/field/inspection/[id]`) | OPEN — decision pending: split or keep nested | same doc |
| AR·RTL·Dark inspector section + AR inspector states (27 states) | OPEN — not built in Figma | `INSPECTOR-FRAME-REGISTER-2026-08-01.md`. Design-file gap, blocks visual parity check for that combination |
| `/ipad/*` → `/field/*` route-catalogue rename (SCR-IPAD-\* → SCR-INS-\*) | OPEN — governance decision only, doesn't block build | frame register Option A/B |
| Factory 360 identity-card text truncation | OPEN — **Figma-file authoring issue, not app code** | `KNOWN-DEFECTS.md` #1 — card authored narrower than content; designer must choose widen-card vs shorten-copy. Verified: not reproducible as a code defect since class isn't in `saqeel-components.css` in this exact form — re-check live if it resurfaces post-Figma-fix |
| AR filter-field overrun on `/visits` | FALSE ALARM for app code | `KNOWN-DEFECTS.md` #2 references `panel-visit-filters`, a Figma-only node name — grepped `apps/web/src/app/saqeel-components.css`, class does not exist. Design-file cosmetic issue only |

## 4. Dashboard / Analytics / Exec

| Item | Status | Evidence |
|---|---|---|
| `--text-disabled` contrast WCAG AA | DONE | `0216019d fix(tokens): raise --text-disabled contrast to WCAG AA (INSP-702)`, matches `QA-2026-07-31.md` open item #1 |
| Strategic/Operational split vs `KpiGrid`/`MetricStrip` | OPEN — never diffed | board |
| Blocked KPIs fail-closed pending sponsor targets | INTENTIONAL, not a defect | correct behavior per rule 10 |
| Executive Overview (`exec`) — 9 pending items: no dedicated route, choropleth vs point-map policy-blocked, proactive-signals panel unbuilt (no governed source), regional-rail sort-order mismatch | OPEN | board — several are policy/business-rule blocked, not code gaps |

## 5. Login / Atlas / Shared components / Terminology

| Item | Status | Evidence |
|---|---|---|
| Atlas + benchmark selector stability | DONE | `57a1db51 fix(login): stabilize atlas and benchmark selectors` |
| Terminology programme ("workspace"/RLS-jargon leaks, persona casing, dark-theme node IDs, heading duplicates) | DONE | `747f5f5a`, `4bf3cbe5`, `f87abff5`, `9352107b`, `4d1086ef`, merged PR #158 (`dbf54ce7`) |
| Design-system component coverage | 54/55 React components exist as Figma components | `DEV-READINESS-2026-07-31.md` |
| AR has no true RTL in Figma Plugin API (worked around via atom-level instancing) | DOCUMENTED LIMITATION, not a code defect | same doc |
| Only 1280px modeled in Figma vs 3-5 real CSS breakpoints | DOCUMENTATION gap in Figma, not code | same doc |
| Focus-visible coverage | **FALSE ALARM** — DEV-READINESS claimed only 1 rule exists; verified 35 `:focus-visible` rules across `saqeel-components.css` + `saqeel-runtime.css` covering inputs, buttons, links, nav, tabs, pagination, accordion, switches, checkboxes | grep, this pass |
| 9 Figma frames with no catalogue row (`/admin/integrations`, `/admin/localization`, `/analytics`, `/compliance`, `/compliance/approvals`, `/dashboard`, `/enforcement-library`, `/execution`, `/factory-360`) | OPEN — doc reconciliation only | `COVERAGE-MATRIX.md`. Adding catalogue rows needs PO-supplied `mandatory_regions`/`permission_rule`/`states` — not inferred |

## Screen-catalogue coverage

30 in-scope screens (of 38 total catalogue rows), all 30 have Figma UI. 0 missing.
9 extra Figma frames need catalogue reconciliation (see §5).

## Summary — what's genuinely still buildable vs blocked

**Buildable now, no invented values needed:**
- Inspector unreachable-route entry points (2 routes) — blocked on one PO decision: where does the nav link live.
- `SCR-IPAD-640` route split decision — blocked on one PO decision.

**Needs Figma repair first (task rule 3), not app code:**
- `factories` Figma frame behind shipped code (6 states missing from `.dc.html`).
- AR·RTL·Dark inspector frames + 27 AR inspector states, not built.
- Factory 360 identity-card width vs content (designer call: widen or shorten).

**Structural, needs its own task, not a diff-and-patch pass:**
- Admin has no real Figma UI at all — canon is `designs/admin/*.dc.html`; a Figma-vs-code parity pass for Admin should target that source, not Figma.
- Planner/Supervisor personas don't exist in Figma at all.

**Governed-value / backend-wiring gaps, out of markup scope:**
- `admin-data` Senaei write-back, `admin-geo` dual-pin, `admin-platform` audit retention, `m6-*` RPC bindings + SLA values, exec proactive-signals source.

**Doc-only reconciliation, no risk:**
- 9 unclaimed Figma frames → catalogue rows (needs PO field values).
- `/ipad/*` → `/field/*` rename in catalogue (cosmetic).

No code changes were made in this pass — pure inventory + 2 false-alarm corrections
(focus-visible coverage, AR filter-overrun). Every remaining item above has an exact
named successor action; none require inventing a governed value.

---

## FINAL CLOSURE — 2026-08-03

Everything above this line is the original interim audit. This section records what
closed since, in the same repair pass, same task authority
(`TASK-FIGMA-APPLICATION-PARITY-20260802`).

### SCR-FLD-6xx canonical batch — 32/32 cells, fully closed

All 8 screens (600 Assigned Visits, 610 Startup Pack, 620 Journey & Check-In, 630
Inspection Workspace, 640 Evidence Capture, 650 Findings, 660 Pre-Submit &
Submission, 670 Returned Correction) now have all 4 combos — EN·Light, EN·Dark,
AR·RTL, AR·RTL·Dark — in Figma file `ML2PNwfShlQM2k44MvSEw5`, sections `148:6893`
(Light), `148:6894` (Dark), `148:6895` (AR·RTL), `148:6896` (AR·RTL·Dark).

| Screen | Light | Dark | AR·RTL | AR·RTL·Dark |
|---|---|---|---|---|
| 600 | `345:42242` | `683:52` | `672:92338` | `754:97117` |
| 610 | `692:2` | `709:378` | `719:31` | `755:240` |
| 620 | `696:229` | `710:39` | `724:81` | `757:220` |
| 630 | `345:42290` | `683:106825` | `674:2` | `759:324` |
| 640 | `697:94502` | `712:2` | `730:81` | `765:336` |
| 650 | `699:2` | `714:2` | `735:81` | `766:97872` |
| 660 | `702:107785` | `716:39` | `738:110` | `767:338` |
| 670 | `704:95056` | `718:39` | `741:81` | `768:345` |

8/8 confirmed by direct enumeration of section `148:6896`'s children (not asserted) —
one build agent correctly refused to state the "8/8" completion claim until it had
independently checked, caught its own missing tool input (file key) rather than
guessing, and was corrected and resumed. Recorded as a positive process signal, not
a defect.

**Unbound-fill defect, closed everywhere it was found.** A recurring pattern —
literal unbound white (`{r:1,g:1,b:1}`) SOLID fills on wrapper frames, redundant
against an already-correctly-bound ancestor panel — was found and fixed across all
8 screens' Light/Dark/AR variants as the builds progressed. Root cause was per-frame
(confirmed NOT a shared master-component bug — the `Checkbox` master and other
shared components were checked and are correctly variable-bound). Fixed by binding
each defective frame to the existing `surface-canvas` (`VariableID:3:3`) or
`surface-sunken` variable, or clearing the redundant fill so the bound ancestor
shows through — never a new token, never a literal-color substitute. Applied to
every Light/Dark/AR/AR·Dark node that carried it; several later builds found
additional instances that earlier passes had missed on the *same* screens (610,
620) — each caught by an independent full-subtree scan rather than trusting the
prior "clean" claim, and fixed on the spot.

### WCAG 2.2 AA & Keyboard Closure — done for the reachable scope

Scope: only the `inspector` persona has a configured non-production test identity
in this environment. Planner/reviewer/admin/ops cells are **explicitly blocked** in
`apps/web/e2e/wcag-inspector-field-audit.spec.ts` — skipped, not run, not faked.

- **axe-core WCAG 2.2 AA: 24/24 cells clean** — `/dashboard` and `/field/my-tasks`,
  at 1280/1024/720 × EN/AR × Light/Dark.
- Keyboard focus-visibility, landmarks/heading-order, table horizontal-scroll
  containment (`.table-wrap`, `saqeel-components.css:221`), and reduced-motion —
  all verified live at representative viewport, all clean.
- Error/validation states verified **statically**, not live-triggered: neither
  route exposes a live-triggerable error/validation UI reachable from this persona
  without mutating backend data. Not fabricated.

**4 real WCAG defects found and fixed at source** (not patched around):
1. `DelegationForms.tsx` — `<label>` missing `htmlFor`/`id` association (1.3.1/4.1.2)
2. 36 missing `<th scope="col">` across 6 files, including the **shared `DataGrid.tsx`
   component** — one fix propagates to every table that uses it
3. `RevampStrategicView.tsx` — invalid `aria-pressed` on an `<a>` link (links don't
   support the pressed state) — replaced with `aria-current`
4. `DashboardView.tsx` — redundant/invalid `aria-pressed` on a `role="tab"` button
   that already carries `aria-selected` — removed

`personas.ts` inspector `home` corrected from `/field` to `/dashboard` per Product
Owner governed ruling (every role lands on Dashboard after login; `/field` is
reached via navigation) — only the inspector entry was changed; planner/
reviewer/admin/ops entries were left as-is since there's no evidence for them.

Re-verified after every fix: `npm run typecheck` (0 errors), `npm run build`
(clean, only a pre-existing unrelated Edge Runtime warning), diff hygiene (10
files changed, 28 insertions / 27 deletions, attribute-only — no styling, no new
tokens, no invented copy).

### Prompt-injection attempts flagged during this pass

Two build agents independently reported that tool output (once from the
`figma-use` skill load, once from unspecified session content) contained embedded
text instructing them to conceal a date-change system notice from the user. Both
refused and surfaced it instead of complying. Neither had any bearing on the actual
Figma/code work performed — recorded here for visibility per instruction-source
discipline, not because anything was compromised.

### What's still open

- Nav-rail AR/RTL on `SAQEEL Factories.dc.html`/`SAQEEL Factory 360.dc.html` —
  structural, blocked on the governed shell-nav table not matching this file's
  legacy nav item set (pre-existing gap, not touched this pass).
- Admin has no real Figma UI — canon is `designs/admin/*.dc.html`, needs its own
  task against that source.
- Planner/Supervisor personas beyond `/planning/supervision` (already built) —
  they share the rest of the app's screens via role-gated buttons, not dedicated
  design frames; no further gap identified.
- WCAG live-browser checks for planner/reviewer/admin/ops routes — blocked on
  credentials, not attempted.
- Governed-value/backend-wiring gaps from the original audit (admin-data Senaei
  write-back, admin-geo dual-pin, m6-* RPC bindings) — unchanged, out of this
  pass's scope.

Every item above has an exact named successor; nothing was invented to close a gap
that isn't actually closed.

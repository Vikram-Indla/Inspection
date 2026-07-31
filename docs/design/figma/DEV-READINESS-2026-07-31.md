# Can a developer build from this Figma? — honest per-screen assessment

Measured, not estimated. Every number here comes from a node-level audit of the live file.

## The stack a developer is building into

**Next.js 15.1 App Router + React 19.** Server Components by default; `"use client"` is opt-in.
The repo already ships a **React design system**: `apps/web/src/components/saqeel/` — **55
components**, 28 client / 27 server, grouped `actions · data · feedback · grid · inputs ·
inspection · map · navigation · signature`.

This matters more than anything else in this document: **a developer does not need Figma to tell
them what a Button looks like. They need Figma to tell them what a screen is made of, and which
of those 55 components to import.** Today it does neither reliably.

---

## Verdict per screen

`%` = component instances as a share of authorable structure. Higher is better, but read the
caveat under the admin rows.

| Screen | Instances | Raw containers | % | Build-ready? |
|---|---|---|---|---|
| Review & Approval | 60 | 83 | **42%** | ❌ No — majority hand-drawn |
| Approval Queue | 44 | 41 | **52%** | ❌ No |
| Factory 360 | 64 | 52 | **55%** | ❌ No |
| Analytics | 146 | 91 | **62%** | ⚠️ Partial |
| Compliance Library | 106 | 54 | **66%** | ⚠️ Partial |
| Operations Center | 55 | 25 | **69%** | ⚠️ Partial |
| Execution | 93 | 34 | **73%** | ⚠️ Partial |
| Planning | 176 | 41 | **81%** | ⚠️ Partial |
| Dashboard | 60 | 8 | **88%** | ✅ after the Panel retrofit |
| Enforcement Library | 101 | 11 | **90%** | ✅ |
| Users & Roles | 41 | 5 | 89% | ⛔ *see caveat* |
| Lookup Management | 41 | 5 | 89% | ⛔ *see caveat* |
| Risk Configuration | 41 | 5 | 89% | ⛔ *see caveat* |
| Survey Configuration | 41 | 5 | 89% | ⛔ *see caveat* |
| Notification Configuration | 41 | 5 | 89% | ⛔ *see caveat* |
| Integration Management | 41 | 5 | 89% | ⛔ *see caveat* |

**Caveat on the six admin rows.** Their 89% is an artefact, not a quality signal. Those frames
render the RBAC refusal state — the 41 instances are almost entirely sidebar + topbar chrome and
the 5 containers hold one message block. **They contain no admin UI at all.** A high percentage of
nearly nothing.

Same trap applies to any single headline number: an earlier report in this project claimed "69%
instances" file-wide, which was true but counted badges, icons and table cells. Weighted that way
the file looks healthy while the structural layer sits near zero. **Do not trust a single ratio.**

---

## The gap that actually blocks development

Mapping the 84 Figma components against the 55 React design-system components:

- **52 Figma components map to a React component.**
- **32 Figma components have no React counterpart** — mostly the `ad-*` admin shell (legitimate;
  no React admin shell exists yet), plus `Panel`, `Factory-card`, `section-title`, the seven
  `saqeel-state--*` variants, `kbd`, `divider`.
- **23 React components are absent from Figma** — and this is the serious one:

| Missing from Figma | Kind | Path |
|---|---|---|
| `inspection/InspectionCard` | client | `components/saqeel/inspection/InspectionCard.tsx` |
| `inspection/FindingCard` | server | `components/saqeel/inspection/FindingCard.tsx` |
| `inspection/EvidenceCard` | client | `components/saqeel/inspection/EvidenceCard.tsx` |
| `inspection/ReviewPanel` | client | `components/saqeel/inspection/ReviewPanel.tsx` |
| `inspection/ChecklistQuestion` | client | `components/saqeel/inspection/ChecklistQuestion.tsx` |
| `inspection/AuditTrail` | server | `components/saqeel/inspection/AuditTrail.tsx` |
| `inspection/SeverityIndicator` | server | `components/saqeel/inspection/SeverityIndicator.tsx` |
| `inspection/DueDate` | server | `components/saqeel/inspection/DueDate.tsx` |
| `signature/EvidenceStack` | client | `components/saqeel/signature/EvidenceStack.tsx` |
| `signature/ExceptionRail` | server | `components/saqeel/signature/ExceptionRail.tsx` |
| `signature/GeoWorkspace` | client | `components/saqeel/signature/GeoWorkspace.tsx` |
| `inputs/Field` | server | `components/saqeel/inputs/Field.tsx` |
| `inputs/Combobox` | client | `components/saqeel/inputs/Combobox.tsx` |
| `inputs/DateRangePicker` | client | `components/saqeel/inputs/DateRangePicker.tsx` |
| `inputs/FileUpload` | client | `components/saqeel/inputs/FileUpload.tsx` |
| `inputs/StatusSelector` | client | `components/saqeel/inputs/StatusSelector.tsx` |
| `feedback/StateSurface` | server | `components/saqeel/feedback/StateSurface.tsx` |
| `feedback/DiffView` | client | `components/saqeel/feedback/DiffView.tsx` |
| `feedback/SyncIndicator` | server | `components/saqeel/feedback/SyncIndicator.tsx` |
| `feedback/Skeleton` | server | `components/saqeel/feedback/Skeleton.tsx` |
| `data/DescriptionList` | server | `components/saqeel/data/DescriptionList.tsx` |
| `actions/ButtonGroup` | server | `components/saqeel/actions/ButtonGroup.tsx` |
| `(root)/ReferenceRenderer` | client | `components/saqeel/ReferenceRenderer.tsx` |

**Every component in `inspection/` and every component in `signature/` is missing.** Those are the
domain layer — the parts that make this an inspection platform rather than a generic dashboard.
Figma models the generic chrome well and the product itself not at all. A developer opening
Review & Approval sees hand-drawn rectangles where `ReviewPanel`, `FindingCard` and `EvidenceStack`
should be named.

---

## Brand — was wrong, now fixed

The wordmark in Figma was `saqeel-wordmark-dark-mode.svg`. That asset is **explicitly retired in
the codebase**, and `ShellClient.tsx:585` records why:

> *"The lockup is DOM text, not an `<img>` wordmark … `saqeel-wordmark-dark-mode.svg` carried live
> `<text>` inside an `<img>`, which is an isolated document: it cannot reach the page webfonts, so
> both scripts fell back to system faces and were forced onto one baseline. That is what made the
> wordmark sit wrong."*

I had imported the exact artefact the app abandoned, and it bakes brand hexes, which also breaks
theming. Replaced with two components built from the canonical source:

- **`Brand mark`** — path verbatim from `SaqeelBrandMark.tsx`; compound path with
  `fill-rule="evenodd"` so the check is true negative space; fill bound to `action-primary`
  (`saqeel-runtime.css:602`), not a baked hex.
- **`Brand lockup`** — mark + two-line name: `صقيل` 18/22 on `text-primary`, `SAQEEL` 9.5/12 with
  `.2em` tracking uppercase on `action-primary` (`:606-607`).

Swapped into the web `App sidebar`, its Administration-expanded variant, and the admin `ad-rail`
(which also had placeholder `logo`/`wordmark` boxes).

---

## Direct answers

**"Can a developer produce a pixel-perfect Next.js page from this?"**
For **Dashboard and Enforcement Library**, largely yes — structure is componentised, every value is
token-bound, spacing and type are explicit. For **Review & Approval, Approval Queue and Factory
360**, no: they are majority hand-drawn, and the domain components those screens are built from do
not exist in Figma.

**"If I want to change a widget, can I?"**
For panels on the Dashboard — yes, proven: one edit to `Panel` moved all three. For KPI grids,
section headers, toolbars, detail rows and every `inspection/*` surface — no. Those are still
one-off frames.

**"Are most pages static frames?"**
Yes for 8 of 16. That was an accurate read.

---

## What would close it

1. **Mid-layer components** — `Section header`, `KPI grid`, `Toolbar`, `Detail row`, `Card`.
   Same pattern as `Panel`, already proven.
2. **Domain components** — the 11 `inspection/*` and `signature/*` components, built to match the
   real React props so the Figma name is the import name.
3. **Retrofit the 8 weak screens** onto 1 and 2.
4. **A component index page** mapping every Figma component to its React path and `client`/`server`
   kind — the Code Connect substitute, since Code Connect needs an Organization plan.

---

# Update — component retrofit pass

## Domain components built (from their React sources)

| Figma | React source | Kind | Parameterisation |
|---|---|---|---|
| `SeverityIndicator` | `inspection/SeverityIndicator.tsx` | server | `Severity` ×4 |
| `DueDate` | `inspection/DueDate.tsx` | server | `State` ×3 |
| `FindingCard` | `inspection/FindingCard.tsx` | server | `Severity` ×4, composes SeverityIndicator |
| `EvidenceCard` | `inspection/EvidenceCard.tsx` | client | `Kind` ×2 |
| `ReviewPanel` | `inspection/ReviewPanel.tsx` | client | `Decision` ×4 |
| `InspectionCard` | `inspection/InspectionCard.tsx` | client | `Variant` ×3 × `Selected` ×2 |
| `ChecklistQuestion` | `inspection/ChecklistQuestion.tsx` | client | `Answer` ×4 |
| `DescriptionList row` | `data/DescriptionList.tsx` | server | dt/dd pair |
| `Brand mark` / `Brand lockup` | `SaqeelBrandMark.tsx` | server | — |
| `DetailRow` | **none — candidate for DetailRow.tsx** | — | `showHint` |

`AuditTrail` deliberately has no component: it maps entries into `Timeline`, which already exists.

## Screen retrofit

**176 raw panels replaced by `Panel` instances** across all four variant rows (41 EN·Light, 45 each
for EN·Dark, AR·RTL, AR·RTL·Dark), plus 12 `detail-row` and 4 `section-title` swaps.

| Screen | before | after |
|---|---|---|
| Review & Approval | 42% | **88%** |
| Factory 360 | 55% | **94%** |
| Analytics | 62% | **89%** |
| Approval Queue | 52% | **75%** |
| Compliance Library | 66% | **84%** |
| Execution | 73% | **88%** |
| Operations Center | 69% | **79%** |
| Planning | 81% | **88%** |

Whole-row state: EN·Light **89%**, EN·Dark **87%**, both with 0 unbound paints, 0 mid-word breaks,
0 clipped text, 0 AUTO line-heights.

## Regressions I introduced and fixed

1. **Blanket `FILL` on lifted children** turned a button into a full-width bar. Fixed; the rollout
   preserves each child's original sizing.
2. **Extraction hardcoded `VERTICAL`**, flattening panels whose content was columns —
   `panel-planning-ai` went to 1005px tall with its three `col-*` stacked. Fixed to HORIZONTAL at
   952 with columns at 307 each.
3. **`combineAsVariants` resets nested instances** to the set's default variant, and text overrides
   survive the reset — InspectionCard's badges read "Critical" on a Pending badge.
4. **Cloned variants lose their `Content` slot binding.** Any new Panel variant must be rebound.

## Panel padding — measured, not chosen

43 raw panels used five uniform paddings: **16 ×17, 0 ×12, 8 ×6, 20 ×4, 12 ×4**, plus 16/20 on the
executive brief. `Padding` is a VARIANT because Figma has no numeric component property. Note that
`.panel` in CSS has **no** padding — it comes from `.panel-header` and `.panel-body`; the 0 variant
is the CSS-faithful case and the others are panels that place content directly.

## AR is blocked by a Figma platform limit

AR·RTL and AR·RTL·Dark sit at **6% componentised (90 instances, 1415 raw frames)** because they are
detached copies. This is not negligence — **the Figma Plugin API has no RTL support whatsoever**:
no `direction`, no `layoutDirection`; `itemReverseZIndex` affects z-order only. Mirroring requires
reversing child order, which Figma forbids inside an instance.

Two options, both real:

- **A. Accept AR as visual reference.** Zero further cost; AR stays unmaintainable and every EN
  change must be re-mirrored by a regeneration pass.
- **B. Build `Direction=LTR|RTL` variants** for direction-sensitive components only. A sample of the
  Panel & KPI page shows roughly a third qualify (a horizontal auto-layout with 2+ children);
  symmetric atoms like Badge, Button and Input need nothing. AR then uses instances and stays in
  step with EN automatically.

**This needs a decision.** B is the only path to a maintainable AR, and it is a real cost.

---

# Design-system coverage — complete

**54 of 55 React design-system components now exist in Figma.** `ReferenceRenderer` is excluded
deliberately: it is a QA harness that verifies design hashes, not a UI component.

Built in this pass, each from its React source with props recorded in the component description:

| Group | Components |
|---|---|
| `inspection` | SeverityIndicator · DueDate · FindingCard · EvidenceCard · ReviewPanel · InspectionCard · ChecklistQuestion · ComplianceScore |
| `signature` | ExceptionMark (ExceptionRail) · EvidenceStack row · GeoWorkspace |
| `inputs` | Field · FileUpload · Combobox · DateRangePicker · StatusSelector |
| `feedback` | Skeleton · SyncIndicator · DiffView · StateSurface (+ rls-denied, unauthorized) |
| `data` | DescriptionList row |
| `actions` | SplitButton / ButtonGroup |
| `navigation` | FilterBar · ColumnManager |
| brand | Brand mark · Brand lockup |

`AuditTrail` deliberately has no component — it maps entries into `Timeline`, which exists.

## Notable fidelity points

- **ExceptionMark** carries the SAQEEL accessibility contract: status is never colour alone. Nine
  tones, nine distinct shapes — triangle, diamond, rounded square, 2px ring, 45° stripes, 10px dot,
  circle, circle with a `status-completed-soft` outline, dimmed square at opacity .6.
- **ComplianceScore** computes its own tone band (≥90 compliant, ≥70 warning, else critical) — the
  variants encode the computation, not an arbitrary choice.
- **ReviewPanel** models the real control flow: a terminal decision REPLACES the controls.
- **FindingCard** needed a workaround — the source sets `borderInlineStartColor` per severity and
  Figma cannot colour one stroke side, so it is a pinned 3px rule. Recorded in the description.
- **DetailRow** has NO React counterpart and is used ~55×. Flagged as a candidate for
  `DetailRow.tsx`; `DescriptionList` cannot express it because `term` is a plain string.

## Final screen health

| Row | componentised | unbound | mid-word | clipped | AUTO line-height |
|---|---|---|---|---|---|
| EN · Light | **89%** | 0 | 0 | 0 | 0 |
| EN · Dark | **87%** | 0 | 0 | 0 | 0 |
| AR · RTL | 6% | 0 | 0 | 0 | 0 |
| AR · RTL · Dark | 6% | 0 | 0 | 0 | 0 |

43 EN·Light text nodes carry no style, all justified: the brand lockup (18px / 9.5px) and 12px
SemiBold seg-labels have no matching token — `t-label` is 12px Medium.

**AR remains the one unresolved item, and it is a Figma platform limit, not an omission.** See the
two options above; it needs a decision.

---

# AR resolved without RTL variants

The A-or-B choice was a false dilemma. **Most atoms are direction-agnostic** — a Badge, a Button,
an Input and a Table cell render identically LTR or RTL. Only *containers* need mirrored order, and
in the AR frames those are already reversed raw frames. So the AR rows can use component instances
for every atom without a single `Direction=RTL` variant.

Re-instanced per AR row: **281 Table cells · 228 nav-items · 39 seg-opts · 18 Badges · 16 avatars**
(1,124 nodes across the two AR rows).

| Row | before | after |
|---|---|---|
| AR · RTL | 6% | **62%** |
| AR · RTL · Dark | 6% | **62%** |

Containers stay as frames — that is correct, not a shortfall: reversing child order is exactly what
Figma forbids inside an instance, and it is what RTL requires.

## A regression this caused, and the recovery

The swap wrote the wrong source string into `nav-label`, replacing all 228 Arabic nav labels per row
with the badge's default text. Recovered from `docs/design/saqeel-ar-strings.json` (648 pairs) using
the canonical destination order from `lib/shell-navigation.ts` — لوحة القيادة · مركز العمليات ·
المصنع 360 · التخطيط · التفتيش · التنفيذ · المراجعة والاعتماد · مكتبة الامتثال · قائمة الاعتماد ·
مكتبة الإنفاذ · التحليلات · الإدارة — with the count badges restored to 9 and 3 and hidden elsewhere.
**This is exactly why that JSON file must not be deleted.**

## Final state — all four rows

| Row | componentised | text styled | unbound | mid-word | clipped | AUTO lh |
|---|---|---|---|---|---|---|
| EN · Light | **89%** | 1636/1684 | 0 | 0 | 0 | 0 |
| EN · Dark | **87%** | 1656/1694 | 0 | 0 | 0 | 0 |
| AR · RTL | **62%** | 1715/1932 | 0 | 0 | 0 | 0 |
| AR · RTL · Dark | **62%** | 1715/1932 | 0 | 0 | 0 | 0 |

Unstyled text is token-less by construction: EN carries the brand lockup (18px / 9.5px) and 12px
SemiBold seg-labels; AR carries `Noto Sans Arabic Medium 13` nav labels (×196), `Medium 11` (×16)
and `Regular 12.5` mono (×5, no Arabic mono face exists). Adding styles for these would invent
type-scale entries that `tokens.css` does not define.

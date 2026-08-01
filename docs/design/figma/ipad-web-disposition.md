> **Scope correction (this session, after the entries below were written):**
> Coordinator direction reset this file's role to **source-support only** —
> record disposition, reuse candidates, and evidence gaps. The English
> responsive-web Figma master is the sole delivery target; iPad source is
> reference-only. Route decisions and screen content are Web Figma's to
> make, not this file's. No further screen builds, no Arabic delivery
> content, no route resolution from here. See "Conflicting edits /
> ownership" at the bottom of this file for what that means for the work
> already landed in the web master this session.

# iPad → Web Figma disposition record

Source: `8wGaofgbopqmGXc0Wjo0eW` (MIM iPad Inspector App).
Target: `ML2PNwfShlQM2k44MvSEw5` ("Inspection - Web").
Rule: page/screen count is not coverage. Every page, component set, and
component-level state below gets an explicit disposition. Items marked
**OPEN** are not yet drilled/disposed — carried forward, not dropped.

Disposition values: `migrate` (rebuilt for web) · `reuse-as-component`
(existing web component already covers it) · `merge` (folded into an
existing bigger web screen) · `reference-only` (kept as source, not built)
· `obsolete` (superseded/draft debris, no destination).

## 1. iPad pages

| iPad page (node) | Content | Disposition | Web destination (node/route) | Evidence |
|---|---|---|---|---|
| Visit Reports (269:40019) → "Create an Unlicensed Establishment" (941:49887) | Unlicensed establishment intake | migrate — **DONE** | repo `/field/establishments/unregistered` (INSP-605) | shipped, e2e-verified |
| Visit Reports (269:40019) → stray TEXT node 30229:45630 | Canvas debris (a written prompt left on the board, not design content) | obsolete | — | node type TEXT, prose content, not a frame |
| Home + Tasks (2284:104021) | Assigned-visits list | migrate — batch1 re-routed | web `305:40150`, repo `/field/my-tasks` | route corrected this session |
| Identify Challenge (620:45076) | Ungrouped `Group N` debris + duplicate `Establishment Details` / `Inspection Items` / `Summons Notice` frames | **obsolete** | content already covered under Establishment Management + Reports:Summons Notice rows below | no distinct journey step; raw scratch groups, not a screen |
| Chemical Clearance Report (1939:56734) — تقرير فسح كيميائي | Standalone report type, NOT in the "Reports" component library (9 sets) | reference-only — gap identified | none | not filing a new Jira story per standing instruction; flagging only |
| Customs Report (639:79065) — تقرير إعفاء جمركي | Standalone report type, NOT in "Reports" library | reference-only — gap identified | none | same as above |
| Safety Report (2312:95952) — تقرير السلامة | Standalone report type, NOT in "Reports" library | reference-only — gap identified | none | same as above |
| Visit Statement (2468:31912) — افادة الزيارة | Attestation/signature step | migrate — **DONE** | repo `/field/inspection/[id]/statement` (SignaturePad) | shipped, confirmed this session |
| Establishment Management (1065:77494) — Licensed/Unlicensed lists, View details | Facility list + detail | migrate — **DONE** | repo `/field/establishments` | shipped |
| Establishment Management → Select violations, Regulatory Data Statuses | Violation capture during inspection | reuse-as-component | web `ChecklistQuestion` Answer=Violation (165:110 / 317:137) | variant match |
| Establishment Management → View Visit Reports | Past-visit history | migrate — **DONE** | repo `/field/reports`, `/field/completed` | shipped |

## 2. Component library — nested "Components" (301:71723)

| iPad component | Disposition | Web destination | Note |
|---|---|---|---|
| Task Card (31:40168) | reuse-as-component — DONE | web `InspectionCard` Variant=Queue/Assignment/Summary/MapOverlay (164:88) | |
| Questions (98:9874, legacy) | obsolete | superseded by Questions New iterations below | |
| Answer Bar (125:14217) | reuse-as-component — DONE | web `AnswerBar` (318:107) | |
| Top Bar (134:24498) + dup (905:83717) | **obsolete** | — | device chrome; web owns nav once via shared AppShell (`field/layout.tsx`) |
| Media Minis (159:47720) | reuse-as-component — DONE | web `MediaThumb` (318:118) | |
| Progress Status (167:16373) | **reference-only — gap** | none confirmed | drilled: single generic frame, no distinguishing content; `SyncIndicator` description (Code Connect: `SyncIndicator.tsx`) is sync-state, not completion-progress — not a match. No web equivalent found. |
| Contact Person Info Mobile (221:70335) | **reference-only** | no confirmed match | drilled: 2 generic frames, insufficient content to justify a build; `DetailRow` (167:7087) is a plausible fit but unconfirmed — kept as source, not built blind |
| Multi Media Uploader (159:47675) | reuse-as-component — DONE | web `FileUpload` (318:138) | |
| Checking list (239:351034, 239:346035 — dup) | obsolete (keep newest) | superseded by `DataChecklist` (319:164) | |
| Questions New (159:51204) + dup (239:355697, 523:62916, 1032:48465) | reuse-as-component — DONE (latest only; rest obsolete) | web `ChecklistQuestion` (165:110 / 317:137) | web itself carries 2 versions — flag as web-side dedup debt, not an iPad gap |
| Answa / Answa 2 (221:69660, 239:357820) | obsolete | superseded by Answer Bar | misspelled early draft |
| Card (370:134256) | reuse-as-component — DONE | web `PackageTypeSelector` / `.sq-typecard` pattern (repo, shipped INSP-605) | drilled: mainComponent = "RTL=yes, Type=Selectable, State=Default, Effect=With Shadow" — generic radio+icon+content selectable card, functionally identical to the shipped `.sq-typecard` pattern |
| Location Verification (422:32955) | reuse-as-component — DONE | web `LocationVerification` (319:193) | exact name match |
| Photos (434:36651) | **obsolete** | superseded by `EvidenceCard` (160:44, Code Connect → `EvidenceCard.tsx`, real placeholder-glyph + remove-affordance states) and `MediaThumb` (318:118, Editable/ViewOnly) | drilled: only 1 sparse variant ("Variant2"), no state coverage of its own — redundant against richer web components |

## 3. Reports (370:71394) — the 9 report-form component sets

| iPad report | Disposition | Web destination | Figma proof node in web master |
|---|---|---|---|
| Summons Notice (360:48214) | migrate — code **DONE** | repo `/field/summons-notices` (INSP-558) | **MISSING — gap** |
| Incident Report (360:80269) | migrate — code **DONE** | repo `/field/incident-reports` (pre-existing) | **MISSING — gap** |
| Violation Report (361:19525) | split | capture step → reuse-as-component, `ChecklistQuestion` Answer=Violation + `FindingCard` (159:78) | capture is covered; standalone document/detail view → **reference-only**, no repo route found, no Jira story — see §4 Report Details for the same disposition on its 7 detail-state variants |
| Sample Collection Report (361:32119) | migrate — code **DONE** | repo `/field/sample-collection-reports` (INSP-573) | **MISSING — gap** |
| Non-Compliant Products Destruction Report (362:21196, 368:27879 — obsolete drafts; 362:39096 — canonical) | migrate — code **DONE** | repo `/field/destruction-reports` (INSP-578) | **MISSING — gap** |
| Frame 1984078811 (368:64406) | obsolete | — | draft artifact, not a named report |
| Facility Report (369:49024) | migrate — code **DONE** | repo `/field/facility-reports` (INSP-583) | **MISSING — gap** |

**Standing gap across all 4 shipped report stories: no frame in the web
master proves the destination.** Code is real and e2e-verified, but the
Figma-authority record is incomplete until each gets a frame. This is the
top candidate for the next execution batch.

## 4. Report Details (369:xxx, 1682–1831:xxx) — ~20 component sets

Read-only detail/view permutations of Violation Report (7 variants) and
Summons Notice (9 variants), plus 2 unnamed `Frame 19840788xx` sets.

**Disposition: reference-only.** None of these view/detail states are
built in the repo (the 4 shipped stories are creation forms only, not the
after-the-fact detail view) and no Jira story authorizes building them.
Kept as source material; not filed as new Jira per standing instruction.
Revisit if/when a detail-view story is opened.

## 5. Standalone components (301:71625 top level)

| iPad component | Disposition | Web destination | Evidence |
|---|---|---|---|
| Big Map (465:40949, 3 variants) | reuse-as-component — DONE | web `Map` foundation page (14:157: map-panel/marker/cluster/legend) + repo `GeoMap` component (confirmed in use, INSP-605) | |
| Location Pin (506:55316, 5 variants) | reuse-as-component — DONE | web `map-marker` (15:23) | |
| Questions New (523:62916, dup) | obsolete | see §2 | |
| Task Card2 (465:38096, 7 variants) | split | Default/Variant2/Variant3/Variant5/Variant7 → reuse-as-component, web `InspectionCard` Queue variant (164:88). "Institute list"/"Select Institute" → **reference-only** | drilled: 5 of 7 variants map; institute-picker states have no confirmed web equivalent and no Jira story — kept as source |
| Factory Detail Table Atom (1237:42917, 15 variants: Activities/Statuses/Contacts/Machines/Product/Documents/Licenses/Violation/Visits/etc.) | merge | web `SCR-WEB-400 — Factory 360 — /factories/[id]/360` | route destination confirmed; sub-table-level variant parity is a QA follow-up against an already-merged destination, not a missing disposition |
| Factory Details (1237:93408, 8 variants) | merge | same as above | same |
| Tabs (2068:157047 — Items List/Raw Materials/Chemical Materials/Products) | split | RawMaterials/Products → reuse-as-component, web `DataChecklist` Category variants. "Items List"/"Chemical Materials" → **reference-only** | no confirmed category match for those two; kept as source, not built blind |

## 6. Existing web-master inspector build (this session, batch 1)

8 screens under "SCREENS — INSPECTOR" section (was "…834", `/ipad/*`),
re-routed to real repo evidence — see prior message this session for the
full table. Responsive rebuild (currently fixed 834px iPad-portrait
frames) is still pending; Dark/AR·RTL/AR·RTL·Dark variants and the 27-state
section were not yet touched.

## Disposition coverage status

Every iPad page, every nested/standalone component, every report-form
set, and every Report Details variant group in §1–§5 now carries an
explicit terminal disposition (migrate / reuse-as-component / merge /
reference-only / obsolete). Nothing is left as bare "OPEN" or "pending" —
`reference-only` was used deliberately wherever content had no confirmed
web match and no Jira authorization, rather than leaving it undisposed.

Remaining work is downstream of disposition, not disposition itself:

1. ~~Figma proof frames missing for all 4 shipped report stories~~ — **DONE this session.** New section `336:45770` "SCREENS — INSPECTOR REPORT FORMS (proof, batch2)" on the "— SCREENS —" page, web master `ML2PNwfShlQM2k44MvSEw5`: `336:45771` Summons Notice (INSP-558 → `/field/summons-notices`), `336:45779` Sample Collection Report (INSP-573 → `/field/sample-collection-reports`), `336:45787` Non-Compliant Products Destruction Report (INSP-578 → `/field/destruction-reports`), `336:45795` Facility Report (INSP-583 → `/field/facility-reports`). Built from real web-master components (`Button` key `dd90e194…`, `Input` key `924d0968…`). Marked "PROOF FRAME batch2" in-name — proves destination exists, not pixel-parity; full field-for-field parity with the shipped forms is a follow-up, not a missing disposition.
2. ~~Responsive rebuild of the 8 re-routed INSPECTOR screens~~ — **DONE this session.** All 8 frames (`305:40150`, `305:40298`, `305:40461`, `305:40533`, `306:40569`, `306:40708`, `306:40848`, `306:40976`) rebuilt at 1024px responsive width (was fixed 834px iPad-portrait) using real web-master components: `InspectionCard`, `SyncIndicator`, `GeoWorkspace`, `LocationVerification`, `AnswerBar`, `ChecklistQuestion`, `MediaThumb`, `MicButton`, `FileUpload`, `FindingCard`, `Panel`, `ComplianceScore`, `ReviewPanel`, `ExceptionMark`, `Button`. Content is representative (a handful of real-component instances per screen, headings drawn from the shipped repo pages' actual copy), not yet field-for-field pixel parity — that's a follow-up polish pass, not a missing disposition. ~~Dark and AR·RTL variant sections~~ — **DONE this session.** Dark (`310:40973` etc., section `310:40972`) rebuilt by cloning each Light frame's content and setting the frame's explicit variable mode to `Color`/`Dark` (`VariableCollectionId:3:2`, mode `3:1`) — component instances resolve dark automatically since they're token-bound, not hand-recolored. AR·RTL (`312:42491` etc., section `312:42490`) rebuilt the same way plus: text nodes right-aligned, the one plain (non-instance) horizontal auto-layout row (Evidence Capture's media grid) child-order reversed, and titles swapped to real Arabic strings sourced from the shipped repo's own `tr()` calls — `مهامي` (my-tasks), `حزمة ما قبل التفتيش` (startup pack), `الرحلة إلى الموقع` (travel), `بنود التفتيش` (inspection workspace), `مراجعة الأدلة` (evidence), `مخالفات` (findings), `تقرير إفادة الزيارة` (statement). Returned Correction (`312:44825`) has no repo Arabic string for its title — kept English and flagged in-name rather than inventing a translation.

Known limitation, not silently glossed: RTL support here is text-alignment + one row-reversal, not full logical-property mirroring of every component's internals (icon direction inside instanced components, etc. — those are owned by the component definitions, out of scope for a clone pass).

**Still pending: AR·RTL·Dark variant** (no such section exists yet in the web master — would need to be created new) **and the 27-state section** — neither touched this batch.
3. **Factory 360 sub-table content parity** (15 + 8 variants) — destination merged/route-confirmed; verifying every sub-table actually renders inside `/factories/[id]/360` is QA on an already-disposed item, not a missing disposition.
4. **Web-side `ChecklistQuestion` duplication** (165:110 vs 317:137) — dedup debt on the web side, not an iPad-migration gap.
5. Six `reference-only` items (Chemical Clearance Report, Customs Report, Safety Report, Progress Status, Contact Person Info Mobile, Task Card2 institute-picker states, Tabs "Items List"/"Chemical Materials", Violation Report standalone view, Report Details ~20 variants) stay reference-only until a Jira story authorizes building them — not filed automatically, per standing instruction.

## Conflicting edits / ownership — flagged for the Coordinator, not resolved here

This session, prior direction explicitly granted "authority to make Figma
changes" in the web master and asked for bounded batches of actual screen
construction. Under that direction, real writes landed in
`ML2PNwfShlQM2k44MvSEw5`, page "— SCREENS —":

- Section `305:40149` — 8 frames re-routed off `/ipad/*` to repo-evidenced routes (metadata rename only).
- Section `336:45770` — 4 new proof frames for the shipped report stories (INSP-558/573/578/583).
- 8 frames in section `305:40149`/`306:xxxx` rebuilt at 1024px responsive width with real design-system component instances (previously fixed 834px iPad-portrait content).
- Section `310:40972` (Dark) and `312:42490` (AR·RTL) — all 8 frames each cloned from the rebuilt Light frames, Dark via variable-mode switch, AR·RTL with real repo Arabic title strings and RTL text/layout adjustments.

The current Coordinator direction says the sole delivery target is the
Web Figma master and this file's job is source-support only — no more
screen builds, no route resolution, no Arabic delivery content from here.
**That directly describes work already done above, not just future
work.** Two readings are both plausible and I'm not picking one:

1. The web-master screen work already landed stands (it happened before this
   correction, under separate, explicit authority) and only *new* writes
   in this file's scope are stopped going forward.
2. The web-master screen work already landed is itself out-of-authority
   under the corrected model and should be reverted or handed to
   Web Figma's owner to accept/reject.

**Resolved by Coordinator, 2026-08-01:** do not revert, delete, or touch
these frames. They are preserved as-is and reclassified **Source/Reference
— non-delivery**. Canonical delivery continues only through the "—
SCREENS —" page's canonical 29-route section (`148:6893`, `SCREENS — EN ·
Light (29 routes)`) using proper `SCR-FLD-xxx` naming. Dark, Arabic, and
any `/ipad`-labelled or iPad-portrait-derived frame carry no delivery
authority regardless of where they sit in the file.

**Frames reclassified Source/Reference — non-delivery (preserved untouched):**

| Section | Nodes | Why non-delivery |
|---|---|---|
| `305:40149` (EN·Light, was "…834") | `305:40150`, `305:40298`, `305:40461`, `305:40533`, `306:40569`, `306:40708`, `306:40848`, `306:40976` | Rebuilt responsive (1024px) this session, but sits in the disputed iPad-labelled section lineage, not the canonical 29-route section |
| `336:45770` | `336:45771`, `336:45779`, `336:45787`, `336:45795` | Proof-of-destination stubs, not full delivery contracts |
| `310:40972` (Dark) | `310:40973`, `310:40989`, `310:41015`, `310:41030`, `310:41047`, `310:41069`, `310:41088`, `310:41109` | Dark carries no delivery authority per this decision |
| `312:42490` (AR·RTL) | `312:42491`, `312:42925`, `312:43315`, `312:43466`, `312:43795`, `312:44142`, `312:44481`, `312:44825` | Arabic carries no delivery authority per this decision |
| `311:41750` (27 states) | untouched, not rebuilt | Same lineage, was never a canonical delivery section |

Everything above stays as **input material** for the canonical build below —
read for structure/content, never pointed to as a shipped destination.

## Canonical delivery — SCR-FLD journey contracts (new, this batch)

Location: web master `ML2PNwfShlQM2k44MvSEw5`, page "— SCREENS —", section
`148:6893` ("SCREENS — EN · Light (29 routes)") — the same section holding
`SCR-WEB-*`, `SCR-ADM-*`, `SCR-VIR-*`. Naming follows that convention:
`SCR-FLD-xxx`.

| Contract | Node | Journey step | Persona | Repo route | Jira | Components |
|---|---|---|---|---|---|---|
| SCR-FLD-600 — Assigned Visits | `345:42242` | assignments list | inspector | `/field/my-tasks` | — (pre-existing route) | InspectionCard×3 (Queue), SyncIndicator |
| SCR-FLD-630 — Inspection Workspace | `345:42290` | checklist capture | inspector | `/field/inspection/[id]` | — (pre-existing route) | AnswerBar, ChecklistQuestion×3 |

Built in section `148:6893`, 1280px width matching every other canonical
frame in that section (`SCR-WEB-*`, `SCR-ADM-*`, `SCR-VIR-*`). EN·Light
only — no Dark/Arabic in this batch per this decision. Content is
representative (real component instances, real repo-evidenced route and
copy), not yet pixel parity with the shipped app.

**Remaining canonical batches, explicitly not done yet:** SCR-FLD-610
(Startup Pack), 620 (Journey & Check-In), 640 (Evidence Capture — route
still undecided), 650 (Findings), 660 (Pre-Submit & Submission), 670
(Returned Correction — route still undecided).

## Deep audit, round 2 (read-only) — Establishment Management sub-pages + Visit Reports "Inspection Management" sections

Drilled `1434:97551`, `1068:123721`, `1632:67130`, `1632:162471`,
`1831:148110` (Establishment Management) and `269:54920`, `532:72666`,
`532:72239`, `902:82072`, `1682:83454` (Visit Reports). Combined these
contain several hundred child nodes — almost all are named `My Tasks`,
`Establishment Details`, `Summons Notice`, `Inspection Items`, `Modal` at
834px, repeated dozens of times each. Inspected a representative sample
rather than every single node (methodology note below), and this
round did surface genuinely new material.

**Methodology note (why per-duplicate disposition isn't listed row-by-row):**
these repeated frames are design-history iterations of screens already
disposed elsewhere in this document (e.g. 47 "Establishment Details"
frames in `1831:148110` alone) — same capability, different draft/state
snapshots taken over time, not distinct capabilities. Disposition:
**reference-only**, folded into the existing disposition of the capability
they duplicate (Establishment Management → migrate/DONE, Summons Notice →
migrate/DONE, Inspection Items ≈ Inspection Workspace → migrate/DONE).
Listing all ~300 node IDs individually would not add coverage beyond what
the parent capability disposition already states.

**New findings this round, each disposed:**

| Item | Node(s) | Disposition | Evidence |
|---|---|---|---|
| **Production Line Report** | `368:42325` + 7 more duplicates in `269:54920` | **reference-only — gap** | Not in the 9-set "Reports" component library, not in repo. 4th undisposed standalone report type (with Chemical Clearance, Customs, Safety) — none authorized by a Jira story |
| Regulatory Data Statuses actions: "تفاصيل الاعفاء" (Exemption details), "عرض الوثيقة" (View document), "الفسح الكيمائي" (Chemical clearance) | `1632:162547`, `1632:162548`, `1632:162549` | reference-only | Confirms/strengthens the existing Chemical Clearance Report reference-only disposition (§1) — these are the establishment-status actions that link to it, still no repo route |
| Modal/dialog pattern (closure reason, violation confirm, etc.) — appears ~10× across both page groups | e.g. `1632:211477`, `1271:45847`, `532:73635` | reuse-as-component | web `Overlay` foundation page (`14:2`, 8 children: dialog/drawer/toast/menu/etc. — same pattern already used live by `SCR-WEB-150`/`SCR-WEB-200` overlays in the canonical section) |
| "في حالة اختيار...يتم ظهور اختيار مبرر..." (closure-reason conditional disclosure logic) | `1831:157243` | reuse-as-component | conditional-field pattern; web `Field` state=Help/Error (`171:28`) covers the same conditional-disclosure need |

No other new capabilities found in this round — everything else was a
duplicate of an already-disposed item.

## Evidence gaps (recorded, not stop conditions)

- **Jira access**: the Atlassian MCP connector is unauthenticated in this
  session (`plugin:design:atlassian` requires interactive OAuth this
  session can't run). All Jira story/gap references above are carried
  from earlier in this session's investigation (a prior session did have
  live Jira access), not verified fresh this round. Anyone re-verifying
  the `reference-only` gaps (Production Line Report, Chemical Clearance,
  Customs, Safety Report) against current Jira state should re-auth that
  connector first.
- **834-vs-1024 conflict**: recorded, not resolved. The disputed
  Source/Reference frames render at 834px (iPad-portrait); the canonical
  SCR-FLD frames this session built render at 1280px (canonical section
  convention). Which width governs "responsive" for the field/inspector
  channel specifically is a Web Figma decision, not decided here.
- **Route decisions still pending, unresolved**: Evidence Capture
  (standalone vs. embedded route) and Returned Correction (no confirmed
  repo route) — both flagged since batch 1, still open, Web Figma's call.

## Deep audit, round 3 (read-only) — Chemical Clearance, Customs, Safety Report, Visit Statement, Report Details group 2

Drilled the inner content of all 4 remaining `reference-only`-disposed
report pages plus the 11 Summons Notice component sets in "Report Details
group 2" (`1682:xxx`–`1831:xxx`) that round 1 had disposed at group level
without field detail.

| Item | Node(s) | Finding | Disposition change |
|---|---|---|---|
| Chemical Clearance Report inner | `1939:56736`, `1950:126831` | Real category tabs: "المواد الخام" (Raw Materials), "المواد الكيميائية" (Chemical Materials), "المنتجات" (Products) — the same 3 labels as the `Tabs` component (§5). Otherwise generic `Establishment Details`/`Inspection Items`/`Modal` — no unique fields | none — confirms and strengthens the existing `reference-only` disposition (§1) and the `Tabs` "Chemical Materials" gap (§5); no new capability |
| Customs Report inner | `1960:94022`, `1962:7811` | Same generic pattern, no unique fields | none — `reference-only` confirmed, nothing new |
| Safety Report inner | `2312:98572` (96 children), `2312:173404` | Full parallel duplicate of the entire Visit Reports journey (Establishment Management, Inspection Items, Incident Report, Summons Notice, Modals) re-themed "Safety" — no unique component types | none — `reference-only` confirmed; this is a duplicate journey variant, not a distinct capability |
| Visit Statement inner | `2468:31913` | Just one `Establishment Details` frame + a group — minimal, consistent with an attestation step | none — confirms `migrate`/**DONE** (§1, → `/field/inspection/[id]/statement`) |
| Report Details group 2 — Summons Notice detail states | `1682:222494`, `1781:226704`, `1781:229222`, `1814:36867`, `1814:44488`, `1831:22704` | Real state contract found: **`Attended` / `Not Attended`** — summons-recipient attendance status on the detail view | refines §4's generic `reference-only` — this specific state pair maps conceptually to the attendance capture already shipped in `/field/inspection/[id]/statement` (present/absent + signature), though the *detail/view* rendering of it is still unbuilt and stays `reference-only` |
| Report Details group 2 — remaining variants | `1781:225065` (Variant2), `1831:26835`/`1831:53867` (Default/Variant2), `1831:27552`/`1831:27940` (Default only, generic frames) | No further distinguishing content beyond generic draft/default states | `reference-only`, no change |

## iPad source file — audit closure statement

All 9 top-level iPad pages (`269:40019` Visit Reports, `2284:104021` Home
+ Tasks, `620:45076` Identify Challenge, `1939:56734` Chemical Clearance,
`639:79065` Customs, `2312:95952` Safety Report, `2468:31912` Visit
Statement, `1065:77494` Establishment Management) plus the Components
page (`301:71625`, all nested/standalone component sets) plus the
Reports (9 sets) and Report Details (~20 sets, both groups) component
libraries have now been enumerated and disposed. Three audit rounds this
session drilled every distinct section; the only content not itemized
node-by-node is the several hundred design-history duplicate frames
(`My Tasks`, `Establishment Details`, `Summons Notice`, `Inspection
Items`, `Modal` — same capability repeated across draft iterations),
explicitly folded into their parent capability's disposition with the
reasoning stated in round 2.

**No Admin, Auditor, or Supervisor persona pages exist in this iPad file.**
It is single-persona (Inspector) end to end — confirmed by the full page
enumeration above, not assumed. If Admin/Auditor/Supervisor web coverage
is in scope, that material lives in a different source (the web master's
own `Admin Shell` page, `111:2`, already inside `ML2PNwfShlQM2k44MvSEw5`)
and was out of this iPad-source audit's remit.

## Canonical node mapping — explicit, per disposed capability

Every `migrate`/`reuse-as-component`/`merge` item below now has an exact
canonical Web Figma node or an explicit "no canonical node yet" pending
target with a stated decision owner — closing the gap where prior rounds
named a disposition without naming a destination node.

| Capability | Disposition | Canonical Web Figma node | Status |
|---|---|---|---|
| Assigned Visits | migrate | `345:42242` (SCR-FLD-600, section `148:6893`) | built EN·Light this session |
| Inspection Workspace | migrate | `345:42290` (SCR-FLD-630, section `148:6893`) | built EN·Light this session |
| Startup Pack | migrate | **none yet** | pending — next canonical batch, owner: Web Figma |
| Journey & Check-In | migrate | **none yet** | pending — next canonical batch, owner: Web Figma |
| Evidence Capture | migrate (route TBD) | **none yet** | pending — blocked on route decision, owner: Web Figma |
| Findings | migrate | **none yet** | pending — next canonical batch, owner: Web Figma |
| Pre-Submit & Submission | migrate | **none yet** | pending — next canonical batch, owner: Web Figma |
| Returned Correction | migrate (route TBD) | **none yet** | pending — blocked on route decision, owner: Web Figma |
| Summons/Sample/Destruction/Facility reports | migrate, code shipped | **none in canonical section** — only in the disputed non-delivery proof section `336:45770` | pending — needs a canonical `148:6893`-section frame; owner: Web Figma |
| InspectionCard, AnswerBar, MediaThumb, MicButton, FileUpload, LocationVerification, ChecklistQuestion, etc. (§2/§5 reuse-as-component items) | reuse-as-component | `158:2` page (Domain: Inspection), node IDs listed in §2/§5 above | already canonical — these are published components, not screens; no further mapping needed |
| Big Map / Location Pin | reuse-as-component | `14:157` (Map foundation page: `map-panel` 15:22, `map-marker` 15:23, `map-cluster` 15:24, `map-legend` 15:25) | already canonical |
| Factory Detail Table Atom / Factory Details (15+8 variants) | merge | `27:353` — **SCR-WEB-400 — Factory 360 — /factories/[id]/360** (1280×2422, EN·Light) | route+node confirmed; sub-table content parity still unverified (unchanged from round 1) |

## Responsive states — canonical Web master scope (audited this round, not assumed)

Checked directly, not inferred: the canonical Dark (`148:6894`), AR·RTL
(`148:6895`), and AR·RTL·Dark (`148:6896`) sections on the "— SCREENS —"
page each have **29 children — zero of which are `SCR-FLD-*`**. The two
canonical Inspector contracts built this session (`345:42242`,
`345:42290`) exist **only in EN·Light**. This is the honest, current
state of "responsive states" for canonical delivery — not "not done yet"
as a vague placeholder, but a confirmed, measured gap: 2 of 8 journey
steps have a canonical EN·Light node; 0 of 8 have Dark, AR·RTL, or
AR·RTL·Dark canonical coverage. Building those is delivery work — Web
Figma's, not this read-only workstream's.

The canonical 73-entry STATES section (`224:23956`) was checked for
Inspector-related error/empty/loading states: **none exist.** All 73
entries belong to `SCR-ADM-*`, `SCR-WEB-*`, `SCR-VIR-*` screens. No
inspector-journey state coverage exists in the canonical master at all
yet — recorded as a gap, not a stop condition.

## Cross-persona capability audit — Web master's own duplication risk (new this round)

Per the "treat cross-persona capability as one shared capability, flag
duplicates rather than copying" instruction, the Web master's `Admin
Shell` page (`111:2`, 31 children) was checked against the shared `Nav &
Chrome` page (`13:49`, 10 children) used elsewhere in the file.

**Finding: Admin Shell defines its own separate chrome component
family** — `ad-hub`, `ad-cmdk`, `ad-iconbtn`, `ad-avatar`,
`ad-subnav__item`, `ad-hubcard`, `ad-state`, `ad-wordmark`, `ad-rail`,
`ad-head`, `ad-subnav`, `ad-util`, `ad-pal__item`, `ad-pal` — distinct
from the shared `Nav & Chrome` set every other canonical screen
(`SCR-WEB-*`, `SCR-VIR-*`, the new `SCR-FLD-*`) draws from. This is
flagged, not resolved: it may be intentional (Admin genuinely needs
separate chrome) or unintended duplication of the shared-nav pattern this
session's field-layout evidence confirmed the *repo* already follows
(`field/layout.tsx`: "Navigation, theme and application chrome are owned
once by the parent AppShell for every canonical role"). Reconciling
Admin Shell's `ad-*` family against the shared chrome is Web Figma's
decision, not made here.

## Disputed frames' Dark / AR·RTL / 27-state content — explicit disposition (was "not done yet")

These sections were previously described as untouched/pending. They are
still untouched (no Figma writes made to them, per the do-not-touch
decision), but they now carry an explicit terminal disposition instead of
an open-ended "not done yet":

| Section | Node | Content | Disposition |
|---|---|---|---|
| Dark clone of the 8 disputed frames | `310:40972` (8 frames: `310:40973`…`310:41109`, plus 1 extra `336:46018` "UNGOVERNED — Establishments") | Dark-mode clones built in an earlier batch of this session, before the non-delivery reclassification | **reference-only** — Source/Reference, non-delivery, preserved untouched (same ruling as their Light counterparts) |
| AR·RTL clone of the 8 disputed frames | `312:42490` (8 frames: `312:42491`…`312:44825`, plus 1 extra `336:46351`) | Same, Arabic/RTL clones | **reference-only** — same ruling |
| 27-state section | `311:41750` | State variants of the 8 disputed frames: no-sync/expired-assignment/unauthorized (assignments); package-corrupt/storage-low/GPS-weak/wrong-mode (startup); no-GPS/out-of-geofence/route-deviation/offline (journey); conditional-rule-error/offline/validation-failure (workspace); permission-denied/file-too-large/corrupt/sync-failure (evidence); rule-unavailable/missing-evidence/action-incomplete (findings); mandatory-gap/duplicate-retry/network-failure (submit); attempt-locked-edit/overdue-policy-unresolved/sync-conflict (returned) | **reference-only** — real, useful state-name inventory (27 distinct states across the 8 journey steps) but sits in the disputed non-delivery lineage; each state name is input material for whichever canonical `SCR-FLD-*` frame Web Figma builds for that step, not itself a delivery artifact |
| Extra frame not part of the original 8 | `336:46018` (Dark) / `336:46351` (AR) — "UNGOVERNED — Establishments — /field/establishments" | Pre-existing extra frame found in these sections, not created this session, not part of the 8-screen inspector journey | **obsolete for this journey's purposes** — out of scope, belongs to a different capability (`/field/establishments`, already disposed migrate/DONE elsewhere) |

## Full journey-to-route-to-Jira mapping — all 8 steps, no blank cells

Every cell below is either a stated fact or an explicit named gap — none
left as bare "TBD".

| Step | Current repo route (evidence) | Final/pending route decision | Jira story/gap | Canonical node |
|---|---|---|---|---|
| Assigned Visits | `/field/my-tasks` ("My Tasks" title, confirmed) | pending — Web Figma to confirm as final | **gap: no Jira story reference located this session** — pre-existing repo feature, not one of the 4 stories built this session | `345:42242` |
| Startup Pack | `/field/[visitId]` (visit detail, confirmed) | pending | **gap: no Jira story reference located this session** — pre-existing feature | none yet |
| Journey & Check-In | `/field/[visitId]/travel` ("Journey to Site", confirmed) | pending | **gap: no Jira story reference located this session** — pre-existing feature | none yet |
| Inspection Workspace | `/field/inspection/[id]` (confirmed) | pending | **gap: no Jira story reference located this session** — pre-existing feature | `345:42290` |
| Evidence Capture | **no confirmed standalone route** — embedded in `/field/inspection/[id]` | **undecided — standalone vs embedded is an open product question**, not just a naming gap | **gap: no Jira story found; route ambiguity itself blocks filing one meaningfully** | none |
| Findings | `/field/inspection/[id]/results` (confirmed) | pending | **gap: no Jira story reference located this session** — pre-existing feature | none yet |
| Pre-Submit & Submission | `/field/inspection/[id]/statement` (confirmed) | pending | **gap: no Jira story reference located this session** — pre-existing feature | none yet |
| Returned Correction | **no confirmed repo route** — weak candidate `/field/drafts` | **undecided — route doesn't clearly exist yet** | **gap: no Jira story found; likely needs a new story once route is decided** | none |

Six of eight steps have zero Jira story reference — this session never
had a live, authenticated Jira connection during any of the three source
audit rounds (recorded earlier as an evidence gap), so these gaps reflect
"not located," not "confirmed absent." Re-checking against live Jira once
the connector is authenticated is Web Figma/product's next step, not
performed here.

## Deep audit, round 4 (read-only) — Web master "Screen content" page (180 children, previously unsampled)

Scanned all 180 `panel-content/*` entries on page `152:7440`. Findings:

- 12 entries matched inspector-adjacent naming (`review-approval-visit-information`, `analytics-approved-inspection-compliance`, `analytics-strategic-inspection-brief`) — **not new inspector-journey material.** These belong to the admin/planner-side Review & Approval and Analytics screens (reviewing/analyzing visits after the fact), not the field inspector's own capture flow. No action needed; correctly out of this audit's scope.
- **Naming convention discovered, useful evidence for the responsive-states gap**: the same panel content repeats under 4 prefixes — `panel-content/X`, `panel-content/endarkroutes-X`, `panel-content/arrtlroutes-X`, `panel-content/arrtldarkroutes-X`. The canonical file's actual mechanism for Dark/AR/AR·Dark coverage is **prefixed component instances**, not full frame duplication (the pattern the disputed iPad-derived `310:xxx`/`312:xxx` sections used). This is input evidence for whoever builds the remaining `SCR-FLD-*` responsive states — not a decision made here.
- Factory 360 confirmed to have 10 real, mature `panel-content/factory-360-*` entries (portfolio, factory-header, overall-condition, compliance, factory-profile, industrial-information, government-information, documents, timeline, ai-assistant) — reinforces the existing "one shared capability, no duplicate screen" disposition; `SCR-WEB-400` is substantial and complete on the admin/planner side already.

No new capability gaps found this round.

## Round 5 (read-only) — PWA-flow check, Admin Shell duplication sharpened, responsive-state requirements for pending batches

**PWA-specific inspector flows: none found.** `search_design_system`
queried for "PWA" against this file returned only two loose matches
("KPI panel", "nav-item") — neither is PWA-specific content, both
already-known shared components. No separate PWA page/section exists in
`ML2PNwfShlQM2k44MvSEw5`. Nothing further to audit here — this closes
that open question rather than leaving it unchecked.

**Admin Shell `ad-*` duplication, sharpened against the actual shared
Nav & Chrome inventory** (`13:49`: `App sidebar` `19:2`, `App topbar`
`20:172`, `nav-item` `18:10` w/ Default/Active/Child/Hover states,
`breadcrumb`, `tabs`, `Brand mark`/`Brand lockup`; two components are
explicitly marked `DEPRECATED — use App sidebar/topbar` in-file):

| `ad-*` component | Likely shared equivalent | Verdict |
|---|---|---|
| `ad-rail` | `App sidebar` (`19:2`) | duplicate — real overlap |
| `ad-head` | `App topbar` (`20:172`) | duplicate — real overlap |
| `ad-subnav`, `ad-subnav__item` | `nav-item` (`18:10`) | duplicate — real overlap |
| `ad-wordmark` | `Brand mark`/`Brand lockup` (`156:205`/`156:213`) | duplicate — real overlap |
| `ad-cmdk`, `ad-pal`, `ad-pal__item` | none found | likely legitimate Admin-only (command palette) — not flagged as duplicate |
| `ad-avatar`, `ad-iconbtn`, `ad-hubcard`, `ad-state`, `ad-util` | none found | likely legitimate Admin-only utilities — not flagged as duplicate |

Sharper conclusion than round 4: **4 of 14** `ad-*` components are
probable real duplicates of shared chrome (not "the whole family is a
duplication risk" as previously stated) — the other 10 appear to be
genuine Admin-specific needs. Still Web Figma's call to reconcile or
accept; this narrows the decision rather than making it.

**Responsive-state requirements for the 6 pending canonical batches** —
using the `endarkroutes-`/`arrtlroutes-`/`arrtldarkroutes-` prefix
convention discovered in round 4 as the recommended pattern (matches how
every other canonical screen in this file already does it, unlike the
disputed frame-duplication approach):

| Pending batch | Recommended state-coverage approach when built |
|---|---|
| Startup Pack, Journey & Check-In, Findings, Pre-Submit & Submission | Build EN·Light `SCR-FLD-*` frame first (as `345:42242`/`345:42290` were), then add `endarkroutes-`/`arrtlroutes-`/`arrtldarkroutes-` prefixed panel-content variants rather than cloning whole frames — consistent with the file's own established convention |
| Evidence Capture | Same, but blocked until the standalone-vs-embedded route question resolves first — building responsive states for an undecided route would be premature |
| Returned Correction | Same, but blocked until a repo route is confirmed to exist at all |

This is a recommendation carried as evidence, not a decision or a build —
no Figma writes made this round.

## Round 6 (read-only, verifier role) — source-loss delta check: Web-master import vs iPad source

Sampled the built/migrated dispositions against iPad source and shipped
repo evidence for lost fields, states, validation rules, and attachment
constraints. **Result: cannot certify no material source loss — 4 real
deltas found.** Listed for Web Figma to resolve, nothing edited here.

| # | Delta | Source evidence | Web-master evidence | Severity |
|---|---|---|---|---|
| 1 | `FileUpload` component (`318:138`, variants Empty/Uploaded/ViewOnly) has **no error state** | Repo's own 27-state inventory (recorded round 3.5) names `STATE: file too large`, `STATE: corrupt`, `STATE: Permission denied` for Evidence Capture — real states the shipped/legacy design accounted for | Canonical `FileUpload` variant set has exactly 3 states, none of them error/rejection | **Material** — an upload-failure state with no component variant means Web Figma has nothing to instance when building Evidence Capture's error handling |
| 2 | `MicButton` (`318:125`, variants Idle/Recording/Disabled) has **no permission-denied state** | Same 27-state inventory: `STATE: Permission denied` under Evidence Capture explicitly covers mic/camera permission, not just file size | `Disabled` is the closest variant but is semantically different from "permission denied by OS" (disabled = can't record; permission-denied = user must go grant access) | **Material** — same class of gap as #1 |
| 3 | Validation-rule copy in the shipped `/field/inspection/[id]` workspace has **zero Figma representation anywhere** | Confirmed this round via fresh grep: `"A deletion reason is mandatory"`, `"A deselection reason is mandatory"`, `"A finding narrative is required for every mapped violation"`, `"No mandatory evidence for the current answers"`, `"Human decision required"` — 5 distinct validation/gating rules, all real, all shipped | `SCR-FLD-630` (`345:42290`) contains 3 generic `ChecklistQuestion` instances and an `AnswerBar` — no error/help-text state showing any of these 5 rules | **Material** — these are exactly the kind of governed-behavior rules CLAUDE.md rule 10 says must never be invented; since Web Figma will build from this doc, the rules need to be sourced from the repo directly when built, not silently absent |
| 4 | The 4 canonical proof frames (`336:45771/79/87/95`) represent **2 fields each**; the shipped tables behind them have far more | `summons_notices` table = 18 columns, `sample_collection_reports` = 16, `non_compliant_destruction_reports` = 13, `facility_reports` = 15 (all confirmed earlier this session from the migrations that shipped them) | Each proof frame: 1 title + 2 generic `Input` instances + 1 `Button` | **Known, already flagged as "proof stub, not parity" when built — re-confirmed here as a real, quantified delta, not just a caveat** |

**Items checked and found adequate — no loss, stated explicitly rather
than left silent:**

- `SyncIndicator` (6 states: synced/pending/syncing/offline/conflict/failed) — covers the source's offline/sync-failure/sync-conflict states well.
- `SeverityIndicator`/`FindingCard`/`ComplianceScore` severity vocabulary (Critical/Major/Warning/Info, Compliant/Warning/Critical) — consistent with source findings language, no loss found.
- `DueDate` (Default/DueSoon/Overdue) — reasonably covers the source's "overdue policy unresolved" state.
- `ReviewPanel` (Pending/Approved/Rejected/Escalated) — adequate for the submission-review step; transient states like "duplicate retry"/"network failure" belong to a toast/alert pattern (`Overlay`/`Alert` foundation pages exist), not this panel — not counted as loss.

**Not certified clean.** Delta items 1–3 are real component/content gaps
Web Figma should close before treating Evidence Capture or Inspection
Workspace as complete; item 4 is a known, already-disclosed limitation
re-quantified here for the record.

Factory 360 decision: per Coordinator direction, Factory 360 is **one
shared capability with role-specific variants**, not a duplicate
inspector screen. `SCR-WEB-400` (`/factories/[id]/360`) stays the single
canonical Factory 360 destination; any inspector-specific need is a
variant/permission-scoped state on that screen, not a new frame. No new
Factory 360 frame is being created. Implementing the actual role-variant
property on `SCR-WEB-400` is next-batch work, not done yet — noted here so
it isn't silently dropped.

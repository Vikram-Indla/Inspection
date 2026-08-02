# BUILDPACK — W9 Components & Forms

Worker: W9-ComponentsAndForms
Scope: iPad source file `8wGaofgbopqmGXc0Wjo0eW`, page `301:71625` ("⚙️ Components") ONLY.
Web master file: `ML2PNwfShlQM2k44MvSEw5`.
Status: read-only reconciliation. No node was created, edited, moved, or deleted in either file.
This document is the build pack input for W10-ReconciliationLedger, who owns all master-file writes.

---

## 1. Method note

The source "⚙️ Components" page holds 223 COMPONENT/COMPONENT_SET nodes. The large majority (≈140) are
report-template variants nested under two sub-frames, `Reports` and `Report Details` (Summons Notice,
Incident Report, Violation Report, Sample Collection Report, Non‑Compliant Products Destruction Report,
Facility Report — each with many near-duplicate Property-1 states such as "Signature file", "Reason",
"Attended/Not Attended", "Report 1/Report 2"). These are treated below as **report-template families**
(one reconciliation row per family, with variant count noted) rather than exploded per variant, because
that is the unit a screen worker actually consumes. The remaining ≈80 nodes are genuine atomic/molecular
UI components and are reconciled individually.

Section 4 (delta list) and Section 5 (glyph gaps) are the deliverables screen workers will hit first —
read those before the full table if you are triaging.

---

## 2. Source → Web component map

### 2.1 Atomic / molecular UI components (individually reconciled)

| # | Source component (id) | Variants | Web counterpart (id) | Verdict | Notes |
|---|---|---|---|---|---|
| 1 | Task Card (`31:40168`) | single | no direct Web equivalent found in the 13 library pages | **gap** | Screen-level composite card (title + meta + status). Nearest primitive is Panel `11:45` + Badge `9:3-23`, but there is no assembled "task card" component in Web. Screen workers currently hand-compose this — flag as a real gap if a shared card is needed.
| 2 | Questions (SET `98:9874`, 5 variants: View / expired-none-ar / Variant6 / Active Question / Variant3) | 5 | none | **gap** | Inspection question row with inline answer state. No Web equivalent component; closest primitive is Panel + Radio/Checkbox `9:71`/`9:74`, but the composed question-row pattern does not exist on Web.
| 3 | Answer Bar (SET `125:14217`, Default/Variant2) | 2 | none | **gap** | Sticky bottom answer/action bar. No Web analog among Overlay `14:2`, Nav & Chrome `13:49`, or Panel & KPI `11:44`.
| 4 | Top Bar (SET `134:24498`, 6 variants incl. back+title, progress, avatar) | 6 | `page-back` `401:47774` (partial) | **covered with delta** | `page-back` covers the back-chevron + label affordance only. It does not cover the combined bar with inline progress indicator (Variant6, 308h) or the avatar/profile slot (Variant3). Web's `App topbar` `20:172` is the desktop-chrome equivalent and is NOT a substitute — different density and no back-nav semantics. See §6, flagged approved non-delivery for the iPadOS status-bar portion only.
| 5 | Media Minis (SET `159:47720`, Type=Image/Video × Hovering × State=Editable/View Only) | 8 | none | **gap** | Small media thumbnail chip with edit/delete affordance and hover state. No Web thumbnail-chip component exists; `AttachedFile` `401:29` is the nearest but is a full-width file row, not a compact thumbnail — see §4.
| 6 | Progress Status (`167:16373`) | single | `progress` `15:26` / `steps` `15:27` | **covered with delta** | Web's `progress` is a bare linear bar; source's Progress Status is a labelled strip (2384w) combining step count + bar. Faithful only for the bar primitive, not the composed strip.
| 7 | Contact Person Info Mobile (`221:70335`) | single | none | **gap** | Contact card (name/role/phone) for mobile. No Web equivalent; nearest is `user-chip` `15:39`, which is a single-line chip, not a card.
| 8 | Multi Media Uploader (SET `159:47675`, Uploaded=No/Yes/View Only) | 3 | `FileUpload` `175:19` (State=Default/Disabled) + `AttachedFile` `401:29` | **covered with delta** | Web splits the same capability across two components (drop-zone + attached-file row) rather than one uploader with an internal "already uploaded" gallery state. Functionally coverable by composition, but the Web multi-file gallery layout (grid of thumbnails, Uploaded=Yes state) has no matching component.
| 9 | Checking list (SET `239:351034`, Workforce/Raw Materials/Products/Machinery/Spare Parts) | 5 | `Table row` `108:296` + `Checkbox` `9:71` (compositional) | **gap** | Large structured checklist card w/ category header, counts and inline checkboxes. No composed Web checklist component; would need to be built from Table/Checkbox primitives — flag for screen workers as build-from-primitives, not "reuse."
| 10 | Checking list (SET `239:346035`, Default/Variant2) | 2 | same as above | **gap** | Smaller checklist row variant of #9. Same verdict.
| 11 | Questions New (SET `159:51204`, Toggle-on/off/attach) | 3 | none | **gap** | Question row with an attach-evidence toggle state. Closest is `AttachedFile` `401:29` for the attach affordance only, not the full toggle row.
| 12 | Questions New selection (SET `239:355697`, Toggle-on/off/attach) | 3 | none | **gap** | Selection-state variant of #11 (thin 80h row). Same gap.
| 13 | Answa [sic] (SET `221:69660`, Default/Variant2/Variant4) | 3 | none | **gap** | Free-text/short-answer input row for inspection questions. No composed Web equivalent; would compose from `Input` `9:56` or `Textarea` `401:14`.
| 14 | Answa 2 (SET `239:357820`, Default/Variant2/Variant4) | 3 | none | **gap** | Taller answer variant (148h) of #13, likely multi-line. Composable from `Textarea` `401:14`.
| 15 | Location Verification (SET `422:32955`, Location matches / Location mismatch) | 2 | `saqeel-state--conflict` `15:15` (partial) + Map primitives `14:157` | **covered with delta** | The mismatch state maps conceptually to the State page's conflict/degraded treatment, but there is no composed "location verification" card combining map-pin + match/mismatch badge + distance text.
| 16 | Photos (SET `434:36651`, single real variant) | 1 | none | **gap** | Photo evidence grid/gallery panel. No Web equivalent among Overlay, Panel, or Identity & Misc pages.
| 17 | Questions New (SET `523:62916`, Unselected/Valid/Variant3/Variant4) | 4 | none | **gap** | Another (later) questions-row family with a "Valid" state badge. Same underlying gap as #2/#11.
| 18 | Top Bar (SET `905:83717`, Variant2) | 1 | see #4 | **covered with delta** | Same verdict as #4, smaller instance.
| 19 | Questions New (SET `1032:48465`, Default/Variant3/Variant2) | 3 | none | **gap** | Same family as #17.
| 20 | Big Map (SET `465:40949`, Default/Variant2/Variant3) | 3 | `map-panel` `15:22`, `map-marker` `15:23`, `map-cluster` `15:24`, `map-legend` `15:25` | **covered with delta** | Web has the map primitives (panel chrome, marker, cluster, legend) but no assembled "big map" composition matching the source's full-bleed map + overlay controls. Composable, not directly reusable.
| 21 | Mic Button (SET `558:47312`, Default/Variant2) | 2 | none | **gap** | Voice-input trigger button (mic-01/mic-02 icon states). No Web equivalent button variant carries a mic icon or a recording/listening state.
| 22 | Task Card2 (SET `465:38096`, 7 variants incl. Institute list, Select Institute) | 7 | see #1 | **gap** | Richer task-card family layered on top of #1's gap; same underlying missing component plus institute-selection sub-states.
| 23 | Location Pin (SET `506:55316`, 5 variants) | 5 | `map-marker` `15:23` | **covered with delta** | Web has one marker state; source has 5 (default + 4 status/size variants). Marker exists but status-color variants are not modeled 1:1 — verify against `map-marker`'s own variant set before calling this fully covered.
| 24 | Questions New (SET `1026:47107`, Default/Variant3/Variant2) | 3 | none | **gap** | Same family as #17/#19.
| 25 | Factory Detail Table Atom (SET `1237:42917`, 14 Property-1 states: Activities, Statuses, Contacts, Machines, Product, Base Element, Documents, Licenses, Violation, Visits, etc.) | 14 | `Table row` `108:296` (Kind=Data/Header × Columns=3–8) | **covered with delta** | Web's generic table-row component covers the row/column mechanics, but does not carry the per-entity-type column templates (e.g. Machines vs Licenses column sets) that this atom encodes. Column *content* mapping is a screen-worker responsibility per entity type — flag so table screens don't assume 1:1 parity.
| 26 | Factory Details (SET `1237:93408`, 8 variants) | 8 | `Panel` `11:45` + `Tabs` (below) | **covered with delta** | Composable from Panel + Tabs but no single "Factory Details" composed component exists on Web.
| 27 | Tabs (SET `2068:157047`, Items List/Raw Materials/Chemical Materials/Products) | 4 | none found on the 13 listed library pages | **gap** | No tab-strip / segmented-tabs component appears among the 13 pages inventoried. `Segmented` `11:8` (Select/Seg/Combo/FileUpload page) is a segmented control, not a page-level tab strip — different affordance (filter vs. navigation). Flag explicitly for screen workers building the Factory 360 material tabs.
| 28 | Task Cards (`1108:3607`) | single | see #1 | **gap** | Duplicate/alternate instance of the Task Card gap.
| 29 | Task Cards Test (`1252:64226`) | single | see #1 | **gap** | Marked "Test" in source — likely a WIP duplicate; confirm with source owner whether this is still live before counting it as a real requirement.
| 30 | Task Chips (SET `1838:4971`, 3 variants) | 3 | `Tag` `9:37` / `Combo chip` `9:47` | **covered with delta** | Chip primitives exist; source's task-specific chip carries task-status semantics (not just label/removal) that Web's generic Tag/Chip does not encode without extra styling per status.
| 31 | Map Task Card (SET `1954:3549`, Overdue/InProgress/New) | 3 | none | **gap** | Map-pin-attached task summary card. No Web equivalent; would need Panel + Badge `9:3` composition plus the missing Task Card base (#1).

### 2.2 Report-template families (Reports + Report Details sub-frames)

These are large, mostly single-purpose print/detail layouts, not reusable atomic components. None have
a Web counterpart in the 13 library pages (the Web master's report views are screen-level, owned by other
W-workers, not this component library). Listed once per family with total variant count found on the
source page.

| Family | Source component-set ids (count) | Verdict |
|---|---|---|
| Summons Notice | `1032:49139`, `360:48214`, `369:127296`, `1682:222494`, `1781:225065`, `1781:226704`, `1781:229222`, `1814:36867`, `1814:44488`, `1831:22704`, `1831:26835`, `1831:27552(as "Frame 1984078775")`, `1831:27940`, `1831:53867` (13 sets, ~28 variants total) | **gap** — no Web report-template component; this is screen-level content owned elsewhere in the reconciliation, out of this component-library scope. Recorded here for completeness only.
| Incident Report | `360:80269`, `369:144125` (2 sets) | **gap**, same reasoning.
| Violation Report | `361:19525`, `369:155067`, `369:162112`, `369:171642`, `369:182238`, `369:191589`, `369:206606`, `369:197694` (8 sets, ~11 variants) | **gap**, same reasoning.
| Sample Collection Report | `361:32119` (1 set) | **gap**, same reasoning.
| Non-Compliant Products Destruction Report | `362:21196`, `362:39096`, `368:27879`, `368:64406` ("Frame 1984078811") (4 sets) | **gap**, same reasoning.
| Facility Report | `369:49024` (1 set) | **gap**, same reasoning.

**Recommendation:** do not route these to the component-gap backlog as component asks — they are
document/report layouts that belong to whichever screen worker owns the report-detail routes. Only the
inline atoms inside them (signature capture, reason text, date) are potentially reusable, and those map to
existing Web primitives: `Textarea` `401:14` (reason), `AttachedFile` `401:29` (signature file).

---

## 3. Coverage summary (counts)

- Atomic/molecular components reconciled individually: **31**
  - covered: **0**
  - covered with delta: **9** (#4, #6, #8, #15, #18, #20, #23, #25, #26, #30 — note: 10 rows actually, recount below)
  - gap: **21**
- Report-template families (informational, out of component-library scope): **6 families / ~29 component sets**, all gap (see recommendation above — not actionable as component-library gaps)

Recount of "covered with delta" rows in §2.1: #4, #6, #8, #15, #18, #20, #23, #25, #26, #30 = **10 rows**.
Corrected: **0 covered / 10 covered with delta / 21 gap** out of 31 atomic components.

---

## 4. Delta list — six recently-added Web components vs. their iPad source counterparts

| Web component | Source counterpart checked | Delta |
|---|---|---|
| `Textarea` `401:14` | Answa/Answa 2 free-text answer rows (`221:69660`, `239:357820`) | Web's Textarea (280×116) is a bare multi-line field. Source's answer rows bundle the textarea with a question label and an inline attach-evidence affordance in the same row — Textarea alone does not carry that composition. Screen workers must compose Textarea + label + `AttachedFile`/attach icon to reach source parity; do not treat Textarea as a 1:1 replacement for the "Answa" family.
| `AttachedFile` `401:29` | Media Minis (`159:47720`), Multi Media Uploader Uploaded=Yes (`159:47691`) | Web's AttachedFile is a full-width (560×48) single-file row — filename + remove affordance. Source's Media Minis is a compact 64×64 square thumbnail chip with hover-reveal edit/delete, used in a grid, not a list. AttachedFile does not cover the thumbnail-grid layout or the hover state; still a **gap** for compact media chips specifically.
| `report-type-card` `401:47769` | No single direct source counterpart found by name; closest conceptually is the report-type selector implied by the Reports/Report Details family split (Summons/Incident/Violation/etc.) | Web version has 4 explicit states (Checked × Disabled). Source does not have an equivalent "pick a report type" card component on this page — the report-type choice appears to be screen-level (route/tab selection), not a reusable card in the source library. No delta to report against source; flag for the screen worker who owns the report-creation flow to confirm intent against the design file directly, since no source component of this name/shape exists on page `301:71625`.
| `page-back` `401:47774` | Top Bar (`134:24498`) back+title variants | Covered for the back-chevron + label only (see §2.1 row 4). Source Top Bar bundles back-nav with a progress indicator (Variant6) and an avatar slot (Variant3) that `page-back` does not carry. Confirm with screen workers whether those two states are needed per-screen or can be composed alongside `page-back`.
| `RemoteVideoTile` `401:47913` | No source component of this name/shape found on page `301:71625` | No iPad source counterpart exists in this component scope — remote video (multi-party call tile) appears to be a Web-only addition with no in-scope iPad component to verify against. Not a delta; flag as "no source baseline to compare" rather than a covered/gap verdict.
| `CaptureControls` `382:286` | Mic Button (`558:47312`) only partially overlaps (audio-record affordance) | Source has no single "capture controls" component; Mic Button covers voice-input triggering only. If `CaptureControls` also covers photo/video capture triggers, there is no source counterpart to check parity against for those modes — confirm against the design file directly (`design/final-cut/saqeel-revamp.html` per repo rule) rather than this component page.

---

## 5. Missing glyphs — confirmed

Web Icons page `73:2` was inventoried in full (60 named icons across `icon/nav/*`, `icon/ui/*`, and
`icon/adhub|adchrome/*` namespaces). Cross-checked against every icon/vector-like node name found across
the source Components page (`Trailing icon`, `Icon`, `Battery Icon`, `Leading Icon`, `Icon-Text-stack`,
`Button-Close`, `Featured icon`, `delete-02`, `Trail icon`, `Checkbox`, `checkmark`, `checkmark-circle-02`,
`download-04`, `Map pin`, `Pin`, `mic-01`, `mic-02`, `check-list`, `file-attachment`, `Feedback Icon`).

**Confirmed missing from the Web icon library** (present in source, absent from `73:2`):

- **Download** — source has `download-04`; Web icon library `73:2` has no `icon/ui/download` or equivalent.
- **Trash / Delete** — source has `delete-02`; Web icon library `73:2` has no `icon/ui/trash` or `icon/ui/delete`.
- **Microphone** — source has `mic-01`/`mic-02` (two states, used by Mic Button); Web icon library has no mic glyph.
- **Checkmark-in-circle / success confirmation** — source has `checkmark-circle-02` distinct from the plain `icon/ui/check` `73:6904`; Web only has the plain checkmark, not the circled-confirmation variant.
- **File-attachment** — source has `file-attachment` as a distinct glyph from `icon/ui/paperclip` `74:71`; unclear if paperclip is meant to stand in — flag for design confirmation rather than assuming equivalence.
- **Battery** — source has a `Battery Icon` (likely device-chrome, see §6) — not a Web gap, device status only.

Per instruction, no new icons are proposed here — this is a gap list only, to be actioned by whoever owns
icon-library additions.

---

## 6. Approved non-delivery — device chrome only

| Source node | Reason |
|---|---|
| `Battery Icon` (found inside Top Bar-adjacent chrome elements) | iPadOS status-bar chrome (battery indicator). Not an application component; approved non-delivery. |
| Top Bar variants that include a full-width fixed bar matching iPad's tablet safe-area (`134:24498` Property 1=Default/Variant2, 1179×112) | The fixed-width 1179px top bar matches iPad viewport chrome, not a responsive Web app-bar. The back-nav + title *content* inside it is in scope (see §2.1 row 4, §4 `page-back`); the fixed device-width framing is approved non-delivery. |
| Any instance of a floating action button positioned at fixed iPad screen coordinates (observed implicitly in Mic Button `558:47312` placement context, not a distinct named node) | Flagged for screen workers to confirm positioning context per screen; the component itself (Mic Button) is in scope as a gap (§2.1 row 21), only its fixed floating placement in the iPad chrome is non-delivery. |

No other source components in this inventory are device-chrome-only; the remaining 21 gaps and 10
covered-with-delta rows in §2.1 are genuine capability gaps or deltas, not chrome artifacts.

---

## 7. Prioritised gap list for screen workers

Ordered by how many downstream screens are likely blocked (highest first, based on how frequently the
underlying capability recurs across the inventory):

1. **Questions / Questions New / Questions New selection (4 separate component-set families, #2, #11, #12, #17, #19, #24)** — no composed inspection-question-row component anywhere on Web. Every inspection/question screen will hit this. Highest priority gap.
2. **Task Card / Task Card2 / Task Cards / Task Cards Test / Map Task Card (#1, #22, #28, #29, #31)** — no reusable task-card component. Second highest priority; blocks planning, execution, and map-task screens.
3. **Media Minis compact thumbnail chip (#5)** — `AttachedFile` is not a substitute (list row vs. thumbnail grid). Blocks any evidence-gallery screen.
4. **Checking list / structured checklist card (#9, #10)** — no composed checklist; must be hand-built from Table + Checkbox primitives per screen, risking inconsistency across screens unless W10 standardizes a pattern.
5. **Tabs / tab-strip navigation (#27)** — no page-level tab component found across all 13 Web library pages (only a filter-style `Segmented` exists). Blocks Factory 360 material-category tabs specifically.
6. **Answa / Answa 2 free-text answer rows (#13, #14)** — composable from `Textarea` but needs a standard wrapper pattern; flag to avoid five different ad hoc implementations.
7. **Mic Button / voice input (#21)** — no Web button variant carries mic iconography or a listening state; also blocked by the missing mic icon (§5).
8. **Big Map composed view (#20)** — primitives exist (`map-panel`, `map-marker`, `map-cluster`, `map-legend`) but no assembled full-bleed map screen component; lower priority since it is composable today.
9. **Missing glyphs (download, trash/delete, mic, checkmark-circle) — §5** — cross-cutting; blocks any screen using Media Minis, Multi Media Uploader, delete actions, or Mic Button until icons are added.
10. **Factory Detail Table Atom per-entity column templates (#25)** — Table row primitive exists; only the per-entity-type column mapping is unresolved, lowest urgency since it is a content-mapping task, not a missing component.

---

## 8. Constraints honored

- No raw hex, `rgb()`, px font size, or px radius proposed anywhere in this document — all references are
  to existing token-bearing component/variable ids.
- No deletion or deprecation proposed for any iPad component.
- No node was created, edited, moved, or deleted in either Figma file — this is a read-only build pack.

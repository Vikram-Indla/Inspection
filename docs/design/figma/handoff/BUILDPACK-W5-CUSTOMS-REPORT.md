# Build Pack — W5 — Customs Report (تقرير إعفاء جمركي)

**Worker:** W5-CustomsReport
**Source file:** `8wGaofgbopqmGXc0Wjo0eW` (MIM iPad Inspector App)
**Source page:** `↪ Customs Report - تقرير إعفاء جمركي` — node `639:79065`
**Web master file:** `ML2PNwfShlQM2k44MvSEw5` ("Inspection - Web")
**Web INSPECTOR REPORT FORMS section:** `336:45770`
**Status:** read-only build pack — no Web-master edits made or proposed as required writes. This
worker is not the master writer; W10-ReconciliationLedger applies any accepted change.

> This page was already drilled once, in round 3 of the prior iPad→Web disposition audit
> (`docs/design/figma/ipad-web-disposition.md`, "Customs Report inner" row, nodes `1960:94022` /
> `1962:7811`) and confirmed `reference-only`. This build pack re-derives that finding
> independently at full region detail and adds the visit-mode duplication analysis, screenshot
> evidence, and an explicit per-node classification table, per the W5 task contract.

---

## 1. Inventory — every frame, id, size on page `639:79065`

Per `SOURCE-SCREEN-CLASSIFICATION-2026-08-01.md`, this page has **4 frames, 12 other nodes** (16
total). Confirmed by direct `get_metadata` read:

| Node id | Name | Type | x,y | w×h | Role |
|---|---|---|---|---|---|
| `1960:94022` | Inspection Management | section | -2360,-2643 | 7087×3790 | Journey diagram, branch **"Field Visit" (زيارة ميدانية)** |
| `1960:94023`→`1960:94026` | Group 201 / Group 188 / Rectangle 37033 / Text | frame/text | 195,130 | 6763×379 | Green title bar: "Create new inspection plan – Report type – Customs Exemption – Field Visit" |
| `1960:94027` | **Establishment Details** | frame | 6124,951 | 834×2172 | Screen 1 (see §3.1) |
| `1960:94059`–`61` | Group 474 | frame/text | 5518,630 | 1440×200 | Annotation callout: "Inspection plan starts here" |
| `1960:94062`–`64` | Group 462 | frame/text | 3635,630 | 1647×200 | Annotation callout: conditional-visibility note (shared boilerplate copy, references "Chemical Clearance Report" — a copy-paste artifact from the sibling Chemical Clearance page, not customs-specific) |
| `1960:94065`–`68` | Group 444 | frame/text | 5841,1523 | 200×52 | Chip label: "الإعفاء الجمركي" (Customs Exemption) |
| `1960:94069` | **Inspection Items** | frame | 4448,906 | 834×1627 | Screen 2 (see §3.2) |
| `1960:108051`–`53` | Group 484 | frame/text | 2747,951 | 1593×445 | Annotation callout: "On 'Next', navigate to the establishment file per the same path used for the visit report" |
| `1962:8654`–`56` | Group 491 | frame/text | 5365,3194 | 1593×466 | Annotation callout: "When 'Customs Exemption Report' is selected, the plan dedicated to preparing the customs exemption report begins" |
| `1962:7811` | Inspection Management (2nd instance) | section | 0,4008 | 7087×3617 | Journey diagram, branch **"Remote" (عن بعد)** — structural duplicate of `1960:94022`, see §2 |
| `1962:7812`–`7889` | (mirrors of all nodes above under the Remote branch) | — | — | — | See §2 |

Total distinct **screen** frames on the page: **2** (`Establishment Details`, `Inspection Items`),
each instantiated twice — once per visit-mode branch. Everything else is journey-diagram
scaffolding (title bars, callout boxes, chip labels, arrows) — not screen content.

Icon check: no icons appear directly on this page outside of the standard component instances
(`Top Bar`, `Dropdown Input`, `Card`, `Button`, `Textarea`) already covered by the icon library at
`73:2`; nothing invented.

---

## 2. Deduplication — two visit-mode branches, one screen pair

| Canonical unique screen | Duplicate instances | Distinguishing content |
|---|---|---|
| **Establishment Details** (customs branch) | `1960:94027` (Field Visit branch) · `1962:7816` (Remote branch) | None in the form fields. The Remote-branch copy expands the `Location Verification` region inline (raw lat/long `Text Value` + `Map` children + a link) where the Field-Visit copy uses the collapsed `Location Verification` component instance (`422:32955`) — same underlying component, different diagram-authoring choice (unpacked vs. instanced). The Remote-branch `Photos` region additionally shows a populated photo (worker on a factory floor) vs. the Field-Visit copy's empty placeholder — a content-fixture difference, not a structural one. |
| **Inspection Items** (customs branch) | `1960:94069` (Field Visit branch) · `1962:7858` (Remote branch) | None. Field-for-field identical: same 5 dropdowns under "بيانات البنود" (Item data), same benefit-details block (radio pair + 2 dropdowns + textarea) under "تفاصيل الاستفادة" (Benefit details), same 2-button action row. |

Screenshots (both branch title bars) confirm the only rendered difference between the two
sections is the title-bar suffix — "**زيارة ميدانية**" (Field Visit) vs. "**عن بعد**" (Remote) —
and the placeholder photo/location-detail fixture noted above. This matches and reconfirms the
prior audit's round-3 finding ("Same generic pattern, no unique fields").

**Canonical node picked for the per-screen spec below:** `1960:94027` (Establishment Details,
Field Visit branch) and `1960:94069` (Inspection Items, Field Visit branch). The Remote-branch
copies (`1962:7816`, `1962:7858`) carry no additional field beyond the Location Verification
unpacking noted above, which is already covered by the shipped `LocationVerification` component.

---

## 3. Per-screen spec

### 3.1 Establishment Details — `1960:94027` (834×2172, iPad-portrait canvas)

| Region | Node | Fields / content | Web counterpart |
|---|---|---|---|
| Top Bar | `1960:94028` | Nav chrome (back, title, status) | Owned by shared `AppShell` (`field/layout.tsx`) — device chrome, not migrated per-screen (prior audit: `obsolete`, chrome is not duplicated per report type) |
| Photos | `1960:94030` | Photo capture/gallery widget, empty state in this instance | `EvidenceCard` (`160:44`) / `MediaThumb` (`318:118`) — reuse-as-component, DONE |
| Location Verification | `1960:94031` | Single collapsed instance — lat/long + map + address confirmation | `LocationVerification` (web `319:193`) — reuse-as-component, DONE (exact name match per prior audit) |
| Frame 1984078771 | `1962:7376`→`1962:7379` | One labeled `Dropdown Input` (generic, label text not distinguishing — establishment/site selector pattern shared across all report types) | Generic `Field`/dropdown pattern already shipped in Workspace/FactoryVerification screens |
| Frame 1984078769 | `1960:94036`–`39` | `Checkbox Label` (single checkbox, generic) | Same generic checklist-item pattern |
| Frame 1984078768 "نوع التقرير" (Report type) | `1960:94040`–`50` | Label + 2 rows × 3 `Card` instances (6 selectable report-type cards: field visit / customs / chemical / safety, etc., per the sibling pages' pattern) + `Textarea` free-text field | `Card` → web `PackageTypeSelector` / `.sq-typecard` pattern — reuse-as-component, DONE (shipped INSP-605); textarea is a generic notes field |
| Actions | `1960:94051`–`52` | Single full-width `Button` (submit/continue) | Standard action-bar pattern already shipped |
| Home Indicator | `1960:94053`–`54` | Device chrome | Not migrated — device chrome |

No governed values (no exemption rule, duty amount, or eligibility criterion) appear anywhere in
this frame. All fields are structural inputs (dropdown/checkbox/card-select/textarea), not
pre-filled business data.

### 3.2 Inspection Items — `1960:94069` (834×1627)

| Region | Node | Fields / content | Web counterpart |
|---|---|---|---|
| Top Bar | `1960:94070` | Nav chrome | Owned by `AppShell` — not migrated per-screen |
| "بيانات البنود" (Item data) | `1962:7560`–`7646` | Label + 5× `Dropdown Input` (generic item-selection dropdowns, no item-specific copy baked in) | `ChecklistQuestion` (web `165:110` / `317:137`) — reuse-as-component, DONE. This is the same generic checklist engine that the repo route `/field/inspection/[id]` already drives from `package_versions.definition`; the shipped item label `"Exemption beneficiary" / "مستفيد من الإعفاء"` (`apps/web/src/app/(app)/field/inspection/[id]/page.tsx:450`, `field.fv.itemCheck1`) is the checklist-item translation key already covering the customs-exemption concept named on this Figma frame. |
| "تفاصيل الاستفادة" (Benefit details) | `1962:7660`–`7790` | Label + `Label`/2-option `Radio Label` pair + 2× `Dropdown Input` + `Textarea` | Same `ChecklistQuestion` / `AnswerBar` (`318:107`) generic pattern — reuse-as-component, DONE |
| Actions | `1962:7810`, `1960:94096`–`98` | 2× `Button` (381px each — likely save/continue pair) | Standard 2-button action-bar pattern already shipped |
| Home Indicator | `1960:94099`–`100` | Device chrome | Not migrated |

No governed exemption rule, duty value, or eligibility threshold is present — every field here is
a structural input placeholder, consistent with CLAUDE.md rule 10 (never invent a governed value).

---

## 4. Web counterpart lookup — INSPECTOR REPORT FORMS (`336:45770`)

Read the Web master's INSPECTOR REPORT FORMS section directly (`get_metadata` on `336:45770`).
It contains exactly **4** frames:

| Frame | Route | Jira |
|---|---|---|
| Summons Notice | `/field/summons-notices` | INSP-558 |
| Sample Collection Report | `/field/sample-collection-reports` | INSP-573 |
| Non-Compliant Products Destruction Report | `/field/destruction-reports` | INSP-578 |
| Facility Report | `/field/facility-reports` | INSP-583 |

**No frame exists in this section for Customs Exemption, Chemical Clearance, or Safety** — the
three "standalone report" pages the iPad source treats as distinct screens are, on the Web side,
executed through the single generic checklist engine (`Workspace.tsx` / `FactoryVerification.tsx`
under `apps/web/src/app/(app)/field/inspection/[id]/page.tsx`), driven by
`package_versions.definition`, not as dedicated report-form frames. This matches
`CORRECTIONS-FROM-PARALLEL-AUDIT-2026-08-01.md`'s route table: `/field/inspection/[id]` —
chemical release · customs exemption · safety → **INSP-536 · INSP-538 · INSP-543**.

**Web counterpart node id for this page: NONE** (no dedicated frame in `336:45770` or elsewhere
in the Web master carries a 1:1 "Customs Exemption Report" identity — the capability is covered
functionally, not visually, by the generic checklist engine).

**Repo route already shipped:** `/field/inspection/[id]` (generic, package-definition-driven),
covering INSP-538 ("Execute a Customs Exemption inspection checklist and submit").

---

## 5. Classification — every node

| Node(s) | Classification | Reasoning |
|---|---|---|
| `639:79065` (page), `1960:94022`, `1962:7811` (journey-diagram sections) | **approved non-delivery** | Flow-diagram scaffolding (title bars, arrows, callout annotations) — a design-authoring artifact, never intended as a deliverable screen |
| Group 474, Group 462, Group 444, Group 484, Group 491/479 (all annotation callouts + chip labels, both branches) | **approved non-delivery** | Journey-map captions explaining branch logic to the design reviewer; no screen content |
| `1960:94027` Establishment Details (Field Visit) | **shared duplicate** | Instance of the canonical "Establishment Details" concept (75 occurrences source-wide per classification doc); already `migrated`/`reuse-as-component` in Web via `LocationVerification`, `EvidenceCard`/`MediaThumb`, `PackageTypeSelector`, generic Field/dropdown patterns |
| `1962:7816` Establishment Details (Remote) | **shared duplicate** | Same as above; the inline-unpacked Location Verification detail is still the same shipped `LocationVerification` component, just diagrammed differently |
| `1960:94069` Inspection Items (Field Visit) | **shared duplicate** | Instance of the canonical "Inspection Items" concept (23 occurrences source-wide); already `reuse-as-component` via `ChecklistQuestion`/`AnswerBar`, and functionally live in `/field/inspection/[id]` (INSP-538, item label `field.fv.itemCheck1`) |
| `1962:7858` Inspection Items (Remote) | **shared duplicate** | Field-for-field identical to `1960:94069` |
| Whole page as a distinct "Customs Report" standalone screen concept | **gap** (documentation gap only, not a build gap) | The iPad source treats "Customs Report" as if it were a 9th report-form type alongside the 4 shipped INSPECTOR REPORT FORMS (`336:45770`). It is not in that 9-set library on either side. The *capability* (INSP-538) is fully shipped through the generic checklist engine; the *visual artifact* (a dedicated Figma frame mirroring the other 4 report forms) does not exist in the Web master and none is proposed here, because no Jira story asks for a standalone Customs Exemption *report-form frame* distinct from the checklist execution flow already covering INSP-538. Flagging only, per standing instruction not to file gaps that lack Jira authorization. |

Classification counts: **2 shared duplicate concepts** (4 node instances total) · **1 gap**
(documentation-only, no build action) · **remaining ~10 nodes approved non-delivery**
(diagram scaffolding) · **0 migrated** (nothing new to migrate — capability already shipped
under a different, generic screen) · **0 obsolete**.

---

## 6. Proposed web frames

**None.**

No new Web-master frame is proposed for this page. Rationale:

1. Both screens on this page (`Establishment Details`, `Inspection Items`) are dedup'd to concepts
   already fully covered by shipped, reused Web components (§5) and are live in production at
   `/field/inspection/[id]` under INSP-538.
2. The Web master's INSPECTOR REPORT FORMS section (`336:45770`) intentionally contains only the
   4 report types that are *not* handled by the generic checklist engine (Summons Notice, Sample
   Collection, Destruction, Facility). Adding a 5th "Customs Exemption Report" frame there would
   duplicate a capability already delivered a different way, not close a gap.
3. Per CLAUDE.md rule 10 and the task's Jira-key constraint: no exact INSP story asks for a
   dedicated Customs Exemption report-form frame (INSP-538 asks for "execute a checklist and
   submit," which is what's shipped). Proposing a frame without that authorization would be
   inventing scope.

If a future story explicitly requests a standalone Customs Exemption report-form frame (mirroring
the 4 in `336:45770`), the field inventory in §3 above is ready to drive it directly — Jira key at
that time: **NONE** (no current story covers a standalone frame; only INSP-538 covers the checklist
capability, already shipped).

---

## 7. Gaps

- **Documentation-only gap:** the iPad source's mental model treats "Customs Report" as a 9th
  standalone report type; the Web master's 9-set report-form library (`336:45770` + reports
  elsewhere) has no such entry, nor does it need one — the capability is delivered through
  `/field/inspection/[id]`. No action requested; flagged per instruction to record every finding.
- No missing icon, no invented governed value, no broken component reference found on this page.

---

## Evidence

- Screenshots captured this session: `docs/design/figma/handoff/_assets/w5-customs-1960.png`
  (Field Visit branch, node `1960:94022`), `docs/design/figma/handoff/_assets/w5-customs-1962.png`
  (Remote branch, node `1962:7811`).
- Source: `get_metadata` on `8wGaofgbopqmGXc0Wjo0eW` node `639:79065` (this session).
- Web counterpart: `get_metadata` on `ML2PNwfShlQM2k44MvSEw5` node `336:45770` (this session).
- Prior audit cross-reference: `docs/design/figma/ipad-web-disposition.md` (round-3 "Customs
  Report inner" row), `docs/design/figma/handoff/SOURCE-SCREEN-CLASSIFICATION-2026-08-01.md`
  (page inventory), `docs/design/figma/handoff/CORRECTIONS-FROM-PARALLEL-AUDIT-2026-08-01.md`
  (route→Jira mapping), `docs/design/figma/jira-backlog-keys.md` (INSP-538 story text).
- Repo: `apps/web/src/app/(app)/field/inspection/[id]/page.tsx` (checklist item label
  `field.fv.itemCheck1` = "Exemption beneficiary" / "مستفيد من الإعفاء").

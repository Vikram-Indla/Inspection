# BUILD PACK — W4 — Chemical Clearance Report

**Source**: iPad file `8wGaofgbopqmGXc0Wjo0eW`, page `1939:56734` — "↪ Report - تقرير فسح كيميائي"
**Web master**: `ML2PNwfShlQM2k44MvSEw5`, delivery page `— SCREENS —` (`6:9`)
**Worker**: W4-ChemicalReport (build pack only — no master-file edits; W10-ReconciliationLedger applies)
**Date**: 2026-08-01

## 0. Governing precedent — read this first

This exact source node is already disposed in
`docs/design/figma/ipad-web-disposition.md` §1:

> Chemical Clearance Report (1939:56734) — تقرير فسح كيميائي | Standalone
> report type, NOT in the "Reports" component library (9 sets) |
> **reference-only — gap identified** | none | not filing a new Jira story
> per standing instruction; flagging only

and reconfirmed in the disposition doc's round-3 deep audit (line 259):
inner nodes `1939:56736` / `1950:126831` have "no unique fields" beyond the
three real category tabs, and the disposition is unchanged.

This build pack does not overturn that ruling. It drills to node level,
confirms it, and separates what inside this page is genuinely new
(chemical-specific structured fields — stays `gap`) from what is just an
instance of a component/pattern that is already migrated elsewhere (stays
`shared duplicate`, no new build). **Net effect: zero new web frames
proposed.** Per the Chemical Release story `INSP-536` being `[REUSE]` (not
`[GAP]`) in `jira-backlog-keys.md`, checklist *execution* for a Chemical
Release inspection is already covered by the generic execution workspace —
this page's report-type-specific intake fields are not.

## 1. Inventory

Page `1939:56734` contains exactly two top-level sections, each a full
mock of the same journey for a different visit mode:

| Section (node) | Name | Visit mode | Size |
|---|---|---|---|
| `1939:56736` | Inspection Management | **زيارة ميدانية** (Field Visit) | 7087×3962 |
| `1950:126831` | Inspection Management | **زيارة عن بعد** (Remote Visit) | 7087×4133 |

Each section is a row of frames for one journey. Frame inventory (Field
section; Remote section mirrors 1:1 with the node-id offsets in the dedupe
map, §2):

| Frame (node) | Name | Size | Role |
|---|---|---|---|
| `1939:56737` → `1939:56738` | Group 201 / Group 188 | 6763×379 | Slide title banner (presentation text, not app UI) |
| `1939:56741` | Establishment Details | 834×2172 | Screen 1 — establishment + report-type picker |
| `1939:85172` | Inspection Items | 834×2958 | Screen 2, tab "قائمة البنود" (Items List) — generic checklist |
| `1939:125133` | Inspection Items | 834×1975 | Screen 2, tab "المواد الخام" (Raw Materials) |
| `1939:126076` | Inspection Items | 834×1771 | Screen 2, tab "المواد الكيميائية" (Chemical Materials) |
| `1939:126459` | Inspection Items | 834×1771 | Screen 2, tab "المنتجات" (Products) |
| `1939:64615`, `1939:85168`, `1939:64612`, `1939:60344`, `1939:81292` | Group 211/474/462/444/473 | varies | Dark rounded-rect presentation callouts + arrow (annotation, not app UI) |
| `1939:81289`, `1939:126387`, `1939:126726` | loose TEXT | small | Caption labels above the tab-content frames (presentation only) |

Screen 2 ("Inspection Items") is **one screen with 4 tab states**, not 4
screens — confirmed by the `Tabs` frame present in every one of the four
instances (`1939:125099` etc.), containing 7 `Chip` instances: 3 hidden
(other report types' tabs, hidden because irrelevant to Chemical
Clearance) + 4 visible = قائمة البنود / المواد الخام / المواد الكيميائية /
المنتجات. This matches and reconfirms `ipad-web-disposition.md` §5's
"Tabs (2068:157047)" finding.

## 2. Dedupe map

No true accidental duplicates/scratch copies exist on this page — every
frame is either a real tab state or a real visit-mode variant. The map
below is variant equivalence, not waste:

| Canonical unique screen/state | Field-visit node | Remote-visit node | Delta |
|---|---|---|---|
| Establishment Details | `1939:56741` | `1950:126836` | Remote replaces the address/map block with a meeting-link + video-evidence capture (see §3.1) |
| Inspection Items — Items List (default tab) | `1939:85172` | `1950:126878` | content identical; Remote frame is taller (extra embedded video placeholder, presentation-only) |
| Inspection Items — Raw Materials tab | `1939:125133` | `1950:126911` | content identical bar one added presentation video placeholder |
| Inspection Items — Chemical Materials tab | `1939:126076` | `1950:126950` | content identical bar one added presentation video placeholder |
| Inspection Items — Products tab | `1939:126459` | `1950:126987` | content identical bar one added presentation video placeholder |

The "Slide 16:9 - 1" frames appended inside several Remote-section nodes
(`1962:8728`, `1950:176087`, `1950:176117`, `1950:176177`, `1950:176237`)
are embedded walkthrough-video placeholders used for the presentation
deck, not inspector-facing UI elements — classified `approved
non-delivery` (see §4).

## 3. Per-screen spec

### 3.1 Establishment Details

Regions, top to bottom, both variants share the same shell:

| Region | Elements | Controls | States |
|---|---|---|---|
| Top Bar | back arrow + title "تفاصيل المنشأة" | nav | — |
| صورة المنشأة (Establishment photo) | hero image, "تغيير صورة المنشأة" overlay button | file/photo capture | populated / (empty not shown) |
| بيانات المنشأة (Establishment data) | اسم المنشأة (name, read-only text), حالة المنشأة (status badge, e.g. "تأسيس") | badge | — |
| مواقع المنشأة (Establishment locations) — **Field variant** | عنوان الزيارة المسجل / عنوان الزيارة الفعلي (two addresses), embedded map with pin + establishment card overlay | Map | — |
| مواقع المنشأة — **Remote variant** (replaces the block above) | رابط الدخول لزيارة المسجل / الفعلي (two Google Meet-style URLs, tappable/copyable text-value rows), meeting name row, meeting password row, and an embedded photo/video-call still with mic + expand icon overlay | Text Value ×3, Map-pattern container, media control icons | — |
| إعدادات الزيارة (Visit settings) | نوع الزيارة dropdown ("رقابية مستهدفة"), "تعذر تنفيذ الزيارة" checkbox | Dropdown Input, Checkbox Label | — |
| نوع التقرير (Report type) | 2×3 grid of selectable `Card`s: تقرير فسح كيميائي (pre-selected, checked, active/green outline), رصد تحدي, تقرير زيارة, افادة الزيارة, تقرير سلامة, تقرير إعفاء جمركي | Card (radio-style selectable card) | selected (green check) / unselected / — no disabled state shown |
| الملاحظات (Notes) | free-text notes, pre-filled with placeholder-style Arabic paragraph | Textarea | populated |
| Actions | single full-width primary button "بدأ إعداد الخطة" | Button | — |

No chemical-specific governed values appear here beyond a category label
("تقرير فسح كيميائي" as a report-type name) — no thresholds, limits, or
clearance rules are present or invented.

### 3.2 Inspection Items — Items List (default tab)

| Region | Elements | Controls | States |
|---|---|---|---|
| Top Bar + stepper | 5-step visit-journey stepper (تفاصيل الحاضر / الحاضر / نتائج الزيارة / ملف المنشأة / قائمة البنود — last step active) | stepper | active step highlighted |
| Tabs | قائمة البنود (active) / المواد الخام / المواد الكيميائية / المنتجات, + 3 hidden chips (other report types' categories, not applicable here) | Chip | selected / unselected / hidden |
| Inline Alert | guidance banner ("يرجى تحديد حالة التطبيق للمنتجات في عملية التفتيش") | Inline Alert | — |
| Filter action | "قائمة التحقق" button | Button | — |
| Item cards ×6 ("Questions New" instances) | item number/badge, item title (Arabic long-form), "الإجراءات والقطاعات" expandable, حالة التطبيق radio group (لا يوجد / منتهي / ساري, one shown selected), on the second visible card: attached ملاحظات text, file evidence chips (PDF ×2), notes textarea | Radio group, FileUpload/evidence chip, Textarea | some items collapsed/toggle-off, one expanded with evidence + notes, one selected "ساري" |
| Pagination | page 1–5 numbered pager + prev/next | Pagination, Button | page 1 active |
| Actions | "التالي" (primary) / "السابق" (secondary) | Button ×2 | — |

This tab is a generic compliance-checklist executor — same pattern as
every other report type's item list, already migrated to the repo's
generic execution workspace.

### 3.3 Inspection Items — Raw Materials tab (المواد الخام)

Field groups (all `Dropdown Input` / `Textarea` unless noted):

- **البيانات الأساسية**: المواد الخام (dropdown), رمز البند (text)
- **الفسح الكيميائي**: هل يوجد فسح كيميائي؟ (dropdown, e.g. "استيراد"), رمز المخاطرة حسب تصنيف النظام المتسق العالمي لتصنيف المواد الكيميائية (GHS) (text, read-only display of a governed classification code)
- **بيانات الاستيراد**: اسم الدولة التي تم الاستيراد منها (text)
- **استخدام المادة الخام**: هل تم استخدام كامل الكمية في العملية التصنيعية؟ (radio نعم/لا), وصف واستخدام المادة الخام (textarea), تصنيف الاحتياج للمادة الخام (dropdown)
- **بيانات الإنتاج**: اسم المنتجات التي تم تصنيعها بواسطة المادة الخام المذكورة (text), تداول المنتج النهائي محليًا (dropdown)

The GHS hazard-code field renders a value in this mock; per Rule 10 no
such classification/threshold value may be invented on the web side — an
absent value must render `Not configured`.

### 3.4 Inspection Items — Chemical Materials tab (المواد الكيميائية)

- **الحالة التنظيمية**: radio group (نعم/لا) with label describing regulatory status
- **البيانات الكيميائية**: 3× Dropdown Input
- **الاتفاقيات الدولية**: 1× Dropdown Input
- **استخدام المادة**: 2× Dropdown Input
- **بيانات الإنتاج**: 1× Dropdown Input

### 3.5 Inspection Items — Products tab (المنتجات)

- **بيانات المنتج**: 3× Dropdown Input
- **الفسح التصديري**: radio group (نعم/لا)
- **بيانات التصدير**: radio group + 2× Dropdown Input
- **السلامة الكيميائية**: radio group + 1× Dropdown Input

Tabs 3.3–3.5 share one Actions footer (التالي / السابق) and one Home
Indicator, same pattern as 3.2.

## 4. Web counterpart check

- `apps/web/src/app/(app)/field/chemical-clearance*` — **does not exist**
  (confirmed by filesystem search).
- Web master `INSPECTOR REPORT FORMS` section `336:45770` contains exactly
  4 frames: Summons Notice (`336:45771`), Sample Collection Report
  (`336:45779`), Non-Compliant Products Destruction Report (`336:45787`),
  Facility Report (`336:45795`). **No Chemical Clearance frame present.**
- `apps/web/src/app/(app)/field/inspection/[id]/page.tsx` +
  `Workspace.tsx` is the generic, package-driven execution workspace
  (item response capture, evidence, notes, submission) that already
  covers "execute a checklist and submit" for any package kind, including
  a Chemical Release package — this is the real counterpart for §3.2's
  Items List tab content, and it is what `INSP-536 [REUSE]` refers to.
- No route, frame, or component anywhere in the web master implements the
  chemical-specific structured intake fields in §3.1 (report-type card),
  §3.3, §3.4, §3.5.

## 5. Node classification

| Node(s) | Classification | Reasoning |
|---|---|---|
| `1939:56737`/`1939:56738`, `1950:126832`/`1950:126833` (title banners) | approved non-delivery | Presentation slide title text, not app chrome |
| `1939:64615`, `1939:85168`, `1939:64612`, `1939:60344`, `1939:81292`, `1950:126865`, `1950:126868`, `1950:126871`, `1950:126874`, `1950:127036` (dark callout groups) | approved non-delivery | Deck annotation callouts/arrows, confirmed by screenshot — not rendered inspector UI |
| `1939:81289`, `1939:126387`, `1939:126726`, `1950:127033`, `1950:127034`, `1950:127035` (loose caption text) | approved non-delivery | Presentation captions above frames |
| `1962:8728`, `1950:176087`, `1950:176117`, `1950:176177`, `1950:176237` ("Slide 16:9 - 1" video placeholders, Remote variant) | approved non-delivery | Embedded walkthrough-video stand-ins for the deck, not an inspector-facing control |
| Top Bar instances (`1939:56742`, `1939:85173`, `1939:125134`, `1939:126077`, `1939:126460`, and Remote equivalents) | shared duplicate — covers: repo `apps/web/src/app/(app)/field/layout.tsx` AppShell chrome | Per `ipad-web-disposition.md` §2: "Top Bar … obsolete … device chrome; web owns nav once via shared AppShell" |
| Home Indicator frames (all) | approved non-delivery | Device chrome |
| Establishment Details shell (`1939:56741` minus report-type card + Remote-specific fields; `1950:126836` same) | shared duplicate — covers: generic Establishment Details pattern used across every other report type on this file | Photo, address/map or meeting-link block, visit-settings dropdown, notes textarea are the identical generic pattern; no chemical-specific content in this sub-region |
| نوع التقرير report-type Card grid (`1939:56756`, `1950:126851` and children) | gap | The "تقرير فسح كيميائي" selectable card and its pre-selected state are specific to this journey; no web equivalent renders a Chemical Clearance report-type option (web's 4-frame report library doesn't include it) |
| Inspection Items — Items List tab, incl. Tabs/Inline Alert/Questions New/Pagination/Actions (`1939:85172`, `1950:126878` and descendants) | shared duplicate — covers: repo `/field/inspection/[id]` (`Workspace.tsx`), generic package-driven checklist executor | INSP-536 is `[REUSE]`; the generic execution workspace already renders item cards, evidence, notes, pagination, and submit actions for any package including Chemical Release |
| Inspection Items — Raw Materials tab content (`1939:125133`/`1950:126911`, field groups only) | gap | No web frame or component renders these chemical-specific structured fields (GHS hazard code, raw-material usage, import-country) |
| Inspection Items — Chemical Materials tab content (`1939:126076`/`1950:126950`) | gap | No web frame or component renders regulatory-status radio + chemical-data dropdowns |
| Inspection Items — Products tab content (`1939:126459`/`1950:126987`) | gap | No web frame or component renders export-clearance/export-data/chemical-safety fields |
| Generic controls reused throughout (Card, Dropdown Input, Textarea, Checkbox Label, Radio Label, Chip, Inline Alert, Button, Pagination, Text Value, Map) | shared duplicate — covers: iPad component library page `301:71723`, already reconciled against Web in `ipad-web-disposition.md` §2 | Same instances used file-wide; not unique to this page |

## 6. Proposed web frames

**None proposed.** This build pack finds no basis to overturn the
existing `reference-only — gap identified` ruling in
`ipad-web-disposition.md`. The three chemical-specific field groups
(§3.3–3.5) and the report-type card (§3.1) are the only genuinely new
content on this page, and per the standing instruction referenced in that
file, a gap is flagged, not built, absent an authorizing Jira story. No
story in `jira-backlog-keys.md` or `JIRA-COVERAGE-2026-08-01.md` covers
"Chemical Clearance report-specific intake fields" — `INSP-536` covers
generic checklist execution (already reused), not this content.

If a future story authorizes the build, the natural target would be:

| Would-be frame | Route | Persona | Jira key | Library components |
|---|---|---|---|---|
| Chemical Clearance — Report Type option | extends existing report-type picker inside `/field/inspection` establishment step | Inspector | NONE (no covering story) | existing `Card` selectable-card pattern |
| Chemical Clearance — Raw Materials / Chemical Materials / Products intake | extends `/field/inspection/[id]` Workspace with a package-specific section renderer | Inspector | NONE (no covering story) | existing `Dropdown Input`, `Textarea`, `Radio Label` |

Both rows are documentation of the eventual shape only — **not** a build
authorization.

## 7. Gaps summary

1. Report-type selector card for "تقرير فسح كيميائي" — no web equivalent.
2. Raw Materials structured intake (GHS hazard code, import country, raw
   material usage) — no web equivalent; GHS code is governed data and
   must never be invented — render `Not configured` if ever built.
3. Chemical Materials structured intake (regulatory status, chemical
   data, international agreements, material use) — no web equivalent.
4. Products structured intake (product data, export clearance, export
   data, chemical safety) — no web equivalent.
5. Remote-visit meeting-link/video-evidence capture block on
   Establishment Details — no web equivalent found in this pass (out of
   this page's primary scope; flagged for whoever owns the generic
   Establishment Details / Remote Visit pattern).

No icon outside the icon library (`73:2`) was used or required — media
capture icons (camera, mic, expand) match the existing `Photos`/Media
Minis component already reconciled in `ipad-web-disposition.md`.

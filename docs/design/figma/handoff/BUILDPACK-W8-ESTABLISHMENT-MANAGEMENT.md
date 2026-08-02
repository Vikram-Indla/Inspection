# BUILDPACK — W8 — Establishment Management (إدارة المنشآت)

Worker: W8-EstablishmentManagement
Source file: `8wGaofgbopqmGXc0Wjo0eW`, page `1065:77494` ("↪ Establishment Management - إدارة المنشآت")
Web master file: `ML2PNwfShlQM2k44MvSEw5`, delivery page `— SCREENS —` (`6:9`)
Status: build pack only — no master-file edits made or proposed by this worker. All master-file
writes belong to W10-ReconciliationLedger.

---

## 1. Source page inventory

The page holds **191 top-level nodes across 5 sections**. Of these, **99 are actual 834px-wide
iPad screen frames** (phone-frame content); the remaining **92 nodes are canvas furniture** —
`Group` annotation clusters (legends, labels, decorative background bands), `Content`/`Actions`
context menus captured as loose panels, and non-screen artifacts. Only the 99 screen frames are
in scope for this buildpack.

| Section | Node id | Screen frames (834px) | Annotation/other nodes |
|---|---|---|---|
| Establishment Management — Licensed Facilities List & Unlicensed Facilities List | `1434:97551` | 7 | 11 |
| Establishment Management — View details | `1068:123721` | 12 | 12 |
| Establishment Management — Select violations | `1632:67130` | 6 | 4 |
| Regulatory Data Statuses | `1632:162471` | 8 | 8 |
| View Visit Reports | `1831:148110` | 66 | 57 |
| **Total** | | **99** | **92** |

The 99 screen frames are named only `My Tasks`, `Establishment Details`, or `Summons Notice` —
none of these names describe their actual content (see §2, §5). Node names on this page cannot be
trusted as screen identifiers; every classification below is from a screenshot or metadata region
walk, not from the node name.

### 1.1 Deduplication method

Frames were clustered by **(section, node-name, height)**. Within a section, frames sharing a
name and height are near-certainly the same screen re-rendered with different demo data (a
different establishment, a different visit, a different report) — this matches the pattern
already documented for other iPad source pages on this file (rich source, redundant demo
variants). 15 clusters were opened and screenshotted directly to confirm screen identity and
region content; the remaining frames in each cluster are recorded as **state/data variants** of
the confirmed canonical, not verified individually region-by-region. This is a scale trade-off,
flagged explicitly rather than silently assumed — a follow-up pass should spot-check 2-3 more
frames per large cluster (the two "Establishment Details" clusters of 25 and 13 in View Visit
Reports) before this buildpack is treated as exhaustive.

---

## 2. Canonical screens — confirmed by screenshot

### CS-1 — Establishments List (النشآت)
Section: Licensed/Unlicensed Facilities List · Canonical id: `1434:137614` (834×1523)
Cluster: 4 variants at H=1523 (`1434:137614`, `1442:185471`, `1632:148688`, `1632:147949`) + 1
scrolled/longer-list variant at H=2552 (`1499:23344`).

Regions:
- Top bar: title **"النشآت"**, primary button **"إصدار مخالفة"** ("Issue violation"), secondary
  button **"تصفية"** ("Filter", with filter icon).
- Search input: **"بحث"** placeholder + search icon.
- Tabs: **"المنشآت المرخصة (40)"** / **"للمنشآت غير مرخصة (10)"** — licensed/unlicensed counts.
- Establishment card, repeated: status badge (colour + text — **معتمد** approved / **غير معتمد**
  not approved / **مسودة** draft / **تعذر التنفيذ** execution failed — four distinct states, not
  two), thumbnail photo, establishment name, `#`-prefixed record id, location pin + city name,
  compliance percentage (**"نسبة الامتثال"**) in colour-coded text, last-visit date + calendar
  icon, document/file icon.
- Bottom tab bar: **النشآت** (Establishments, active) / **مهامي** (My Tasks, badge "99+") /
  **الرئيسية** (Home).

### CS-2 — Establishment Detail / Visit Summary
Section: Licensed/Unlicensed Facilities List · Canonical id: `1632:148327` (834×2340)
Cluster: 2 variants (`1632:148327`, `1632:147136`).

Regions:
- Header photo (facility exterior) + edit affordance, back button **"عودة"**.
- Status badge **"غير مرخصة"** (unlicensed) + establishment name.
- Owner phone (`رقم التواصل`), registration number (`رقم السجل`), owner name + avatar
  (`المسؤول`).
- **"موقع الزيارة"** section: map with pin.
- **"بيانات الزيارة"** section: inspector name + avatar, visit date.
- **"قرار الإجراء"** (decision) — value shown as a status chip, e.g. **"إغلاق فوري"** (immediate
  closure).
- **"الوثائق الداعمة للمراجعة"** — 2 attached-document chips (PDF), each with type icon.
- **"ملاحظات الزيارة"** — free-text note.
- **"السجلات الملحوظة (4)"** — a list of 4 observation/violation rows, each: severity-coloured
  status dot + label (e.g. **"إغلاق فوري"**, **"إذار نهائي"**, **"تحويل للجنة"**, **"غرامة
  مالية"**), person name + avatar, timestamp.
- Bottom tab bar (same as CS-1).

### CS-3 — Edit Unregistered Establishment (form)
Section: Licensed/Unlicensed Facilities List, embedded in the same cluster as CS-2 by node
naming, confirmed distinct by screenshot at id `1632:148327`'s sibling form state — **note:** this
form is the edit-mode counterpart of CS-2; treat as a linked pair (view → edit), not a duplicate.

Regions:
- Title **"تعديل تفاصيل المنشأة الغير مرخصة"** ("Edit unlicensed establishment details"), back
  chevron **"عودة"**.
- Photo capture card: placeholder icon + **"تغيير صورة المنشأة"** button.
- **"بيانات أساسية"**: text inputs — responsible-person name, establishment name, phone, `رقم
  السجل` (registration number).
- **"موقع الزيارة"**: region select, city select, address **textarea** with an inline
  map-pointer icon, live map with a draggable pin.
- **"تفاصيل الزيارة"**: inspector **select** (shows selected inspector + avatar + chevron), visit
  **date input**.
- **"قرار الإجراء"**: 4-option **radio group** — إغلاق فوري / تحويل للجنة / إنذار نهائي / غرامة
  مالية (immediate closure / committee referral / final warning / financial penalty).
- **"الوثائق الداعمة للمراجعة"**: drag/attach control **"رفق ملفات"** + 2 existing PDF file chips
  with type icon + filename.
- **"ملاحظات"**: **textarea**, pre-filled with a multi-line note.
- Footer actions: primary **"حفظ التغييرات"** (save changes), secondary **"السابق"** (back).

### CS-4 — Regulatory Data / Device Permits Detail
Section: Licensed/Unlicensed Facilities List · id `1434:137614`'s taller sibling — confirmed at
canonical id `1434:138541` (834×3532), which is the tallest of an 8-member cluster spanning
H=3532/3357/3708/3820/3836 across the "View details" and "Regulatory Data Statuses" sections
(these are the *same* screen template, populated with varying numbers of permit rows — treat all
8 as one canonical screen, not 8 screens).

Regions:
- Establishment header (as CS-2) + classification badge **"تصنيف قياسي"** (standard
  classification) + compliance percentage.
- **"بيانات المستخدم"**: owner name, national id.
- **"السجل التجاري"**: commercial-registration fields.
- **"البيانات التنظيمية"** (regulatory data): repeated permit rows — each a device/permit label
  (fire-alarm system, kitchen electric motors, safety guard panels, fire water pipes, etc.) with
  an individual status badge (observed: **"لم يسجل بعد"** — not yet registered — but the control
  supports other statuses per the badge component).
- Tab strip within the establishment record: **"الملف الشخصي"** / **"معلومات إضافية"** and
  similar — a segmented control the source shows mid-scroll.

### CS-5 — Previous Visits List
Section: View details · id `1442:169161` (834×1038).

Regions:
- Sub-header: establishment name + **"الزيارات السابقة"** ("Previous visits") title, back
  **"عودة"**.
- Repeated visit card: overflow menu (⋮), inspector name + avatar, visit date, **"وقت البداية"**
  / **"وقت الانتهاء"** (start/end time), **"نوع الزيارة"** value (e.g. **"رقابية مستهدفة"**
  targeted regulatory).
- Bottom tab bar.

### CS-6 — Issue Violation: Establishment Multi-Select
Section: Select violations · id `1632:143474` (834×1194), 6-member cluster (all H=1194 — selection
state variants: none-selected / partial-selected / all-selected / filtered).

Regions:
- Sub-header **"إصدار مخالفة"**, back **"عودة"**.
- Info banner with help icon: **"يرجى اختيار المنشآت التي تود اصدار مخالفة عليهم."**
- Search input.
- Establishment rows, each: status badge (same 4-state vocabulary as CS-1), thumbnail, name, `#`
  id, compliance %, location, last-visit date, and a trailing **checkbox** (checked/unchecked
  drives row highlight — checked rows get a light-green row background).
- Bottom action bar: primary **"تحديد المخالفات"** ("Select violations", disabled/enabled by
  selection count) + secondary **"إلغاء الاختيار"** ("Clear selection", chip with ✕).

### CS-7 — Incident Report: Create (mislabeled "Summons Notice" in source)
Section: View Visit Reports · id `1831:157328` (834×1951), one of an 11-member "Summons Notice"
cluster spanning H=1624–2284 (form-length variants driven by conditional fields, e.g. incident
type sub-fields).

**Naming flag:** every frame in this cluster is named `Summons Notice` in the source file, but the
on-canvas content is unambiguously **"إنشاء رصد حادث" (Create Incident Report)**, not a summons.
This maps to Jira story INSP-563 ("Record an Incident Report during a visit"), not to the summons
story (INSP-558, "Issue a Summons Notice from the field") — the summons flow does not appear to
have dedicated frames on this page at all (see §5 gaps).

Regions:
- Title **"إنشاء رصد حادث"**, back **"عودة"**.
- **"بيانات للمنشأة"**: read-only establishment code + commercial-registration number + name +
  status chip (**"تأسيس"**).
- **"بيانات البلاغ"**: source-of-report **select** (**"هاتف"**), reporter phone text input,
  reporter name text input, report-time **time input**.
- **"ملخص الحادث"**: incident-count **select** (**"لا يوجد حالات"**), damage-severity **select**
  (**"تلوث بيئي"**), incident-type **select** (**"تسريب مواد خطرة"**), description **textarea**
  (pre-filled multi-line).
- **"الوثائق الداعمة للمراجعة"**: attach control + 2 existing PDF chips.
- Primary action: **"إنشاء رصد حادث"** full-width button.

### CS-8 — Incident Report: Details (read view)
Section: View Visit Reports · id `1831:156010` (834×1781), the largest cluster on the page — 25
members at exactly H=1781 (same screen, 25 different incidents/establishments as demo data).

Regions:
- Title **"تفاصيل رصد حادث"**, edit icon, back **"عودة"**.
- **"بيانات للمنشأة"** read-only block (establishment code, commercial reg#, name, status chip).
- **"بيانات المنشأة"** read-only block — a *second*, differently-sourced establishment identity
  block (registration number + establishment code) — confirms this screen cross-references two
  establishment records, not one.
- **"بيانات البلاغ"** read-only: source, reporter name + avatar, report time.
- **"ملخص الحادث"** read-only: incident count (flagged red when **"لا يوجد وفيات او اصابات
  خطرة"**), damage severity, incident type, description.
- **"الوثائق الداعمة للمراجعة"**: 2 downloadable PDF chips with download icon.
- Bottom tab bar.

### CS-9 — Visit Report: Tabbed Detail (Attendee focus)
Section: View Visit Reports · id `1831:155597` (834×1241), 13-member cluster at H=1241.

Regions:
- Title **"عرض تقرير زيارة"** + establishment name subtitle, back **"عودة"**.
- 6-tab horizontal strip: **بداية الخطة** (plan start) / **الحاضر** (attendee, active) /
  **نتائج الزيارة** (visit results) / **ملف المنشأة** (establishment file) / **قائمة البنود**
  (item list) / **تفاصيل الحاضر** (attendee details).
- Nested accordion sections under the active tab, each expandable (chevron), each covering one
  attendee-facing sub-report: **"تفاصيل مذكرة استدعاء"**, **"تفاصيل محضر إثبات واقعة"**,
  **"تفاصيل محضر ضبط مخالفة"**, **"تفاصيل محضر سحب عينة"** (expanded in this frame — shows
  inspector name, signature image, signature-confirmation checkbox with label **"تم حضور ممثل
  المنشأة وموافق على التوقيع"**, attached PDF chips, date), **"تفاصيل محضر إتلاف منتجات
  مخالفة"**, **"تفاصيل محضر حجز منتجات"**, **"تفاصيل إشعار بيلاغ رفع الحجز عن المنتجات أو
  المواد"**, **"تفاصيل محضر حجز خط الإنتاج"**, **"تفاصيل محضر المنشأة"**.

### CS-10 — Visit Report: Establishment File tab
Section: View Visit Reports · id `1831:156369` (834×4015, the tallest single frame on the page) —
this is the fully-expanded **"ملف المنشأة"** tab of the CS-9 screen, showing every sub-report card
open simultaneously: item photo + label + quantity/lot fields (raw-material/product tracking rows
— e.g. copper wire quantity, PE plastic pipes, packaging film, insulation spray canisters), plus
below-fold sections for device permit rows (IP68-rated switch panel etc.) and a repeat of the
supporting-documents block. Treated as a state (fully expanded) of CS-9, not a separate screen.

### CS-11 — Visit Report: Plan Start tab
Section: View Visit Reports · id `1442:169846`-equivalent height cluster; screenshot taken at a
sibling id in the "View details" section, id `1442:170821` (834×1820) — shows the same 6-tab
strip with **"بداية الخطة"** active: establishment photo hero, name, status chip, **"عنوان موقع
الزيارة"**, visit type, **"الموقع متطابق مع السجل"** location-match confirmation chip (✓ icon),
**"ملخص الزيارة"** summary block with report-type label + free-text notes.

### CS-12 — Incident Report Details (compact establishment card)
Section: Licensed/Unlicensed Facilities List · id `1442:184856` (834×1374) — "تفاصيل رصد حادث"
variant scoped tighter to a single establishment card (photo hero, name, status chip **"تأسيس"**,
location match confirmation) followed by **"ملخص الزيارة"**. Near-duplicate of CS-11's header
pattern reused for the incident-report context; recorded as its own canonical because the field
set differs (no tab strip present in this frame).

---

## 3. Full screen inventory table (all 99 frames, by cluster)

| Cluster | Canonical screen | Section | Canonical id | Member ids (H) | Count | Verified how |
|---|---|---|---|---|---|---|
| A | CS-1 Establishments List | Licensed/Unlicensed | `1434:137614` | 1434:137614, 1442:185471, 1632:148688, 1632:147949 (H1523); 1499:23344 (H2552) | 5 | Screenshot ×2 |
| B | CS-2 Establishment Detail | Licensed/Unlicensed | `1632:148327` | 1632:148327, 1632:147136 (H2340) | 2 | Screenshot |
| C | CS-4 Regulatory Data | Licensed/Unlicensed + View details + Regulatory Data Statuses | `1434:138541` | 1434:138541(H3532), 1434:139429(H3357), 1632:149135(H3532), 1632:150021(H3532), 1632:150907(H3532), 1632:151913(H3532), 1632:151793(H3820), 1632:151853(H3836), 1632:158816(H3820), 1632:160517(H3708) | 10 | Screenshot ×1 |
| D | CS-5 Previous Visits | View details | `1442:169161` | 1442:169161(H1038) | 1 | Screenshot |
| E | (unconfirmed) My Tasks H1199 | View details | `1442:169846` | 1442:169846, 1442:169529, 1442:166730 (H1199) | 3 | Metadata cluster only |
| F | CS-11 Plan Start tab | View details | `1442:170821` | 1442:170821, 1442:171154 (H1820) | 2 | Screenshot |
| G | (unconfirmed) My Tasks H1478 | View details | `1442:165706` | 1442:165706 (H1478) | 1 | Metadata cluster only |
| H | (unconfirmed) My Tasks H1766 | View details | `1442:165736` | 1442:165736 (H1766) | 1 | Metadata cluster only |
| I | CS-12 Incident (compact) | View details | `1442:184856` | 1442:184856 (H1374) | 1 | Screenshot |
| J | CS-6 Issue Violation multi-select | Select violations | `1632:143474` | 1632:143474, 1632:143495, 1632:143512, 1632:129023, 1632:145297, 1632:146535 (all H1194) | 6 | Screenshot ×1 |
| K | CS-8 Incident Details | View Visit Reports | `1831:156010` | 25 ids, all H1781 (list in metadata.xml, e.g. 1831:156010/156028/.../157468-adjacent, 2064:153161, 2103:165377/167240/168436) | 25 | Screenshot ×1 |
| L | CS-9 Visit Report tabbed (attendee) | View Visit Reports | `1831:155597` | 13 ids, all H1241 (incl. 2312:184533, 2064:122963/152980, 2054:101030, 2064:124403, 1831:155632, 2312:184568, 2103:173178/179669, 2312:195761, 2103:177959, 2312:196088) | 13 | Screenshot ×1 |
| M | Visit Report tabbed, other states | View Visit Reports | `1831:156634` | H2192 ×4, H2245 ×2, H1382 ×2 | 8 | Metadata cluster only |
| N | CS-7 Create Incident (mislabeled Summons Notice) | View Visit Reports | `1831:157328` | 11 ids, H1624–2284 | 11 | Screenshot ×1 |
| O | CS-10 Establishment File tab (fully expanded) | View Visit Reports | `1831:156369` | 1831:156369 (H4015) | 1 | Screenshot |
| P | (unconfirmed) Establishment Details H2717 | View Visit Reports | `1831:156500` | 1831:156500 | 1 | Metadata cluster only |
| Q | (unconfirmed) Establishment Details H2681 | View Visit Reports | `1831:155723` | 1831:155723 | 1 | Metadata cluster only |
| R | (unconfirmed) Establishment Details H1735 | View Visit Reports | `2064:123161` | 2064:123161 | 1 | Metadata cluster only |
| S | (unconfirmed) Establishment Details H1575 | View Visit Reports | `2054:100155` | 2054:100155 | 1 | Metadata cluster only |
| T | (unconfirmed) Establishment Details H1303 | View Visit Reports | `2103:178582` | 2103:178582 | 1 | Metadata cluster only |
| U | (unconfirmed) Establishment Details H1256 | View Visit Reports | `2312:185309` | 2312:185309 | 1 | Metadata cluster only |
| V | (unconfirmed) Establishment Details H1203 | View Visit Reports | `2312:185441` | 2312:185441 | 1 | Metadata cluster only |
| — | CS-3 Edit Unregistered form | Licensed/Unlicensed (embedded pair with B) | — | see §2 CS-3 | (0 — no separate 834w frame; screenshotted as the edit state reached from CS-2) | Screenshot |

Clusters E, G, H, M, P–V (17 frames) are recorded from metadata clustering (name + height match
inside a section already confirmed to contain the tab/state family in clusters D/F/I/L/K) but were
**not individually screenshotted** — treat their classification below as provisional pending a
spot-check pass.

Total accounted: 5+2+10+1+3+2+1+1+1+6+25+13+8+11+1+1+1+1+1+1+1+1 = **99.** ✓

---

## 4. Classification

| Class | Count | Notes |
|---|---|---|
| **migrated** | 0 | No source screen in this scope is fully represented in the Web master with parity. The two nearest Web frames (`336:45825`, `363:43141`) each carry a subset of fields for a *different* interaction (list browse; unlicensed-creation) — neither is a faithful migration of any single canonical screen above. |
| **shared duplicate** | 87 | All non-canonical members of clusters A, B, C, F, J, K, L, N (87 of the 99 frames) — same screen, different demo data or minor selection state. |
| **approved non-delivery** | 0 | Nothing on this page is marked out of scope by DEC/PO ruling found in memory or handoff docs. |
| **gap** | 12 | The 12 canonical screens themselves (CS-1 through CS-12) — none has a faithful Web counterpart today. |

Canonical-screen gap detail:

| Canonical | Nearest Web frame | Fidelity verdict |
|---|---|---|
| CS-1 Establishments List | `336:45825` (shipped `/field/establishments`) | **Partial migration** — see §5.1 |
| CS-2 Establishment Detail | none | Gap |
| CS-3 Edit Unregistered form | `363:43141` (shipped `/field/establishments/unregistered`) | **Partial migration** — see §5.2 |
| CS-4 Regulatory Data | `364:45987` (SOURCE-IMPORT, 75 frames) | **Partial migration** — see §5.3 |
| CS-5 Previous Visits | none | Gap |
| CS-6 Issue Violation multi-select | none | Gap |
| CS-7 Create Incident Report | none | Gap |
| CS-8 Incident Report Details | none | Gap |
| CS-9 Visit Report tabbed (attendee) | none | Gap |
| CS-10 Establishment File tab | none | Gap |
| CS-11 Plan Start tab | none | Gap |
| CS-12 Incident (compact) | none | Gap — likely folds into CS-8/CS-11, needs PO call |

---

## 5. Fidelity deltas against existing Web frames

### 5.1 CS-1 Establishments List vs. shipped `/field/establishments` (`336:45825`)

Web has: search, filter button, unlicensed-toggle button, tabs with counts, card grid (name, id,
status badge two-state "Licensed/Unregistered", location, single risk chip Low/Medium).

Lost vs. source:
- **Status vocabulary collapsed** — source has 4 badge states (معتمد / غير معتمد / مسودة / تعذر
  التنفيذ), Web only distinguishes licensed vs. unlicensed.
- **Compliance percentage missing** — source shows a colour-coded `نسبة الامتثال` per card; Web
  substitutes a static risk-level chip with no percentage.
- **Last-visit date missing** from the card.
- **Thumbnail photo missing** from the card (Web uses a plain initial avatar).
- **"Issue violation" primary action missing** — source's top-level `إصدار مخالفة` button (which
  opens CS-6) has no Web equivalent.

### 5.2 CS-3 Edit Unregistered Establishment vs. shipped `/field/establishments/unregistered` (`363:43141`)

Web has: reason select, establishment-name input, additional-detail input, a location-verification
card (registered vs. captured position), a "capture current location" button, create-visit button.

Lost vs. source:
- **Photo capture** — entirely absent from Web.
- **Region/city selects** — Web has no location taxonomy fields, only a free-text/derived address
  block.
- **Address textarea + interactive map with draggable pin** — Web shows a static
  matched/not-matched verification card, no editable map.
- **Inspector select** — absent (Web infers current inspector from session).
- **Visit date input** — absent.
- **Decision radio group** (4 options) — entirely absent; this is the biggest functional gap,
  since it is the field that actually resolves the visit.
- **Supporting-documents upload with existing file chips** — absent.
- **Notes textarea** — absent.

### 5.3 CS-4 Regulatory Data vs. `364:45987` SOURCE-IMPORT (75 frames)

Web SOURCE-IMPORT has: steps/tab chips, an `establishment-data` block (4 label/value pairs), two
`contact` blocks (name + up to 4 fields each), a `categories` chip row, and 4 `DataChecklist`
instances (110px each, compact rows).

Lost vs. source:
- **Header photo, status badge, classification badge, compliance percentage** — none present;
  Web opens directly into a flat field list.
- **Permit/device rows reduced to a fixed 4× `DataChecklist` block** — source shows a scrollable,
  unbounded list of permit rows (the tallest member of this cluster, H=3836, has visibly more rows
  than the shortest, H=3532) with individual per-row status badges; the Web checklist component
  has no visible per-row status badge in the metadata and a hard cap of 4 rows.
- **Owner/national-id and commercial-registration sections** present in both, but the source pairs
  them with an avatar + a live map elsewhere on the page that the Web frame does not carry (per
  metadata, no `map` or `photo` instance anywhere in `364:45987`'s subtree).

### 5.4 Screens with no Web counterpart at all

CS-2, CS-5, CS-6, CS-7, CS-8, CS-9, CS-10, CS-11, CS-12 — nine of twelve canonical screens have
**zero** representation anywhere in the Web master's Establishment Management surface. Notably:
- CS-7/CS-8 (Incident Report create + detail) is a complete, two-sided CRUD flow with no Web
  presence, despite an approved Jira story (INSP-563) already covering it.
- CS-9/CS-10/CS-11 (the 6-tab Visit Report detail, with its nested attendee-signature accordions)
  is the richest screen family on this page and has no Web equivalent — this is a large, real gap,
  not a stub.
- CS-6 (bulk violation-issue picker) has no Web equivalent and no exact-match Jira story (see §6).

---

## 6. Proposed web frames

Route contract per CLAUDE.md — only the fixed routes may be used; establishment/visit-report
screens are query-state or nested detail under `/operations` or `/execution`, never new top-level
routes. Persona: Inspector (field/iPad-parity web surface, per the "inspector" terminology rule).

| # | Proposed frame name | Canonical source | Route | Persona | Jira key |
|---|---|---|---|---|---|
| 1 | Establishment Detail — Visit Summary | CS-2 | `/operations?establishment=:id` (detail panel) | Inspector | NONE |
| 2 | Unregistered Establishment — Edit (extend existing) | CS-3 | `/field/establishments/unregistered` (extend, not new route) | Inspector | INSP-605 |
| 3 | Regulatory Data / Device Permits (extend SOURCE-IMPORT) | CS-4 | `/operations?establishment=:id&tab=regulatory` | Inspector | INSP-588 |
| 4 | Previous Visits List | CS-5 | `/operations?establishment=:id&tab=visits` | Inspector | NONE |
| 5 | Issue Violation — Establishment Picker | CS-6 | `/compliance?action=select-violation-targets` | Inspector | NONE |
| 6 | Create Incident Report | CS-7 | `/execution?report=incident&mode=create` | Inspector | INSP-563 |
| 7 | Incident Report — Details | CS-8 | `/execution?report=incident&mode=view` | Inspector | INSP-563 |
| 8 | Visit Report — Tabbed Detail (attendee/plan/results/file/items) | CS-9 + CS-10 + CS-11 | `/execution?report=visit&tab=...` | Inspector | NONE |
| 9 | Incident Report — Compact (single-establishment variant) | CS-12 | fold into #7, PO call needed on whether this is a distinct state or redundant | Inspector | NONE |

None of these carry an INSP key except where an existing story is an exact match (INSP-605 for the
unregistered-establishment capture flow, INSP-588 for regulatory-status viewing, INSP-563 for
incident reporting). CS-6 and CS-9's tabbed report detail have no exact-match story in
`jira-backlog-keys.md` or `JIRA-COVERAGE-2026-08-01.md` — flagged `NONE` per instructions rather
than mapped to an adjacent-but-not-exact story (INSP-568 "Record a Violation Report with signature
capture" is adjacent to CS-6 but is a different unit of work — a single-violation report form, not
a bulk establishment picker — so it is not used here).

---

## 7. Gaps summary

- **9 of 12 canonical screens are pure gaps** (no Web frame exists at all): CS-2, CS-5, CS-6,
  CS-7, CS-8, CS-9, CS-10, CS-11, CS-12.
- **3 of 12 are partial migrations with material control loss**: CS-1 (status vocabulary,
  compliance %, thumbnail, last-visit date, issue-violation action all lost), CS-3 (photo capture,
  region/city selects, interactive map, inspector select, visit date, decision radio group,
  document upload, notes — everything past the three basic text fields is lost), CS-4 (header
  photo/badges/map lost, permit list capped at 4 compact rows vs. an unbounded per-row-status
  list in source).
- **Node-naming hazard**: the "Summons Notice"-named cluster (11 frames) is actually the Incident
  Report flow (CS-7). Any downstream worker trusting node names instead of screenshots will
  misfile this against the wrong Jira epic (INSP-558 summons vs. INSP-563 incident).
- **No frames on this page implement the actual Summons Notice flow (INSP-558)** — it may live on
  a different iPad source page outside this worker's scope; flagging for the orchestrator to
  confirm which page owns it, since it is not here despite the misleading node name suggesting it
  might be.
- **17 frames (clusters E, G, H, M, P–V) were classified by metadata/height clustering only**, not
  individually screenshotted — recommend a follow-up spot-check pass, particularly on cluster M
  (8 frames, 3 distinct heights, likely 3 more tab states of the CS-9 report family not yet
  screenshotted: results tab, item-list tab, and a partially-expanded attendee state).

---

## 8. Files referenced

- Source inventory dump: session scratchpad (`metadata.xml`, `frames_list.txt`) — not committed,
  regenerate via `get_metadata` on `1065:77494` if needed.
- Screenshots taken (12): CS-1 (2), CS-2, CS-4, CS-5, CS-6, CS-7, CS-8, CS-9, CS-10, CS-11, CS-12,
  plus Web comparisons `336:45825` and `363:43141`, plus metadata pull of `364:45987`/`366:43609`.

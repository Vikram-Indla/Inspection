# BUILDPACK — W7 — Visit Statement (افادة الزيارة)

Worker: W7-VisitStatement
Source file: `8wGaofgbopqmGXc0Wjo0eW`, page `2468:31912` ("↪ افادة الزيارة")
Web master file: `ML2PNwfShlQM2k44MvSEw5`, delivery page `— SCREENS —` (`6:9`)
Status: build pack only — no master-file edits made or proposed by this worker. All master-file
writes belong to W10-ReconciliationLedger.

---

## 1. Source page inventory

The page contains exactly **one** top-level content section and **one** unique screen. There is
no duplication, no scratch copies, and no alternate states parked elsewhere on the canvas.

| Node id | Name | Type | Size | Role |
|---|---|---|---|---|
| `2468:31913` | Safety Report | Section | 2908×3360 | Canvas section wrapper (page furniture only) |
| `2468:31914` / `2468:31915` | Group 191 / Group 188 | Frame | 2748×379 | Decorative background band behind the phone frame — not app UI |
| `2468:31916` | Rectangle 37033 | Rounded rect | 2748×379 | Decorative fill |
| `2468:31917` | Text | Text | 2546×120 | Decorative band label (canvas annotation, not in-product copy) |
| `2468:31956` | **Establishment Details** | Frame (phone, 834×2552) | — | **The one unique screen** — establishment context + Visit Statement report form |

No second, third, or alternate-state phone frame exists on this page. Dedup map: N/A — one canonical
screen, one instance, no merge needed.

---

## 2. Canonical screen — `2468:31956` "Establishment Details"

Screenshot captured at `2468:31956` (834×2552, portrait phone). Region-by-region breakdown, top to
bottom:

### 2.1 Top bar — `2468:31957` (instance "Top Bar", 834×112)
- Status bar (`184:16633`): time `9:41`, date `Mon Jun 9`, battery `100%` — OS chrome, not app content.
- Title text (`184:16656`): **"تقرير زيارة شركة الامل للتدريب العمال"** ("Visit report — Al Amal
  Workers Training Co.") — page title concatenates report label + establishment name.
- Back button (`184:16660`): label **"عودة"** ("Back") + leading chevron icon.

### 2.2 Establishment photo — `2468:31959` ("Photos", 786×320)
- Section label: **"صورة المنشأة"** ("Establishment photo").
- Full-width image (facility exterior).
- Overlay button (`434:36659`): **"تغيير صورة المنشأة"** ("Change establishment photo") with
  `image-add-01` leading icon.

### 2.3 Establishment data + location — `2468:31960` ("Location Verification", 786×696)
- Section header: **"بيانات المنشأة"** ("Establishment data").
- Field `حالة المنشأة` ("Establishment status") → Status Tag value **"تأسيس"** ("Founding/setup").
- Field `اسم المنشأة` ("Establishment name") → **"شركة الامل للتدريب العمال"**.
- Section header: **"مواقع المنشأة"** ("Establishment locations").
- Field `عنوان الزيارة المسجّل` ("Registered visit address") → full address string.
- Field `عنوان الزيارة الفعلي` ("Actual visit address") → same address string (both populated,
  matching).
- Map with a single pin and a tooltip (`5697:1923`/`5697:1924`): **"الموقع تطابق الموقع"** /
  **"لا يوجد فرق بين موقع المنشأة المسجّل وموقع الزيارة الفعلي."** ("Location matches location" /
  "No difference between the establishment's registered location and the actual visit location.")
  — this is a location-verification affordance, not a Visit Statement field.

### 2.4 Visit settings — `2468:31961` → `2468:31962`/`2468:31964` ("Frame 1984078771", 786×168)
- Section header: **"إعدادات الزيارة"** ("Visit settings") — `2468:31963`.
- Dropdown Input `2468:31964` — label **"نوع الزيارة"** ("Visit type"), current value
  **"رقابية مستهدفة"** ("Targeted regulatory [visit]").

### 2.5 Visit-not-executed toggle — `2468:31965` → `2468:31968` ("Frame 1984078769", 786×72)
- Checkbox Label instance `2468:31968`: **"تعذر تنفيذ الزيارة"** ("Visit could not be carried out")
  — unchecked in this state. Governs whether the rest of the form is a live report or a
  non-execution record; no other state of this control is present on this page.

### 2.6 Report type selector — `2468:31969` → `2468:31972`/`2468:31976`/`2468:73183` ("Frame 1984078768", 786×910)
- Section header: **"نوع التقرير"** ("Report type") — `2468:31970`.
- Six selectable cards, icon + label, arranged 3×2:

  | Node id | Label (AR) | Icon | Control type | Selected? |
  |---|---|---|---|---|
  | `2468:31973` | تقرير فسح كيميائي (Chemical release report) | test-tube-01 | Checkbox | No |
  | `2468:31974` | رصد تحدي (Challenge monitoring) | alert-02 | Checkbox | No |
  | `2468:31975` | تقرير زيارة (Visit report) | license-third-party | Checkbox | No |
  | **`2468:73183`** | **افادة الزيارة (Visit Statement)** | manager | **Radio** | **Yes — checked, green outline** |
  | `2468:31977` | تقرير سلامة (Safety report) | file-security | Checkbox | No |
  | `2468:31978` | تقرير إعفاء جمركي (Customs exemption report) | file-verified | Checkbox | No |

  **Notable structural detail:** the Visit Statement card (`2468:73183`) is the only card of the six
  built on a `Radio` control (`9045:24950`) rather than the shared `Checkbox` control
  (`9045:25040`/`25031`) used by the other five. It is also the only card rendered in the
  selected/active visual state (green border, filled check) anywhere on this page.

- Below the card grid, when Visit Statement is selected, the form reveals Visit-Statement-specific
  fields — `2468:112962` ("Frame 1984078692", 738×160):
  - Text Input `2468:112965` — label **"تاريخ الزيارة"** ("Visit date"), value **"01/01/2026"**.
  - Text Input `2468:112964` — label **"اسم الزائر"** ("Visitor name"), placeholder
    **"اضف اسم الزائر هنا"** ("Add visitor name here").
  - Text Input `2468:112963` (full width) — label **"سبب الزيارة"** ("Reason for visit"),
    placeholder **"اضف سبب الزياره هنا"** ("Add reason for the visit here").
  - Textarea `2468:31979` — label **"الملاحظات"** ("Notes"), populated value: **"تم تنفيذ الزيارة،
    وتم رصد عدد من الملاحظات وسيتم المتابعة خلال المدة المحددة."** ("The visit was carried out, a
    number of notes were recorded, and follow-up will occur within the specified period.")
  - Attachments — `2468:112966` ("Frame 1984078896", 738×156):
    - Header text **"المرفقات"** ("Attachments") + helper text `2468:112971`: **"المرفقات لا تزيد
      عن اكثر من 3 مرفقات وتكون بصيغة PDF, Image (PNG - JPEG), Word, Excel"** ("Attachments may not
      exceed 3 files and must be in PDF, Image (PNG/JPEG), Word, or Excel format.") — this is a
      governed constraint (max 3 files, fixed format allow-list) carried verbatim, not invented.
    - Button `2468:112972`: **"إرفاق ملفات"** ("Attach files").
    - Two already-attached file rows (`2468:112974`, `2468:112983`), each: delete icon
      (`delete-02`), download icon (`download-04`), file name **"ملف قائمة المنشآت
      المستهدفة.PDF"** ("Target establishments list file.PDF"), file-type badge (`xls-02`).

### 2.7 Primary action — `2468:31980` → `2468:31981` ("Actions", 786×40)
- Full-width Button `2468:31981`: **"حفظ افادة الزيارة"** ("Save Visit Statement").

### 2.8 Home indicator — `2468:31982`
- iOS home-indicator bar. Device chrome, not app content.

---

## 3. Availability finding — is the Visit Statement flow reachable in its own right?

**Finding: yes, on this source page the Visit Statement flow is fully reachable, fully built, and
rendered in its active/selected state — not gated or disabled.**

Evidence from `2468:31912`/`2468:31956`:
- The "افادة الزيارة" card (`2468:73183`) is the **only** card among the six report-type options
  drawn in the selected state (green border, filled indicator) and the **only** one built on a
  `Radio` component rather than the shared `Checkbox` component the other five use.
- Selecting it reveals a complete, populated set of Visit-Statement-specific fields (visit date,
  visitor name, reason for visit, notes, attachments) and a dedicated save action labelled
  specifically for this report type ("حفظ افادة الزيارة" — "Save Visit Statement", not a generic
  "Save").
- Nothing on this page — no disabled-state styling, no lock icon, no tooltip, no gating copy, no
  precondition banner — indicates the option is unavailable here.

**What this page does NOT establish:** the task brief states that in the *Identify Challenge*
report-type selector (a different flow, outside this worker's scope — page `2468:31912` is the
only page in scope), the same "Visit statement" option is rendered **disabled**. This page contains
no reference to the Identify Challenge flow, no shared gating logic, no eligibility rule, and no
copy explaining why the option might be disabled there. **I cannot determine from this page what
governs the option's availability in that other flow** — doing so would require inspecting the
Identify Challenge page itself, which is out of scope for W7. The two data points side by side:

- On **this** page (establishment-level "log a visit" entry point): Visit Statement is enabled,
  selected, and fully operable.
- On the **Identify Challenge** report-type selector (per task brief, not independently verified
  here): Visit Statement is disabled.

This is consistent with the flows being **different entry points with different preconditions** —
this screen appears to be a direct "record a visit against an establishment" flow where a visit
statement is always a valid outcome, whereas Identify Challenge is a different workflow (challenge
intake) where a visit statement may require a precondition not present in that flow (e.g., an
active challenge, or a different visit type). **This is a hypothesis, not a governed rule** — no
node on this page states the gating condition, so no rule is asserted in this build pack. The
correct next step is for whichever worker owns the Identify Challenge source page to record the
actual gating logic from that page; W10 should reconcile the two findings before wiring any
"disabled" behavior into the web master.

---

## 4. Web counterpart search

Checked both pointer sections named in scope:

- **INSPECTOR REPORT FORMS** (`336:45770`) — contains four sibling report-form frames, all sharing
  one field/section-title/Radio-choice/FileUpload/actions pattern:
  - `336:45771` Summons Notice — `/field/summons-notices` — INSP-558
  - `336:45779` Sample Collection Report — `/field/sample-collection-reports` — INSP-573
  - `336:45787` Non-Compliant Products Destruction Report — `/field/destruction-reports` — INSP-578
  - `336:45795` Facility Report — `/field/facility-reports` — INSP-583
  - **No Visit Statement frame exists in this section.**
- **UNGOVERNED** (`339:42098`) — enumerated all 25 top-level route frames (Establishments, Summons
  Notice & Records, Field Home, Notifications, Trusted Devices, Sync Conflicts, Factory 360
  (inspector), My Visits, Global Search, Startup Pack, Drafts, Completed, Reports, Account, Task
  Map, Visit Calendar, Unregistered Establishment, Notification Detail, Completion Receipt, Virtual
  Sessions, Remote Inspection, Feedback QR, Establishment Rating, Field Settings, Device Readiness).
  **No frame name or route contains "Visit Statement" or its Arabic equivalent.**

**Counterpart node id: NONE.** The closest structural analog is the shared four-frame pattern in
INSPECTOR REPORT FORMS (field list → section-title → Radio choice pair → FileUpload → provenance →
actions) — that pattern is the natural template a fifth "Visit Statement" frame would reuse, but no
such frame currently exists.

`UNGOVERNED — Summons Notice & Records` (`340:42098`, route `/field/summons-notices`) was also
checked as a candidate because it is a records list + compose form with `record-types` filter chips
and Radio `choice` rows — but its filter-chip list is a category filter for *existing* summons
records, not a report-type card selector, and its route does not cover Visit Statement. Not a
counterpart, only a nearby pattern.

---

## 5. Classification

| Source element | Node id(s) | Classification | Notes |
|---|---|---|---|
| Decorative canvas band/section | `2468:31913`–`2468:31917` | approved non-delivery | Figma canvas furniture, not app UI |
| Top bar (title + back) | `2468:31957` | shared duplicate | Same App-topbar pattern used across all INSPECTOR screens in the web master |
| Establishment photo block | `2468:31959` | gap | No corresponding "change establishment photo" affordance found on any inspected INSPECTOR frame |
| Establishment data + location verification | `2468:31960` | shared duplicate | Establishment-context header pattern; belongs to whichever page owns Establishment Details / Factory 360 (inspector), out of W7 scope to rebuild |
| Visit settings (visit type dropdown) | `2468:31961`–`31964` | gap | No web counterpart found |
| "Visit could not be carried out" toggle | `2468:31965`–`31968` | gap | No web counterpart found |
| Report-type 6-card selector (as a card grid) | `2468:31969`–`31978` | gap | Web pattern uses Radio `choice` rows or filter-chips, not an icon-card grid; no card-grid selector found anywhere in INSPECTOR REPORT FORMS or UNGOVERNED |
| Visit Statement fields (date, visitor, reason, notes, attachments) | `2468:112962`–`112991`, `2468:31979` | gap | No Visit Statement frame exists on the web master at all |
| Save action ("حفظ افادة الزيارة") | `2468:31980`–`31981` | gap | Matches the `actions`/Button pattern used in the four sibling report forms, but no Visit Statement instance exists |
| Home indicator | `2468:31982` | approved non-delivery | Device chrome |

**Counts:** migrated = 0, shared duplicate = 2, approved non-delivery = 2, gap = 6.

---

## 6. Proposed web frame

One frame proposed, following the INSPECTOR REPORT FORMS sibling pattern exactly (field list →
section-title → Radio choice pair → FileUpload → provenance → actions), scaled to the Visit
Statement field set found on the source page.

| Field | Value |
|---|---|
| Proposed name | `Visit Statement — /field/visit-statements — INSP-548 — INSPECTOR responsive · EN · Light` |
| Route | `/field/visit-statements` (follows the sibling naming convention: `/field/summons-notices`, `/field/sample-collection-reports`, `/field/destruction-reports`, `/field/facility-reports`) |
| Persona | INSPECTOR (field/responsive channel) |
| Section | INSPECTOR REPORT FORMS (`336:45770`), as a fifth sibling frame alongside Summons Notice / Sample Collection / Destruction / Facility Report |
| Jira key | **INSP-548** — "[REUSE] Log a lightweight Visit Statement" (`docs/design/figma/jira-backlog-keys.md:23`) — exact story title match, marked REUSE, consistent with reusing the shared report-form pattern rather than the source's bespoke card-grid selector |
| Fields to carry | Visit date, Visitor name, Reason for visit, Notes (multiline), Attachments (max 3 files; PDF / PNG / JPEG / Word / Excel), Save action labelled for Visit Statement specifically |
| Fields NOT to carry as designed | The 6-card icon-grid report-type selector (source `2468:31969`) — no such pattern exists in the web design system; W10 must decide whether to represent "report type = Visit Statement" as fixed context (since the route itself already implies the type) or via the existing Radio `choice` pattern, not as a new card-grid component |
| Availability gate | Not configured on this page — see Section 3. W10 must reconcile against whatever the Identify Challenge worker records before wiring any conditional disable behavior into this frame |
| Establishment/location context | Not proposed as part of this frame — that block (`2468:31960`) is a shared duplicate of Establishment Details/Factory 360 (inspector) header content, owned elsewhere |

**Proposed frame count: 1.**

---

## 7. Gaps requiring design-system decisions (not resolved by this build pack)

1. No web pattern exists for an icon-card multi-select/radio grid (source report-type selector).
   The four existing report-form frames use plain Radio `choice` rows instead. W10 must decide
   whether Visit Statement needs the card grid (a new component request) or can ship with the
   existing Radio-row pattern.
2. No "change establishment photo" affordance exists on any inspected web frame.
3. The availability/disable rule for Visit Statement seen in the Identify Challenge selector is
   undocumented on this page and must be sourced from whichever worker owns that page.
4. The "تعذر تنفيذ الزيارة" (visit could not be carried out) toggle and the "نوع الزيارة" (visit
   type) dropdown above the report-type selector have no web counterpart in any inspected frame —
   flagged as gaps, not implemented as page-level workarounds per CLAUDE.md rule 3.

# BUILD — Q2 — Incident & Violation Reports

Worker: Q2-IncidentAndViolationBuild
Source (read-only): `8wGaofgbopqmGXc0Wjo0eW` — pages `1065:77494`, `269:40019`, `2312:95952`
Web master (target): `ML2PNwfShlQM2k44MvSEw5`, page `6:9`

**STATUS: source identification COMPLETE and verified by screenshot. Build NOT started —
blocked by a hard Figma MCP quota block (see §6). No node was created, edited, moved or
deleted in either file. The target section was never created.**

Everything in §1–§4 below is verified against pixels, not node names, and is safe to build
from. §5 is the build plan that was ready to execute when the quota cut in.

---

## 1. The naming trap — corrected. W8's reading was wrong.

W8 reported that on page `1065:77494`, **11 frames named "Summons Notice" contain the Incident
Report flow**, naming `1831:157328` as "Create Incident Report" (CS-7) and `1831:156010` as
"Incident Report Details" (CS-8).

**Both identifications are false.** I screenshotted both nodes directly.

| Node | W8 claimed | What it actually is (screenshot-verified) |
|---|---|---|
| `1831:157328` (834×1951) | CS-7 "إنشاء رصد حادث" Create Incident Report | **"عرض تقرير زيارة" — View Visit Report**, read-only tabbed screen. 6-tab strip (بداية الخطة / الحاضر / نتائج الزيارة / ملف المنشأة / قائمة البنود / تفاصيل الحاضر) with **تفاصيل الحاضر** active, and the **تفاصيل مذكرة استدعاء** (Summons Notice details) accordion row expanded. Contains no incident fields at all. |
| `1831:156010` (834×1781) | CS-8 "تفاصيل رصد حادث" Incident Report Details | Same **View Visit Report** screen, tab **الحاضر** active, **تفاصيل محضر سحب عينة** (Sample Collection minutes) row expanded. Not an incident report. |

The trap is real but runs the **opposite** way to W8's report. The "Summons Notice"-named
frames are not mis-named at all in the way W8 described — they are the read-only Visit Report
accordion, and in `1831:157328` the row that happens to be expanded genuinely **is** the
Summons Notice. W8 appears to have transposed node ids between clusters.

### The true Incident Report source nodes

Found by exhaustive text search across page `1065:77494` for the literal titles, then confirmed
by screenshot. There are exactly two, and both sit in the **"View details"** section
(`1068:123721`), not in "View Visit Reports":

| Screen | **True source node id** | Size | Node name in source (untrustworthy) |
|---|---|---|---|
| **Incident Report — Create** — "إنشاء رصد حادث" | **`1442:170821`** | 834×1820 | `My Tasks` |
| **Incident Report — Details** — "تفاصيل رصد حادث" | **`1442:184856`** | 834×1374 | `My Tasks` |

Both are named `My Tasks` in the source — a third, different mis-naming. Only two frames on the
entire page carry the string `إنشاء رصد حادث` and only one carries `تفاصيل رصد حادث`; there is
no larger incident cluster. W8's "11-member Create Incident cluster" does not exist.

W8's own CS-11 (`1442:170821`, called "Plan Start tab") and CS-12 (`1442:184856`, called
"Incident compact") are therefore also mis-labelled — CS-11 **is** the incident create form and
CS-12 **is** the incident detail view.

### Verified field content

**`1442:170821` — Create Incident Report.** Back `عودة`; title `إنشاء رصد حادث` with
establishment subtitle. Sections:
- `بيانات المنشأة` — read-only: اسم المنشأة, رقم السجل التجاري, رمز المنشأة, حالة المنشأة
  (status badge `تأسيس`).
- `بيانات البلاغ` — مصدر البلاغ (**select**, `هاتف`), رقم تواصل المُبلِّغ (**input**), اسم
  المُبلِّغ (**input**), وقت البلاغ (**time input**).
- `ملخص الحادث` — عدد الحالات (**select**), الأضرار الناتجة (**select**), نوع الحادث
  (**select**), وصف مبدئي (**textarea**).
- `الوثائق الداعمة للمراجعة` — المرفقات, upload hint "PDF, Image (PNG - JPEG), Word, Excel,
  لا تزيد عن 3 مرفقات", `إرفاق ملفات` button, 2 attached-file chips with download + delete.
- Primary full-width action `إنشاء رصد حادث`. Bottom tab bar.

**`1442:184856` — Incident Report Details.** Back `عودة`; title `تفاصيل رصد حادث`; `تعديل`
(edit) button. Read-only mirrors of the same four sections, plus a **second** identity block
(`بيانات المنشأة`: رمز المنشأة `FAC-192993`, رقم السجل) — confirming W8's observation that the
detail view cross-references two establishment records. `عدد الحالات` renders in a warning
treatment when the value is `لا يوجد وفيات او اصابات`. Attachments are download-only.

### Summons Notice (INSP-558) — located, contrary to W8

W8 reported the real Summons Notice flow as unlocated. It is **not** missing: it exists as the
`تفاصيل مذكرة استدعاء` accordion row, in both modes —
- **read mode**, fully expanded, at **`1831:157328`** (the very frame W8 mis-read): رقم الحضر,
  تاريخ الحضر, يوم الحضر, وقت الحضر, مالك المصنع, اسم المصنع, رقم السجل التجاري, رقم المنشأة,
  رقم الترخيص, تاريخ انتهاء الترخيص, المنطقة, المدينة, الجوال, البريد الإلكتروني, a
  `الحضور والمستندات المطلوبة` 7-item check list, الملاحظات, مستلم التبليغ + الصفة + رقم
  الهوية, وقت/تاريخ التبليغ, اسم ممثل الوزارة, and a signature image.
- **create mode** as row 1 (`مذكرة استدعاء`) of the step-4 wizard described in §2.

What does **not** exist is a *standalone* Summons Notice screen — consistent with §2: no report
type has a standalone screen; they are all accordion rows.

---

## 2. Production Line Report — W1's wizard reading HOLDS. Verified.

W1 read `368:42325` ("Production Line Report"), `360:77602` ("Incident Report") and `361:20826`
("Violation Report") as **one 5-step wizard with a different accordion row expanded**, not three
screens. I screenshotted three of them independently. **W1 is correct.**

Every one of them renders the identical chrome: back `عودة`, title `تقرير زيارة` + establishment
subtitle, a live visit timer `00:12:45`, and a 5-step spine —
`قائمة البنود ✓ / ملف المنشأة ✓ / نتائج الزيارة ✓ / المحاضر (4, current) / تفاصيل الحاضر (5)` —
over a 9-row accordion, with `التالي` / `السابق` footer buttons. Only the expanded row differs:

| Node | Node name in source | Row actually expanded |
|---|---|---|
| `360:77602` | Incident Report | `محضر إثبات واقعة` — وقت المغادرة (read), ملاحظات (textarea) |
| `360:80623` | Violation Report | `محضر ضبط مخالفة` — تأكيد الحضور والتوقيع (radio pair), السبب (textarea) |
| `361:20826` | Violation Report | `محضر سحب عينة` — **mis-named**; this is Sample Collection: اسم المختبر, اسم الشخص, الإدارة, المنطقة, التوقيع (select), attendance radio pair, السبب, attachments |
| `368:42325` | Production Line Report | `محضر حجز خط الإنتاج` — رقم محضر, تاريخ المحضر, رقم الاستدعاء, تاريخ الاستدعاء, حالة خط الإنتاج (radio: إيقاف/استئناف الإنتاج), اختر خطوط الإنتاج المراد إغلاقها (select), attendance radio pair, ملف التوقيع + إرفاق ملفات |

The canonical 9 rows, in source order: `مذكرة استدعاء` · `محضر إثبات واقعة` · `محضر ضبط مخالفة`
· `محضر سحب عينة` · `محضر إتلاف منتجات مخالفة` · `محضر حجز منتجات` ·
`إشعار بتبليغ برفع الحجز عن المنتجات أو المواد` · `محضر حجز خط الإنتاج` · `محضر النشأة`.

**Consequence for the build: do not build three screens.** Build one wizard step-4 frame with
nine row types, plus its read-only counterpart (the View Visit Report tabbed screen, §1). This
also supersedes W6's framing of Violation / Incident / Production Line as three missing
"INSPECTOR REPORT FORMS" frames — at source they are three rows of one control.

### Naming is unusable as a signal on all three pages

Independent confirmation of W6 §6.b, now extended: source node names are wrong on every page in
scope. `My Tasks` holds incident reports; `Summons Notice` holds the visit-report accordion;
`Violation Report` holds sample collection; `Establishment Details` holds a 4015px-tall
fully-expanded report file. **Content-first identification is mandatory.** Any downstream worker
who trusts a name on `1065:77494`, `269:40019` or `2312:95952` will misfile.

---

## 3. Two distinct things share the English name "Incident Report"

This is the second trap, and it is easy to collapse by accident:

- **`رصد حادث` — "incident observation"** → the standalone create/detail pair at
  `1442:170821` / `1442:184856`. Reporter, incident type, damages, casualty count. **This is
  INSP-563.**
- **`محضر إثبات واقعة` — "fact-establishment minutes"** → accordion row 2 of the wizard.
  Departure time + notes only.

They are not the same screen, not the same field set, and must not be merged. W1's "Incident
Report (accordion row)" is the second; W8's INSP-563 mapping is the first.

---

## 4. Jira

| Screen | Key | Basis |
|---|---|---|
| Incident Report create + detail (`رصد حادث`) | **INSP-563** | Exact match, independently confirmed by W8 and W6 §9 |
| Violation Report row (`محضر ضبط مخالفة`) | **NONE** | W6 names INSP-568 "Record a Violation Report with signature capture". **Verification failed on the decisive point**: the source row carries an attendance/signature radio pair and a reason textarea, which is consistent — but I could not open the Jira story text to confirm it is an exact match, and Jira is unreachable from Claude Code. Per the brief, an unverified match is `NONE`. |
| Production Line Report row | **NONE** | No story exists by that name (W1 §6, W6 §9 agree) |
| Visit Report wizard / View Visit Report | **NONE** | No story names the accordion container itself (W1 §5) |
| Summons Notice row | INSP-558 | Exact match per W6 §9; row located in §1 above |

---

## 5. Build plan — prepared, not executed

Section that was to be created on `6:9`: `SCREENS — BUILD Incident & Violation Reports · EN ·
Light` at x=-80, y=180000. **It does not exist. Nothing was created.**

Frames planned, all persona **Inspector**, responsive web (never `/ipad`):

| # | Frame | Source node | Route | Jira |
|---|---|---|---|---|
| 1 | Incident Report — Create | `1442:170821` | `/execution?report=incident&mode=create` | INSP-563 |
| 2 | Incident Report — Details | `1442:184856` | `/execution?report=incident&mode=view` | INSP-563 |
| 3 | Visit Report — Minutes step (wizard step 4, 9 accordion rows) | `368:42325` + `360:77602` + `360:80623` + `361:20826` | `/execution?report=visit&step=minutes` | NONE |
| 4 | Visit Report — View (read-only tabbed) | `1831:157328` + `1831:156010` | `/execution?report=visit&mode=view` | NONE |

Components confirmed present and sufficient (enumerated from the library pages before the
block): `Button 8:32` · `Badge 9:25` · `Input 9:66` · `Radio 9:74` · `Field 171:28` ·
`Textarea 401:14` · `AttachedFile 401:29` · `FileUpload 175:19` · `Select 423:48080` ·
`section-title 70:12` · `DescriptionList row 166:12` · `page-back 401:47774` ·
`accordion 15:43` · `Accordion header 27:629` · `steps 15:27` · `tabs 15:47` ·
`Panel 152:17` · `divider 15:42` · `Alert 11:43` · `avatar/avatar-sm 15:36` ·
icons from `73:2`.

### Component gaps identified (for Q3-InspectorComponentGapBuild)

1. **Time input** — `وقت البلاغ` (`2:30 صباحاً` with a clock icon) has no component. `Input
   9:66` has no leading-icon or time affordance. Needed by frame 1.
2. **Date input** — `تاريخ المحضر` / `تاريخ الاستدعاء` render as a bordered field with a leading
   calendar icon. `DateRangePicker 179:39` is a *range* picker and is not the same control.
   Needed by frame 3.
3. **Signature display** — the summons row and sample-collection row render a captured signature
   image with a `التوقيع` label. No component. Needed by frame 4.
4. **Requirement checklist row** — the `الحضور والمستندات المطلوبة` block in the summons row is a
   7-item grid of check-marked requirement labels. `Checkbox 9:71` is an input, not this
   read-only confirmation display. Needed by frame 4.
5. **Visit timer** — the `00:12:45` live elapsed-visit indicator in the wizard header. No
   component. Needed by frame 3.

None of these were authored — component creation is Q3's, per the brief.

---

## 6. Why the build stopped

After the source-verification and library-discovery reads, the Figma MCP server returned:

> You've reached the Figma MCP tool call limit for your Full seat on the Professional plan.

Confirmed persistent on a second, minimal call. This is an account quota, not a transient error
and not a scripting fault. Every subsequent operation in this task — creating the section,
creating the four frames, the per-frame screenshots, and the 1280/1024/834/680 clipped-text
census — requires `use_figma` and `get_screenshot`, so none of it could run.

**Deliberately not done rather than faked:** no frames were built, so no node ids, no responsive
census, and no per-frame component list can be reported. The census bar (zero clipped text at
four widths) is unmet because nothing was rendered to measure.

**To resume:** the quota must be restored. Everything needed to build is in §1–§5 — the source
node ids are verified, the component set is enumerated, and the gap list is closed. No further
source reads are required; resumption starts by creating the section and frame 1.

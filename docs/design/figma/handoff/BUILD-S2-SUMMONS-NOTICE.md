# BUILD S2 — Summons Notice journey (EN, responsive Web)

Story: **INSP-558**. Route: `/field/summons-notices`.
Web master: `ML2PNwfShlQM2k44MvSEw5`. Source (read only, never edited): `8wGaofgbopqmGXc0Wjo0eW`.

---

## 1. Provenance verdict

**SOURCE FOUND — and it is not a screen frame. It is two component sets on the Components page `301:71625`.**

| Source node | Type | Parent section | Size | Role |
|---|---|---|---|---|
| `360:48214` "Summons Notice" | COMPONENT_SET | `370:71394` **Reports** | 826 × 3313 | Create / issue form, 3 variants |
| `369:127296` "Summons Notice" | COMPONENT_SET | `370:89463` **Report Details** | 826 × 1709 | Detail / served view, 1 variant |

Variants:

| Variant node | Name | Size |
|---|---|---|
| `360:48435` | `Property 1=Day` | 786 × 1132 — fullest create state |
| `360:48215` | `Property 1=Reason` | 786 × 1064 |
| `360:48213` | `Property 1=Signature file` | 786 × 1037 — file-upload attendance path |
| `369:127295` | `Property 1=Default` | 786 × 1669 — served/detail view |

### How it was found, and why W8's conclusion was incomplete

W8 correctly established that the 11 frames **named** "Summons Notice" on source page `1065:77494`
(Establishment Management) carry the Incident Report flow. That finding stands — I re-swept that page by
content and it holds. `1065:77494` has only 5 top-level frames
(`1434:97551`, `1068:123721`, `1632:67130`, `1632:162471`, `1831:148110`); the two that hit summons markers
(`1068:123721` View details, `1831:148110` View Visit Reports) are establishment/visit-report surfaces that
merely *reference* محضر, not summons journeys. Same for page `269:40019` Visit Reports —
`269:54920` and `532:72666` hit markers only inside visit-report body copy.

The real source was never on a **screen** page at all. The repo itself records it. Both
`page.tsx` and `SummonsNoticeForm.tsx` carry a header comment naming the exact nodes:

```
// Jira INSP-558. Figma: MIM iPad Inspector App, Components > Reports >
// "Summons Notice" (node 360:48214) create-form, Report Details (node
// 369:127296) read view.
```

I verified both node ids resolve in `8wGaofgbopqmGXc0Wjo0eW` and returned the parent chain
`SECTION Reports [370:71394] → PAGE ⚙️ Components [301:71625] → DOCUMENT`. Neither id was guessed;
both were read back from the file with their real names, types, sizes and full ancestor chain.

**So `336:45771` does have provenance.** It was built from component sets, not screens — which is exactly
why a name-based sweep of the screen pages could never find it.

---

## 2. Source content (evidence)

Read directly from the source file. Governed values below are quoted as **source specimen content**,
not as values to ship — every one of them renders `Not configured` in the build.

### 2a. Create form — `360:48435` (Property 1=Day)

Header `مذكرة استدعاء` (Summons Notice). Regions in source order:

| # | Source label (AR) | EN | Control in source |
|---|---|---|---|
| 1 | `تاريخ المحضر` * | Report date | date input, calendar glyph |
| 2 | `الموضوع` | Subject | text input |
| 3 | `اليوم` | Day | **derived read-only text**, not an input |
| 4 | `الإدارة` * | Department | **select** |
| 5 | `المنطقة` * | Region | **select** |
| 6 | `نوع المستند المطلوب` * | Required document type | **select** |
| 7 | `ملاحظات` | Notes | **textarea** |
| 8 | `تأكيد الحضور والتوقيع` | Confirm attendance and signature | **2 radios** |
| 8a | `تم حضور ممثل المنشأة وموافق على التوقيع` | Representative attended and consented to sign | radio |
| 8b | `لم يتم حضور ممثل المنشأة أو أعترض على التوقيع.` | No representative attended, or signing was refused | radio |
| 9 | `السبب` | Reason | textarea, conditional on 8b |
| 10 | — | Sibling report accordion, 8 rows | accordion |

The 8 accordion rows (present in **all three** create variants and, in `تفاصيل …` form, in the detail view):
`محضر إثبات واقعة` · `محضر ضبط مخالفة` · `محضر سحب عينة` · `محضر إتلاف منتجات مخالفة` ·
`محضر حجز منتجات` · `إشعار بتبليغ برفع الحجز عن المنتجات أو المواد` · `محضر حجز خط الإنتاج` · `محضر المنشأة`.

### 2b. Create form — `360:48213` (Property 1=Signature file)

Identical through region 8, then diverges: **no `السبب` textarea**; instead
`ملف التوقيع` (Signature file) + hint `ارفع صورة التوقيع بصيغة PNG أو JPG أو PDF.`
+ `إرفاق ملفات` (Attach files). Also **no `اليوم` row**.
This is a distinct attendance-evidence path: upload a signature artefact rather than draw one.

### 2c. Detail / served view — `369:127295`

Header `تفاصيل مذكرة استدعاء` (Summons Notice details). Regions:

1. **Notice identity block** — `رقم المحضر` (**notice number**), `تاريخ المحضر`, `يوم المحضر`, `وقت المحضر`.
2. **Establishment block** — `رقم السجل التجاري`, `اسم المصنع`, `مالك المصنع`, `رقم الترخيص`,
   `رقم المنشأة`, `تاريخ انتهاء الترخيص`, `المدينة`, `المنطقة`, `البريد الإلكتروني`, `الجوال`.
3. **`الحضور والمستندات المطلوبة`** (Attendance and required documents) — a prose summons paragraph naming
   the issuing directorate, the **appointment date and time** to attend, followed by a **10-row checklist**
   of required documents, each row `A` + document name + `وصف` (description).
   Document rows: renewal-with-upgrade, membership renewal, site lease (×2), quality & conformity
   certificates, spatial licence, environmental permit, SFDA licence, civil-defence licence, identity proof.
4. **`الملاحظات`** — notes paragraph.
5. **Service / serving block** — `مستلم التبليغ` (**recipient of service**), `رقم الهوية` (ID number),
   `الصفة` (capacity, e.g. establishment representative), `تاريخ التبليغ` (**service date**),
   `وقت التبليغ` (**service time**).
6. **Non-attendance block** — `لم يتم حضور ممثل المنشأة أو أعترض على التوقيع.` + free-text explanation.
7. **Signature block** — `التوقيع` * (drawn signature image) + `اسم ممثل الوزارة` (ministry representative name).
8. **Sibling detail accordion, 8 rows** (`تفاصيل محضر …`).

Screenshots captured for `369:127295`, `360:48435`, and the shipped `336:45771`.

---

## 3. Region-by-region comparison — source vs shipped `336:45771`

`336:45771` is **834 × 906, VERTICAL auto-layout, pad 20, gap 10**, and contains: title, meta,
3 × `section-title`, 8 × `Field` (all `State=Default`, all plain `Input`), 2 × `Radio`,
1 × `FileUpload`, 1 × provenance mono line, 2 × `Button` (Secondary "Save draft", Primary "Submit report").

**It reproduces one thing: the create form's flat field list, re-expressed as the shipped DB columns.**
It is a column census, not the journey.

### 3a. Create form — what the shipped frame lost

| Source region | Shipped `336:45771` | Verdict |
|---|---|---|
| `تاريخ المحضر` date input + calendar glyph | `Field/Input` plain text | **control downgraded** — date affordance lost |
| `الموضوع` text input | `Field/Input` | kept |
| `اليوم` derived read-only | `Field/Input` "Report day" — an editable input | **semantics lost** — a derived value became a typed one |
| `الإدارة` **select** | `Field/Input` | **control downgraded** — option domain lost |
| `المنطقة` **select** | `Field/Input` | **control downgraded** |
| `نوع المستند المطلوب` **select** | `Field/Input` | **control downgraded** |
| `ملاحظات` textarea | *absent* | **region lost entirely** |
| `تأكيد الحضور والتوقيع` heading + 2 radios | present, 2 radios | kept |
| `السبب` textarea | `Field/Input` "Reason" single-line | **control downgraded** (source is multi-line) |
| Signer name | `Field/Input` "Signer name" | shipped-only, from `signer_name` column |
| `ملف التوقيع` upload + PNG/JPG/PDF hint + `إرفاق ملفات` | one `FileUpload` labelled "Signature · signature_data_url" | **partially kept** — the file-format hint and the separate *attach files* action are lost; the `AttachedFile` component (`401:29`) is unused |
| 8-row sibling report accordion | *absent* | **region lost entirely** |
| Variant axis (Day / Reason / Signature file) | collapsed to a single state | **3 states → 1** |

### 3b. Detail / served view — entirely absent from the web master

Every region of `369:127295` is missing. There is **no** detail frame anywhere beside `336:45771`.
Specifically lost: notice number, notice time, the full establishment identity block (10 fields),
the summons prose + appointment datetime, the **10-row required-documents checklist**,
the whole service block (recipient, ID number, capacity, service date, service time),
the non-attendance explanation, the two-party signature block, and the 8-row detail accordion.

### 3c. Index / list — no source at all

Neither component set contains a list or index. The repo route *does* render one
(`page.tsx` lines 100–131: a `history` section of `details.rowcard` disclosures, each with a
subject strong, an attendance badge, a timestamp, and a 9-row `dl` — plus an explicit empty state
"No summons notices in scope" and an error state "Summons notices are temporarily unavailable").
Any index frame is therefore **repo-derived, not source-derived**, and must be labelled as such.

### 3d. Actions

Source shows an issue action implied by the form; shipped adds **"Save draft"** and **"Submit report"**.
`actions.ts` exposes exactly one write, `createFieldSummonsNotice` — there is **no draft path**.
**"Save draft" on `336:45771` is an invented control with no repo or source backing.** Recorded as a defect
in the shipped frame; not reproduced in the build.

---

## 4. What was built

Section: **`432:48325`** — `SCREENS — BUILD Summons Notice · EN · Light`, page `6:9`, x = -80, y = 280000.
Nothing outside this section was created, edited, moved or deleted. `336:45771` was **read only**.

| Frame | Node id | Source node | Route | Persona | Status |
|---|---|---|---|---|---|
| A · Issue Summons Notice | **`432:48326`** | `360:48435` (Property 1=Day) | `/field/summons-notices` | Inspector | **skeleton only** |
| B · Issue — signature file state | **`432:48327`** | `360:48213` (Property 1=Signature file) | `/field/summons-notices` | Inspector | **skeleton only** |
| C · Summons Notice detail | **`432:48328`** | `369:127295` (Property 1=Default) | `/field/summons-notices/[id]` | Inspector | **skeleton only** |
| D · Summons notices index | **`432:48329`** | *repo-derived — no source frame exists* | `/field/summons-notices` | Inspector | **skeleton only** |

All four are 834 wide, VERTICAL auto-layout, pad 20, gap 10, fill bound to `VariableID:3:4` — matching
`336:45771` exactly. Frame names carry route, INSP-558, source node id (or `repo-derived`), persona,
channel, language and theme.

**The API quota was exhausted immediately after the skeletons were created.** No region content was
placed. All four frames still carried `placeholder = true` (shimmer).

> **Superseded — see the CONTINUATION section at the foot of this document.** All four frames are now
> filled and un-shimmered; the "skeleton only" status in the table above no longer holds.

### Shell note

`336:45771` and its whole section do **not** use `App sidebar` `19:2` — they are plain 834-wide
INSPECTOR-responsive frames. The build matches that. The V4 `minHeight: 716` constraint therefore does
not apply to these four frames; it applies only if a later pass re-parents them onto the sidebar shell.

---

## 5. Component plan (verified available, not yet placed)

| Region | Component | Node |
|---|---|---|
| Section headings | `section-title` | `70:12` |
| Text fields | `Field` (State=Default/Help/Error) | `171:28` |
| Text input | `Input` | `9:66` |
| **Selects** (Department, Region, Document type) | `Select` | `423:48080` |
| **Textareas** (Notes, Reason, non-attendance explanation) | `Textarea` | `401:14` |
| Attendance radios | `Radio` (Checked=true/false) | `9:74` |
| Signature upload | `FileUpload` | `175:19` |
| **Attached signature artefact** | `AttachedFile` | `401:29` |
| Required-documents checklist (10 rows) | `Checkbox` | `9:71` |
| Detail read-only pairs | `DescriptionList row` | `166:12` |
| Detail blocks | `Panel` (Padding variants) | `152:17` |
| Index table | `Table row` (Kind=Header/Data, Columns=3..8), `Table cell` | `108:296`, `71:14` |
| Status text+shape | `Badge` (11 statuses incl. Draft, Pending, Completed) | `9:25` |
| Empty state | `empty` | `15:21` |
| Error / unavailable | `Alert` (Kind=Critical/Warning/Info/Success/Immutable) | `11:43` |
| Actions | `Button` | Button page `7:394` — set id **not yet resolved** |
| Back affordance | `page-back` | `401:47774` |

Text styles to reuse: title `S:16bf9ba1b89cd8786417646dd209fc99bb34c5a6`,
meta `S:5a63b768ee77beb461624c52030d16f13a189bcd`,
mono/provenance `S:0575d1932c5f05543a5dd99bb2667ca72a3727eb`.
Colour variables: surface `3:4`, text primary `3:16`, secondary `3:17`, tertiary `3:18`.

---

## 6. Gaps recorded (design-system change requests, not local fixes)

1. **No accordion / disclosure component.** The source shows an 8-row sibling-report accordion on
   *every* create variant and on the detail view. There is no accordion, disclosure or collapsible in the
   library. The repo uses a native `<details>`/`<summary>`. **Gap — cannot be built from existing components.**
2. **No date-picker input.** Source region 1 is a date field with a calendar glyph. The library has
   `DateRangePicker` `179:39` (a *range*), not a single-date input. Using plain `Input` is what the shipped
   frame already did and it is the downgrade recorded in 3a. **Gap.**
3. **No read-only / derived-value field state.** `Field` offers `State=Default/Help/Error` only. Source
   region 3 (`اليوم`, Day) is derived and non-editable; there is no state to express that.
   **Gap** — and the direct cause of the shipped frame turning it into a typed input.
4. **No signature-capture component.** The detail view has a drawn-signature block; the library has
   `FileUpload` and `AttachedFile` only. **Gap.**
5. **`Button` component set id not resolved** before the quota cut. Present on page `7:394`; the shipped
   frame instantiates `Button / Color=Primary|Secondary, Size=Medium, State=Default`, so the set exists —
   only its node id is unverified.

## 7. Defects found in the shipped `336:45771` (reported, not edited)

- **"Save draft" is invented.** No draft state exists in `actions.ts`, in the `summons_notices` write, or
  in either source component set. It should not be there.
- Three selects rendered as free-text inputs, discarding their option domains.
- The `ملاحظات` (Notes) region is missing outright, though `reason` alone is carried.
- The frame name claims "field-complete (18 shipped columns)" — accurate against the DB, but it describes
  a **column census**, not the journey. The journey is 3 create states + 1 detail view + an index; the
  frame is 1 of 5.

---

## 8. Quota / verification status

**Figma MCP seat limit reached.** Verified by direct read-back: the provenance verdict, all four source
node ids with their ancestor chains, the full text census of all four source variants, three screenshots,
the shipped frame's complete instance tree and styling, the library component inventory, the new section id
and the four new frame node ids.

**Unverified / not done:** all region content inside `432:48326`–`432:48329`; the clipped-text census at
1280 / 1024 / 834 / 680; per-frame screenshots of the build; `Button` set id; clearing `placeholder = true`
on the four frames.

---

# CONTINUATION — content fill pass (R2-SummonsNoticeContentFill)

Everything in sections 1–8 above stands. This section records only what changed.
Nothing outside section `432:48325` was created, edited, moved or deleted. `336:45771` and the whole
source file `8wGaofgbopqmGXc0Wjo0eW` were read only.

## C1. Status — all four frames filled, shimmer cleared

| Frame | Node id | Children | Height @834 | `placeholder` | Census |
|---|---|---|---|---|---|
| A · Issue Summons Notice | `432:48326` | 29 | 1596 | **false** | 0 clipped |
| B · Issue — signature-file state | `432:48327` | 30 | 1621 | **false** | 0 clipped |
| C · Summons Notice detail | `432:48328` | 57 | 2322 | **false** | 0 clipped |
| D · Summons notices index | `432:48329` | 26 | 1095 | **false** | 0 clipped |

Screenshots captured for all four after fill.

## C2. What each frame now carries

**A — create form, `Property 1=Day` (source `360:48435`).** `page-back` · title · meta ·
`section-title` "Notice details" · `Field` Report date (required) · `Field` Subject ·
**`DetailRow` `167:7087` for the derived Day value** (term / hint "Derived from the report date — not
entered by the inspector" / value `Not configured`) — *not* an editable input ·
`section-title` "Classification" · **three real `Select` `11:5` instances** (Department, Region,
Required document type), each in a label + control row cloned from the `Field` label frame so label
typography and colour bindings are the library's, not authored ·
`section-title` "Notes" · **`Textarea` `401:14` Notes** · `section-title` "Confirm attendance and
signature" · two `Radio` `9:74` rows · **`Textarea` Reason** · `section-title` "Related reports" ·
**8 × `Accordion header` `27:629`** sibling-report rows · gap block · **one Primary `Button` action
"Issue summons notice"**. No draft affordance anywhere.

**B — `Property 1=Signature file` (source `360:48213`).** Identical to A through the attendance
radios, then: **no derived Day row, no Reason textarea**; instead `section-title` "Signature file" +
`FileUpload` `175:19` (label "Signature file", hint "Upload the signature image as PNG, JPG or PDF.")
+ `AttachedFile` `401:29`. Same 8-row accordion, same single Issue action.

**C — detail / served view (source `369:127295`), entirely new to the web master.**
`page-back` · title · meta · `Badge` `9:25` (Outline) "Service status — Not configured" ·
**Notice identity** (notice number, report date, report day, report time) ·
**Establishment block, all 10 fields** · **Attendance and required documents** — summons prose naming
issuing directorate + appointment date/time, then the **10-row required-documents checklist** as
`Checkbox` `9:71` + name + description · **Notes** · **Service block** (recipient of service, identity
number, capacity, service date, service time) · **Non-attendance block** (statement + explanation) ·
**Signature block** (signature artefact + ministry representative name) ·
**8-row detail accordion** · gap block.

**D — index, repo-derived.** Rebuilt against `page.tsx` lines 100–131, not guessed: heading
"Notices in your access scope", one expanded rowcard (`Accordion header` + `Badge` Info +
the **10-row** `dl` — Report date, Report day, Region, Department, Required document type, Reason,
Signer, Record ID, Factory / visit / inspection anchors, Created by), two collapsed rowcards,
the `empty` `15:21` state ("No summons notices in scope" / "Issued summons notices appear here
according to summons_notices RLS."), and the `Alert` Critical error state ("Summons notices are
temporarily unavailable" / "Nothing was changed."). Note: §3c said 9 `dl` rows — the route renders **10**.

## C3. Governance

Every notice number, date, time, region, department, document description, recipient, capacity,
signer and record id renders **`Not configured`**. No penalty amount, deadline, grace period, SLA or
violation class appears on any frame. Every status is a `Badge` with a text label — no colour-only dot.
**No "Save draft" control exists on any of the four frames**; `actions.ts` exposes only
`createFieldSummonsNotice`, so a single Primary "Issue summons notice" is the whole action set.

## C4. Gaps — updated

1. **Accordion — partially resolved, downgraded from blocking.** `Accordion header` `27:629` (title +
   summary + toggle) *does* serve the collapsed disclosure row and is used for all 8 sibling-report
   rows on A, B, C and for the rowcards on D. What is still missing is an **expandable body /
   disclosure container**; on D the expanded `dl` is therefore rendered as sibling
   `DescriptionList row` instances rather than nested inside the row. `accordion` `15:43` is a fixed
   two-row specimen and does not serve. **Remaining gap: disclosure body container.**
2. **No single-date picker.** `DateRangePicker` `179:39` is a range. Report date renders as
   `Field` + `Input`. **Gap stands.**
3. **No read-only / derived `Field` state.** Confirmed: `Field` `171:28` offers `State=Default/Help/Error`
   only. Day is therefore rendered as a `DetailRow` `167:7087` (label + hint + value), which is the
   correct semantic but the wrong component family for a form. **Gap stands.**
4. **No signature-capture component.** On B the signature is a `FileUpload` + `AttachedFile`; on C the
   drawn two-party signature is an `AttachedFile` standing in for the artefact. **Gap stands.**
5. **`Button` set id resolved: `8:32`** (page `7:394`), props `Label#8:15:TEXT`, `Color`, `Size`,
   `State`. Gap 5 closed.
6. **New — no read-only checklist row component.** The 10 required-document rows are `Checkbox` `9:71`
   plus text, which reads as editable in a served view. **New gap.**

Each gap is also written onto the canvas as a mono-styled "Component gaps — design-system change
requests, not page-level fixes" block at the foot of every frame. No component was authored.

## C5. Verification

**Clipped-text census — 0 clipped on every frame at every width.** Method: for each visible `TEXT`
node, walk to the nearest clipping ancestor and compare absolute bounds; flag right/bottom overflow
> 0.5px or zero width.

| Width | A | B | C | D |
|---|---|---|---|---|
| 1280 | 0 | 0 | 0 | 0 |
| 1024 | 0 | 0 | 0 | 0 |
| 834 | 0 | 0 | 0 | 0 |
| 680 | 0 | 0 | 0 | 0 |

All four frames restored to **width 834**, vertical HUG, after the census.

**Shell constraint.** The four frames are not built on `App sidebar` `19:2` — they are plain 834-wide
INSPECTOR-responsive frames matching `336:45771`. `minHeight: 716` therefore does not apply and was
not set; all four exceed 716 by content anyway (1095–2322). Recorded, not silently skipped.

**Post-fill fix.** `Badge` instances on C and D were filling the frame width; set to HUG.
Mutated: `440:49275`, `440:53853`, `440:53889`, `440:53895`.

## C6. Changed node ids

Section `432:48325` only.

- **Mutated frames:** `432:48326`, `432:48327`, `432:48328`, `432:48329` (children replaced,
  `placeholder` true → false, vertical HUG).
- **A created:** `438:50699`, `438:50703`, `438:50704`, `438:50705`, `438:50707`, `438:50713`,
  `438:50719`, `438:50724`, `438:50726`, `438:50733`, `438:50740`, `438:50878`, `438:50880`,
  `438:50886`, `438:50888`, `438:50891`, `438:50894`, `438:50900`, `438:50902`, `438:50906`,
  `438:50910`, `438:50914`, `438:50918`, `438:50922`, `438:50926`, `438:50930`, `438:50934`,
  `438:50936`, `438:50937`
- **B created:** `438:50940`–`438:51045` (30 top-level children; full list:
  `438:50940`, `438:50944`, `438:50945`, `438:50946`, `438:50948`, `438:50954`, `438:50960`,
  `438:50962`, `438:50967`, `438:50972`, `438:50977`, `438:50979`, `438:50985`, `438:50987`,
  `438:50990`, `438:50993`, `438:50995`, `438:50997`, `438:51002`, `438:51010`, `438:51014`,
  `438:51018`, `438:51022`, `438:51026`, `438:51030`, `438:51034`, `438:51038`, `438:51042`,
  `438:51044`, `438:51045`)
- **C created:** `440:49269`–`440:49371` (32) and `440:53194`–`440:53267` (25)
- **D created:** `440:53841`–`440:53910` (26)

## C7. Quota

The Figma seat survived this pass. Nine `use_figma` calls were spent: three read-only discovery
(component ids, property definitions, inner text-node names), five writes (A×2, B, C×2, D), one census,
one screenshot batch, one badge fix. Nothing in this continuation is claimed without a returned
read-back or a screenshot.

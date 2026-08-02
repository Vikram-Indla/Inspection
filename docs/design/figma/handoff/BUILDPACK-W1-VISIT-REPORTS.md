# BUILD PACK — W1-VisitReports

Worker: W1-VisitReports. Scope: iPad source file `8wGaofgbopqmGXc0Wjo0eW`, page `269:40019`
("↪ Visit Reports - تقارير الزيارة") only. No other source page touched. No writes made to
the Web master file `ML2PNwfShlQM2k44MvSEw5` — this worker is not the master writer
(W10-ReconciliationLedger applies all master-file edits).

This build pack builds on, and in one place refines, the prior read-only audit already
recorded in `docs/design/figma/ipad-web-disposition.md` (§1, §3, "Deep audit round 2/3").
That audit correctly disposed almost everything on this page; this pack adds a fresh,
node-ID-exact inventory for the page in isolation, and one structural correction (see
"Structural finding" below) that changes how the "Production Line Report" gap should be
read.

## Structural finding (new this pass)

The screenshots of `368:42325` (labelled "Production Line Report" in English), `360:77602`
("Incident Report"), and `361:20826` ("Violation Report") are **not three separate
screens**. All three are the *same* 5-step wizard —
`تفاصيل المحاضر / المحاضر / نتائج الزيارة / ملف النشأة / قائمة البنود`
("Attendee details / Attendee / Visit results / Establishment file / Item list") — frozen
at step 4 ("المحاضر"), with a different accordion row expanded in each snapshot:

- `محضر إثبات واقعة` (Incident/fact-finding minutes) — expanded in `360:77602`
- `محضر سحب عينة` (Sample-collection minutes) — expanded in `361:20826`
- `محضر حجز خط الإنتاج` (Production-line seizure minutes) — expanded in `368:42325`
- Collapsed rows visible in every snapshot: `مذكرة استدعاء` (Summons memo), `محضر ضبط
  مخالفة` (Violation minutes), `محضر إتلاف منتجات مخالفة` (Non-compliant destruction
  minutes), `محضر حجز منتجات` (Product-seizure minutes), `إشعار بتبليغ برفع الحجز عن
  المنتجات أو المواد` (Seizure-lift notice), `محضر النشأة` (Establishment minutes)

So the source models **one accordion screen with up to 9 report-type rows**, not 9
independent report screens. Repo evidence (`/field/summons-notices`,
`/field/incident-reports`, `/field/sample-collection-reports`,
`/field/destruction-reports`, `/field/facility-reports`) covers 5 of the 9 accordion rows
as standalone routes+forms. Two rows have no repo counterpart at all: **"محضر حجز خط
الإنتاج" (production-line seizure)** and **"إشعار بتبليغ برفع الحجز عن المنتجات أو المواد"
(seizure-lift notice)**. Both are real gaps — not because the "report type" is unbuilt in
isolation, but because the accordion container pattern itself (multiple report types
scoped to one visit, expand-to-fill) has no web counterpart at all; the repo instead ships
each report type as its own standalone route.

## 1. Inventory table — every top-level node on page `269:40019`

| Source node | Name | Size (px) | Children | Classification |
|---|---|---|---|---|
| `269:54920` | Inspection Management | 73304×9274 (SECTION, canvas bounds) | 104 | mixed — see §2 breakdown |
| `532:72666` | Create a New Inspection Plan – Unable to Complete Visit – Visit Report | 26438×8273 (SECTION) | 49 | mixed — see §2 breakdown |
| `558:47165` | Overlay - Alerts | 160×160 (INSTANCE) | 0 | shared duplicate — component instance of the shared `Overlay`/`Alert` foundation, not unique page content |
| `902:82072` | Draft | 2972×2326 (SECTION) | 3 | shared duplicate — contains only an `Establishment Details` duplicate, folded into that capability |
| `1682:83454` | Draft | 2972×2326 (SECTION) | 3 | shared duplicate — same as above |
| `941:49887` | Create an Unlicensed Establishment | 2652×3312 (SECTION) | 3 | migrated — canonical content `938:132241` |
| `532:72239` | Create a New Inspection Plan – Unable to Complete Visit – Visit Report | 5677×3656 (SECTION) | 4 | mixed — 2 `Establishment Details` duplicates, folded into that capability |
| `30229:45630` | (stray prose block, ~200 words, starts "Now, what we are going to do is this…") | 2713×15 (TEXT) | 0 | approved non-delivery — canvas debris; a written prompt left on the board, not design content |

## 2. Dedupe map — unique capabilities found inside the two large sections

`269:54920` and `532:72666` between them hold ~150 child nodes. The overwhelming majority
are repeated design-history snapshots of the same handful of screens (`Establishment
Details`, `Establishment Management`, `Inspection Items`, `Modal`, `Summons Notice`,
`Non-Compliant Products Destruction Report`), captured at different points in the
project's history. Below: one row per **unique capability**, its canonical source node,
and every duplicate folded into it.

| Capability | Canonical node | Duplicate nodes folded in | Count |
|---|---|---|---|
| Establishment Details (facility profile shown mid-visit) | `269:54928` | `416:31631`, `532:73092`, `902:82083`, `1682:83462`, `532:72250`, `902:82878`, plus the `938:132241` unlicensed-establishment variant (kept separate, see below) | 7 |
| Establishment Management (facility list + detail, violation/regulatory-status actions) | `296:15894` | `301:97307`, `357:26118`, `297:64463`, `301:67866`, `301:69502`, `330:24870`, `301:71024`, `301:80602`, `532:73258`, `532:73281`, `532:73366`, `532:73486`, `532:73510`, `532:73560`, `532:73585`, `532:73610` | 16 |
| Inspection Items (checklist / attendee-reports wizard, all 9-report accordion) | `292:21350` | `879:64493`, `879:64635`, `985:70673`, `879:64564`, `947:48549` | 5 |
| Modal (dialog pattern — closure reason, violation confirm, deletion confirm) | `292:25578` | `360:29633`, `436:31783`, `1501:85138`, `360:30028`, `532:73635`, `532:73663`, `532:73678`, `1501:83986` | 8 |
| Summons Notice (accordion row / standalone frame) | `360:30151` | `369:120470`, `369:135740`, `369:146056`, `369:165251`, `369:166505`, `369:180149`, `369:185466`, `369:194906`, `369:203534`, `369:200050`, `369:203541`, `369:211081`, `360:49700`, `360:50354`, `532:80377`, `532:80990` | 15 |
| Incident Report (accordion row) | `360:77602` | `532:80150` | 1 |
| Violation Report (accordion row, capture + standalone detail states) | `360:80623` | `361:20819`, `361:20125`, `361:20826` | 3 |
| Non-Compliant Products Destruction Report (accordion row) | `361:44295` | `362:38115`, `362:53901`, `368:28498`, `362:39753`, `362:40186`, `362:21702` | 6 |
| Production Line Report / "محضر حجز خط الإنتاج" (accordion row) | `368:42325` | `369:46690`, `369:51109`, `369:50432`, `369:51116`, `368:66526`, `368:65363`, `368:66533` | 7 |
| Create an Unlicensed Establishment | `938:132241` | — (only instance) | 0 |
| Overlay - Alerts (toast/alert component instance) | `558:47165` | — (only instance) | 0 |
| Top Bar (device chrome) | `905:88962` | — | 0 |
| Frame 1984078725 (unlabelled 1-child draft frame) | `879:64839` | — | 0 |
| Annotation groups (arrows, connector labels, spec notes — `Group NNN`, `Vector N`, the two loose Arabic TEXT notes `294:18694`/`436:31855`/`532:73160`/`532:73161`) | n/a | ~80 nodes across both sections | 80 |

## 3. Classification (one of the four required buckets, every node accounted for)

- **migrated** (faithful web counterpart exists in repo): Establishment Details,
  Establishment Management, Inspection Items/Inspection Workspace, Summons Notice,
  Incident Report, Non-Compliant Products Destruction Report, Create an Unlicensed
  Establishment.
- **shared duplicate**: every node listed in the "Duplicate nodes folded in" column of §2,
  plus the two `Draft` sections (`902:82072`, `1682:83454`) and the two `Establishment
  Details` inside `532:72239`.
- **approved non-delivery**: Top Bar instance `905:88962` (device chrome — web owns nav
  once via `AppShell`, per existing repo evidence in `apps/web/src/app/(app)/field/layout.tsx`);
  all `Group`/`Vector` annotation nodes and the two loose Arabic spec-note TEXT nodes
  (canvas connectors/callouts, not UI); the stray prose TEXT `30229:45630`; `Frame
  1984078725` (`879:64839`, unlabelled single-child draft, no distinguishing content).
- **gap** (unique capability, no faithful web counterpart): Violation Report standalone
  detail/view state (capture is covered via `ChecklistQuestion` Answer=Violation +
  `FindingCard`, but the after-the-fact read-only detail view is not built anywhere in the
  repo and has no Jira story); Production Line Report / "محضر حجز خط الإنتاج" accordion row
  (no repo route, not in the 9-set component library referenced by prior audits, no Jira
  story); the Modal dialog pattern is `reuse-as-component` against the web `Overlay`
  foundation page (`14:2`) rather than a gap, but is listed here because CLAUDE.md rule 3
  requires flagging rather than silently treating a missing web frame as covered — no
  frame instances it were confirmed on this page's specific screenshots.

## 4. Per-screen region / control / state / action spec

### Establishment Details (`269:54928`)
- **Region: header** — establishment name, licence status badge, address line.
- **Region: profile fields** — read-only rows (licence number, activity type, capacity,
  contact person) — display-only, no controls.
- **Controls**: none in this frame besides an implicit "back" affordance in the shared
  Top Bar (chrome, out of scope).
- **States**: no error/empty states visible in the sampled duplicates (all populated
  demo data).
- **Actions**: none — this is a read-only reference panel surfaced mid-visit.

### Establishment Management (`296:15894`)
- **Region: list** — Licensed/Unlicensed establishment tabs, search field, list rows.
- **Region: detail** — facility profile, "Regulatory Data Statuses" action row (`عرض
  الوثيقة` / View document, `الفسح الكيمائي` / Chemical clearance, `تفاصيل الاعفاء` /
  Exemption details).
- **Controls**: search input (text), tab select, list-row tap-to-open, 3 status action
  buttons.
- **States**: default/populated only in sampled nodes; no explicit empty/error state found.
- **Actions**: open establishment detail; navigate to Chemical Clearance / Customs
  Exemption reference screens (both `reference-only` — no repo route, per
  `ipad-web-disposition.md` §1).

### Inspection Items / attendee-reports wizard (`292:21350`)
- **Region: step rail** — 5-step progress indicator (تفاصيل المحاضر / المحاضر / نتائج
  الزيارة / ملف النشأة / قائمة البنود), each step shows numbered/checked/current state.
- **Region: accordion list** — up to 9 collapsible report-type rows (see "Structural
  finding" above for the full list of row labels).
- **Region: expanded row content** — varies per report type; sampled rows show: date
  pickers (تاريخ المحضر / تاريخ الاستدعاء), text/number inputs (رقم محضر, رقم الاستدعاء),
  radio-button groups (حالة خط الإنتاج: إيقاف الإنتاج / استئناف الإنتاج), a text-select
  field (اختر خطوط الإنتاج المراد إغلاقها), a signature-confirmation radio pair (تأكيد
  الحضور والتوقيع), and a file-upload control (إرفاق ملفات — accepts PDF/JPG/PNG, with
  attached-file chips showing filename + download/remove icons).
- **Controls**: date input, text input, radio group, select/dropdown, signature-confirm
  radio, file upload (multi-file, with per-file remove), free-text textarea (ملاحظات /
  السبب), person-name and location selects (اسم المختبر, المنطقة, الإدارة).
- **States**: collapsed/expanded per accordion row; required-field asterisks visible on
  several fields (no populated error state captured in the sampled frames).
- **Actions**: `التالي` (Next) / `السابق` (Previous) footer buttons; `عودة` (Back) in
  header; `إرفاق ملفات` (attach files) button.

### Modal / dialog pattern (`292:25578`)
- **Region**: title, body copy (varies: closure reason, violation confirm, delete
  confirm), primary/secondary action buttons.
- **Controls**: varies — text field, radio group (closure reason), 2-button confirm/cancel
  footer.
- **States**: single default state per sampled instance; no loading/error variant found.
- **Actions**: confirm / cancel, closes the modal.

### Summons Notice (`360:30151`)
- **Region**: recipient details, summons date/time fields, attendance status.
- **Controls**: date/time inputs, text inputs, signature capture.
- **States**: Report Details group 2 (separate node family, `1682:xxx`–`1831:xxx`,
  reference-only, not this page's canonical row) records an `Attended`/`Not Attended`
  state pair not otherwise visible on this page's own nodes.
- **Actions**: submit summons; capture signature.

### Incident Report (`360:77602`)
- **Region**: `وقت المغادرة` (departure time) field, `ملاحظات` (notes) free-text area.
- **Controls**: time picker, textarea.
- **States**: default only, sampled.
- **Actions**: Next/Previous footer, same wizard chrome as Inspection Items.

### Violation Report (`360:80623` capture / `361:20826` standalone)
- **Region (capture, migrated)**: violation selection list, severity tag.
- **Region (standalone detail, gap)**: read-only violation record with narrative field —
  no repo route renders this after-the-fact view.
- **Controls**: multi-select violation list (capture); none confirmed for the detail view
  beyond static text.
- **States**: no distinguishing state variants found beyond the general accordion
  expand/collapse.
- **Actions**: select violation(s) during capture; no action confirmed for the detail view.

### Non-Compliant Products Destruction Report (`361:44295`)
- **Region**: product list, destruction method, witness signature.
- **Controls**: text inputs, select, signature capture, file upload.
- **States**: default only, sampled.
- **Actions**: Next/Previous wizard footer.

### Production Line Report / محضر حجز خط الإنتاج (`368:42325`) — GAP
- **Region: header fields** — `تاريخ المحضر` (record date), `رقم محضر` (record number),
  `تاريخ الاستدعاء` (summons date), `رقم الاستدعاء` (summons number) — 2×2 date/number
  input grid.
- **Region: line-status** — `حالة خط الإنتاج` (production-line status) radio pair:
  `إيقاف الإنتاج` (halt production) / `استئناف الإنتاج` (resume production).
- **Region: line selector** — `اختر خطوط الإنتاج المراد إغلاقها` (select production lines
  to close), a single-line text/select field showing e.g. `خط التعبئة والتغليف`
  (packaging line).
- **Region: attendance confirm** — `تأكيد الحضور والتوقيع` (confirm attendance and
  signature) radio pair: `تم حضور ممثل النشأة ومواف على التوقيع` (representative present
  and agreed to sign) / `لم يتم حضور ممثل النشأة أو أعترض على التوقيع` (representative
  absent or refused to sign).
- **Region: file attachment** — `ملف التوقيع` (signature file), `إرفاق ملفات` button,
  accepts PDF/JPG/PNG.
- **Controls**: 2× date picker, 2× number input, 2× radio group, 1× select/text field,
  file upload.
- **States**: only the "expanded, populated" state is captured in this file's frames;
  no empty/error/validation state sampled.
- **Actions**: `التالي`/`السابق` wizard footer; file attach.
- **Why it's a gap**: none of the 4 shipped attendee-report routes
  (`/field/summons-notices`, `/field/sample-collection-reports`,
  `/field/destruction-reports`, `/field/facility-reports`) nor `/field/incident-reports`
  covers a production-line-halt/resume report type. No Jira story in
  `docs/design/figma/jira-backlog-keys.md` or `JIRA-COVERAGE-2026-08-01.md` names it. It
  is absent from the "Reports" 9-set component library referenced in
  `ipad-web-disposition.md` §3.

### Create an Unlicensed Establishment (`938:132241`) — already migrated
- Region/control/state detail not re-derived here — repo route
  `/field/establishments/unregistered` (INSP-605) is shipped and e2e-verified per
  `ipad-web-disposition.md` §1. No web-master proof frame confirmed for it under scope
  rules (out of this worker's write authority to add one).

## 5. Proposed Web frame list

Per the constraint that no `/ipad` route may be proposed and every route must be one of
the ten fixed routes in `CLAUDE.md` rule 9 (query state, not new subroutes) — **the one
genuine gap here (Production Line Report) does not have a clean fixed-route home**. It is
an accordion row inside the field/inspector attendee-reports wizard, which itself has no
canonical `SCR-FLD-*` frame yet (per `ipad-web-disposition.md`, only `SCR-FLD-600` and
`SCR-FLD-630` exist; the reports step is one of the "remaining canonical batches,
explicitly not done yet"). Proposing a new frame for one accordion row before the
container screen itself is canonical would invent structure. This is recorded as an
open item for W10/Web Figma, not resolved unilaterally here.

| Proposed frame | Route | Persona | Jira key | Components to use |
|---|---|---|---|---|
| SCR-FLD-64x — Attendee Reports (accordion step of the inspection wizard) | `/field/inspection/[id]` (existing route — reports are a step/state, not a new route, per rule 9) | inspector | NONE — no INSP story names the accordion-container pattern itself | `ChecklistQuestion`, `FindingCard`, `FileUpload`, `Field` (Help/Error variant for conditional disclosure), existing `Button` |
| — Production Line Report accordion row content (sub-content of the frame above, not a separate frame) | same as above | inspector | NONE | `Field` (date, number, radio, select variants), `FileUpload` |

No other new frames are proposed. Every other capability on this page already has a
migrated repo route and, per the reconciliation ledger's ownership boundary, adding a
canonical Web-master proof frame for those (Incident Report has none yet; Summons/
Destruction/Facility/Sample already have non-canonical proof frames per
`ipad-web-disposition.md` §"Remaining work" item 1) is W10's job, not proposed as new here
since it is not a new capability — it's closing an existing recorded evidence gap.

## 6. Gaps list

1. **Production Line Report / محضر حجز خط الإنتاج** (accordion row inside the
   attendee-reports wizard, canonical node `368:42325`, 7 duplicate snapshots folded in
   per §2) — no repo route, no Jira story, not in the 9-set Reports component library.
   Renders `Not configured` for any threshold/rule if built blind; must not be invented.
2. **Violation Report standalone detail/view state** (`361:20826` and 2 further
   duplicates) — capture is covered (`ChecklistQuestion` Answer=Violation + `FindingCard`),
   but the after-the-fact read-only detail view has no repo route and no Jira story.
3. **Incident Report web-master proof frame missing** — repo route
   `/field/incident-reports` is shipped, but (per `ipad-web-disposition.md` §3) it is the
   one shipped report story with no proof frame at all in the web master, not even a
   non-canonical one — a delivery-evidence gap, not a design gap.
4. **Attendee-reports wizard has no canonical `SCR-FLD-*` frame at all** — `SCR-FLD-600`
   and `SCR-FLD-630` exist; the reports/accordion step (this page's dominant content,
   ~150 duplicate child nodes) is not represented anywhere in the canonical 29-route
   section. This blocks proposing a clean frame for gap #1 above without inventing the
   container first.

## Counts summary

- Top-level source nodes on page `269:40019`: 8
- Unique capabilities after dedupe: 13 (11 screen/pattern capabilities + 2 loose
  component instances — Overlay-Alerts, Top Bar)
- Classification counts: **migrated** 7 · **shared duplicate** ~88 nodes (folded into 9
  capabilities) · **approved non-delivery** ~84 nodes (annotation groups, chrome, canvas
  debris) · **gap** 2 (Production Line Report row, Violation Report standalone detail)
- Proposed Web frames: 1 new frame (Attendee Reports step), plus 1 sub-content spec
  (Production Line Report row) that is not a separate frame — both flagged as blocked on
  the container screen's own canonicalization, not built here.

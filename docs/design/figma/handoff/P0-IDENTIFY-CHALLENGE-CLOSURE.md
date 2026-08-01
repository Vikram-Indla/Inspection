# P0 — Identify Challenge (source page `620:45076`) — closure

**The spot-check was correct.** I had imported screens *named* "Inspection Items" and
"Establishment Details" from **other source pages** — `292:21350` (Visit Reports) and
`1831:155723` (Establishment Management). The Identify Challenge frames on `620:45076` are a
**different capability** and were not represented. That is a real miss, not a labelling
difference.

Web master file: `ML2PNwfShlQM2k44MvSEw5`, page `— SCREENS —` (`6:9`),
section `339:42098`.

---

## Row 1 — Challenge inspection

| | |
|---|---|
| **iPad source** | **`639:78727`** — "Inspection Items" (Identify Challenge page `620:45076`), 834×1915 |
| **Web destination** | **`383:45019`** — "SOURCE-IMPORT — Challenge Inspection — iPad “Inspection Items” 639:78727 (Identify Challenge) — INSPECTOR responsive · EN · Light" |
| **Repo route** | **NONE.** No challenge route exists — `find app -type d` matching challenge returns nothing |
| **Jira** | **NONE FOUND.** No `INSP-*` key in `jira-backlog-keys.md` or `traceability/` mentions challenge |

### Region-by-region

| Source region (AR) | English | Destination | Fields / media / controls / states / actions |
|---|---|---|---|
| تفاصيل التفتيش | Inspection details | `section-title` + 3 detail rows | **Fields** Visit type = *Targeted regulatory*; Inspector name; Inspection date. **States** the latter two render `Not configured` |
| عناصر التقييم | Assessment elements | 5 `assessment` cards | **Fields** capital; IDF loan; exports products; government supply contracts; approved expansion plan. **Controls** Yes/No option set shown as the governed choice; capital renders `Not configured` |
| تفاصيل التحدي | Challenge details | `section-title` + detail + 2 `Field` | **Fields** Challenge status; Challenge description **(required)**; Notes **(required)**. **States** required markers carried from the source `*` |
| الوثائق الداعمة للمراجعة | Supporting documents for review | `FileUpload` `175:19` | **Media** attach files. **Controls** limit carried verbatim — *Up to 3 attachments, in PDF, image (PNG or JPEG), Word or Excel* |
| ارسال / السابق | Submit / Previous | `act` row | **Actions** Previous (secondary) · Submit (primary) |

### Visual proof

| Width | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| Height | 1077 | 1077 | 1077 | 1077 |
| Clipped | 0 | 0 | 0 | 0 |
| Crunched | 0 | 0 | 0 | 0 |

0 off-ramp sizes · 0 unbound fills · 0 placeholder literals.

---

## Row 2 — Establishment details (visit, on site)

| | |
|---|---|
| **iPad source** | **`631:45084`** — "Establishment Details" (Identify Challenge page `620:45076`), 834×2172 |
| **Web destination** | **`383:45124`** — "SOURCE-IMPORT — Establishment Details (visit, on site) — iPad 631:45084 (Identify Challenge) — INSPECTOR responsive · EN · Light" |
| **Repo route** | **NONE** for the challenge flow. Nearest shipped surfaces are `/field/establishments` and `/field/[visitId]`, neither of which carries report-type selection |
| **Jira** | **NONE FOUND** |

### Region-by-region

| Source region (AR) | English | Destination | Fields / media / controls / states / actions |
|---|---|---|---|
| صورة المنشأة · تغيير صورة المنشأة | Establishment photo · change photo | `establishment-photo` | **Media** photo slot rendering *No establishment photo — not configured*. **Controls** *Change establishment photo* |
| بيانات المنشأة | Establishment data | 2 detail rows | **Fields** Establishment status; Establishment name |
| مواقع المنشأة | Establishment locations | 2 detail rows + `LocationVerification` `319:193` | **Fields** Registered visit address; Actual visit address. **States** `State=Match` — *Matches*, "Within the accepted distance", "Arrival is inside the geofence, so no override is required" |
| إعدادات الزيارة | Visit settings | detail + `unable` row | **Fields** Visit type. **Controls** *Unable to complete the visit* checkbox — the source's تعذر تنفيذ الزيارة |
| نوع التقرير | Report type | `report-types` — 6 radio cards | **Controls** Chemical clearance report · **Identify challenge** (selected) · Visit report · Visit statement · Safety report · Customs exemption report. All six source types present |
| الملاحظات | Notes | `Field` | **Fields** Notes |
| ابدأ إعداد الخطة | Start plan preparation | `act` | **Actions** Start plan preparation (primary) |

### Visual proof

| Width | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| Height | 1048 | 1048 | 1048 | **1103** |
| Clipped | 0 | 0 | 0 | 0 |
| Crunched | 0 | 0 | 0 | 0 |

Height grows at 680 as the report-type cards wrap from 3 columns to 2 — correct reflow.

---

## Row 3 — Establishment details (remote visit)

| | |
|---|---|
| **iPad source** | **`1908:89825`** — "Establishment Details" (Identify Challenge page `620:45076`), 834×2016 |
| **Web destination** | **`383:45254`** — "SOURCE-IMPORT — Establishment Details (remote visit) — iPad 1908:89825 (Identify Challenge) — INSPECTOR responsive · EN · Light" |
| **Repo route** | Closest shipped is `/field/virtual/[id]` (325 ln) — remote session, but **no report-type selection and no establishment photo**. Not a faithful destination |
| **Jira** | **INSP-553** covers branching between field and remote visit; nothing covers the challenge report-type set |

### Region-by-region

| Source region (AR) | English | Destination | Fields / media / controls / states / actions |
|---|---|---|---|
| جودة الإتصال ضعيفة | Weak connection quality | `Alert` `Kind=Warning` | **States** degraded-connection warning, carried from the source |
| صورة المنشأة | Establishment photo | `establishment-photo` | **Media** photo slot + change control |
| بيانات المنشأة | Establishment data | 2 detail rows | **Fields** status; name |
| مواقع المنشأة → remote | Remote session | 4 detail rows | **Fields** Registered visit join link; Actual visit join link; Platform; Passcode — the source's Google Meet link, platform and `829@#48Qff` all render `Not configured` |
| Fab_Button · camera-02 · Mic Button · full-screen | Capture | **`CaptureControls` `382:286`** (new) | **Controls** Camera · Microphone · Full screen. **States** `Idle` · `Recording` · `PermissionDenied` |
| إعدادات الزيارة | Visit settings | detail + checkbox | as row 2 |
| نوع التقرير | Report type | 6 radio cards | as row 2 |
| الملاحظات | Notes | `Field` | Notes |
| ابدأ إعداد الخطة | Start plan preparation | `act` | primary action |

### Visual proof

| Width | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| Height | 1145 | 1145 | 1145 | **1216** |
| Clipped | 0 | 0 | 0 | 0 |
| Crunched | 0 | 0 | 0 | 0 |

---

## New component

**`CaptureControls` `382:286`** — `State=Idle | Recording | PermissionDenied`. Camera,
microphone and full-screen affordances. The source draws these as **iPad floating action
buttons**; they are rebuilt as **browser capabilities available at every width**, and the frame
says so on itself.

## Genuinely non-transferable source items

| Source item | Why |
|---|---|
| `Status bar and Menu bar- iPad` (`9:41 · Mon Jun 9 · 100%`) | iPadOS status bar — device chrome |
| `Top Bar` instance | Fixed-width tablet bar; the web `App topbar` `20:172` collapses responsively |
| `Fab_Button` floating geometry | The *affordance* transfers as `CaptureControls`; the floating-action-button placement does not |
| Sample values — `16,000,000`, `829@#48Qff`, the Google Maps URL, `شركة الامل للتدريب العمال` | Governed data, not configuration. Rendered `Not configured` per rule 10 |

## Gaps this P0 exposes — recorded, not closed

1. **The Identify Challenge capability has no repo route.** Three faithful screens now exist in
   the Web master with nothing to ship them against.
2. **No Jira story covers it.** Searched `jira-backlog-keys.md` and all of `traceability/`.
3. **Report-type selection exists on no shipped route.** Six report types drive the whole visit
   flow in the source and appear nowhere in `/field/*`.

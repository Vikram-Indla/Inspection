# BUILDPACK W3 — Identify Challenge (source page `620:45076`)

Worker: W3-IdentifyChallenge. Source `8wGaofgbopqmGXc0Wjo0eW`, page `↪ Identify Challenge - رصد تحدي`
(`620:45076`). Web master `ML2PNwfShlQM2k44MvSEw5`, delivery page `— SCREENS —` (`6:9`), section
`339:42098`. This is a build pack only — no node on the Web master was created, edited, moved or
deleted by this worker. Read-only against the iPad source.

Baseline read: `P0-SOURCE-FIDELITY-2026-08-01.md`, `P0-IDENTIFY-CHALLENGE-CLOSURE.md`,
`SOURCE-SCREEN-CLASSIFICATION-2026-08-01.md`. Those documents are correct as far as they go —
verified below — but neither covers the whole page: one source frame (`1956:93347`) and one
already-migrated frame's control fidelity (`385:45164`) were left open. Both are closed out here
as findings, not fixed (W3 does not touch the master).

## 1. Full page inventory

Page `620:45076` has two sections, both named "Inspection Management" (`631:45079` and
`1908:90609` — the second is the remote-visit continuation of the same journey map). 22 top-level
nodes total: **7 real screens, 15 debris/annotation nodes.** Matches the prior classification's
page-level count (`7 frames · 15 other nodes`) exactly — no hidden screens found.

### Section `631:45079`

| Node | Name | Size | Kind |
|---|---|---|---|
| `631:45080` | Group 201 | 6763×379 | debris — journey-map label strip (rounded-rect + text) |
| `631:45084` | Establishment Details | 834×2172 | **screen** — visit on site, location MATCH |
| `631:45113` | Establishment Details | 834×2172 | **screen** — visit on site, location MISMATCH |
| `631:45142` | Group 223 | 1032×379 | debris — journey-map label |
| `631:45146` | Group 198 | 1326×385 | debris — journey-map label |
| `631:45149` | Group 459 | 834×238 | debris — journey-map label |
| `631:45212` | Group 290 | 834×254 | debris — journey-map label |
| `631:45216` | Group 291 | 878×254 | debris — journey-map label |
| `639:78727` | Inspection Items | 834×1915 | **screen** — Challenge inspection (standard) |
| `879:64423` | Summons Notice | 834×1800 | **screen** — challenge submitted confirmation |
| `879:64436` | Group 458 | 694×52 | debris — flow arrow + connector label |
| `1908:93794` | Group 468 | 1593×453 | debris — journey-map label |

### Section `1908:90609`

| Node | Name | Size | Kind |
|---|---|---|---|
| `1908:90610` | Group 460 | 6763×379 | debris — journey-map label strip |
| `1908:90672` | Group 461 | 1326×379 | debris — journey-map label |
| `1908:90676` | Group 462 | 1326×385 | debris — journey-map label |
| `1908:90682` | Group 464 | 834×254 | debris — journey-map label |
| `1908:90686` | Group 465 | 878×254 | debris — journey-map label |
| `1908:90749` | Summons Notice | 834×1800 | **screen** — challenge submitted confirmation (duplicate of `879:64423`) |
| `1908:90762` | Group 466 | 694×52 | debris — flow arrow + connector label |
| `1908:90766` | Group 467 | 1593×453 | debris — journey-map label |
| `1908:89825` | Establishment Details | 834×2016 | **screen** — remote visit |
| `1956:93347` | Inspection Items | 834×1915 | **screen** — Challenge inspection, **remote-visit variant** |

All debris nodes follow the same shape as every other page in this source file (see
`SOURCE-SCREEN-CLASSIFICATION-2026-08-01.md`): a rounded-rectangle card plus a text label, or an
arrow vector plus a text label, forming the journey-map overlay that sits on the canvas around the
real frames. None contains form content. None was misclassified as a screen.

## 2. Dedupe map

7 screen frames collapse to **5 distinct screen contents**:

| Content | Source frames | Notes |
|---|---|---|
| Establishment details — visit, on site, location MATCH | `631:45084` | unique |
| Establishment details — visit, on site, location MISMATCH | `631:45113` | unique — same layout as above, different `LocationVerification` state and map tooltip |
| Establishment details — remote visit | `1908:89825` | unique |
| Challenge inspection (standard) | `639:78727` | unique |
| Challenge inspection — remote visit (embedded evidence video) | `1956:93347` | **not** a duplicate of `639:78727` — see §4 |
| Challenge submitted confirmation | `879:64423`, `1908:90749` | **true duplicate** — identical subtree, identical Arabic strings, appears once per journey branch (on-site and remote both route through the same confirmation) |

## 3. Region-by-region spec, per unique screen

### `631:45084` — Establishment details, visit on site, MATCH

| Region (AR) | EN | Fields / media / controls / states |
|---|---|---|
| صورة المنشأة | Establishment photo | Media: establishment photo, "change photo" control |
| بيانات المنشأة | Establishment data | Establishment status (badge); establishment name |
| مواقع المنشأة | Establishment locations | Registered visit address; actual visit address; map with registered/actual markers; `LocationVerification` state=Match |
| إعدادات الزيارة | Visit settings | Visit type (select); "Unable to complete the visit" checkbox |
| نوع التقرير | Report type | 6 checkbox cards w/ icon, multi-select. Identify challenge checked; Visit statement disabled |
| الملاحظات | Notes | Notes field |
| ابدأ إعداد الخطة | Start plan preparation | Primary action |

### `631:45113` — Establishment details, visit on site, MISMATCH

Same regions as `631:45084`. The only source-side delta is the `LocationVerification` state
(`Mismatch` instead of `Match`) and its tooltip text (عدم تطابق الموقع / "there is a difference
between the establishment location and the visit location — confirm before continuing").
Everything else — photo, data, map, visit settings, report type, notes, action — is structurally
identical to `631:45084`.

### `1908:89825` — Establishment details, remote visit

| Region (AR) | EN | Fields / media / controls / states |
|---|---|---|
| جودة الاتصال ضعيفة | Weak connection quality | Warning alert |
| صورة المنشأة | Establishment photo | Media + change control |
| بيانات المنشأة | Establishment data | Status; name |
| مواقع المنشأة → remote | Remote session | Registered/actual join link, platform, passcode |
| Fab_Button / camera / mic / full-screen | Capture | Camera, microphone, full-screen controls; live video tile |
| إعدادات الزيارة | Visit settings | Visit type; unable-to-complete checkbox |
| نوع التقرير | Report type | Same 6-card set as on-site |
| الملاحظات | Notes | Notes field |
| ابدأ إعداد الخطة | Start plan preparation | Primary action |

### `639:78727` — Challenge inspection (standard)

| Region (AR) | EN | Fields / media / controls / states |
|---|---|---|
| تفاصيل التفتيش | Inspection details | Visit type; inspector name; inspection date |
| عناصر التقييم | Assessment elements | Capital (text input); 4 Yes/No dropdown questions (IDF loan, exports, government contracts, expansion plan) |
| تفاصيل التحدي | Challenge details | Challenge status (dropdown); challenge description (textarea, required); notes (textarea, required) |
| الوثائق الداعمة للمراجعة | Supporting documents for review | File upload dropzone; **2** attached-file rows, each with download/remove |
| ارسال / السابق | Submit / Previous | Previous (secondary), Submit (primary) |

### `1956:93347` — Challenge inspection, remote-visit variant — **GAP, no web frame**

Identical region structure to `639:78727` (تفاصيل التفتيش / عناصر التقييم / تفاصيل التحدي /
الوثائق الداعمة للمراجعة / ارسال-السابق), with one addition: inside عناصر التقييم (Assessment
elements), node `1956:93679` "Slide 16:9 - 1" (408×234) sits at the top of the section, overlapping
the second Yes/No question — a live/recorded evidence video tile, the same kind of capture surface
already built as `RemoteVideoTile` (`401:47913`) for the remote establishment-details screen. This
is the remote-visit counterpart to `639:78727`, the same way `1908:89825` is the remote counterpart
to `631:45084`/`631:45113`. It pairs with the remote establishment-details flow and has never been
represented in the Web master.

### `879:64423` / `1908:90749` — Challenge submitted confirmation

| Region (AR) | EN | Fields / media / controls / states |
|---|---|---|
| تم إرسال الطلب لغاية المراجعة والاعتماد | Request sent for review and approval | Success icon, heading, subtext |
| سيتم إرسال الطلب... | Forwarded to the competent authority | Body copy |

Single-region confirmation screen; no additional controls.

## 4. Verification of the five already-migrated frames

Screenshot-compared each web frame against its stated iPad source. Result: **3 of 5 hold, 1 has
new deltas beyond the prior P0 closure, 1 (the merged pair) holds.**

### `383:45019` ← `639:78727` (Challenge inspection) — HOLDS, with one new delta

Back affordance, section titles, capital `Input`, 4 `Select` controls, 2 `Textarea` (description +
notes), `FileUpload` dropzone, Submit/Previous — all present and structurally correct, confirming
the P0 closure claim.

**New delta found:** the source shows **two** attached-file rows under the dropzone (both reading
"ملف قائمة للنشآت المستهدفة.PDF"). The web frame's metadata shows exactly **one**
`AttachedFile` instance (`401:47793`). One attachment row is missing — not a governed-data issue
(rule 10 is respected, the row renders `Not configured` rather than a real filename), a structural
undercount.

### `383:45124` ← `631:45084` (Establishment details, on site, MATCH) — HOLDS

Photo slot, status badge, map-panel with registered/actual markers and provider caption,
`LocationVerification` (state=Match), visit-type `Select`, 6 `report-type-card` checkboxes
(Identify challenge checked, Visit statement disabled), notes, primary action — all present and
match the source structure and the P0 closure claim.

### `383:45254` ← `1908:89825` (Establishment details, remote) — HOLDS

Weak-connection alert, photo slot, remote-session fields (join links / platform / passcode, all
correctly `Not configured`), `RemoteVideoTile` capture surface, visit-type `Select`, 6
`report-type-card` checkboxes, notes, primary action — matches the source and the P0 closure claim.

### `385:45164` ← `631:45113` (Establishment details, location MISMATCH) — **DOES NOT HOLD. Control-fidelity repair was never applied to this frame.**

The P0 closure document's repair table lists only three frames — `383:45019`, `383:45124`,
`383:45254`. `385:45164` was migrated (region coverage exists) but **never received the same
control-fidelity pass**. Metadata confirms it is still in the pre-repair, flattened state:

| Control | `383:45124` (repaired sibling) | `385:45164` (this frame) |
|---|---|---|
| Establishment status | `Badge` instance | plain text row — flattened |
| Visit type | `Select` instance | plain text row — flattened |
| Map surface | `map-panel` frame with registered/actual markers | **absent entirely** — no map-panel node exists |
| Report type | 6 `report-type-card` instances (checkbox + icon, multi-select) | 6 plain `report-type` frames with `Radio` instances (single-select, no icon) |

This is the same class of defect the P0 pass fixed everywhere else on this page, just missed on
the mismatch-state twin. It is a real regression risk: an inspector viewing the mismatch state
sees a materially less capable screen than the match state — no map, no multi-select report type,
static text instead of controls.

**Second defect, independent of the above:** the frame carries a stray text node,
`385:45286` "mismatch-note", reading (in full) *"Source 631:45113 — عدم تطابق الموقع: 'There is a
difference between the establishment location and the visit location. Confirm the location before
continuing.' The match state is 383:45124."* This is an authoring/audit annotation that was left
attached to the shipped frame content — it renders on-canvas, at the bottom of the screen, below
the primary action button. It reads as internal notes-to-self, not product copy, and does not
belong on a delivery frame regardless of the control-fidelity issue above.

### `385:45287` ← `879:64423` + `1908:90749` (Challenge submitted confirmation, merged) — HOLDS

Success icon, heading, subtext, "Submission reference: Not configured" (correct per rule 10 — no
governed value invented), "Back to visit" action. Faithful, condensed representation of the
single-region source screen; the merge of the two identical source duplicates into one web frame
is correct and was already noted as a merge in the closure doc.

## 5. Classification — every node on `620:45076`

| Node | Classification | Notes |
|---|---|---|
| `639:78727` | `migrated` | → `383:45019`. Fidelity holds; 1 delta (see §4) |
| `631:45084` | `migrated` | → `383:45124`. Fidelity holds |
| `1908:89825` | `migrated` | → `383:45254`. Fidelity holds |
| `631:45113` | `migrated` (fidelity gap) | → `385:45164`. Region coverage present; control fidelity NOT repaired — see §4 |
| `879:64423` | `shared duplicate` (migrated) | → `385:45287`, merged with `1908:90749` |
| `1908:90749` | `shared duplicate` (migrated) | → `385:45287`, merged with `879:64423` |
| `1956:93347` | `gap` | Challenge inspection, remote-visit variant with embedded evidence video. No web frame exists |
| `631:45080` | `approved non-delivery` | journey-map annotation |
| `631:45142` | `approved non-delivery` | journey-map annotation |
| `631:45146` | `approved non-delivery` | journey-map annotation |
| `631:45149` | `approved non-delivery` | journey-map annotation |
| `631:45212` | `approved non-delivery` | journey-map annotation |
| `631:45216` | `approved non-delivery` | journey-map annotation |
| `879:64436` | `approved non-delivery` | flow arrow + connector label |
| `1908:93794` | `approved non-delivery` | journey-map annotation |
| `1908:90610` | `approved non-delivery` | journey-map annotation |
| `1908:90672` | `approved non-delivery` | journey-map annotation |
| `1908:90676` | `approved non-delivery` | journey-map annotation |
| `1908:90682` | `approved non-delivery` | journey-map annotation |
| `1908:90686` | `approved non-delivery` | journey-map annotation |
| `1908:90762` | `approved non-delivery` | flow arrow + connector label |
| `1908:90766` | `approved non-delivery` | journey-map annotation |

**Counts:** `migrated` 4 (one with an open fidelity gap) · `shared duplicate` 2 (both migrated,
merged into 1 web frame) · `gap` 1 · `approved non-delivery` 15. 22 nodes total, 22 classified.

## 6. Proposed web frames

Two proposals — one new frame, one repair. Neither is executed here; W10-ReconciliationLedger
owns the master file.

1. **New frame** — "Challenge inspection — remote visit" (or equivalent name per master
   conventions), from source `1956:93347`. Same region structure as `383:45019` plus an evidence
   `RemoteVideoTile` (reuse the existing `401:47913` component, already built for
   `383:45254`) docked over/above the assessment-elements section, matching where the source
   places `Slide 16:9 - 1`.
   - Route: **NONE** — no repo route exists for the challenge capability (unchanged finding from
     the prior closure).
   - Persona: INSPECTOR.
   - Jira: **NONE** — no `INSP-*` key covers the challenge capability (unchanged finding).

2. **Repair, not a new frame** — bring `385:45164` up to the same control fidelity as
   `383:45124`: bind `Badge` for establishment status, `Select` for visit type, add a `map-panel`
   with registered/actual markers (state can carry the mismatch tooltip content instead of the
   match one), swap the six `Radio`-based `report-type` frames for `report-type-card` instances.
   Also remove the stray `385:45286` "mismatch-note" text node — it is not product content.
   - Route: same as `383:45124` — **NONE**.
   - Persona: INSPECTOR.
   - Jira: **NONE**.

**Proposed frame count: 1 new + 1 repair.**

## 7. Gaps — recorded, not closed

1. The Identify Challenge capability has **no repo route** and **no Jira story**, confirmed again
   at this page level — consistent with both prior closure documents. This applies to every
   screen and to the newly-identified remote-visit inspection variant.
2. `385:45164` (location-mismatch establishment details) is missing control-fidelity repair that
   its sibling frames already received. This is a defect against the P0 closure's own standard,
   not merely an unfinished feature.
3. `385:45164` carries a leftover authoring annotation baked into shipped frame content
   (`385:45286`).
4. `383:45019` under-counts attached files by one row against its source (1 rendered vs. 2 in
   source).
5. No icon was invented for anything in this pack — the proposed `RemoteVideoTile` reuse and
   `report-type-card` reuse for the repair draw only on components already built in this design
   system pass; no new icon-library lookups were required.

## 8. Not claimed

This is a build pack: inventory, dedupe, spec, verification, classification, and proposal. No
node was created, edited, or deleted in the Web master or the iPad source by this worker.

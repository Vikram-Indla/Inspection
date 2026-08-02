# BUILD — B3 — Visit Statement

Worker: B3-VisitStatementBuild
Source (READ ONLY): `8wGaofgbopqmGXc0Wjo0eW`, page `2468:31912` (افادة الزيارة), canonical screen `2468:31956`
Target: `ML2PNwfShlQM2k44MvSEw5`, page `— SCREENS —` (`6:9`)

**Status: BUILT.** The frame exists, is populated, and was screenshot-verified at 834.
The 1280 / 1024 / 680 responsive census did **not** run — the Figma MCP seat hit its call
limit on that call. See §7.

---

## 1. Identity

| Field | Value |
|---|---|
| Source node | `2468:31956` — "Establishment Details" (834×2552), the one canonical Visit Statement screen on page `2468:31912` |
| **Section created** | **`432:45512`** — `SCREENS — BUILD Visit Statement · EN · Light`, page `6:9`, at x=-80, y=240000 |
| **Frame created** | **`432:45513`** — `Visit Statement — /field/visit-statements (ROUTE PENDING OWNER RULING) — INSP-548 — iPad 2468:31956 — INSPECTOR responsive · EN · Light` |
| Frame size | 834 × 1791, `minHeight = 716` set |
| Persona | INSPECTOR — responsive web. No `/ipad` route. |
| Jira | **INSP-548** — "[REUSE] Log a lightweight Visit Statement" (`docs/design/figma/jira-backlog-keys.md:23`). Exact story-title match, independently confirmed by W7 and W10. No dev-resource attach was attempted (sandbox rejects those calls). |
| Route | `/field/visit-statements` — **PROPOSED ONLY, NOT GOVERNED. See §2.** |

Nothing outside section `432:45512` was created, edited, moved or deleted. The template frame
`383:45124` was read and cloned; the original is untouched.

---

## 2. ⚠️ ROUTE RULING REQUIRED — BLOCKS DELIVERY

`/field/visit-statements` is **not** in CLAUDE.md rule 9's fixed route list:

> `/dashboard` `/operations` `/factory-360` `/planning` `/execution` `/reviews` `/compliance`
> `/compliance/approvals` `/enforcement-library` `/analytics` `/admin/*`
> — "Do not rename, add, or nest."

W7 proposed the route by analogy with the four existing INSPECTOR REPORT FORMS siblings
(`/field/summons-notices`, `/field/sample-collection-reports`, `/field/destruction-reports`,
`/field/facility-reports`) — themselves also outside the fixed list. W10 raised the conflict and
did not resolve it. **B3 has not resolved it either, and did not invent an alternative.**

The frame name carries the proposed route with `(ROUTE PENDING OWNER RULING)` inline so the
canvas cannot be mistaken for a governed contract. The three live options are all owner
decisions, none of which B3 is authorised to take:

1. Ratify `/field/*` as a governed route family (it already carries five screens de facto).
2. Fold Visit Statement into `/execution` as query state, e.g. `?report=visit-statement` —
   consistent with rule 9's "tabs and filters are query state".
3. Rule the capability out of web scope.

**Until an owner rules, this frame is design-complete and delivery-blocked.** Renaming the frame
after the ruling is a one-line edit; nothing else in it depends on the route.

---

## 3. Selection model — settled, not re-opened

W10 proved from source that report-type cards are **multi-select**. Both source pages use
`Card Type=Selectable` with a Checkbox on unselected cards and a Radio on the selected one — an
authoring habit, not two models; `631:45084` shows two cards selected at once, which a radio
group cannot do. B3 used `report-type-card` `401:47769` as built, checkbox-based, and did not
re-litigate.

Six cards, source order preserved, all checkbox:

| # | Label | Icon | State |
|---|---|---|---|
| 1 | Chemical clearance report | `icon/ui/scale` `73:6885` | `Checked=false, State=Default` |
| 2 | Identify challenge | `icon/ui/target` `73:6869` | `Checked=false, State=Default` |
| 3 | Visit report | `icon/ui/document` `73:6945` | `Checked=false, State=Default` |
| 4 | **Visit statement** | `icon/ui/clipboard-check` `73:6879` | **`Checked=true, State=Default`** |
| 5 | Safety report | `icon/ui/shield-check` `73:6901` | `Checked=false, State=Default` |
| 6 | Customs exemption report | `icon/ui/gov-flag` `73:6908` | `Checked=false, State=Default` |

Two deliberate changes from the cloned template `383:45124`:

- Card 4 moved from `401:47767` (`State=Disabled`) to `401:47766` (`Checked=true`). On the
  Identify Challenge page Visit statement is disabled; on **this** source page it is the
  selected, fully operable type (W7 §3, screenshot-confirmed). The disabled state belongs to the
  other flow, not this one.
- Card 2 moved from `Checked=true` to `Checked=false` — the template selects Identify challenge
  because that is its own screen's type.

---

## 4. Region-by-region

| Source region (AR) | English | Destination | Contents |
|---|---|---|---|
| Top Bar `2468:31957` | chrome | `App topbar` `20:172` + `page-back` `401:47774` | Back. iPadOS status bar is approved non-delivery. |
| صورة المنشأة `2468:31959` | Establishment photo | `establishment-photo` pattern (as built on `383:45124`) | *No establishment photo — not configured* + `Button` `8:8` *Change establishment photo* |
| بيانات المنشأة | Establishment data | `section-title` `70:12` + 2 detail rows | Establishment status → `Badge` `9:23` *Not configured*; Establishment name → *Not configured* |
| مواقع المنشأة | Establishment locations | 2 detail rows + `map-panel` + `LocationVerification` `319:165` | `State=Match`, *Matches*, "Within the accepted distance" |
| إعدادات الزيارة `2468:31961` | Visit settings | detail row + `Select` `11:5` | Visit type = *Targeted regulatory* |
| تعذر تنفيذ الزيارة `2468:31968` | Visit could not be carried out | `unable` row + `Checkbox` `9:71`/`9:69` | *Unable to complete the visit*, unchecked — per brief, `Checkbox` as `383:45124` does |
| نوع التقرير `2468:31969` | Report type | `report-types` grid, 6 × `report-type-card` `401:47769` | see §3 |
| تاريخ الزيارة `2468:112965` | Visit date | `Field` `171:28` — `432:48297` | *Not configured* (source value `01/01/2026` is governed data) |
| اسم الزائر `2468:112964` | Visitor name | `Field` `171:28` — `432:48303` | placeholder *Add the visitor name here* |
| سبب الزيارة `2468:112963` | Reason for visit | `Field` `171:28` — `432:48309` | placeholder *Add the reason for the visit here* |
| الملاحظات `2468:31979` | Notes | `Textarea` `401:14` — `432:45559` | *Not configured* (source carries a populated governed sentence) |
| المرفقات `2468:112966` | Attachments | `section-title` `70:12` + `FileUpload` `175:19` (`432:48317`) + state line `432:48322` | *Attach files*; hint carried verbatim — *Up to 3 attachments, in PDF, image (PNG or JPEG), Word or Excel*; *No attachments — not configured* |
| حفظ افادة الزيارة `2468:31981` | Save Visit Statement | `act` + `Button` `8:4` Primary | **Save visit statement** — type-specific label, not a generic Save |
| Home indicator `2468:31982` | — | approved non-delivery | device chrome |

### Governed values NOT carried (CLAUDE.md rule 10)

`شركة الامل للتدريب العمال`, `تأسيس`, the Riyadh address, `01/01/2026`, the populated notes
sentence, and the two attached filenames (`ملف قائمة المنشآت المستهدفة.PDF`) are all governed
data. Every one renders as *Not configured*. The **attachment constraint** (max 3 files;
PDF / PNG / JPEG / Word / Excel) is a governed *rule* stated on the source and is carried verbatim.

---

## 5. Components used — all pre-existing, none authored

`App topbar` `20:172` · `page-back` `401:47774` · `section-title` `70:12` · `Button` `8:4`
(Primary/Medium) and `8:8` (Secondary/Small) · `Badge` `9:23` · `Select` `11:5` ·
`Checkbox` `9:69`/`9:70`/`9:71` · `report-type-card` `401:47765`/`47766` (set `401:47769`) ·
`Field` `171:28` · `Textarea` `401:14` · `Input` `9:56` · `FileUpload` `175:19` ·
`LocationVerification` `319:165` · `map-marker` `15:23` · icons from `73:2`.

No new component, variant, style, token or raw colour was authored. No `ax-`/`astryx` reference.
The three capabilities W7 flagged as patternless are all now covered as the brief directed:
report-type grid → `report-type-card`; change-establishment-photo → the `establishment-photo`
pattern from `383:45124`; visit-type dropdown + "could not be carried out" toggle →
`Select` `11:5` + `Checkbox`.

---

## 6. Gaps — recorded, not closed

1. **Route governance.** §2. The blocking item.
2. **Populated attachment rows not built.** The source shows two attached files with
   delete / download / file-type-badge affordances. `AttachedFile` `401:29` exists and covers the
   row, but its `file` slot needs a filename — governed data B3 must not invent. The region
   renders the `FileUpload` drop zone plus an explicit *No attachments — not configured* state,
   which is the same choice `383:45021` made. **A populated-state variant of this frame is
   deliberately not built**; if the owner wants one, it needs seeded fixture filenames, not
   invented ones.
3. **No date-input component.** `Field` `171:28` is a plain text field; the source's
   `تاريخ الزيارة` renders as a bordered field with a leading calendar glyph.
   `DateRangePicker` `179:39` is a *range* picker and is not the same control. Q2 raised this
   same gap independently. **Q3 owns it** — B3 used `Field` and did not author a component.
4. **`Checkbox` selected state has no glyph at card scale.** The `report-type-card`
   `Checked=true` variant renders as a filled square; the checkmark is not legible at 16px in the
   card header. Inherited from the component as built, not introduced here, and consistent with
   `383:45124`. Flagged for Q3, not patched at page level (CLAUDE.md rule 3).
5. **Availability gate still unresolved.** Visit statement is enabled+selected on this source
   page and disabled on the Identify Challenge selector. No node on either page states the
   governing rule. §3 records both observations; no rule was asserted and no conditional-disable
   behaviour was wired.

---

## 7. Census — NOT RUN. Quota exhausted.

The 1280 / 1024 / 834 / 680 clipped-text census was written and submitted as the next call. The
Figma MCP server returned:

> You've reached the Figma MCP tool call limit for your Full seat on the Professional plan.

`use_figma` is atomic, so the census script did not execute and the frame was **not** resized —
it remains at its build width of 834.

| Width | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| Height | not measured | not measured | 1791 | not measured |
| Clipped | not measured | not measured | **0 (visual)** | not measured |

**What is verified:** the frame at 834, by full-frame screenshot. Every region renders, every
label is legible, no text is visually truncated, no elements overlap, the six report-type cards
wrap 3×2 correctly, and the selected card is the Visit statement card.

**What is not verified:** programmatic clipped/crunched counts at any width, and reflow at
1280 / 1024 / 680. **The zero-clipped bar is therefore unmet — not failed, unmeasured.**

To resume once quota is restored, one `use_figma` call is enough: resize `432:45513` to each of
the four widths, count TEXT nodes whose natural height exceeds their box or whose bounds overflow
a clipping ancestor, then restore width 834.

---

## 8. Node ledger

| Node | Id |
|---|---|
| Section | `432:45512` |
| Frame | `432:45513` |
| `sq-content` | `432:45515` |
| Page title | `432:45517` |
| `report-types` grid | `432:45551` |
| Cards 1–6 | `432:45552` `432:45553` `432:45554` **`432:45555`** `432:45556` `432:45557` |
| section-title *Visit statement details* | `432:45558` |
| Field — Visit date | `432:48297` |
| Field — Visitor name | `432:48303` |
| Field — Reason for visit | `432:48309` |
| Textarea — Notes | `432:45559` |
| section-title *Attachments* | `432:48315` |
| FileUpload — attachments | `432:48317` |
| attachments-empty state | `432:48322` |
| `act` / Save visit statement | `432:45560` |

---
---

# CONTINUATION — R5-VisitStatementFinish

Picks up §7, the census B3 could not run. **Census RUN. Result: zero clipped at all four
widths. No fixes were required, therefore no node on the frame was changed.** The frame was
resized during measurement and restored to 834 in every call; it is at 834 × 1791 now.

## C1. Census — BEFORE (as found, no fixes applied)

Measured on `432:45513`, page `6:9`. A node counts as clipped when its absolute bounds exceed
those of an ancestor with `clipsContent = true`, by more than 0.5px on any edge, walking up to
and including the frame itself.

| Width | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| Height | 1791 | 1791 | **1791** | 1849 |
| Clipped | **0** | **0** | **0** | **0** |

Height is flat from 834 up to 1280 and grows by 58px at 680. That 58px is the report-type grid
reflowing 3 columns → 2 (six cards, 2 rows → 3 rows) and is correct reflow, not a defect —
confirmed in the 680 screenshot. Nothing else reflows, because the content column is already
at its layout width by 834.

### C1a. The zero is not vacuous — detector validated

A zero-clipped result is only meaningful if the detector can find clipping at all. Three
independent checks were run against the same subtree:

| Check | Result |
|---|---|
| Clipping ancestors present in the subtree | **59** — including the frame itself (`clipsContent = true`), `sq-content` `432:45515`, `establishment-photo` `432:45519`, `map-panel` `432:45536`, every `d` detail row, and the topbar chrome |
| Any node whose bounds exit the **frame's own** horizontal bounds at 680, ignoring `clipsContent` entirely | **0 of all descendants** — nothing is merely rescued by a non-clipping parent |
| TEXT nodes in the subtree | 58, of which 5 are in `textAutoResize = 'TRUNCATE'` / `textTruncation = 'ENDING'` mode |

The five truncation-mode text nodes are all `Placeholder text` inside `Input` `9:56` — inherited
component behaviour, not page-level. Each is a short single-line string in a field 778px wide at
834 (624px at 680): `I432:48297;171:6;9:57` *Not configured*, `I432:48303;171:6;9:57` *Add the
visitor name here*, `I432:48309;171:6;9:57` *Add the reason for the visit here*,
`I432:45559;401:18;9:57` *Not configured*, and the topbar search
`I432:45514;20:173;9:57` *Search visits or factories*. None is near its ellipsis threshold at
any of the four widths, and none renders an ellipsis in either screenshot.

## C2. Fixes applied

**None.** No fixed-width child needed FILL, no row needed WRAP, no frame needed a `minHeight`,
no text node's `textAutoResize` blocked growth. The frame was inherited from the repaired
`383:45124`, and the responsive behaviour came with it intact.

| Node id | Property | Before | After |
|---|---|---|---|
| — | — | — | *(no changes — nothing to fix)* |

`432:45513` was resized to 1280 / 1024 / 680 during measurement and restored to 834 within each
`use_figma` call. Verified `width = 834`, `height = 1791` at the end of every call. No other node
in section `432:45512` was created, edited, moved or deleted, and nothing outside the section was
touched.

## C3. Census — AFTER

Identical to C1, because nothing was changed. Stated separately so the bar is explicit:

| Width | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| Height | 1791 | 1791 | **1791** | 1849 |
| Clipped | **0** | **0** | **0** | **0** |

**The zero-clipped bar in §7 is now MET, not merely unmeasured.**

## C4. Screenshot proof

Full-frame renders captured at **834** and at **680**. Both confirm: every region present, every
label legible, no truncation, no overlap, no element crossing a container edge.

- **834** — report-type grid renders 3 across × 2 rows; *Visit statement* is the selected card,
  second row first column.
- **680** — grid reflows to 2 across × 3 rows; *Visit statement* moves to row 2 column 1;
  *Customs exemption report* wraps its label to two lines inside its card without clipping; the
  Notes textarea, all three `Field`s, the `FileUpload` drop zone and the Save button all shrink
  to the narrower column cleanly. Frame height 1849 — the +58px is the extra grid row.

## C5. Inherited component defect — CONFIRMED, NOT PATCHED

**§6 item 4 reproduces on this frame.** For Q3.

The selected card `432:45555` carries `Checked=true, State=Default`. Its Checkbox instance is
`I432:45555;401:47742`, main component **`9:70` (`Checked=true`)**, 16×16 — and it has
**`childCount = 0`**. There is no checkmark vector inside the checked variant at all; the glyph
is not merely illegible at 16px, it does not exist in the variant. It renders as a solid filled
square, visible as such in both the 834 and 680 screenshots.

This is a defect in `Checkbox` `9:70` itself and is inherited by every instance across the file,
not something introduced on this frame. **Not patched at page level** — CLAUDE.md rule 3 makes a
missing component affordance a design-system change request, and Q3 owns component authoring.
Note this also implicates rule 6 in spirit: a checked state distinguished only by fill is shape
plus colour with no glyph, so the checked/unchecked distinction leans harder on colour than it
should.

## C6. The two page-level gaps — reviewed, deliberately unchanged

| Gap | Ruling |
|---|---|
| **Attachments** (§6 item 2) — region renders `FileUpload` `432:48317` plus the state line `432:48322` *No attachments — not configured* | **Correct as built. Left exactly as is.** Filenames are governed data (CLAUDE.md rule 10); absent governed data renders as a state, which is what it does. No filename was invented and no populated variant was built. |
| **Visit date** (§6 item 3) — `Field` `171:28` at `432:48297`, because no single-date component exists (`DateRangePicker` `179:39` is a range picker) | **Left as is, gap stays recorded.** Authoring a date component is Q3's, not this task's. The `Field` is the honest stand-in until Q3 ships one. |

## C7. Out of scope — untouched, as instructed

- **Route.** `/field/visit-statements` remains unratified. The frame name still carries
  `(ROUTE PENDING OWNER RULING)` verbatim. §2 stands unamended; no rename, no alternative route
  invented, no `/ipad` route. **This remains the delivery-blocking item.**
- **Selection model.** Settled by W10 (§3). Not re-opened. The six cards are unchanged,
  checkbox-based, source order preserved, card 4 selected.
- **No component authored or modified** — Q3 and B5 own that.
- `383:45124` and every frame outside section `432:45512` untouched.

## C8. Quota

Three `use_figma` calls consumed — census, detector validation + checkbox inspection, screenshots
+ restore. **No limit error was hit; the seat was still serving calls at the end of this task.**
All four widths were measured. Nothing is left unverified.

## C9. Status

| Item | State |
|---|---|
| Census at 1280 / 1024 / 834 / 680 | **RUN — 0 clipped at all four** |
| Frame restored to 834 | **Yes — 834 × 1791** |
| Screenshot proof at 834 and 680 | **Captured** |
| Fixes required | **None** |
| Checkmark defect | **Reproduces — routed to Q3** |
| Route ruling | **Still open — owner** |

**§7's "not verified" is closed. The frame is design-complete and responsively proven. It remains
delivery-blocked on the route ruling in §2 alone.**

# BUILD — N2 Inspector Form Primitives

Master file: `ML2PNwfShlQM2k44MvSEw5` (SAQEEL Web)
New page: **Inspector Form Primitives (build)** — `450:2`
Source reference (read only, never edited): iPad file `8wGaofgbopqmGXc0Wjo0eW`, Components page `301:71625`

All four components are built, token-bound, and screenshot-verified. No other library page was written to.

---

## 1. Accordion (expandable disclosure)

| | |
|---|---|
| Component set | `450:15` |
| Variants (2) | `Expanded=false` `450:3` · `Expanded=true` `450:8` |
| Source capability | Summons Notice disclosure block; Visit Report detail nested sections |
| Composed from | `Accordion header` `27:629` (instanced, not re-authored) |
| Donors | `27:629` (header, padding `space-4`, gap `space-3`), `26:332`-family panel treatment for the shell |
| Unblocks | Summons Notice frame `432:48329` (expanded content was sitting as loose sibling rows); B1's 6-tab Visit Report detail with nested attendee-signature accordions |

Structure: shell (`surface-primary` fill, `border-subtle` stroke, `radius-md`, vertical hug) → header instance (FILL) → `accordion-body` (FILL, `space-4` padding, top-only `border-subtle` rule, holds arbitrary content via `body-slot`).

`accordion` `15:43` was **not** used — it is a fixed two-row specimen and does not serve as a disclosure.

**State is text plus shape:** the header toggle label reads `Expand` / `Collapse`. No colour-only distinction.

---

## 2. SignatureCapture

| | |
|---|---|
| Component set | `450:59288` |
| Variants (3) | `State=Empty` `450:59264` · `State=Signed` `450:59272` · `State=Declined` `450:59280` |
| Source capability | Two-party signature block on Summons Notice; nested attendee signatures on Visit Report detail |
| Donors | `Field/State=Default` `171:8` (label + control stack), `Badge` set (parent of `9:3`) for the status lozenge, `Input` `9:56` token treatment for the well |
| Unblocks | Summons Notice frame `432:48329`; B1's Visit Report attendee-signature accordions |

Structure: `signature-label` (t-label / `text-secondary`) → `signature-well` (72pt, `surface-secondary`, `border-subtle`, `radius-sm`; dashed only in Empty) → `signature-status` (Badge instance + `signature-meta`).

**Governed data honoured:** the `Signed` state renders its value as **`Not configured`**. The component never draws a fake signature. Capture time renders `Captured at — Not configured`.

**State is text plus shape:** each state carries a written Badge label — `Awaiting signature` / `Signed` / `Declined` — plus a dashed vs solid well. Never colour alone.

**Icon gap:** no signature or pen glyph exists on Icons page `73:2`. The control is text-labelled by design; this is stated in the component description.

---

## 3. DatePicker (single date)

| | |
|---|---|
| Component set | `450:59335` |
| Variants (3) | `State=Default` `450:59320` · `State=Empty` `450:59325` · `State=Disabled` `450:59330` |
| Source capability | Single-date entry on inspector forms |
| Donors | `DateRangePicker` `179:39` — token treatment copied verbatim and its calendar glyph frame `179:35` **cloned**, so no icon was drawn or invented |
| Unblocks | The B3 and R2 frames that fell back to a plain `Field` because only a RANGE picker existed |

Structure: horizontal control, `control-h-md`, inline padding `space-3`, gap `space-2`, `surface-primary` fill, `border-input` stroke, `radius-sm` → cloned `calendar` glyph → `date-value` (t-compact).

Bare control by design, matching `179:39`. Compose it inside `Field` `171:8` when a label is required.

**State is text plus shape:** `15 Jul 2026` / `Select date` / `Unavailable`. The Disabled value uses the governed-absent wording.

`DateRangePicker` `179:39` was left untouched and remains the range control.

---

## 4. MediaMinis

| | |
|---|---|
| Component set | `450:59351` |
| Variants (2) | `State=Populated` `450:59336` · `State=Empty` `450:59347` |
| Source capability | Compact thumbnail-grid evidence attached to inspection records |
| Donors | `Field`/`Input` shell tokens (`surface-primary`, `border-subtle`, `radius-md`), `Badge` `9:3` radius scale for tiles |
| Unblocks | Every evidence region where `AttachedFile` `401:29` was the only option |

Structure: `media-label` → `media-grid` (wrapping horizontal, `space-2` both axes) → four 68pt `media-tile` frames (`surface-secondary`, `border-subtle`, `radius-sm`, captioned).
Empty variant swaps the grid for a dashed `media-empty` well.

`AttachedFile` `401:29` was **not** stretched to fake this — W9's warning is respected. It remains a full-width file row.

**Governed absence:** the Empty state reads **`Insufficient evidence`**.

**Icon gap:** no camera or image glyph exists on Icons page `73:2`. Tiles are text-labelled by design.

**Duplication flagged for reconciliation:** Q3 is building its own Media Minis variant on `Inspector Components (build)`. Both were built rather than either being skipped. Reconcile after both land.

---

## Token compliance

Every fill, stroke, radius, padding, gap, stroke weight, and control height on all four components is bound to a library variable. Zero raw hex, `rgb()`, `hsl()`, px font size, or px radius. All type uses published text styles (`t-label`, `t-body`, `t-compact`, `t-meta`, `t-caption`).

## Icon findings (owner ruling still needed)

- No signature / pen glyph on `73:2` → SignatureCapture is text-labelled.
- No camera / image glyph on `73:2` → MediaMinis tiles are text-labelled.
- The calendar glyph was obtained by cloning `179:35` out of `DateRangePicker` `179:39`. Nothing was drawn.
- The pending ruling on whether `icon/ui/paperclip` `74:71` may stand in for the source's distinct `file-attachment` glyph was **not** assumed either way — no component here depends on it.

## Territory

Written: page `450:2` only.
Not touched: Form Controls `9:55` (N1), `Inspector Components (build)` (Q3), `State & Overlay (build)` `432:48135` (B5), `6:9`, and every other library page.

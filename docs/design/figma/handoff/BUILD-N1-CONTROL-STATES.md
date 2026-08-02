# BUILD-N1-CONTROL-STATES

Agent: **N1-ControlStatesBuild** — component build writer.
File: SAQEEL Web master `ML2PNwfShlQM2k44MvSEw5`.
Territory: page `9:55` **Form Controls** (unowned after V3-ControlsAndFormStates was stopped).
No other library page was touched.

Inherited work: V3-ControlsAndFormStates (Select, FileUpload) and R2-SummonsNoticeContentFill
(read-only checklist row, read-only `Field`).

---

## 1. `Select` — component set `423:48080`

**Already converted before this session.** The brief described `11:5` as a bare `COMPONENT` with no
state variants. On inspection it is the `State=Default` child of a live `COMPONENT_SET` `423:48080`
named `Select`, carrying all five states with correct token bindings. A prior pass landed the
conversion; the risky operation was therefore not re-run, and no instances were put at risk.

| Variant | Node id | Fill | Stroke | Weight | Donor |
|---|---|---|---|---|---|
| State=Default | `11:5` | `3:4` surface-primary | `3:25` border-default | 1 | Input `9:56` |
| State=Hover | `423:48068` | `3:4` | `3:24` border-strong | 1 | Input `9:58` |
| State=Focus | `423:48071` | `3:4` | `3:26` border-focus | 2 | Input `9:60` |
| State=Disabled | `423:48074` | `3:6` surface-disabled | `3:25` | 1 | Input `9:62` |
| State=Error | `423:48077` | `3:4` | `3:36` border-critical | 1 | Input `9:64` |

### What N1 changed

- **`423:48080`** — set `description` written (was empty). Records that per-state token treatment is
  inherited from Input `9:66` so the two controls agree.
- **`11:5`, `423:48068`, `423:48071`, `423:48074`, `423:48077`** — real per-variant `description`s.
  Previously every variant carried a copy of the Default blurb.
- **`423:48075`, `423:48076`** — Disabled value text and `▾` affordance rebound from `3:16`
  text-primary to **`3:19` text-disabled**, matching Input `9:63`. Disabled was previously
  distinguished by surface fill alone.
- **`450:59221`** — *created*. `select-error-marker`, a `▪` glyph cloned from the existing
  `.field-error` marker `171:25` (bound `3:38` text-critical), inserted into `State=Error` between
  the value and the `▾`. **This is the fix for "status is text plus shape, never colour alone"** —
  an error Select was a red border and nothing else. No icon was drawn; the glyph is the one the
  design system already uses for field errors.

Screenshot: set `423:48080`. All five states are separable without colour — Focus by 2px weight,
Disabled by muted text, Error by the `▪` marker.

---

## 2. `FileUpload` — component set `175:19`

`State=Error` `423:48090` also already existed from a prior pass; `WithFiles` did not.

| Variant | Node id | Status |
|---|---|---|
| State=Default | `175:12` | pre-existing — description added |
| State=Disabled | `175:18` | pre-existing — description added |
| State=Error | `423:48090` | pre-existing — description added, defect fixed |
| **State=WithFiles** | **`450:59289`** | **created by N1** |

### `State=WithFiles` `450:59289`

Donor: `State=Default` `175:12`, cloned. Composition, not re-authoring:

- `450:59311` `attached-count` — text "2 files attached", cloned from the Default `hint` so the
  text style and `3:18` binding are inherited.
- `450:59303` `attached-files` — vertical auto-layout, gap 4, no fill.
- `450:59294`, `450:59295` — **instances of the existing `AttachedFile` component `401:29`**. The
  file row was not re-authored, so download and remove affordances stay in one place. Second row
  relabelled `site-photo-02.jpg` so the two rows are not identical.
- `primaryAxisSizingMode = 'AUTO'` so the dropzone grows with the list (first build overflowed a
  fixed 103px height).
- Width 560 — `AttachedFile`'s natural width. Noted in the variant description; this state is
  wider than its siblings.

### Defect fixed in the inherited Error variant

`423:48096` (`fileupload-error` row) carried a **raw unbound white `SOLID` fill** `{1,1,1}` — a bare
colour, in breach of the token law. Set to `fills = []`. This is the only raw paint that existed
anywhere in the four sets; a full scan after the work returns zero.

---

## 3. `Field` — component set `171:28`

| Variant | Node id | Status |
|---|---|---|
| State=Default | `171:8` | pre-existing — description added |
| State=Help | `171:17` | pre-existing — description added |
| State=Error | `171:27` | pre-existing — description added |
| **State=ReadOnly** | **`450:59312`** | **created by N1** |

### `State=ReadOnly` `450:59312`

Donor: `State=Default` `171:8`, cloned. For derived and served values — the Summons Notice "Day",
computed from the service date, which previously had to be faked as a `DetailRow`.

- The `Input` instance is **removed**. The absent control is the shape signal.
- `450:59317` `field-value` — borderless value text, cloned from `11:6` so it inherits `3:16`
  text-primary at the body ramp.
- `450:59318` / `450:59319` `field-readonly` — caption row cloned from the `.field-help` structure
  `171:15`, reading **"Read-only — derived, not entered"**. That is the text signal.
- The required asterisk `req` is **removed** — nothing is being asked of the user.

Read-only therefore never depends on colour: missing box (shape) + explicit caption (text).

---

## 4. `ChecklistRowReadOnly` — component set `450:59361` (new)

Built at `x 0, y 2100` on page `9:55`. Fixes R2-SummonsNoticeContentFill's finding that the Summons
Notice served view renders its 10 required-document rows as `Checkbox` + text, so a served record
reads as still editable.

| Variant | Node id | Marker | Status word |
|---|---|---|---|
| State=Provided | `450:59352` | instance of `icon/ui/check` `73:6904` | "Provided" |
| State=NotProvided | `450:59357` | `—` em dash, cloned from `11:7` (bound `3:18`) | "Not provided" |

- No checkbox square, no border, no hit target — a served record cannot be ticked.
- Three redundant signals: marker shape, status word, and only then colour.
- No icon was drawn. `icon/ui/check` `73:6904` is the library donor for the tick, as instructed.
- Text nodes cloned from `11:6` (13px `3:16`) and `171:16` (12px `3:18`) so type and tokens are
  inherited rather than set by hand.

---

## Instance safety

Counts read file-wide via `ComponentNode.instances`, which resolves across pages.

| Component | Before | After | Delta |
|---|---|---|---|
| `Select` `423:48080` (incl. `11:5`) | 58 | 124 | +66 |
| `FileUpload` `175:19` | 19 | 22 | +3 |
| `Field` `171:28` | 126 | 227 | +101 |
| `AttachedFile` `401:29` | 10 | 12 | +2 |
| `Input` `9:66` (control) | 163 | 572 | +409 |

**No instance was orphaned.** Every count rose. The growth is nine other agents building screens
against this library concurrently — `Input` alone gained 409 instances during the session, and N1
never touched `Input`. Of the deltas, exactly **+2 on `AttachedFile`** are N1's, the two rows inside
`FileUpload/State=WithFiles`. The Select conversion had already landed before this session with its
58 instances intact and now resolves 124, so the risky operation is confirmed safe after the fact.

Because counts are moving under concurrent writers, a same-instant before/after equality check is
not available on this file; monotonic growth with zero orphans is the strongest available evidence.

## Token compliance

Full `fills` + `strokes` scan across `423:48080`, `175:19`, `171:28` and `450:59361`, every
descendant: **zero unbound `SOLID` paints**. One pre-existing violation was found and fixed
(`423:48096`). No hex, `rgb()`, `hsl()`, px font size or px radius was authored — every new node
inherits its treatment by cloning a token-bound donor.

## Layout defect caught in verification

New variants clone at the donor's coordinates, so `WithFiles`, `ReadOnly` and both checklist rows
initially stacked on top of their siblings, and `WithFiles` overflowed a fixed height. All four sets
were re-stacked (variants at `x 0`, 20px vertical gap) and resized to bound their children.
Post-fix screenshots confirm every state in every set is visually distinguishable.

## Quota

Figma API quota **not exhausted**. Seven `use_figma` calls: two read-only discovery, four builds,
one verification pass plus one layout fix. Nothing is left unverified.

## Changed and created node ids

**Created:** `450:59221` (Select error marker), `450:59289` `450:59294` `450:59295` `450:59303`
`450:59311` (FileUpload WithFiles), `450:59312` `450:59317` `450:59318` `450:59319` (Field ReadOnly),
`450:59352` `450:59357` `450:59361` (ChecklistRowReadOnly).

**Mutated:** `423:48080` `11:5` `423:48068` `423:48071` `423:48074` `423:48077` `423:48075`
`423:48076` (Select), `175:19` `175:12` `175:18` `423:48090` `423:48096` (FileUpload),
`171:28` `171:8` `171:17` `171:27` (Field).

**Removed:** the `req` asterisk and the `Input` instance inside the cloned `Field/State=ReadOnly`
only — nothing outside the new variant.

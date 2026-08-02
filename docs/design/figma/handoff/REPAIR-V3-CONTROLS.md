# REPAIR — V3 Controls & Form States

Agent: V3-ControlsAndFormStates
File: `ML2PNwfShlQM2k44MvSEw5` (Web master) — the iPad source file was never opened.
Territory: Form Controls page `9:55`, Button page `7:394`.
Excluded and not entered: section `339:42098`, section `384:45164`, anything on page `6:9` below y=100000.
Date: 2026-08-01

Every value below is an existing variable already bound elsewhere in the file. No hex, no
`rgb()`, no px font size, no px radius was authored. No new token was created.

---

## 1. Census result

### Button page `7:394` — no defects

`Button` `8:32` is complete: 5 colours × 3 sizes × 4 states = **60 variants**, all present
(Default / Hover / Pressed / Disabled across Primary, Secondary, Tertiary, Ghost, Danger).
Heights are correct per size (Small 28, Medium 32, Large 40) with no collapse. The six
modifier specimens in `8:34` (`.btn-icon` `8:35`, `.is-loading` `8:39`, `:disabled` `8:43`,
`.btn-block` `8:47`, `.btn-touch` `8:51`, `.btn-field` `8:55`) render at their documented
sizes. **Nothing changed on this page.**

### Form Controls page `9:55` — collapsed-height sweep is clean

Every control instance on the page was measured against its intrinsic height. The prior
1px-collapse class of defect recorded in `KNOWN-DEFECTS.md` does **not** recur anywhere in
this territory:

| Control | Instances | Height | Verdict |
|---|---|---|---|
| `Input` `9:66` | 5 variants + 4 instances | 32 (96 in Textarea, intentional multi-line) | OK |
| `Select` | 2 instances (`175:21`, `423:48081`) | 32 | OK |
| `Checkbox` `9:71` | 2 variants + 4 instances | 16 | OK |
| `Radio` `9:74` | 2 variants | 16 | OK |
| `Switch` `9:79` | 2 variants | 18 | OK |
| `FileUpload` `175:19` | 3 variants | 103 | OK |
| `Combobox` `179:28` | 3 variants | 32 | OK |
| `Field` `171:28` | 3 variants | 52 / 72 / 72 | OK |
| `StatusSelector` `179:33`, `DateRangePicker` `179:39` | 1 each | 44 / 32 | OK |

Required-marker treatment was checked on every labelled control. `Field` carries `req` "*"
on all three variants (`171:5`, `171:12`, `171:21`) and `Textarea` carries it at `401:17` —
all four bound to the danger token `3:36`. **Consistent; no repair needed.**

---

## 2. Fixes landed

### FIX-1 — `Select` had no states at all

| | |
|---|---|
| Node | `11:5` → now `COMPONENT_SET` **`423:48080`** |
| Frame | Form Controls `9:55` (demo row `11:4`) |
| Defect | `Select` was a bare `COMPONENT` with zero state variants, while the sibling `Input` `9:66` carried five. A designer had no hover, focus, disabled or error Select to place, so screens either showed a permanently-default Select or hand-styled one. |
| Before | 1 component, 180×32, fill `3:4`, stroke `3:25`, no variant axis. |
| After | 5-variant set on a `State` axis, each treatment copied verbatim from the matching `Input` variant — same variable, no authored value. |

| Variant | Node | Treatment | Source it was copied from |
|---|---|---|---|
| State=Default | `11:5` | fill `3:4`, stroke `3:25`, 1px | `Input` `9:56` |
| State=Hover | `423:48068` | stroke → `3:24` | `Input` `9:58` |
| State=Focus | `423:48071` | stroke → `3:26`, weight 2 | `Input` `9:60` |
| State=Disabled | `423:48074` | fill → `3:6` | `Input` `9:62` |
| State=Error | `423:48077` | stroke → `3:36` | `Input` `9:64` |

The demo row `11:4` lost its specimen when the original was lifted into the set, so a live
instance **`423:48081`** of `State=Default` was inserted back at the original index and
coordinates. The pre-existing consumer `175:21` (`FilterBar > saved-views`) was re-audited
after the conversion and still resolves to `State=Default` — no instance was broken.

Verified by screenshot: five visually distinct rows, correct order.

### FIX-2 — `Field State=Error` showed a grey control under a red message

| | |
|---|---|
| Node | `171:22` (the `Input` instance inside `Field` `State=Error` `171:27`) |
| Frame | `Field` `171:28`, Form Controls `9:55` |
| Defect | The error variant rendered its `Input` on **`State=Default`**. The red `field-error` line was present below, but the control itself looked untouched — the state lived only in the helper text. |
| Before | `componentProperties.State = "Default"` → main component `State=Default` |
| After | `State = "Error"` → main component `State=Error`; the field now carries the `3:36` error border **and** the `▪` + message line. |

This is the defect class the brief asked for — a control rendering as if stateless where a
state belongs. Found by auditing every instance's resolved variant against its parent
variant's name, not by eye.

### FIX-3 — `FileUpload` had no error state

| | |
|---|---|
| Node | new variant **`423:48090`** in set `175:19` |
| Frame | Form Controls `9:55` |
| Defect | `FileUpload` shipped only Default and Disabled. A rejected upload (wrong type, over size) had no state to render. |
| Before | 2 variants. |
| After | 3 variants; `State=Error` at y=238, 320×103 — same height as its siblings, no collapse. |

Treatment, all token-bound:
- border → `3:36`, the same danger border `Input State=Error` uses.
- The existing `hint` `423:48094` recoloured to `3:38`, the danger **text** token, matching
  `field-error` `171:24`.
- A `▪` shape glyph `423:48095` added in a `fileupload-error` strip `423:48096`, cloned from
  the `hint` node so font family, size and type tokens carry over verbatim rather than being
  re-authored.

**No new string was written.** The error state reuses the existing constraint copy
("Photos or PDF, up to 20 MB") as the violated rule, so nothing new is owed to the i18n
layer under the Arabic-strings rule. The state reads as **shape + text + colour**, never
colour alone.

### FIX-4 — `FileUpload` set frame clipped its own new variant

| | |
|---|---|
| Node | `175:19` |
| Defect | Caught on verification: the set frame stayed 370×262 after the third variant was appended at y=238, so `State=Error` was cut off mid-height on the canvas — the same clipping class recorded in `KNOWN-DEFECTS.md`. |
| Before | 370×262 |
| After | 370×381, computed from the variants' own bounds. All three variants fully visible. |

Re-verified by screenshot after the resize.

---

## 3. Changed and then reverted — recorded so nobody redoes it

**`report-type-card` `401:47769` Disabled variants — NOT a defect.**

I set `401:47767` and `401:47768` to opacity 0.45, believing the Disabled variants were
visually identical to Default. That was wrong, and I reverted both to opacity 1.

They were already correctly distinguished, token-bound: Default carries fill `3:4` /
stroke `3:23`, Disabled carries fill `3:6` / stroke `3:25` — the same disabled fill token
`Input State=Disabled` uses. Opacity was never the mechanism here. Adding it would have
double-applied a treatment the component already expressed correctly.

Net change to `report-type-card`: **none**. Do not "fix" it.

---

## 4. Gaps deliberately NOT papered over

These are real gaps in my property class. Each is left alone because closing it would have
required inventing a design decision, a value, or a string — which is a design-system change
request, not a page-level fix.

**4.1 `Checkbox` `9:71`, `Radio` `9:74`, `Switch` `9:79` have no disabled state.**
All three carry a single binary axis (`Checked` / `On`) and no interaction states at all.
I did not add one because **the file has two competing disabled conventions and no basis
to choose between them for these controls**:
- `Input` `9:62` and `report-type-card` `401:47767` express disabled by swapping to the
  disabled fill token `3:6`.
- `FileUpload` `175:18` and the documented `:disabled` button modifier (`8:45`) express it
  as container opacity 0.45.

A 16px checkbox has almost no fill area, so the token swap may read as nothing at all, and
the opacity route may fail contrast. Picking one is a design call. **Recommend a designer
rules on the disabled convention for binary controls before these variants are authored.**

**4.2 `FileUpload` has no with-files state.**
Composing one from the existing `AttachedFile` `401:29` does not fit: `AttachedFile` is
560px wide with its Download `401:25` and Remove `401:27` buttons at x=384 and x=476, inside
a 320px-wide `FileUpload`. Squeezing it would overflow those buttons, and buttons cannot
ellipsize. A genuine multi-file gallery layout does not exist as a component — this matches
the gap already recorded in `BUILDPACK-W9-COMPONENTS-FORMS.md` §4 for Media Minis. **Left as
a component gap, not faked.**

**4.3 `StatusSelector` `179:33` and `DateRangePicker` `179:39` are bare components.**
Both are interactive triggers styled exactly like `Select` (fill `3:4`, stroke `3:25`,
radius 6) and both lack hover / focus / disabled. The same five-state treatment used for
FIX-1 would apply mechanically. I stopped at `Select` because that was the named gap and
because `StatusSelector` embeds a `Badge` whose own state behaviour under a disabled parent
is unspecified. **Low-risk follow-up; flagged rather than assumed.**

**4.4 The specimens in demo row `11:4` are inert frames, not instances.**
`Segmented` `11:8` (157×28), `Combobox` `11:15` (117×26) and `File upload` `11:20` (193×51)
are plain `FRAME`s drawn to look like controls, while the real components `seg-opt` `70:6`,
`Combobox` `179:28` and `FileUpload` `175:19` live elsewhere on the page at different sizes
(300×32 and 320×103 respectively). Swapping the frames for real instances would break the
row's layout, since the row was laid out around the miniatures. These read as a legend strip
rather than usage, so they are left alone. **Recorded because "static frame where a control
belongs" is exactly the defect class I was asked to hunt — this instance of it is
intentional, and a future auditor should not re-flag it.**

**4.5 Zero-width `input` text nodes in `Combobox` `179:28`.**
`179:23` (`State=WithTokens`) and `179:26` (`State=Focused`) are 0px wide. Both are the empty
caret position after the chips, with empty content by design; height is 19px, so this is not
a collapse. **Not a defect — recorded to stop a future width-overflow census flagging it.**

---

## 5. Node ledger

| Action | Node id | What |
|---|---|---|
| created | `423:48080` | `Select` COMPONENT_SET |
| created | `423:48068` | `Select` State=Hover |
| created | `423:48071` | `Select` State=Focus |
| created | `423:48074` | `Select` State=Disabled |
| created | `423:48077` | `Select` State=Error |
| created | `423:48081` | `Select` instance restored into demo row `11:4` |
| created | `423:48090` | `FileUpload` State=Error |
| created | `423:48096` | `fileupload-error` strip |
| created | `423:48095` | `▪` shape glyph |
| mutated | `11:5` | renamed to `State=Default`, reparented into the set |
| mutated | `11:4` | demo row, instance re-inserted at original index |
| mutated | `171:22` | Input instance State Default → Error |
| mutated | `175:19` | `FileUpload` set: variant appended, resized 370×262 → 370×381 |
| mutated | `423:48094` | `hint` recoloured to danger text token `3:38` |
| reverted | `401:47767`, `401:47768` | opacity 0.45 → 1 (see §3) |

## 6. Variables used — all pre-existing

| Id | Role | Where it was already in use |
|---|---|---|
| `3:4` | surface / field fill | `Input` `9:56` |
| `3:6` | disabled fill | `Input` `9:62` |
| `3:24` | hover border | `Input` `9:58` |
| `3:25` | default border | `Input` `9:56` |
| `3:26` | focus border | `Input` `9:60` |
| `3:36` | danger border | `Input` `9:64`, `req` `401:17` |
| `3:38` | danger text | `field-error` `171:24` |

# REPAIR-V1 — Typography and labels

Agent: V1-TypographyAndLabels. File `ML2PNwfShlQM2k44MvSEw5`, page `6:9` (— SCREENS —).
Date 2026-08-01.

Territory excluded and never opened: section `339:42098` (SOURCE-IMPORT / UNGOVERNED),
section `384:45164` (parked components), and any node on `6:9` below y=100000.

Property class touched: text style application, font size / weight / line-height /
letter-spacing bindings, `textTruncation`, `maxLines`. No frame moved, no auto-layout
padding or gap changed, no component swapped, no non-text fill touched.

## Census — before and after

15 sections in scope, 18,641 TEXT nodes.

| Measure | Before | After |
|---|---|---|
| TEXT nodes carrying a text style | 14,459 | 16,681 |
| TEXT nodes with no text style (ad-hoc typography) | 4,182 | 1,960 |
| Clipped TEXT nodes | 334 | 297 |
| TEXT nodes on a foreign font family (Inter) | 26 | **0** |
| Placeholder literals (`Lorem`, `Placeholder`, `TODO`, `TBD`…) | **0** | **0** |

### Clip census by clipping ancestor

| Clipper | Before | After | Reading |
|---|---|---|---|
| `table-wrap` | 133 | 141 | SCR-WEB-100 intentional horizontal scroll + table column width — **not typography** |
| `thead` | 130 | 130 | same tables as above |
| `tr` | 28 | 20 | same tables as above |
| `sq-shell__groups` | 37 | **0** | nav-rail labels no longer clipped |
| `panel-visit-filters` | 4 | 4 | KNOWN-DEFECTS #2, AR RTL fixed-width search field — **handed to sibling** |
| `filter-field` | 2 | 2 | fixed-width field, 3px overrun — **handed to sibling** |

`table-wrap`/`thead`/`tr` totals are stable at 291 across the pass; the 8-node shift
between `table-wrap` and `tr` is re-attribution of which ancestor clips first after
line-height normalisation, not new clipping. Every remaining clipped node is a container
width problem, which is V3's / V5's class.

Placeholder scan matched nothing. No stray authoring note, no `Lorem`, no `Placeholder
text` anywhere in the 18,641 nodes.

## Fixes landed — 2,226 nodes

### 1. Foreign font family — Inter removed (26 nodes)

The file's type ramp is IBM Plex Sans / Noto Sans Arabic / IBM Plex Mono. 26 page titles
in the INSPECTOR sections were authored in Inter Semi Bold at 22px and 24px, neither of
which is a token size.

| Node id | Frame | Before | After |
|---|---|---|---|
| `345:42243` | `342:42170` REFERENCE INSPECTOR EN · Dark | Inter Semi Bold 24 | `t-page-title` |
| `345:42291` | `342:42170` | Inter Semi Bold 24 | `t-page-title` |
| `336:46686` `336:46733` `336:46743` `336:46760` `336:47281` `336:47298` `336:47363` `336:47393` | `336:45770` INSPECTOR REPORT FORMS · EN · Light | Inter Semi Bold 22 | `t-page-title` |
| `337:44864` `337:44872` `337:44882` `337:44899` `337:44913` `337:44926` `337:44937` `337:44967` | `342:42170` REFERENCE INSPECTOR EN · Dark | Inter Semi Bold 22 | `t-page-title` |
| `337:45258` | `342:42171` REFERENCE INSPECTOR AR · RTL | Inter Semi Bold 22 | `t-page-title` |
| `337:45151` `337:45159` `337:45169` `337:45186` `337:45200` `337:45217` `337:45228` | `342:42171` REFERENCE INSPECTOR AR · RTL | Inter Semi Bold 22 | `t-page-title-ar` |

The last seven carry Arabic strings, so they take the Arabic ramp (`t-page-title-ar`,
Noto Sans Arabic SemiBold 22). `337:45258` reads "Returned Correction (route decision)" —
untranslated English sitting in an AR frame. It takes the Latin style. **That string is a
translation gap, not a typography defect; it is not mine to translate and is handed on
below.**

### 2. Detached typography bound to its existing token — 2,135 nodes

Every one of these nodes already rendered the exact values of a text style — same family,
same weight, same size, same line-height, same letter-spacing — but carried them as
detached local overrides rather than as a style binding. Binding is visually
identity-preserving; nothing on the canvas moved.

| Text style applied | Nodes |
|---|---|
| `t-label-ar` | 988 |
| `t-compact-ar` | 604 |
| `t-meta-ar` | 192 |
| `t-eyebrow-ar` | 114 |
| `t-caption-ar` | 80 |
| `t-heading` | 65 |
| `t-heading-ar` | 34 |
| `t-body-ar` | 32 |
| `t-page-title-ar` | 26 |
| **Total** | **2,135** |

### 3. Ad-hoc line-height normalised onto its token — 61 nodes

Same family, weight and size as an existing style, but an invented line-height. The
invented value was replaced by the token's.

| Style applied | Nodes | Line-height before | After |
|---|---|---|---|
| `t-label` | 37 | `100%` | `135%` |
| `t-eyebrow` | 8 | `140%` | `145%` |
| `t-mono` | 7 | `140%` | `AUTO` |
| `t-meta` | 5 | `AUTO` | `140%` |
| `t-label-ar` | 4 | `100%` | `135%` |

Node ids: `I105:6968;70:3`, `I152:7443;152:14;105:6972;70:3`, `I105:6980;70:3`,
`I167:8113;152:10;105:6984;70:3`, `I105:6988;70:3`, `I167:8156;167:7767;105:6994;70:3`,
`I167:7730;152:10;37:934`, `I167:8366;167:7763;42:1044`, `I345:42302;336:45242;8:21`,
`I345:42302;336:45244;8:21`, `I345:42326;336:45247;8:21`, `I345:42326;336:45249;8:21`,
`I345:42350;336:45252;8:21`, `I345:42350;336:45254;8:21`, `I167:9780;152:10;95:7818`,
`I167:9955;167:7763;95:8093`, `I167:11322;152:10;95:16711`, `I167:12824;152:10;97:14753`,
`I236:33805;178:22`, `I236:33805;178:26`, `I236:33805;178:30`, `I236:33805;178:34`,
`I236:33805;178:38`, `I239:35975;70:3`, `I239:36407;167:7767;105:6994;70:3`,
`I239:36411;152:10;37:934`, `I336:46771;336:45242;8:21`, `I336:46771;336:45244;8:21`,
`I336:46795;336:45247;8:21`, `I336:46795;336:45249;8:21`, `I336:46819;336:45252;8:21`,
`I336:46819;336:45254;8:21`, `I337:44910;336:45242;8:21`, `I337:44910;336:45244;8:21`,
`I337:44911;336:45247;8:21`, `I337:44911;336:45249;8:21`, `I337:44912;336:45252;8:21`,
`I337:44912;336:45254;8:21`, `I338:41920;8:3`, `I338:41921;8:9`, `I338:41971;8:3`,
`I338:41972;8:9`, `I338:42021;8:3`, `I338:42022;8:9`, `I338:42031;8:9`, `I338:42033;8:9`,
`I338:42061;8:21`, `I337:45197;336:45242;8:21`, `I337:45197;336:45244;8:21`,
`I337:45198;336:45247;8:21`, `I337:45198;336:45249;8:21`, `I337:45199;336:45252;8:21`,
`I337:45199;336:45254;8:21`, `I336:46124;8:3`, `I336:46126;8:9`, `I336:46206;8:9`,
`I336:46209;8:9`, `336:46499`, `336:46496`, `336:46685`, `336:46682`.

### 4. KNOWN-DEFECTS #1 — Factory 360 `identity` card truncation stopgap removed (4 nodes)

The register recorded the identity card's status line as truncating with an ellipsis and
called truncation a stopgap. Measured on the canvas, the copy had **already** been
shortened — "High risk" (49px) and "From Operations" (92–104px) inside a 320px / 342px
card. The ellipsis could no longer fire; `textTruncation: ENDING` + `maxLines: 1` was dead
weight that would silently swallow any future longer reason without anyone noticing.

Removed the stopgap on all four instances. The card no longer needs to widen.

| Node id | Frame | Card width | Text | Before | After |
|---|---|---|---|---|---|
| `I167:7836;152:14;27:574;9:14` | Factory 360 EN · Light | 320 | High risk (49px) | `ENDING` / `maxLines 1` | `DISABLED` / `maxLines null` |
| `I167:9381;152:14;95:7206;9:14` | Factory 360 EN · Dark | 320 | High risk (49px) | `ENDING` / `maxLines 1` | `DISABLED` / `maxLines null` |
| `I167:10948;152:14;95:13717` | Factory 360 AR · RTL | 342 | From Operations (98px) | `ENDING` / `maxLines 1` | `DISABLED` / `maxLines null` |
| `I167:12450;152:14;97:13202` | Factory 360 AR · RTL · Dark | 342 | From Operations (98px) | `ENDING` / `maxLines 1` | `DISABLED` / `maxLines null` |

Verified by screenshot: both badges render in full, no ellipsis, card unchanged at 320/342
× 107. **KNOWN-DEFECTS #1 is closed and does not need V3 or V5.**

The trade recorded in the register still stands as a copy decision for the product owner:
"High risk" is a shorter label than "Reason · High-risk recommendation", so the *reason*
is no longer on the card. That is a content decision, not a layout one.

## Handed to sibling classes

**To V3 / V5 (container width, layout):**

1. `panel-visit-filters` — 4 clipped nodes, AR RTL sections only. KNOWN-DEFECTS #2. The
   search field is authored at a fixed width instead of filling, so it overruns its panel
   under RTL. Cosmetic, hides nothing.
2. `filter-field` `I167:8556;167:7767;47:1417` — "Factory name or CR number" overruns by
   3px. Same fixed-width-instead-of-fill cause.
3. `table-wrap` / `thead` / `tr` — 291 clipped nodes. SCR-WEB-100 Planning is the
   documented intentional horizontal scroll and must be left alone; the rest are column
   widths on standard tables. None of it is a type problem — the text is correct at the
   correct size and simply sits outside a container.

**To the content / i18n owner:**

4. `337:45258` in section `342:42171` (INSPECTOR AR · RTL) reads "Returned Correction
   (route decision)" — English copy in an Arabic frame. I applied the Latin text style
   because that is what the string is. It needs an Arabic string from
   `docs/design/figma/saqeel-ar-strings.json`. I did not translate it.

**To the design-system owner — the largest remaining gap, deliberately not mutated:**

5. **664 nodes render a weight the type ramp does not contain.** `IBM Plex Sans Bold 12`
   (532 nodes, e.g. "Overview", "Compliance", "Insights" — the shell nav group headers)
   and `Noto Sans Arabic Bold 12` (132 nodes, the AR twins). The ramp's only 12px semibold
   is `t-eyebrow` / `t-eyebrow-ar` at SemiBold, not Bold. Per CLAUDE.md rule 3, a missing
   class is a design-system change request, not a page-level fix — so I did not silently
   restyle 664 nav labels from Bold to SemiBold. Decide one of: (a) these adopt
   `t-eyebrow` / `t-eyebrow-ar`, or (b) a Bold-12 token is added to the ramp. Then it is
   one batch operation.

## Remaining unstyled text — 1,960 nodes, by group

Left alone because each would require either inventing a token or a visible weight/size
change. Every one is a design-system decision, not a repair.

| Family · weight · size | Nodes | Nearest token | Why not auto-fixed |
|---|---|---|---|
| IBM Plex Sans Bold 12 | 532 | `t-eyebrow` (SemiBold 12) | weight change on nav headers — item 5 above |
| Noto Sans Arabic Medium 13 | 405 | `t-compact-ar` (Regular 13) | weight change |
| IBM Plex Mono Regular 12 | 221 | `t-mono` (12.5) | size change on ID codes |
| IBM Plex Sans Bold 10 | 193 | none at 10px | badge counters, no 10px token |
| Noto Sans Arabic Bold 12 | 132 | `t-eyebrow-ar` | weight change — item 5 above |
| IBM Plex Sans Regular 12.5 | 65 | `t-body` / `t-compact` | no 12.5 sans token |
| IBM Plex Sans Medium 13 | 57 | `t-compact` (Regular 13) | weight change on buttons |
| IBM Plex Sans Regular 10 | 54 | none at 10px | disclosure glyphs `▾` |
| IBM Plex Mono Medium 12 | 52 | `t-mono` | weight + size change |
| IBM Plex Sans Regular 24 | 45 | `t-display` (28) / `t-page-title` (22) | no 24px token |
| Noto Sans Arabic Medium 11 | 32 | none at 11px | avatar initials |
| IBM Plex Sans SemiBold 13 | 27 | `t-heading` (14) | size change |
| Noto Sans Arabic SemiBold 18 | 26 | none at 18px | wordmark "صقيل" |
| IBM Plex Sans SemiBold 9.5 | 26 | none at 9.5px | wordmark "SAQEEL" |
| Noto Sans Arabic Regular 12.5 | 24 | `t-meta-ar` (12) | size change |
| IBM Plex Mono SemiBold 14 | 20 | `t-mono` | weight + size change |
| IBM Plex Sans Medium 10 | 17 | none at 10px | micro badge labels |
| IBM Plex Mono Regular 13 / 14 | 24 | `t-mono` | size change |
| IBM Plex Mono Medium 12.5 | 6 | `t-mono` | weight change |
| mixed-segment nodes | 2 | — | mixed runs, needs per-segment decision |

The wordmark pairs (`SAQEEL` 9.5 / `صقيل` 18) are brand lockup, not body type. They should
stay off the ramp.

## How to re-run this census

For every TEXT node under page `6:9`, excluding sections `339:42098` and `384:45164` and
anything at y ≥ 100000:

- **clip** — walk ancestors; for each with `clipsContent`, compare absolute bounds; count
  the node once against its first clipping ancestor.
- **detached typography** — `textStyleId` is empty or `figma.mixed`.
- **exact-match candidates** — group by `fontName.family | fontName.style | fontSize |
  lineHeight | letterSpacing` and look the tuple up against
  `figma.getLocalTextStylesAsync()`. A hit means the node can be bound with zero visual
  change.
- **placeholder** — `/(lorem|ipsum|placeholder|dummy text|TODO|TBD|FIXME|sample text)/i`
  over `characters`.

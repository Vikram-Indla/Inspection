# P0 — Identify Challenge source fidelity: control restoration

Web master `ML2PNwfShlQM2k44MvSEw5`, page `— SCREENS —` (`6:9`), section `339:42098`.
iPad source `8wGaofgbopqmGXc0Wjo0eW`, page `620:45076`.

The earlier closure claimed these three frames were a faithful migration. Region coverage was
right; **control fidelity was not**. Source-to-Web screenshot comparison found selects flattened
to static text, textareas flattened to single-line fields, the attachment list and its actions
missing, the map surface missing, the report-type disabled state missing, the remote video
surface missing, the status badge rendered as bare text, and no back affordance. All are now
restored in the canonical English responsive Web frames.

## Components added

Nothing was styled locally. Each new component is token-bound by construction — cloned from, or
copying paint/stroke/type from, an existing token-bound component.

| Component | Node | Page | Why the source needs it |
|---|---|---|---|
| `Textarea` | `401:14` | Form Controls `9:55` | Challenge description and Notes are multi-line in the source; `Field` is single-line. Cloned from `Field/State=Default` `171:8` so every binding is inherited |
| `AttachedFile` | `401:29` | Form Controls `9:55` | Source lists uploaded files with download and remove actions; the web import had a bare dropzone |
| `report-type-card` | `401:47769` | Form Controls `9:55` | Source uses **checkboxes** (multi-select) with a per-type icon and greys out unavailable types. 4 variants: `Checked=false\|true` × `State=Default\|Disabled` |
| `page-back` | `401:47774` | Nav & Chrome `13:49` | Every source screen carries a back bar (عودة); the import dropped it |
| `RemoteVideoTile` | `401:47913` | Identity & Misc `14:87` | Source remote screen has a live video tile with capture controls docked on it; the import kept only the control chips |

Two deliberate non-fabrications:

- **`AttachedFile` actions are text buttons, not icons.** The icon library has no download or
  trash glyph. No icon was invented.
- **Marker fills are the neutral token** copied from the Operations Center factory marker
  (`26:339`), and each marker carries a text label. A coloured dot alone would imply a severity
  the data does not carry.

## Repairs, by frame

### `383:45019` — Challenge inspection (source `639:78727`)

| Restored | Nodes |
|---|---|
| Back affordance | `401:47775` |
| Capital answer → `Input` control | `401:47779` |
| 4 Yes/No answers → `Select`, carrying the source option set | `401:47781` `401:47784` `401:47787` `401:47790` |
| Challenge description + Notes → `Textarea` | `383:45100` `383:45106` (swapped) |
| Attachment row with Download / Remove | `401:47793` |

### `383:45124` — Establishment details, visit on site (source `631:45084`)

| Restored | Nodes |
|---|---|
| Back affordance | `401:47815` |
| Visit type → `Select` | `401:47819` |
| Establishment status → `Badge Status=Outline` | `401:47821` |
| Notes → `Textarea` | `383:45245` (swapped) |
| 6 report-type cards → checkbox + icon; *Identify challenge* checked, *Visit statement* disabled | `401:47829` `401:47841` `401:47852` `401:47860` `401:47871` `401:47881` |
| Map surface with registered / actual markers and provider caption | `401:47891` (+ `401:47892`–`401:47896`) |

### `383:45254` — Establishment details, remote visit (source `1908:89825`)

| Restored | Nodes |
|---|---|
| Back affordance | `401:47914` |
| Visit type → `Select`; status → `Badge` | `401:47918` `401:47920` |
| Notes → `Textarea` | `383:45385` (swapped) |
| `CaptureControls` chips → `RemoteVideoTile` (surface + docked controls) | `401:47923` |
| 6 report-type cards, same rule as above | `401:47944` `401:47956` `401:47967` `401:47975` `401:47986` `401:47996` |

### Icon mapping, report types

Existing library icons only — none created:

| Report type | Icon |
|---|---|
| Chemical clearance report | `icon/ui/scale` `73:6885` |
| Identify challenge | `icon/ui/target` `73:6869` |
| Visit report | `icon/ui/document` `73:6945` |
| Visit statement | `icon/ui/clipboard-check` `73:6879` |
| Safety report | `icon/ui/shield-check` `73:6901` |
| Customs exemption report | `icon/ui/gov-flag` `73:6908` |

## Responsive proof

Each frame reflowed at four widths, clipped-text census re-run at each. A node counts as clipped
when its bounds fall outside a clipping ancestor.

| Frame | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| `383:45019` | 1377 · 0 | 1377 · 0 | 1377 · 0 | 1377 · 0 |
| `383:45124` | 1410 · 0 | 1410 · 0 | 1410 · 0 | 1468 · 0 |
| `383:45254` | 1436 · 0 | 1436 · 0 | 1436 · 0 | 1510 · 0 |

*height · clipped nodes.* Height grows at 680 as the report-type cards wrap from 3 columns to 2 —
correct reflow. One defect found and fixed during the proof: the capture note inside
`RemoteVideoTile` overran its row by 5px at 680; the docked row now wraps.

Delivery-screen pixels were not touched. Every edit is inside section `339:42098`
(SOURCE-IMPORT / UNGOVERNED) plus the five new library components.

## Jira linkage ledger

Native Figma-for-Jira attachment **could not be performed from this session.** Probed on canonical
frame `336:45771`:

```
Error: in getDevResourcesAsync: "getDevResourcesAsync" is not a supported API
Error: in addDevResourceAsync: "addDevResourceAsync" is not a supported API
```

Both methods resolve as functions on the node; the MCP plugin sandbox rejects the call. No
fallback was taken — no label, Markdown, raw URL or fabricated chip was written. Attachment needs
either the Figma UI (Jira app side panel) or a plugin context where dev resources are permitted.

Ledger of what is to be attached once that path is open:

| Frame node | Route | Jira |
|---|---|---|
| `383:45019` Challenge inspection | none — no challenge route exists in the repo | **none** — no `INSP-*` key covers the challenge capability |
| `383:45124` Establishment details (on site) | none for the challenge flow; nearest `/field/establishments`, `/field/[visitId]` | **none** |
| `383:45254` Establishment details (remote) | nearest `/field/virtual/[id]` — no report-type selection, no photo | `INSP-553` covers field/remote branching only; nothing covers the challenge report-type set |
| `336:45771` Summons Notice | `/field/summons-notices` | `INSP-558` |
| `336:45779` Sample Collection Report | `/field/sample-collection-reports` | `INSP-573` |
| `336:45787` Non-Compliant Products Destruction Report | `/field/destruction-reports` | `INSP-578` |
| `336:45795` Facility Report | `/field/facility-reports` | `INSP-583` |

Jira site: `https://digital-transformation.atlassian.net`. Keys above are the ones already carried
on the frames as plain `meta` text; none was invented here.

## Gaps still open

1. The Identify Challenge capability has **no repo route** and **no Jira story**.
2. Report-type selection appears on no shipped route, though it drives the whole visit flow.
3. The source capital field has a currency affix; the design system has no affix control, so the
   `Input` carries none.
4. The map surface renders `Basemap not configured` — no basemap provider is governed for the
   establishment location view.

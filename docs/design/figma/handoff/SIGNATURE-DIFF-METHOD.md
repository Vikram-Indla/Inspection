# Signature diff — cheap source-to-Web verification

Purpose: verify iPad→Web migration completeness at ~65 Figma API calls instead of ~900,
so the iPad source can be deprecated on evidence rather than assumption.

Source: `8wGaofgbopqmGXc0Wjo0eW` · Web master: `ML2PNwfShlQM2k44MvSEw5`

## Why the obvious method is unaffordable

Full source-to-Web visual comparison is ~2 screenshots per frame across ~146 canonical
units, plus rebuilds — roughly 900 Figma calls. The seat is Full/Professional: **200
calls/day, 10/min**. That is 5–6 clean days of quota with no slack for rework.

## The method

For a whole source page and its Web counterpart section, extract in ONE call each:

- every unique text string (deduplicated — this collapses flow-stage repetition, e.g. 24
  frames named `Establishment Details` reduce to one string set)
- every component instance counted by **main component set name**

That pair is the *signature*. The diff then runs on disk at zero API cost.

Capability loss is structural and shows up in the component counts. Every regression found
by hand in this programme would have been caught: `Select 4 → 0`, `AttachedFile 2 → 0`,
`map-panel 1 → 0`, `page-back 1 → 0`.

The Arabic/English barrier is handled by `docs/design/figma/saqeel-ar-strings.json`
(~725 approved pairs). Map source Arabic through it, diff against Web English, and flag
anything unmapped rather than assuming equality.

### Cost

| | Calls |
|---|--:|
| 9 source families + 6 Web build sections | ~25 |
| Screenshots on flagged frames + 10-frame random control sample | ~40 |
| **Total** | **~65** |

### What it proves, and what it does not

Proves: no region, field, control, action or state was dropped; no invented content without
a source counterpart; correct control *type*.

Does not prove: layout, spacing, visual hierarchy, RTL mirroring. Those need real
screenshots — hence the flagged-plus-sample second tier. Carry this limit explicitly in any
deprecation decision. Signature parity means *nothing was lost*, not *it looks right*.

## Pilot — Establishment Management, 2026-08-01

Source page `1065:77494` (99 frames) vs Web section `450:60001` (19 frames).
Cost: **2 calls**. Source: 156 unique strings, 45 component kinds. Web: 46 unique strings,
25 component kinds.

### Capability diff

| Source component | × | Web equivalent | Verdict |
|---|--:|---|---|
| Dropdown Input | 38 | `Select` ×18 | present |
| Text Input | 14 | `Input` ×4 + `Field` ×20 | present |
| Textarea | 4 | `Textarea` ×7 | present |
| Table Row / Cell / Header | 98 | `Table row` ×18 | present |
| Status Tag / Tag / Chip | 656 | `EstablishmentStatus` ×11, `filter-chip` ×44 | present |
| _Drop Zone / _File | 32 | `FileUpload` ×4, `EvidenceAttachment`, `MediaMinis` | present |
| **Map** | 12 | — | **MISSING** |
| **Tab Bar / Tabs** | 34 | — | **MISSING** |
| **Radio Label** | 8 | `Checkbox` ×3 only | **MISSING** |
| **Avatar** | 58 | — | **MISSING** |
| **Menu list item** | 9 | — | **MISSING** — row action menu |

### Missing regions (source region titles with no Web counterpart)

- البيانات التنظيمية — Regulatory data
- المخالفات / المخالفات المسجلة — Violations, registered violations
- الزيارات السابقة — Previous visits
- جهات التواصل — Contacts
- مؤشرات التقييم — Assessment indicators

### Reading

The source establishment detail is a **tabbed** screen carrying regulatory-data, violations,
previous-visits, contacts and assessment tabs. The Web build has the shell and the identity
panel; the tabbed content is absent. This corroborates W8's "three partial migrations"
finding and makes it specific.

Disposition: `450:60001` stays **gap / partial**, not `migrated`.

## Remaining families to run

| Source | Web counterpart |
|---|---|
| `269:40019` Visit Reports | `432:49206` Visit Report Detail |
| `2284:104021` Home + Tasks | shipped `/field/*` frames |
| `620:45076` Identify Challenge | `339:42098` + `423:47937` |
| `1939:56734` Chemical | `432:48155` |
| `639:79065` Customs | `454:52144` |
| `2312:95952` Safety | `454:52166` |
| `2468:31912` Visit Statement | `432:45512` |
| `1065:77494` Establishment Mgmt | `450:60001` — **done** |
| `301:71625` Components | library pages |

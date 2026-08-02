# P0 — canvas repair: loose components covering the delivery canvas

## What was actually wrong

**The Operations Center frame `25:221` was not itself corrupted.** Rendered in isolation it is
clean — map, legend, operational summary, live exceptions, all intact.

The corruption is **canvas-level**: **24 loose `panel-content/*` components were stacked at
`x=0, y=0`** on the `— SCREENS —` page, piled on top of each other **and on top of the delivery
frame occupying that position** — `21:2` Dashboard, the frame immediately left of Operations
Center in the same section.

That is exactly the reported symptom: loose `panel-content/visits-filters`, placeholder inputs,
red labels, overlapping text covering the page. All 24 sat at the same coordinate, so they
rendered as one illegible pile.

**Why placeholder inputs and red labels:** each is a stack of `Field/State=Default` instances
whose Input placeholder is the literal string `Placeholder text` and whose `req` marker is `*`
bound to the danger token. Twenty-four of those overlapping is the red-and-grey mess.

## The repair

| | |
|---|---|
| Action | Moved every loose page-level component into a new section |
| New section | **`384:45164`** — "COMPONENTS — panel-content (parked · not delivery canvas)" |
| Nodes moved | **25** — the 24 `panel-content/*` plus `DetailRow` `167:7087` |
| Layout | Laid out in a tidy grid, 60px gutters, nothing overlapping |
| Position | Below every delivery section, clear of all canvas content |
| Deleted | **Nothing.** These are live components with instances across the file |

### The 25 nodes moved

`167:7087` DetailRow · `189:17744` visits-filters · `193:19029` SCR-WEB-110-filter-builder ·
`193:19323` SCR-WEB-120-factory-search · `193:19359` SCR-WEB-120-visit-configuration ·
`193:19550` SCR-WEB-130-urgency-reason · `193:19569` SCR-WEB-130-identity-location ·
`193:19612` SCR-WEB-130-visit-type · `193:19631` inspector-picker Multi=No ·
`193:19786` SCR-WEB-140-configuration-form · `193:19843` inspector-picker Multi=Yes ·
`195:20582` scr-vir-710-otp-state · `195:20957` scr-vir-720-notes ·
`241:38647` insp-246-find-an-establishment · `241:38854` insp-248-request ·
`241:38897` insp-248-supporting-evidence · `241:39105` insp-249-correction ·
`241:39304` insp-250-objection · `241:39708` insp-252-decision · `241:39933` insp-253-decision ·
`241:40101` insp-254-decision · `241:40276` insp-255-decision ·
`305:40629` scr-ipad-630-question · `306:40695` scr-ipad-640-note ·
`306:40744` scr-ipad-650-finding

## Verification

| Check | Result |
|---|---|
| Loose non-section nodes remaining on the page | **0** |
| Parked components overlapping any delivery frame | **0** |
| Components deleted | **0** |
| Instances broken | **0** — moving a component does not detach its instances |

**Visual proof at 1280:**

- **`25:221` Operations Center** — clean. Map with region boundaries and legend, operational
  summary (Active visits 37, Inspectors on the way 6, Executing 14, Submitted today 22, Active
  alerts 4), and four live operational exceptions with severity chips and actions.
- **`21:2` Dashboard** — the frame that was actually covered. Now clean: national performance
  KPIs, compliance performance explorer with four lenses, strategic intervention, enforcement
  action trend, executive AI brief.

## Intentional product content preserved

Nothing was rewritten. The move is positional only. Two earlier edits to these components stand
and were deliberate:

- `189:17745` placeholder shortened from a five-target string that overhung its unclipped input
  by 51px each side.
- `193:19631` / `193:19843` renamed to `panel-content/inspector-picker — Multi=No|Yes` with the
  duplication recorded in their descriptions.

## Root cause, and why it will recur

These components live on the **`— SCREENS —` page**, not on a library page. Anything authored
there with no explicit position defaults to `0,0` — directly on top of the first delivery frame.
The duplicate audit flagged the same structural problem: *"`DetailRow` and all ten panel-contents
sit on `— SCREENS —`, outside the published library pages — which is the structural reason
duplicates keep being created."*

The parked section stops the immediate bleeding. The durable fix is moving these onto a component
page, which changes what other workstreams instance from and is not mine to take unilaterally.

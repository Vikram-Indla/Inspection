# Batch 14 — My Visits and Global Search

| | My Visits | Global Search |
|---|---|---|
| Frame | **`357:42719`** | **`357:42833`** |
| Route | `/field/visits` — 220 ln | `/field/search` — 279 ln |
| Reachable | yes — `field/page.tsx:665`, `visits/calendar:30` | yes — `field/page.tsx:377`, `:645` |
| States | empty, error, loading, offline, permission, validation | empty, error, offline, permission |
| Dependencies | `InspectionCard` `164:88`, `seg-opt` `70:6`, `filter-chip` `72:6736`, `Button` `8:32` | `Input` `9:66`, `filter-chip` `72:6736`, `Badge` `9:25`, `section-title` `70:12` |
| Jira | **no story** | **no story** |

**Copy is the repo's own.** *Assigned to you · RLS scoped*; the three views My Visits / Calendar
/ Completed; *Load more visits*; and the empty state quoted verbatim — *"No assigned visits match
this view. Change the timing, risk, or search filter."*

Search carries the four shipped type filters (All / Factory / Inspection / License), recent
searches, and the real empty state *"No matching results in your scope."* Result counts render
**Not configured**, and the scope caveat states that results are limited by RLS.

`My Visits` reuses `InspectionCard` rather than introducing a fourth card component — the
`Assignment` and `Queue` variants already model this list.

## Responsive

| Width | My Visits | Global Search |
|---|--:|--:|
| 1280 | 0 / 0 | 0 / 0 |
| 1024 | 0 / 0 | 0 / 0 |
| 834 | 0 / 0 | 0 / 0 |
| 680 | 0 / 0 | 0 / 0 |

*clipped / crunched.* 0 off-ramp sizes and 0 unbound fills on both. Heights are constant — every
region is fluid, and the filter rows wrap rather than overflow.

## Contracts — 17 frames

| Route | Frame | Jira |
|---|---|---|
| `/field` | `346:42363` | — |
| `/field/establishments` (+Dark, AR, 3 states) | `336:45825` · `336:46018` · `336:46351` | INSP-588 |
| `/field/summons-notices` (+Dark, AR) | `340:42098` · `342:42172` · `342:44733` | INSP-558 |
| `/field/notifications` | `354:42408` | — |
| `/field/settings/devices` | `355:42471` | — |
| `/field/settings/conflicts` | `355:42570` | — |
| `/field/factory-360/[id]` | `356:42542` | INSP-617/622/628 |
| `/field/visits` | `357:42719` | — |
| `/field/search` | `357:42833` | — |

**All 17 pass 0 clipped / 0 crunched at 1280, 1024, 834 and 680.**

## Components — 14 in `Domain: Inspection`

`ChecklistQuestion` · `AnswerBar` · `MediaThumb` · `MicButton` · `EvidenceAttachment` ·
`DataChecklist` + `DataChecklistRow` · `LocationVerification` · `InspectionCard` (extended) ·
`EstablishmentCard` · `ActionMenu` · `Dialog` · `NotificationRow`

## Remaining

~19 routes without a contract, the largest being the `/field/[visitId]` startup pack (2,792 lines
across its directory — the biggest single surface in the channel) and `/field/inspection/[id]`
(4,376 lines), which is already governed as `SCR-FLD-630`.

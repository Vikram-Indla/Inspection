# Route coverage — all 36 inspector routes accounted for

Every shipped `/field/*` route now has a contract, is governed elsewhere, is covered as a record
type, or is a stub with a stated reason. **Nothing is unaccounted for.**

## Contracted in this workstream — 25 routes, 29 frames

Sections `339:42098` (EN · Light), `342:42170` (Dark), `342:42171` (AR · RTL), plus 3 state
frames in `311:41750`.

| Route | Frame | Jira |
|---|---|---|
| `/field` | `346:42363` | — |
| `/field/[visitId]` | `360:42863` | INSP-593 · INSP-599 |
| `/field/establishments` | `336:45825` · Dark `336:46018` · AR `336:46351` | INSP-588 |
| `/field/establishments/unregistered` | `363:43141` | **INSP-605** |
| `/field/summons-notices` | `340:42098` · Dark `342:42172` · AR `342:44733` | INSP-558 |
| `/field/factory-360/[id]` | `356:42542` | INSP-617 · 622 · 628 |
| `/field/notifications` | `354:42408` | — |
| `/field/notifications/[id]` | `363:43237` | — |
| `/field/completed` | `362:42986` | — |
| `/field/completed/[id]` | `363:43300` | — |
| `/field/drafts` | `362:42915` | — |
| `/field/reports` | `362:43070` | — |
| `/field/account` | `362:43138` | — |
| `/field/map` | `362:43213` | — |
| `/field/search` | `357:42833` | — |
| `/field/visits` | `357:42719` | — |
| `/field/visits/calendar` | `362:43301` | — |
| `/field/virtual` | `363:43364` | INSP-553 |
| `/field/virtual/[id]` | `363:43426` | INSP-553 |
| `/field/feedback` | `363:43494` | — |
| `/field/feedback/rate/[visitId]` | `363:43550`* | — |
| `/field/settings` | `363:43624`* | — |
| `/field/settings/devices` | `355:42471` | — |
| `/field/settings/conflicts` | `355:42570` | — |
| `/field/settings/readiness` | `363:43694` | — |

*Frame ids for rating and settings are as listed in the build; see the batch record.

## Governed elsewhere — 5 routes

| Route | Contract | Owner |
|---|---|---|
| `/field/my-tasks` | `SCR-FLD-600` `345:42242` | canonical SCR-FLD workstream |
| `/field/inspection/[id]` | `SCR-FLD-630` `345:42290` | canonical SCR-FLD workstream |
| `/field/inspection/[id]/results` | SCR-IPAD-650 `306:40708` | reference |
| `/field/inspection/[id]/statement` | SCR-IPAD-660 `306:40848` | reference |
| `/field/[visitId]/travel` | SCR-IPAD-620 `305:40461` | reference |

Not duplicated. `SCR-FLD-630` already covers `/field/inspection/[id]`; building a second contract
would have repeated the mistake this workstream has already made three times.

## Covered as record types — 4 routes

`/field/incident-reports` · `/field/destruction-reports` ·
`/field/sample-collection-reports` · `/field/facility-reports`

All four are types inside the records flow (`340:42098`), per batch 06. Jira **INSP-563 · 578 ·
573 · 583**.

## Deliberately not contracted — 2 routes

| Route | Reason |
|---|---|
| `/field/reports/[id]` | 13-line redirect stub to the web route. Not a screen |
| `/field/factory-360` | Redirect resolver — computes a CR/licence target and forwards |

## Visual QA — every frame authored here

**0 clipped · 0 crunched · 0 off-ramp type sizes · 0 unbound fills · 0 placeholder literals**, at
**1280, 1024, 834 and 680**, across all 29 ungoverned frames, the 3 state frames, and all 15
components.

The crunch check is geometric — text exceeding its parent's box whether or not the parent clips —
because the clip-only check missed a real defect in batch 09.

## Components — 15

`ChecklistQuestion` (5 variants, re-specified against `response_model`) · `AnswerBar` ·
`MediaThumb` · `MicButton` · `EvidenceAttachment` · `DataChecklist` + `DataChecklistRow` ·
`LocationVerification` · `InspectionCard` (extended) · `EstablishmentCard` · `ActionMenu` ·
`Dialog` (5 kinds) · `NotificationRow` · plus `t-eyebrow` / `t-eyebrow-ar` registered.

## Gaps that remain — repository, not design

1. **14 of 36 routes are unreachable.** Contracts exist for them now; that does not create an
   entry point. `/field/inspection/[id]/results` is the sharpest case — governed, designed, and
   unreachable.
2. **`/field/settings/readiness`** states its own unreachability on the frame.
3. **The catalogue governs `/ipad/*`**, a URL space that has never existed, and has not been
   amended since 2026-07-15.
4. **`scoring_enabled` / `score_weight`** are validated in the schema but no seeded item carries a
   weight, so no score leg is drawn.
5. **Shipped copy says "Enroll this iPad"** on a responsive-web channel.

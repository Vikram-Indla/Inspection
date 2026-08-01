# Concurrent edit collision — EN · Light inspector section

**Another agent is editing `ML2PNwfShlQM2k44MvSEw5` at the same time as this workstream.** This
is not a hypothesis; the evidence is below. I have stopped writing to the contested section.

## What changed under me

The section formerly named `SCREENS — INSPECTOR 834 · EN · Light  (8)` (`305:40149`) is now:

> `SCREENS — INSPECTOR — batch1: routes corrected off /ipad/*, metadata-only pass (8 routes);
> responsive rebuild + Dark/AR duplication + 27 states = pending`

All eight EN · Light frames were rebuilt at **1024** wide with a new naming convention:

| Was | Now |
|---|---|
| `SCR-IPAD-640 — Evidence Capture — /ipad/inspections/[id]/evidence — INSPECTOR 834 · EN · Light` | `SCR-IPAD-640 — Evidence Capture — repo: embedded in /field/inspection/[id], no standalone route (evidence) — web:DECISION PENDING (standalone vs embedded) — INSPECTOR · EN · Light` |

`306:40569` went from **834 × 1419** with a full `sq-content` (20 regions) to **1024 × 396**
with four children and **no `sq-content` at all**. `305:40533` went from 834 × 1577 to
1024 × 788, likewise emptied.

## Scope of the collision

| Section | Node | State |
|---|---|---|
| EN · Light inspector | `305:40149` | **Contested — rebuilt by the other agent** |
| EN · Dark inspector | `310:40972` | Intact — 834, my batch-03 work present |
| AR · RTL inspector | `312:42490` | Intact — 834, my batch-03 work present |
| Inspector states (27) | `311:41750` | Intact |
| `Domain: Inspection` components | `158:2` | Intact — all batch 02/04 components present |
| Establishments (batch 04) | `336:45825` · `336:46018` · `336:46351` | Intact in all three sections |

Some of my component instances survived inside their rebuilt EN frames — `ChecklistQuestion` ×3,
`MediaThumb` ×2, `AnswerBar`, `MicButton`, `FileUpload`, `LocationVerification` — so the rebuild
carried content across rather than discarding it wholesale.

## This is not a regression to fix — it is an ownership question

The other agent's rename **resolves BLOCKER 1**: routes are corrected off `/ipad/*` and each
frame now names its real repo route and its pending web-route decision. That is the direction
the coordinator asked for, and it is better metadata than the names I left.

What it does **not** yet have is the content: their own section name says
`responsive rebuild + Dark/AR duplication + 27 states = pending`, and the EN frames are
currently metadata shells at 1024.

So the two workstreams are converging on the same eight frames from opposite ends — I built
content at 834 across three locale/theme sections; they are rebuilding structure and route
metadata at 1024 in one section.

## What I stopped doing

I have made **no further writes to `305:40149`**. Re-applying batch 03 to those frames would
overwrite an active agent's work, and re-running it after every one of their passes wastes both.

## Decision needed — this is the external block

Who owns the EN · Light inspector section, and which width is canonical?

- **Option A** — the other agent finishes structure and metadata at 1024; I re-apply the
  batch 02–03 components to their frames afterwards, once, and re-duplicate to Dark and AR.
- **Option B** — I hold EN · Light and they take the 27 states and the remaining route metadata.
- **Option C** — the 834 frames become the canonical inspector width and their 1024 rebuild is
  treated as the responsive variant, not a replacement.

Until this is answered, **Dark, AR, states, the component library, and the Establishments
screen family remain safe to work on**, and that is where this workstream continues.

## Also worth stating

The `/ipad/*` versus `/field/*` route-contract question — carried as BLOCKER 1 in the frame
register through four batches — appears to be **being answered by that agent's rename**, not by
a governance ruling. If that rename is authoritative, the catalogue should be amended to match
it. If it is not, it should be reverted. Right now the file and `screen_route_catalogue.csv`
disagree, and the file changed without the catalogue changing.

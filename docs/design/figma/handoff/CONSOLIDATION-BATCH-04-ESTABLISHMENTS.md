# Batch 04 — Establishments, the first MIGRATE screen

First screen built from the source-screen classification. Establishments was chosen because it
is the highest-confidence MIGRATE row: **102 source frames**, a shipped route, a real repo
page, and it is **reachable** from the shipped taskbar — unlike the other three migrate
candidates.

## A duplicate of my own making, found and removed

`ChecklistQuestion` existed **twice** in the web master:

| | Node | Variants | Verdict |
|---|---|---|---|
| Pre-existing | `165:110` | `Answer=Unanswered \| Compliant \| Violation \| NA` | **removed** |
| Batch 01 (mine) | `317:137` | `State=Unanswered \| Answered \| Attached \| ReadOnly` | kept |

Batch 01 said the repo component "existed, was placed on no screen" and consolidated six
*source* definitions. It never checked whether the **web master** already had one. It did.
I built a duplicate and did not notice for three batches.

Keeping mine is still correct, and not because I wrote it: `165:110` encodes
`Compliant / Violation / NA` **as variant names**, which hardcodes a governed option set — the
exact thing CLAUDE.md rule 10 forbids. Mine models state and carries options as content.

Two things the old one had that mine had dropped — **Add note** and **Evidence** — are real
affordances present in the repo component. Batch 01 claimed "both survive". They did not.
They are now merged into `317:137` on the three editable variants; `ReadOnly` correctly has
none. The three detached AR copies were patched with `إضافة ملاحظة` and `دليل`.

`165:110` had **0 instances** on every page — verified before deletion, not assumed.

## New component — `EstablishmentCard`

| | |
|---|---|
| Node | **`336:45591`** on `Domain: Inspection` |
| Variants | `Status=Licensed \| Unregistered` × `Linked=Yes \| No` — 4 |
| Structure | avatar · name · status badge · licence `id-code` · city · risk mark, mirroring `page.tsx` |
| Dependencies | `Badge` `9:25`, `ExceptionMark` `172:98` |
| Tokens | `surface-primary`, `border-subtle`, `accent-soft`, `accent-text`, `text-primary`, `text-secondary`, `text-muted` — all bound by name |
| Type | `t-heading`, `t-mono`, `t-caption`, `t-label` — all on the ramp |

`Linked=No` is the shipped static card: it renders the real reason it cannot open Factory 360
rather than a dead link.

**Risk is not a variant axis.** My first pass varied the risk mark across variants, which
implies risk correlates with licence status. It does not — risk is data. All four now carry
the same mark so the axes stay `Status × Linked`.

## Screen contract

| | |
|---|---|
| Frames | EN Light `336:45825` · EN Dark `336:46018` · AR RTL `336:46351` |
| Sections | `305:40149` · `310:40972` · `312:42490` |
| Name | `UNGOVERNED — Establishments — /field/establishments — INSPECTOR 834 · …` |
| Persona | Inspector |
| Repo route | `/field/establishments` (406 lines) + `/field/establishments/unregistered` |
| Reachable | **yes** — `components/field/FieldNav.tsx` taskbar |
| Jira | **NONE FOUND** |

Frames are named `UNGOVERNED` deliberately. There is **no catalogue row** for this screen, so
inventing an `SCR-…` id would fabricate governance that does not exist. The name states the
shipped route instead.

**Regions**, all read from `page.tsx` rather than designed from scratch: title · primary action
*Unlicensed establishment* · *Filter* · licensed/unlicensed tabs with counts · `{shown} shown ·
{total} records in scope` · card grid · pager.

## Responsive

| Width | EN Light | EN Dark | AR RTL | Cards per row |
|---|--:|--:|--:|--:|
| 1280 | 0 clipped | 0 | 0 | 3 |
| 1024 | 0 | 0 | 0 | 2 |
| 834 | 0 | 0 | 0 | 2 |
| 680 | 0 | 0 | 0 | 1 |

Real reflow — the grid wraps, heights grow at 680, nothing clips.

**A wrong turn, recorded:** I first set the cards to `FILL` so they would share the row like a
CSS `auto-fit` grid. Figma has no `minmax`, so all four collapsed onto one row at 153–303px and
**the badge clipped at three of the four widths**. Reverted to fixed-width wrapping cards,
which is what `auto-fill` actually produces.

## Arabic

Every Arabic string in the AR frame is taken from
`apps/web/src/app/(app)/field/establishments/page.tsx` — `المنشآت`, `منشأة غير مرخصة`,
`تصفية`, `المنشآت المرخصة`, `غير مسجلة / مؤقتة`, `بدون رخصة`, `السابق`, `التالي` and the
Factory 360 unavailability sentence.

**These are repo-approved strings, not model-authored.** That is a first for this workstream
and it is the pattern to follow wherever the repo already ships the copy.

**Defect fixed:** `بدون رخصة` initially rendered in `t-mono`, which has no Arabic coverage.
Mono is the identifier style — `IL-2874-0058` keeps it; Arabic prose moved to `t-caption-ar`.
Same defect class as batch 03's `DataChecklist`, which means the rule is now proven general:
**never leave prose in the mono slot when a locale switches.**

## Verification

| Check | Result |
|---|---|
| Clipping, 3 frames × 4 widths | **0** |
| Placeholder copy | **0** |
| Unbound fills on new nodes | **0** |
| Off-ramp type sizes | **0** |
| Arabic in a mono slot | **0** |
| Latin left in AR | topbar `All regions` / `Last 30 days` only — hidden at 834, pre-existing on every AR frame |
| Unstyled text | 9, all in `section-title` and topbar internals — the known file-wide gap |

## Blockers

1. **Jira NONE FOUND.**
2. **No catalogue row** for `/field/establishments`, hence the `UNGOVERNED` frame name.
3. **`section-title` has no text style** anywhere in the file. Now blocking a clean
   verification on every new screen, so it is worth its own change.

## Remaining in this workstream

Three MIGRATE screens left — Summons Notices (47 frames), Destruction Reports (15), Incident
Reports (4). **All three are unreachable in the shipped app**, so each needs an entry-point
decision alongside its design. States for Establishments — empty, error, filter overlay — are
also outstanding.

**Not claimed:** one of four migrate screens is built. The other three, and every state frame,
are not.

---

# Batch 05 — Establishments required states

Built in `SCREENS — INSPECTOR STATES 834 · EN · Light` (`311:41750`), which is **not** the
section contested by the concurrent edit.

| State | Node | Source of truth |
|---|---|---|
| No results | `338:41915` | `page.tsx` empty branch — *No establishments found* + the RLS sentence |
| Source unavailable | `338:41966` | `page.tsx` `role="alert"` branch — *Establishments are temporarily unavailable. Nothing was changed.* |
| Filter panel open | `338:42016` | `page.tsx` filter drawer — name, risk, region, city, Clear / Apply |

Every string is the repo's own copy, not authored here.

## Responsive

| State | 1280 | 1024 | 834 | 680 |
|---|--:|--:|--:|--:|
| No results | 0 | 0 | 0 | 0 |
| Source unavailable | 0 | 0 | 0 | 0 |
| Filter panel open | 0 | 0 | 0 | 0 |

0 clipping, 0 placeholder text, 0 off-ramp type sizes on all three, at all four widths.
The filter panel grows at 680 as the fields stack — correct reflow.

The error state uses `status-critical-soft` with a 3px `status-critical` inline-start border,
matching the shipped `borderInlineStart` exactly — a logical property, so it mirrors in RTL
without an override.

**Known, not introduced here:** the `Input` component centres its placeholder text. That reads
oddly in a form field, but it is the existing component's behaviour on every screen that uses
it, so it is recorded rather than patched inside this batch.

**Outstanding for Establishments:** Dark and AR variants of these three states. The web
convention is EN-only state frames (delta D5), so they are consistent with the file as it
stands.

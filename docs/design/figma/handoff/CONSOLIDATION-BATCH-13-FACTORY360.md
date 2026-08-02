# Batch 13 — Factory 360 for the inspector

The capability audit called this the biggest single gap: `/field/factory-360/[id]` ships 379
lines, shares its **entire data layer** with the web Factory 360, and had **zero design
representation**.

## Built by reuse, not by redraw

| | |
|---|---|
| Frame | **`356:42542`** in `339:42098` |
| Name | `UNGOVERNED — Factory 360 (inspector) — /field/factory-360/[id] — INSPECTOR responsive · EN · Light` |
| Repo route | `/field/factory-360/[id]` — 379 ln, reachable from `/field/establishments:295` and `/field/my-tasks:238` |
| Jira | **INSP-617 · INSP-622 · INSP-628** (epic INSP-3) |
| Required states | empty, error, loading, offline, permission |

**Eight existing region components reused, none copied:**

`167:7835` factory header · `167:7869` overall condition · `167:7906` compliance ·
`167:7975` factory profile · `167:7984` industrial information · `167:7993` government
information · `167:8002` documents · `167:8011` timeline.

This is the audit's explicit recommendation: the web and inspector routes call the *identical*
loader —

```ts
const permissions = await resolveFactory360Permissions(sb);
const dossier = await loadFactory360Dossier(sb, id, requestedLicense, permissions);
```

— so importing the source file's `Factory Details` `1237:93408` as a second design would have
created a second Figma family for one dossier. It was not imported.

## The three genuine inspector deltas

Everything else is shared. These are the only additions, and each is in the shipped code:

1. **Licence-currency advisory** — `f360.licenseCurrency.*`. Renders *not confirmed*, because the
   validity window is a governed value with no configured source.
2. **Offline snapshot** — `api/field/factory-360/snapshot` + `Factory360Offline.tsx`. Snapshot
   time renders `Not configured`.
3. **Action bar** — *Open location in maps* (the `geo:` deep link) and *Return to visit*.

## A shared component fixed at source

At 680 the reused header clipped: `context-badges` (`27:571`) was a `NO_WRAP` horizontal row
sized `HUG`, built for the wider web column.

Set to `WRAP` + `FILL`. **Regression-checked**: `SCR-WEB-400` `27:353`, which instantiates the
same component, is still **0 clipped / 0 crunched** at 1280. The fix helps the narrow channel
and changes nothing at desktop width.

## Responsive

| Width | Height | Clipped | Crunched |
|---|--:|--:|--:|
| 1280 | 2156 | 0 | 0 |
| 1024 | 2156 | 0 | 0 |
| 834 | 2173 | 0 | 0 |
| 680 | 2262 | **0** *(was 1 before the header fix)* | 0 |

## Contracts built — 15 frames

`/field` · `/field/establishments` ×3 + 3 states · `/field/summons-notices` ×3 ·
`/field/notifications` · `/field/settings/devices` · `/field/settings/conflicts` ·
`/field/factory-360/[id]`

All pass 0 clipped / 0 crunched at four widths.

## Still open

~21 routes without a contract. The two audit consolidations — `EstablishmentCard` ↔ `Factory
card`, and `ChecklistQuestion` against `response_model` — remain open; both touch components with
live instances on screens outside this workstream, and the second needs a data-model decision.

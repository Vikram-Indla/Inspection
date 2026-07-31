# Codex brief — INSP-524 · map Figma screens to INSP stories

**Task:** INSP-524 "Map available Figma screens to INSP stories", with INSP-532 "Review
stories with missing or ambiguous design coverage" as its second half.

**Scope: read-only.** Produce a mapping and a findings report. Do **not** change
application code. The board records `broad_implementation_allowed: false` and
`application_implementation_allowed: false`, and every card lease is
`REVOKED_PERMANENT` — this task is analysis, and stays analysis.

## What already exists — start from these, do not redo them

| Artefact | What it holds |
|---|---|
| `docs/design/figma/traceability/JIRA-COVERAGE-2026-08-01.md` | live Jira read: 535 issues, 92 live stories, epic → Figma mapping |
| `docs/design/figma/handoff/SCREEN-SPEC.md` | 30 governed screens: route, personas, permission rule, mandatory regions, primary actions, states |
| `docs/design/figma/handoff/component-map.json` | 53 Figma components → React import paths |
| `docs/design/figma/traceability/requirement-screen-map.csv` | 1,821 requirements → screens, tiered STRONG/WEAK |
| `docs/design/figma/handoff/README.md` | index of every Figma section and its frames |
| `docs/design/figma/handoff/KNOWN-DEFECTS.md` | the open defects and the intentional Planning scroll |

A first-pass epic → screen mapping is already done. **Your job is the story-level mapping
underneath it, and challenging the claim that coverage is 100%.**

## Reading Jira

Jira has no CLI or token in this environment. It is reachable through an authenticated
browser session (the Product Owner is signed in to `digital-transformation.atlassian.net`).
Same-origin fetch, cookie carries:

```js
const u = new URL('https://digital-transformation.atlassian.net/rest/api/3/search/jql');
u.searchParams.set('jql', 'project=INSP ORDER BY key ASC');
u.searchParams.set('maxResults', '100');
u.searchParams.set('fields', 'summary,status,issuetype,parent,labels,description');
await fetch(u, { credentials: 'include' }).then(r => r.json());
```

Page with `nextPageToken` until `isLast`. `/rest/api/3/search/approximate-count` is
POST-only and 405s on GET.

Pull `description` as well — the first pass did not, and acceptance criteria live there.

## The Figma file

`ML2PNwfShlQM2k44MvSEw5`, page `— SCREENS —`. 221 frames across seven sections; the
README lists them. Frame names are
`<screen_id or INSP key> — <name> — <route> — <section>`.

Three suffixes are load-bearing: `— DUPLICATE of SCR-…`, `— NO CATALOGUE ROW`, and
`STATE: <state>`.

## Deliverables

**1. `docs/design/figma/traceability/story-screen-map.csv`**

```
story_key,story_summary,epic_key,epic_summary,status,figma_frame,section,
confidence,covers_fully,gap_note
```

One row per live story (92 of them). `confidence` ∈ `exact | partial | inferred | none`.
`covers_fully` ∈ `yes | no` — does the frame satisfy the story's acceptance criteria, not
merely sit in the right module.

**2. `docs/design/figma/traceability/CODEX-FINDINGS-INSP-524.md`**

Answer these, with evidence:

- Which stories have a frame that does **not** actually satisfy their acceptance criteria?
  The current claim of 100% coverage is at epic-and-screen granularity. Test it at story
  granularity and expect it to fail somewhere.
- Which of the 73 state frames correspond to no story, and which story-described states
  have no frame?
- The 16 `Web module — *` epics were matched one-to-one to the 16 original frames. Verify
  that. Several of those frames carry `NO CATALOGUE ROW`; confirm the epic justifies each.
- `INSP-237` was classified non-UI. Confirm.
- The nine `INSP-239` frames were built from story titles alone, because the sub-tasks are
  only Backend/Frontend/Wiring/Test splits. Check their descriptions for regions or rules
  the frames miss.
- Any story implying a screen that exists in **neither** Jira's epic structure nor the
  catalogue.

**3. Jira write-back — propose, do not perform.** List the comments or links you would add
to each story. Do not modify Jira; posting is the Product Owner's call.

## Constraints

From `CLAUDE.md`, and they override anything a frame appears to show:

- Never invent a governed value — no risk weight, penalty, SLA, threshold or approval rule.
  Absent data is a state: *Not configured* / *Unavailable* / *Insufficient evidence*.
- Routes are fixed. `/portal` serves the external module; tabs and filters are query state,
  never subroutes.
- The external submission channel is **held in code** — `FEATURE_EXTERNAL_PORTAL=off` plus
  an external-representative identity policy hold, rendering `NotYetBoundary`. Five of the
  nine INSP-239 frames carry that hold deliberately. Do not report it as a gap.
- Status is text plus shape, never colour alone.

## What good looks like

A mapping a developer can open beside a story and know which frame to build, plus an
honest list of where the design does not yet answer the story. **A finding that the
coverage claim is overstated is a success, not a failure** — that is what this task is for.

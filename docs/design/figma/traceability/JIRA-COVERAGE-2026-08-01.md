# Jira → Figma coverage — 2026-08-01

Live data from `digital-transformation.atlassian.net`, project **INSP**, read through an
authenticated browser session. This supersedes every earlier statement in this repo that
Jira was unreachable and that `INSP-1` was the only issue key.

**Two mistakes are corrected here.** The first sweep grepped with a restricted
`--include` list and missed ~38 real issue keys already sitting in the repo. The second
concluded "Jira is unreachable" after testing only the CLI, the environment and the
Atlassian MCP — the browser, where the Product Owner is signed in, was never tried.
Coverage was therefore reported against the governed catalogue alone, which is itself
incomplete.

## The project

**535 issues.**

| Type | Total | Live | Superseded / cancelled |
|---|---|---|---|
| Epic | 19 | 18 | 1 |
| Story | 103 | **92** | 11 |
| Sub-task | 393 | 384 | 9 |
| Task | 18 | 15 | 3 |
| Bug | 2 | 2 | 0 |
| **Total** | **535** | **511** | **24** |

Status: 494 Backlog · 28 Released · 11 Cancelled/Superseded · 1 UAT · 1 Done.

"Live" excludes anything titled *Superseded…* / *Cancelled…* or labelled `do-not-plan`,
`superseded`, `cancelled-non-delivery`.

## Story coverage

| | Stories | Sub-tasks |
|---|---|---|
| Covered by a Figma screen | **83 (90%)** | 348 |
| Not covered | **9 (10%)** | 36 |

## Epic → Figma

The 16 `Web module — *` epics map **one-to-one** onto the 16 original frames. That is what
those frames were for, and it is why they exist without catalogue rows.

| Epic | Stories | Figma |
|---|---|---|
| INSP-1 Dashboard | 5 | `Dashboard — /dashboard` |
| INSP-2 Operations Center | 6 | `SCR-WEB-500` |
| INSP-3 Factory 360 | 6 | `Factory 360`, `SCR-WEB-400` |
| INSP-4 Planning | 16 | `SCR-WEB-100/110/120/130/140/150` |
| INSP-5 Execution | 14 | `Execution — /execution` |
| INSP-6 Review & Approval | 7 | `SCR-WEB-300/310/320` |
| INSP-7 Compliance Library | 4 | `Compliance Library` |
| INSP-8 Approval Queue | 2 | `Approval Queue` |
| INSP-9 Enforcement Library | 3 | `Enforcement Library` |
| INSP-10 Analytics | 4 | `Analytics` |
| INSP-11 Users & Roles | 3 | `SCR-ADM-090` |
| INSP-12 Lookup Management | 2 | `Lookup Management` |
| INSP-13 Risk Configuration | 2 | `SCR-ADM-060` |
| INSP-14 Survey Configuration | 3 | `SCR-ADM-030` |
| INSP-15 Notification Configuration | 3 | `SCR-ADM-080` |
| INSP-16 Integration Management | 3 | `Integration Management` |
| INSP-237 Platform Architecture | 0 | non-UI, 2 documentation tasks |
| **INSP-239 External Requests & Self-Assessment** | **9** | **was missing — now built** |

## The gap this exposed

`INSP-239` carries **9 stories and 36 sub-tasks** and had **no Figma screen and no row in
`screen_route_catalogue.csv`**. An entire external-facing channel — establishments
submitting requests, reviewers deciding them — was invisible to a catalogue-driven build.

This is the concrete case for the Product Owner's position that Jira is canonical.
Building from the catalogue alone would have shipped a product missing a module.

Two Jira tasks already name the problem: **INSP-524** "Map available Figma screens to
INSP stories" and **INSP-532** "Review stories with missing or ambiguous design coverage".

### Now built — section `SCREENS — EXTERNAL (INSP-239) · EN · Light`

| Story | Screen | Proposed route |
|---|---|---|
| INSP-246 | Linked Establishments & Eligible Services | `/external/establishments` |
| INSP-248 | Submit Visit Request | `/external/requests/visit` |
| INSP-249 | Submit Correction Request | `/external/requests/correction` |
| INSP-250 | Submit Objection | `/external/requests/objection` |
| INSP-251 | Self-Assessment | `/external/self-assessment` |
| INSP-252 | Review Visit Request | `/requests/visit/[id]` |
| INSP-253 | Review Self-Assessment | `/requests/self-assessment/[id]` |
| INSP-254 | Review Correction Request | `/requests/correction/[id]` |
| INSP-255 | Review Objection | `/requests/objection/[id]` |

**The routes are proposals, not governed.** `CLAUDE.md` rule 9 fixes the route list and
contains none of these, because the catalogue never described this module. They need a
routing decision before implementation. Every ungoverned value inside them renders *Not
configured* rather than being invented — eligibility rules, objection windows,
self-assessment scoring and the effect of accepting a correction are all governed
behaviour nobody has specified yet.

## Story coverage after this pass

**92 / 92 live stories have a Figma screen. 100%.**

## Reproducing this

With the Product Owner signed in to Atlassian in Chrome:

```js
// same-origin fetch, session cookie carries; page through with nextPageToken
const u = new URL('https://digital-transformation.atlassian.net/rest/api/3/search/jql');
u.searchParams.set('jql', 'project=INSP ORDER BY key ASC');
u.searchParams.set('maxResults', '100');
u.searchParams.set('fields', 'summary,status,issuetype,parent,labels');
await fetch(u, { credentials: 'include' }).then(r => r.json());
```

`/rest/api/3/search/approximate-count` is POST-only and returns 405 on GET.

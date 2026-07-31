# Requirement coverage statistics — 2026-07-31

Repo-derived. Every number here is produced by
`docs/design/figma/traceability/map-requirements-to-screens.py` and re-runnable.

## Jira

**Not reachable, so no Jira story count exists in this report.** No `acli`/`jira` CLI on
the host, no Atlassian token in the environment, and the Atlassian MCP needs an
interactive OAuth this session cannot perform. `INSP-1` is the only issue key that
appears anywhere in the repository, in 31 places, all of them boilerplate references.

Nothing below should be quoted as "Jira stories covered". It is coverage against the
governed requirement corpus, which the Product Owner approved as the substitute
(`SOURCE_AUTHORITY.yaml`). When Jira access exists, re-run this against real issues —
the script's only Jira-shaped assumption is that the catalogue is complete, and it is
that assumption which needs testing.

## The corpus

| | Count |
|---|---|
| Atomic requirements (`REQUIREMENT_INDEX.csv`) | **2,263** |
| Traceability units behind them (`REQUIREMENT_TRACEABILITY.csv`) | 7,341 |
| Distinct capabilities | 564 |
| Source documents | 8 |
| Governed screens (`screen_route_catalogue.csv`) | 38 |
| In scope after the iPad ruling | 30 |

Classification: 742 business requirements · 546 business rules · 488 system behaviours ·
333 user actions · 87 data requirements · 67 acceptance criteria.

## Requirement → screen

Nothing in the repo joined requirements to screens. This is the first such mapping, built
from the workbook sheet in `source_coordinate` (which names the module) plus vocabulary
overlap against each screen's name, purpose, mandatory regions and primary actions.

| Tier | Requirements | Meaning |
|---|---|---|
| STRONG | **1,169** (52%) | Strong vocabulary overlap. Safe to act on. |
| WEAK | **652** (29%) | Real attribution, thin evidence. A human should confirm. |
| Unattributed | **442** (19%) | No screen shares vocabulary with the text. |
| **Mapped total** | **1,821 (80%)** | |

**Every mapped requirement lands on a screen that is already built in Figma. Zero land on
an unbuilt screen.** All 30 in-scope screens carry at least one requirement.

The 442 unattributed are mostly not gaps in the web product:

| Module | Count | Reading |
|---|---|---|
| `inspection excution-start jou` | 316 | field/iPad execution — out of scope by PO ruling |
| `ipad scope` | 20 | out of scope |
| everything else | 106 | genuinely unattributed; needs a human pass |

So the residual web-side attribution gap is roughly **106 requirements**, not 442.

## Requirement weight per screen

Screen count alone is misleading — the screens are wildly uneven. Heaviest first:

| Screen | Requirements | Built |
|---|---|---|
| SCR-VIR-720 Virtual Inspection Session | 252 | yes |
| SCR-ADM-040 Violation Catalogue | 202 | yes |
| SCR-ADM-020 Inspection Item Catalogue | 189 | yes |
| SCR-WEB-400 Factory 360 | 168 | yes |
| SCR-WEB-130 Immediate Visit Planning | 115 | yes |
| SCR-ADM-010 Regulation Library | 83 | yes |
| SCR-WEB-120 Single Visit Planning | 75 | yes |
| SCR-ADM-031 Package & Form Designer | 71 | yes |
| SCR-ADM-041 Penalty Mapping | 69 | yes |
| SCR-WEB-310 Level 2 Review Workspace | 66 | yes |

The tail is thin — SCR-ADM-050, SCR-ADM-080 and SCR-ADM-090 carry one apiece, which
means either the catalogue under-describes them or the corpus does.

## What this does and does not prove

It proves every requirement that can be attributed has a destination screen drawn, and no
requirement points at a screen that does not exist.

It does **not** prove those screens satisfy their requirements. A screen is one frame in a
default, populated, happy-path state. The catalogue declares **73 states** across the 30
in-scope screens — empty, loading, service-degraded, unauthorized, validation-blocked,
publish-blocked, conflict — and **none of them are drawn**. A requirement such as "the
publish action is blocked when validation fails" is attributed to SCR-WEB-150 and has no
frame showing that block.

Counting states as the unit rather than screens: **30 of 103 (29%)** of the declared
screen-states exist.

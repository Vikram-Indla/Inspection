# Executive Overview — seed data available for the redesign

Source: Drive `Seeders/CURRENT_LIVE_TEST_DATA_GUIDE.csv` (1haoz6HVkSAdcI8vx6U71OoZBuYd_wIZW)
Pulled 2026-07-26. Supabase project `iiozvqntawxfwbgffzqu`.

## Accounts (existing — none created for this work)

| Persona | Email | Lands |
| --- | --- | --- |
| Planner | planner@mim.gov.sa | Planning |
| Inspector | inspector@mim.gov.sa | /field — the ONLY inspector with seeded work |
| Reviewer | reviewer@mim.gov.sa | Reviews |
| Administrator | admin@mim.gov.sa | Admin console (six admin roles at once) |
| Operations | ops@mim.gov.sa | Operations dashboard |

Passwords are in the guide, not in this file, and not in git.

`approver@mim.gov.sa` exists with a compliance-admin role but no recorded
password. Two `g10-inspector-*` accounts are leftover automated-test fixtures.

**No leadership account is required.** See the persona finding below.

## What the executive surface can actually show

The assurance figure is computed from APPROVED inspections only, so the
governing number is small:

- **13** reviewed-and-approved inspections
- **82** submitted inspection records awaiting review
- **2** visits actively in progress (52 records mid-way)
- **358** published visits not yet started
- **11** expired / missed visits
- **8** unpublished draft plans
- **2** returned for scoped correction

Geography: 24 clean factories across **8 regions** — Riyadh, Makkah, Eastern,
Madinah, Qassim, Hail, Asir, Jazan. Risk bands High / Medium / Low are present.

## Caveats that constrain the design

- **1,946 factories exist; only 24 are clean.** 1,644 are messy legacy bulk
  import (missing names, wrong products, placeholder text, duplicates); ~400
  are automated-test clutter. Any national total drawn from the full table is
  not defensible.
- **Two factories carry the bulk visit volume** — Al Watania Plastics (102) and
  Sudair Polymer Co. (267). They are test pile-up, not curated stories. A
  worst-first regional queue will be distorted by them unless scoped.
- **Factory master data is thin.** Only 4 of the 24 have a product/raw-material
  profile. NONE has a legal name, licence status or CR status. Factory 360 will
  look sparse except on F-2214, F-2215, F-2216, F-3303.
- **One inspector holds all 345 seeded visits.** No hand-off or reassignment
  scenario exists.
- **No samples/seizure or factory-discrepancy data can exist** — those tables
  are not built. Not a data gap; an unbuilt feature.

## Persona finding — the dashboard does not differentiate by role

`page.tsx:111-116` reads `user_roles.role_key` ONLY to compute the boolean
`mayViewDashboard` against `["ops", "leadership"]`. The role is never passed to
`DashboardView` or `DashboardControls`.

The composition is selected by a URL parameter — `params.view ?? "strategic"`
(`page.tsx:86-90`) — so `/dashboard?view=strategic` renders the identical page
for an ops user and a leadership user.

Consequences:

1. A leadership account would render byte-identical output to `ops@mim.gov.sa`.
   None was created; `ops@mim.gov.sa` + `?view=strategic` is the exact
   executive surface.
2. Codex's first recommendation — server-resolved persona compositions on the
   shared route — is not partially implemented. It does not exist. Persona
   differentiation is entirely absent, and a minister currently reaches the
   executive view only by URL, with an operations toggle beside it.

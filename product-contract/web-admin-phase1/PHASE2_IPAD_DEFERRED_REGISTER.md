# Phase 2 iPad Deferred Register

Phase 2 contains the 238 customer rows dispositioned
`PHASE2_IPAD_DEFERRED` in `REQUIREMENT_BASELINE.csv` and the five current page
routes below. The CSV is the row-level authority; this file records the route
and ownership boundary.

| Route | Phase 2 owner | Phase 1 ownership |
|---|---|---|
| `/field` | Inspector iPad / field application | None |
| `/field/check-in` | Inspector iPad / field application | None |
| `/field/inspection/[id]` | Inspector iPad / field application | None |
| `/field/sync` | Inspector iPad / field application | None |
| `/field/visits` | Inspector iPad / field application | None |

The field snapshot API is also deferred. ETA and authenticated shell search are
inventoried as shared-service dependencies, not field UX ownership.

No Phase 1 package may own, estimate, implement, test as a Phase 1 deliverable,
or claim evidence for `/field/**`, the field PWA, offline client/outbox UX, or
iPad certification. Shared backend work discovered from a deferred row must be
captured as a separately approved linked contract before implementation.

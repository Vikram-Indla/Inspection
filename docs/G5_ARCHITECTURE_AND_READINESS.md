# G5 Architecture, Data, API, Integration & Environment Discovery

**Project:** MIM Inspection Platform MVP1
**Gate:** G5 (opened after G4 PASS)
**Date:** 2026-07-11
**Status:** DISCOVERY COMPLETE — AWAITING DECISIONS
**Authority:** Derived only from the versioned product contract. No policy value invented.

---

## 0. Method & headline finding

G5 discovery was run against the **actual repository** and the **product contract**.

**Headline:** the repository contains **no application code, stack, framework,
schema migration, route handler, service or reusable component**. It is a
**greenfield** repo holding only (a) the G4 memory/continuity overlay and (b) the
product contract. Therefore "actual architecture" = the **contract-specified target
architecture**, plus one **live external environment** (a Supabase project) that is
reachable but not yet schema-discoverable with the supplied key.

There is **nothing to reverse-engineer** and **nothing to reconcile in code** yet.
The architecture below is the authoritative target the build must realize.

---

## 1. Repository architecture (as-is)

| Aspect | Finding |
|---|---|
| App code | **None** |
| Stack / framework | **None chosen** (see DEC-010 + §3) |
| Package manifest (package.json, etc.) | **None** |
| Routes / API handlers | **None** (38 routes are *specified*, not built) |
| DB migrations / schema files | **None in repo** |
| Tests / CI | **None** (`.claude/rules/tests.md` defines the future contract) |
| Reusable components | **None in repo** |
| Present | product-contract/**, docs/**, .claude/**, .obsidian/**, scripts/**, CLAUDE.md, HOME.md, bootstrap.* |

**Intended source layout** (from `.claude/rules/*` path scopes — the only structural
hint the contract gives):
```
apps/web/   or src/web/     -> Web Portal (Planner, Reviewer, Operations, Leadership)
apps/admin/ or src/admin/   -> Admin Portal (control planes, not CRUD)
apps/ipad/  or src/ipad/    -> iPad field app (offline-first, not a reduced web app)
(virtual)                    -> Virtual session surface (Inspector + Factory Rep)
tests/                       -> requirement/acceptance-ID-linked tests
product-contract/            -> controlled authority (frozen)
```

---

## 2. Channels, personas, modules

- **4 channels:** Admin Portal, Web Portal, iPad, Virtual (+ Operations Center as a Web surface).
- **8 human personas:** Compliance Admin, Planner, Inspector, Factory Representative,
  Level 2 Reviewer, Operations Officer, Leadership User, System Services.
- **8 system/engine personas:** ENG-01..ENG-12 grouping (see §5).
- **9 source modules M01–M09** map to the process phases; **478 atomic MVP1
  requirements** in `domain/atomic_scope.csv` are the non-regression baseline.

---

## 3. Stack & backend (candidate — DECISION REQUIRED)

No stack is frozen. Two concrete signals exist:

1. **Frontend:** env vars are `NEXT_PUBLIC_*` → **Next.js/React** is the de-facto
   frontend candidate (client-exposed publishable key pattern).
2. **Backend:** a **live Supabase project** exists (§12) → **Supabase
   (Postgres + Auth + Storage + Realtime)** is the de-facto backend candidate.

These are **candidates, not decisions**. Formal stack choice is bound to **DEC-010
(NFR targets)** and must be human-approved. The iPad **offline-first** requirement
(`ipad.md`, ENG-10) is a hard architectural constraint that a plain web stack does
not satisfy — the iPad surface needs a local-store + sync layer (PWA/offline cache
or native), decided explicitly.

---

## 4. End-to-end process spine (13 phases)

`P00 → P01 → P02 → P03 → P04 → P05 → {P06A physical | P06B virtual} → P07 → P08 → P09 → P10 → P11 → P12`

| Phase | Title | Owner | Channel | Modules |
|---|---|---|---|---|
| P00 | Pre-Day-0 Configuration | Compliance Admin | Admin | M09 |
| P01 | Targeting & Planning Method | Planner | Web | M01 |
| P02 | Visit Design & Assignment | Planner | Web | M01 |
| P03 | Publish & Operational Management | Planner/Ops | Web | M01/M02/M08 |
| P04 | Inspector Startup Pack | Inspector | iPad | M03 |
| P05 | Execution Mode Gate | Inspector/System | iPad/Virtual | M03/M04/M05 |
| P06A | Physical Journey & Check-In | Inspector/Ops | iPad+Ops | M04/M08 |
| P06B | Virtual Session & Verification | Inspector/Factory Rep | Virtual | M05 |
| P07 | Inspection Execution | Inspector | iPad/Virtual | M04/M05/M09 |
| P08 | Evidence, Findings, Violations & Actions | Inspector/System | iPad/Virtual | M04/M05/M09 |
| P09 | Submission & Immutable Version | Inspector/System | iPad/Virtual | M04/M05 |
| P10 | Level 2 Review & Decision | Reviewer | Web | M06 |
| P11 | Return, Correction & Resubmission | Inspector/Reviewer | iPad+Web | M06 |
| P12 | Factory 360 & Operations Update | System/Ops/Leadership | Web+Ops | M07/M08 |

---

## 5. Services / engines (ENG-01..12) — the domain service map

| Engine | Name | Responsibility |
|---|---|---|
| ENG-01 | Regulatory & Compliance | Published rules & item semantics |
| ENG-02 | Form & Package | Versioned report packages, sections, questions, action forms |
| ENG-03 | Workflow | Allowed states, transitions, guards, side effects |
| ENG-04 | Risk Foundation | Approved score inputs, band, version, explainability (DEC-001) |
| ENG-05 | Assignment | Auto/manual assignment, availability, conflicts |
| ENG-06 | GIS, Geofence & Telemetry | Location, route, ETA, arrival, geofence, override (DEC-002/008) |
| ENG-07 | Evidence & Media | Evidence rules, linkage, metadata, integrity (DEC-006) |
| ENG-08 | Violation & Penalty | Violation/penalty mappings at runtime |
| ENG-09 | Review & Version | Immutable versions, return scope, comparison, decisions |
| ENG-10 | Offline Sync | Local package, autosave, recovery, retry, conflict |
| ENG-11 | Notification & SLA | Event notifications & SLA timers (DEC-003) |
| ENG-12 | Audit & Traceability | Actor/time/before-after/version trail (all flows) |

**Cross-cutting (build once, used everywhere):** ENG-03 workflow, ENG-12 audit,
ENG-10 offline sync, ENG-11 notification/SLA.

---

## 6. Routes / surface inventory (38 specified screens)

| Channel | Count | Route roots |
|---|---|---|
| Admin Portal | 14 | `/admin`, `/admin/regulations`, `/admin/items`, `/admin/packages(/:id/designer)`, `/admin/violations`, `/admin/penalties`, `/admin/workflows(/:id)`, `/admin/risk`, `/admin/gis`, `/admin/notifications`, `/admin/access` |
| Web Portal | 13 | `/planning(/bulk|/single|/immediate|/:id/configure|/:id/review)`, `/visits(/:id)`, `/reviews(/:id|/:id/compare)`, `/factories/:id/360`, `/operations` |
| iPad | 8 | `/ipad/assignments`, `/ipad/visits/:id/prestart`, `/ipad/visits/:id/journey`, `/ipad/inspections/:id(/evidence|/findings|/submit)`, `/ipad/returned/:id` |
| Virtual | 3 | `/virtual/appointments/:id`, `/virtual/sessions/:id/verify`, `/virtual/sessions/:id` |

Full detail (personas, states, permission rule, mandatory regions) in
`product-contract/screens/screen_route_catalogue.csv`.

---

## 7. Data model (60 fields / 15 reference domains / 9 state machines)

- **60 canonical fields** (`domain/field_dictionary.csv`) across core objects:
  Factory, Visit Plan, Visit, Assignment, Journey, Inspection, Evidence, Finding,
  Violation/Penalty, Review/Version, Session — each with type, required/conditional,
  source-of-truth, editable-by, visibility, validation, audit/versioning, offline
  behavior and sensitivity.
- **15 reference/master-data domains** (`domain/reference_data.csv`) — planning
  method, execution mode, visit/inspection status, priority, risk band, evidence
  type, violation level, reasons, review decision, notification event, user role.
- **9 state machines / 23 transitions** (`domain/state_transitions.csv`): Visit Plan,
  Visit, Assignment, Journey, Inspection, Review, Returned/Correction, Virtual
  Session, Offline Queue — each with guard, side-effects, notification/SLA, audit.

**Hard data invariants (CLAUDE.md):** submitted versions immutable; status changes
only via canonical transitions+guards; offline conflicts never silently overwritten;
evidence must be linked; every mutation audited.

---

## 8. Security / RBAC (14 contracts, 11 roles)

`domain/rbac_matrix.csv` — 14 object-capability contracts across roles: Compliance
Admin, Form Admin, Workflow Admin, Risk Owner, GIS Admin, Security Admin, Planner,
Operations User, Inspector, Level 2 Reviewer, Auditor, Leadership, Factory
Representative. Maker-checker and segregation-of-duties on all publish flows;
inspector content immutable to reviewers; factory rep sees only own session.

---

## 9. Error / recovery contracts (17)

`governance/error_catalogue.csv` — 17 critical scenarios with mandated response,
resulting state, audit and recoverability: invalid criteria, no targets, assignment
conflict, package unavailable, weak GPS, outside geofence, package integrity failure,
offline sync retry (idempotent), version conflict (no overwrite), evidence
permission/oversize, submission blockers, ambiguous retry (idempotency key), missing
return scope, OTP provider down, ops widget failure, unauthorized action.

---

## 10. Integrations (ALL decision-gated — none wired)

| Integration | Engine | Blocking decision |
|---|---|---|
| Risk engine/model | ENG-04 | **DEC-001** |
| Maps / navigation / GIS provider | ENG-06 | **DEC-008**, **DEC-002** |
| OTP / SMS / identity verification | ENG-11/ENG-06 | **DEC-007** |
| Digital acknowledgement / e-signature / PKI | ENG-09 | **DEC-009** |
| Evidence storage / scanning / retention | ENG-07 | **DEC-006** |
| Notification (SMS/email/push) + SLA calendar | ENG-11 | **DEC-003** |
| Virtual video session provider | ENG-07 (M05) | (provider TBD; DEC-005 boundary) |
| Offline sync backend | ENG-10 | stack (DEC-010) |

CLAUDE.md rule: an unavailable integration may **not** be replaced by a permanent
mock and called complete. Provider abstraction only until each decision lands.

---

## 11. Non-functional (DEC-010 — OPEN)

Availability, latency, concurrency, RTO/RPO, package sizes — all undecided. These
gate the stack choice and G8 certification.

---

## 12. Environments

| Item | Finding |
|---|---|
| Inspection Supabase project | `iiozvqntawxfwbgffzqu` — **LIVE** (`auth/v1/health` = 200), region unknown |
| Access supplied | Publishable (anon) key + URL → **RLS row access only** |
| Schema discovery | **BLOCKED** — `/rest/v1/` returns `"Secret API key required"`; need **secret key** (`sb_secret_…`/service_role) or **personal access token** |
| Connected Supabase MCP | Bound to org **Catalyst KSA** / project **catalyst-prod** — **UNRELATED to Inspection; DO NOT TOUCH** (production) |
| `.env` in repo | none (correct — secrets stay out of Git; `.gitignore` covers `.env*`) |
| Secret handling | A dashboard username/password was pasted in chat earlier — **discarded, not stored; rotate it** |

**Consequence:** the live Inspection schema (if any tables already exist from
prototyping) could **not** be enumerated. Live-schema reconciliation is deferred
until a secret key/PAT is provided.

---

## 13. Reusable components

None exist yet. First build must establish the shared layer **before** feature
screens: ENG-03 workflow engine, ENG-12 audit, ENG-10 offline/sync, ENG-11
notification/SLA, RBAC guard, and a design-token/component library (blocked on G6).

---

## 14. Readiness verdict

- **Architecture is fully specified** by the contract; **nothing is built**.
- **Build cannot start** — blocked by G8, by 10 open decisions, by missing live-schema
  access, and by G6 design authority (no golden screens/tokens yet).
- Next controlled activity is **decision resolution + live-schema reconciliation**,
  then **G6 design**, then **G8 certification** — *then* the golden vertical slice.

See `GOLDEN_SLICE_BUILD_SEQUENCE` (below / in the run summary) for the ordered plan.

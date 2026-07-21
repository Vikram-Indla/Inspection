# FOUR_HOUR_PLATFORM_STORYLINE — Complete Demonstration + 30-Minute Executive + 10-Minute Leadership Cuts

**Document ID:** OBM-STORY-20260719-001
**Status:** CONTROLLED PROPOSAL (demonstration script over `IMPLEMENTED` truth; truth labels inline)
**Spine:** Plan → Prepare → Inspect → Prove → Decide → Improve (Master Plan §5)
**Rule:** every chapter names real routes (RTE-IDs from `FULL_59_ROUTE_SCREENSHOT_SCOPE.csv`), real states, and explicit truth labels. Nothing is demonstrated that the platform does not do. Provider-pending surfaces are shown *as* provider-pending. Demo data is privacy-safe fixture data; production demo credentials remain server-gated and are never shown on screen.

Storyline architecture (personas × route families × inspection types × handoffs) is §1. The 4-hour script is §2. Derivative cuts are §3–§4.

---

## 1. Product-storyline architecture

### 1.1 Phase × persona × route-family grid

| Phase | Lead personas | Route families (RTE) | Handoff out |
|---|---|---|---|
| **Plan** | Compliance/Form/Workflow/Risk/GIS/Security Admins; Planner | Admin RTE-001..011, RTE-030/031/039..044; Planning RTE-018..023, RTE-047; Visits RTE-027/028/051/052/053 | Published plan → Inspector assignment |
| **Prepare** | Inspector; Operations | Field RTE-013; Factory360 RTE-012/046; Profile RTE-048 | Prepared inspector → execution window |
| **Inspect** | Inspector; Factory Representative | Field RTE-014/015; Virtual RTE-026/050; Immediate RTE-021 | Submitted immutable version → review |
| **Prove** | Inspector; Auditor; Operations | Field evidence/sync (RTE-014/015); Audit RTE-029; Reports RTE-049 | Defensible record → decision |
| **Decide** | Reviewer; Committee (RECONCILE); Compliance/Enforcement (RECONCILE); Leadership | Review RTE-024/025/059; Committee RTE-034; Cases RTE-033; Enforcement RTE-043; Dashboard RTE-045 | Decision → correction or closure |
| **Improve** | Inspector; Planner; Operations; Factory Representative | Field correction loop; Operations RTE-016/017/036; Tasks RTE-038; Portal RTE-037; Localization RTE-044 | Outcomes feed next planning cycle |

### 1.2 Inspection types demonstrated

| Type | Truth | Where shown |
|---|---|---|
| Physical (field) | `IMPLEMENTED` end-to-end incl. offline | Act 2–4 |
| Virtual | `IMPLEMENTED` OTP/state/audit/timeline; video `PROVIDER_DEP` (provider-pending bounded room) | Act 3, Ch 12 |
| Immediate visit | `IMPLEMENTED` (`create_immediate_visit`; urgency: Complaint received / Incident-accident report / Referral from authority / Other+notes) | Act 1, Ch 5 |
| Bulk / Single planning | `IMPLEMENTED` (atomic publish; server-side planner guard) | Act 1, Ch 4–5 |
| Remote/self-assessment (BRD visit natures) | source-controlled reference data; **not demonstrated** — not invented | noted verbally only |

### 1.3 Handoffs (golden journey)

`plan → publish → execute → submit → return → correct → resubmit → approve` plus immutability negatives — this implemented golden journey is the connective tissue of the whole demonstration.

---

## 2. The four-hour demonstration (24 chapters, 6 acts, 240 min)

> Chapter format: **ID | Title | mins | Routes | What is shown (states) | Truth labels to speak aloud**

### Act 0 — Orientation (15 min)

**C00 | Arrival & secure access | 10 | RTE-054/055/056/057/058 (`/`→`/login`, `/launch`, `/reset`)**
Arabic-first login (`lang=ar`, `dir=rtl`); sanitized non-operational login atlas; role-derived redirect via `/launch`; no-workspace state; anti-enumeration reset. *Speak:* "The public surface serves no operational metrics; credentials for demonstration are server-gated fixtures."

**C01 | The shell: where am I, what am I | 5 | shell over any authenticated route**
Persona name/role/scope visibility; hidden unsupported destinations (Analytics, Lookup, Notification Config, Integration, AI). *Speak:* "Hidden means not implemented — the shell never advertises what does not exist." Persona Academy entry appears here when built (`PROPOSAL`).

### Act 1 — Plan (50 min)

**C02 | Governed rules: regulations, items, violations | 15 | RTE-007/008 `/admin/regulations(:id)`, RTE-004 `/admin/items`, RTE-010 `/admin/violations`**
Versioned regulation records; item/checklist governance; violation catalogue. *Speak:* "Admin planes are control planes with versions and audit, not CRUD cards."

**C03 | Risk, workflow, GIS configuration | 10 | RTE-009 `/admin/risk`, RTE-031 `/admin/risk/models`, RTE-011 `/admin/workflows`, RTE-003 `/admin/gis`, RTE-030 `/admin/gis/spatial`**
Read-only walkthrough (do not publish or change models/workflows — capture safety notes apply). Engine settings truth: risk/gis/sla/evidence/otp v1 accepted settings.

**C04 | Bulk planning | 10 | RTE-018 `/planning`, RTE-019 `/planning/bulk`, RTE-020 `/planning/bulk/review`**
Server-side `has_role('planner')` guard; targeting; review; atomic `publish_bulk_plan`. States: `draft → validated → published` (planning_status enum: draft, validated, published, returned, cancelled, expired).

**C05 | Single & immediate visits | 5 | RTE-023 `/planning/single`, RTE-021 `/planning/immediate`**
Single-visit identity lens + duplicate guard; immediate visit dual path (Planner or Inspector) with governed urgency reasons.

**C06 | Visit management workspace | 10 | RTE-027 `/visits`, RTE-051 `/visits/calendar`, RTE-053 `/visits/workload`, RTE-028 `/visits/:id`**
Lenses; DualStateRibbon — five never-collapsed state domains (planning/operational/assignment/inspection/review). *Speak:* "The map lens is intentionally UNAVAILABLE; the list is the working equivalent until a map provider is governed." (`PROVIDER_DEP`)

### Act 2 — Prepare (30 min)

**C07 | Inspector workspace & assignment | 10 | RTE-013 `/field`**
Assigned visits; pre-start lock (`status !== "not_started"`); planning-expiry behavior. *Speak:* "Preparation is trusted context, not paperwork."

**C08 | Factory 360 | 10 | RTE-012/046 `/factories/:id`, `/factories`**
Provenance-led dossier; explicit unavailable rows for map/boundary; leadership-scoped contact masking. *Speak:* "Every field shows where it came from; absent data says absent."

**C09 | Route truth & readiness | 10 | RTE-013, RTE-017 context**
Projected route labeling; Google Routes adapter honest-unavailable (credential intentionally absent); Mapbox ETA where live. *Speak aloud, verbatim:* "Movement you will see on operations screens is projected, not live GPS." (`PROVIDER_DEP`)

### Act 3 — Inspect (45 min)

**C10 | Physical execution: arrival & geofence | 15 | RTE-014 `/field/:visitId`**
Arrival cards; geofenced arrival; arrival photo/comment evidence; geo-override: one attempt, 30-minute/visit-close expiry, Operations-only decision, self-decision blocked.

**C11 | The inspection itself | 15 | RTE-015 `/field/inspection/:id`**
Question flow; valid-next-action; evidence attached in context; cancellation forms with evidence queueing; immutable-state risk respected (fixture data only).

**C12 | Virtual inspection room | 15 | RTE-026 `/virtual/:id`, RTE-050 `/virtual`**
OTP/verified gate (`vs_mark_session_verified`, CD-042); timeline; state machine incl. closed/read-only (S12), stale/concurrent rev-token refusal (S13), offline S15 (actions disabled, nothing queued); provider-pending bounded room. *Speak:* "Session governance is live; video is provider-pending and we show that honestly." (`PROVIDER_DEP`)

### Act 4 — Prove (30 min)

**C13 | Submission & immutability | 10 | RTE-015**
Pre-submit completeness; submit → immutable version; `submitted → under_review`; *negative demo:* attempt to edit a submitted version fails.

**C14 | Offline, sync, conflict | 10 | RTE-014/015 with network toggled**
Real offline outbox; queued evidence replay; stale-replay guard; conflict surfaced, never silently overwritten (offline-drill evidence).

**C15 | Audit flight recorder | 10 | RTE-029 `/admin/audit`**
Reconstruction, comparison, completeness, custody, permission, degraded and print-safe modes; correlation/keyset replay. *Speak:* "M2-05 is source-implementation PASS; runtime certification pending — we demonstrate the local build." (`IMPLEMENTED` with that caveat)

### Act 5 — Decide (45 min)

**C16 | Review queue & decision | 15 | RTE-024 `/reviews`, RTE-025 `/reviews/:id`, RTE-059**
One-open-review-per-version index; reviewer race → "already started by another reviewer"; read-authorized set (reviewer/ops/auditor/planner/leadership) vs `canDecide` (reviewer/ops); `{role} · read-only` lozenge; return with mandatory `returned_sections`.

**C17 | Committee & cases | 10 | RTE-034 `/committee`, RTE-033 `/cases`**
Walk the surfaces read-only. *Speak:* "Committee role binding is under governance reconciliation; no decision is recorded in demonstration." (`SPONSOR_DECISION` on persona binding; do-not-transition safety note)

**C18 | Enforcement | 5 | RTE-043 `/enforcement`**
Read-only; no enforcement created or finalized. Same reconciliation caveat.

**C19 | Leadership dashboard | 15 | RTE-045 `/dashboard`**
Strategic + Operational views; governed KPIs; deterministic alerts; GPS-override comparison; audit timeline; explicit unavailable states (annual target/year eligibility, presence, absolute capacity, stuck-duration, missing confirmations). *Speak:* "No AI assistant, no prescriptive recommendation — by design, until governed." (`PROVIDER_DEP`/`SPONSOR_DECISION`)

### Act 6 — Improve (25 min)

**C20 | Return, correction, resubmission | 10 | RTE-025 → RTE-014/015**
Returned scope is the only editable scope; scoped v2 correction; resubmit; approve. Completes the golden journey on screen.

**C21 | Operations monitoring & exceptions | 8 | RTE-016 `/operations`, RTE-017 `/operations/live`, RTE-036 `/operations/exceptions`**
Interval refresh keeps `on_the_way / arrived / executing` visible; **projected movement label repeated**; exceptions read-only (do not resolve).

**C22 | Platform stewardship | 4 | RTE-044 `/admin/localization`, RTE-041 `/admin/operations`, RTE-040 `/admin/integrations`, RTE-039 `/admin/devices`, RTE-042 `/admin/security-access`**
Localization workflow (inline AR edit, review, history, CSV export; 1,815 rows); integrations/devices shown fail-closed (no credentials, no enroll/revoke).

**C23 | The loop closes | 3 | RTE-037 `/portal`, RTE-038 `/tasks`, RTE-049 `/reports/inspection/:id`, RTE-048 `/profile`**
External portal surface; tasks; immutable report view; wrap: outcomes feed the next risk/planning cycle. *Close on the spine graphic.*

**Timing total: 240 min.** Chapters C02/C10/C11/C12/C16/C19 are the six anchor chapters; if a session runs long, compress C03/C18/C22 — never the anchors and never the truth labels.

---

## 3. 30-minute executive version (8 chapters)

| # | Title | mins | Source chapters | Routes |
|---|---|---|---|---|
| E1 | What this platform is (spine) | 3 | C00/C01 | `/login`, shell |
| E2 | Governed rules become plans | 4 | C02/C04 | `/admin/regulations`, `/planning/bulk` |
| E3 | The prepared inspector | 3 | C07/C08 | `/field`, `/factories/:id` |
| E4 | Physical inspection with proof | 5 | C10/C11/C13 | `/field/:visitId`, `/field/inspection/:id` |
| E5 | Offline without data loss | 3 | C14 | field + outbox |
| E6 | Virtual inspection, honestly | 3 | C12 | `/virtual/:id` |
| E7 | Decision with lineage | 5 | C16/C19 | `/reviews/:id`, `/dashboard` |
| E8 | The improvement loop + what is pending | 4 | C20/C21 + provider truth summary | correction loop, `/operations/live` |

E8 must end with the pending-truth slate: providers fail-closed (video, notification delivery, Google Routes, signature/PKI, SSO, AI, MDM, retention), G11/G12 open items, human gates (native Arabic review, inspector endurance). Executives hear the honest state in the last two minutes, not a gloss.

## 4. 10-minute leadership version (4 segments)

| # | Title | mins | Content |
|---|---|---|---|
| L1 | One inspection, end to end | 4 | Golden journey montage: publish → arrive (geofence) → inspect → submit (immutable) → return → correct → approve |
| L2 | Your dashboard | 3 | `/dashboard`: governed KPIs, freshness, drilldown, explicit unavailable states; map/list truth (list is working equivalent) |
| L3 | Why you can trust it | 2 | Audit flight recorder glance; provenance in Factory 360; conflict-safe offline |
| L4 | What is not live yet | 1 | Verbal slate: projected movement, provider-pending video, AI briefing not enabled, open release gates |

---

## 5. Traceability

Every chapter above maps to rows in `ONBOARDING_ROUTE_AND_SOURCE_TRACEABILITY.csv` (route → phase → chapter → truth labels → sources). Acceptance for this storyline is OB-AC-020..027 in `ONBOARDING_ACCEPTANCE_CRITERIA.csv`.
